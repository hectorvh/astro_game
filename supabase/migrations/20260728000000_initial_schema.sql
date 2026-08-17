-- Jerboa's Journey — initial schema (spec §4).
--
-- Applied with `pnpm supabase db push`. Never edit the schema in the Supabase
-- dashboard: it must stay reproducible and reviewable from these files (§4.4).
--
-- Security model: the browser talks to Supabase directly with the publishable
-- key, and each participant signs in anonymously. Every table is protected by
-- Row Level Security keyed to auth.uid(), so a participant can only read or
-- write their own rows, and identity is always taken from the JWT — never from
-- anything the client sends.
--
-- Prerequisite: Authentication > Sign In / Providers > Anonymous sign-ins must
-- be enabled on the project, or no participant can be recorded at all.

-- ---------------------------------------------------------------------------
-- 4.1 users
-- ---------------------------------------------------------------------------

create table users (
  -- Defaulted from the JWT, and the insert policy rejects any other value, so
  -- a client cannot nominate which participant row it writes to.
  --
  -- Deliberately NO foreign key to auth.users: a job that deletes abandoned
  -- anonymous users must not cascade-delete research data, and severing that
  -- link is what makes the stored rows genuinely anonymous.
  id           uuid primary key default auth.uid(),
  -- Nullable: §5 flags collecting a real name. A nickname or generated code
  -- would be preferable; the column allows dropping the value entirely.
  name         text,
  -- Non-overlapping bands (§3). Left as text rather than an enum because the
  -- final banding is a research-team decision and will likely change.
  age_range    text not null,
  gender       text not null check (gender in ('male', 'female', 'other')),
  gender_other text,
  -- ISO 3166-1 alpha-2, e.g. 'DE'. Codes, never display names (§4.1).
  country      text not null,
  ui_language  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- 'other' is the only gender that may carry free text, and it must carry it.
  constraint gender_other_only_when_other check (
    (gender = 'other') = (gender_other is not null)
  ),
  -- The client can bypass Zod now that it writes directly, so the same bound
  -- the form applies is enforced here too.
  constraint users_name_length check (
    name is null or char_length(btrim(name)) between 1 and 80
  )
);

-- One row per spoken language: a variable-length list with a fluency each, so
-- it cannot live in a users column (§4.1 design note).
create table user_languages (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references users (id) on delete cascade,
  language text not null, -- ISO 639-1, e.g. 'es'
  fluency  text not null check (
    fluency in ('native', 'fluent', 'intermediate', 'beginner')
  ),
  -- Mirrors the same rule the Zod schema enforces in the UI.
  unique (user_id, language)
);

create index user_languages_user_id_idx on user_languages (user_id);

-- ---------------------------------------------------------------------------
-- 4.3 consents — recording consent, not merely gating on it
-- ---------------------------------------------------------------------------

create table consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users (id) on delete cascade
                  default auth.uid(),
  consent_version text not null,
  agreed          boolean not null,
  timestamp       timestamptz not null default now()
);

create index consents_user_id_idx on consents (user_id);

-- ---------------------------------------------------------------------------
-- 4.2 data — in-game spatial-relation responses (populated by mini-games)
-- ---------------------------------------------------------------------------

-- No `ip` column. §5 questions collecting it at all, and a browser cannot
-- observe its own public IP, so the column could only ever have been NULL.
-- Capturing it would require a server hop such as a Supabase Edge Function.
create table data (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users (id) on delete cascade
                   default auth.uid(),
  minigame         text,
  spatial_category text check (
    spatial_category in ('topological', 'motion', 'projective', 'distance')
  ),
  stimulus_id      text,
  response         jsonb,
  is_correct       boolean, -- nullable: some trials have no correct answer
  response_time_ms integer, -- see the browser-noise caveat in §5
  timestamp        timestamptz not null default now()
);

create index data_user_id_idx on data (user_id);

-- ---------------------------------------------------------------------------
-- "At least one spoken language" (§4.1) — spans two tables, so not a CHECK
-- ---------------------------------------------------------------------------

-- Deferred constraint triggers evaluate at commit, which lets save_participant
-- write the users row and its languages in one transaction while still
-- rejecting a lone insert that would leave a participant with no languages.
create function assert_participant_has_language() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from user_languages where user_id = new.id) then
    raise exception 'participant % must have at least one spoken language', new.id;
  end if;
  return null;
end;
$$;

create constraint trigger users_require_language
  after insert on users
  deferrable initially deferred
  for each row execute function assert_participant_has_language();

-- Guards the other direction: deleting your last language. Skipped when the
-- users row is already gone, so cascade deletes still work.
create function assert_language_remains() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from users where id = old.user_id)
     and not exists (select 1 from user_languages where user_id = old.user_id)
  then
    raise exception 'participant % must keep at least one spoken language',
      old.user_id;
  end if;
  return null;
end;
$$;

create constraint trigger user_languages_require_one
  after delete on user_languages
  deferrable initially deferred
  for each row execute function assert_language_remains();

-- ---------------------------------------------------------------------------
-- Row Level Security (§4.4)
-- ---------------------------------------------------------------------------

alter table users enable row level security;
alter table user_languages enable row level security;
alter table consents enable row level security;
alter table data enable row level security;

-- RLS sits on top of grants, it does not replace them. Withheld on purpose:
-- no delete anywhere, and no update on consents or data. Erasure is an
-- administered operation, and an audit trail a participant can rewrite is not
-- an audit trail.
grant select, insert, update on users to authenticated;
grant select, insert, update, delete on user_languages to authenticated;
grant select, insert on consents to authenticated;
grant select, insert on data to authenticated;

-- `to authenticated` means a caller who has not signed in is denied outright
-- rather than merely failing a row check.

-- Do not remove the select policies as "unused reads". Postgres applies SELECT
-- policies to INSERT ... RETURNING, which save_participant depends on —
-- dropping this one makes every write fail with an RLS violation. Verified.
create policy users_select_own on users
  for select to authenticated using (auth.uid() = id);
create policy users_insert_own on users
  for insert to authenticated with check (auth.uid() = id);
create policy users_update_own on users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy user_languages_select_own on user_languages
  for select to authenticated using (auth.uid() = user_id);
create policy user_languages_insert_own on user_languages
  for insert to authenticated with check (auth.uid() = user_id);
create policy user_languages_update_own on user_languages
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- DELETE is required: save_participant clears and rewrites the language set on
-- edit. Without this policy the delete silently affects zero rows and the
-- following insert fails on unique (user_id, language).
create policy user_languages_delete_own on user_languages
  for delete to authenticated using (auth.uid() = user_id);

-- Append-only by design: no update or delete policy.
create policy consents_select_own on consents
  for select to authenticated using (auth.uid() = user_id);
create policy consents_insert_own on consents
  for insert to authenticated with check (auth.uid() = user_id);

create policy data_select_own on data
  for select to authenticated using (auth.uid() = user_id);
create policy data_insert_own on data
  for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- save_participant — one atomic upsert for a participant and their languages
-- ---------------------------------------------------------------------------

-- supabase-js cannot wrap two statements in a transaction, and a participant
-- is one users row plus N user_languages rows. Doing it in SQL keeps the write
-- atomic and implements the "edit in place, never insert twice" rule (§1.2.C).
--
-- There is no p_user_id parameter: the participant is whoever the token says,
-- so the insert-vs-update branch cannot be pointed at someone else's row.
create function save_participant(
  p_name text,
  p_age_range text,
  p_gender text,
  p_gender_other text,
  p_country text,
  p_ui_language text,
  p_languages jsonb
) returns jsonb
language plpgsql
-- security invoker, not definer: RLS applies to every statement below, so a
-- bug in this function still cannot write across participants.
security invoker
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_user users;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if jsonb_array_length(coalesce(p_languages, '[]'::jsonb)) < 1 then
    raise exception 'at least one spoken language is required';
  end if;

  if exists (select 1 from users where id = v_uid) then
    update users
    set name = p_name,
        age_range = p_age_range,
        gender = p_gender,
        gender_other = p_gender_other,
        country = p_country,
        ui_language = p_ui_language,
        updated_at = now()
    where id = v_uid
    returning * into v_user;

    -- Replace rather than diff: the list is short and this keeps the stored
    -- set exactly equal to what the participant last submitted.
    delete from user_languages where user_id = v_uid;
  else
    insert into users (
      id, name, age_range, gender, gender_other, country, ui_language
    )
    values (
      v_uid, p_name, p_age_range, p_gender, p_gender_other, p_country,
      p_ui_language
    )
    returning * into v_user;
  end if;

  insert into user_languages (user_id, language, fluency)
  select v_uid, elem ->> 'language', elem ->> 'fluency'
  from jsonb_array_elements(p_languages) as elem;

  return to_jsonb(v_user);
end;
$$;

-- EXECUTE on a new function defaults to PUBLIC, which would publish it on the
-- anon RPC surface. RLS already blocks what it tries to do, but keeping it off
-- that surface means a future policy change cannot make it exploitable.
revoke execute on function save_participant(
  text, text, text, text, text, text, jsonb
) from public;
grant execute on function save_participant(
  text, text, text, text, text, text, jsonb
) to authenticated;
