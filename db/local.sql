-- Jerboa's Journey — schema for a vanilla local Postgres (database `jerboa`).
--
-- This is the spec §4 model without Supabase-only pieces (auth.uid(), the
-- `authenticated` role, RLS keyed to a JWT). The Next.js server is the only
-- client, so identity is a participant uuid held in an httpOnly cookie, not a
-- token. The Supabase migration in supabase/migrations/ remains the cloud
-- schema and must not be applied here.
--
-- Apply with: pnpm db:apply

begin;

-- ---------------------------------------------------------------------------
-- 4.1 users
-- ---------------------------------------------------------------------------

create table users (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  age_range    text not null,
  gender       text not null check (gender in ('male', 'female', 'other')),
  gender_other text,
  country      text not null,
  ui_language  text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint gender_other_only_when_other check (
    (gender = 'other') = (gender_other is not null)
  ),
  constraint users_name_length check (
    name is null or char_length(btrim(name)) between 1 and 80
  )
);

create table user_languages (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references users (id) on delete cascade,
  language text not null,
  fluency  text not null check (
    fluency in ('native', 'fluent', 'intermediate', 'beginner')
  ),
  unique (user_id, language)
);

create index user_languages_user_id_idx on user_languages (user_id);

-- ---------------------------------------------------------------------------
-- 4.3 consents
-- ---------------------------------------------------------------------------

create table consents (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users (id) on delete cascade,
  consent_version text not null,
  agreed          boolean not null,
  timestamp       timestamptz not null default now()
);

create index consents_user_id_idx on consents (user_id);

-- ---------------------------------------------------------------------------
-- 4.2 data — ready for mini-games; no `ip` column (spec §5)
-- ---------------------------------------------------------------------------

create table data (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users (id) on delete cascade,
  minigame         text,
  spatial_category text check (
    spatial_category in ('topological', 'motion', 'projective', 'distance')
  ),
  stimulus_id      text,
  response         jsonb,
  is_correct       boolean,
  response_time_ms integer,
  timestamp        timestamptz not null default now()
);

create index data_user_id_idx on data (user_id);

-- ---------------------------------------------------------------------------
-- At least one spoken language
-- ---------------------------------------------------------------------------

create function assert_participant_has_language() returns trigger
language plpgsql
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

create function assert_language_remains() returns trigger
language plpgsql
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
-- save_participant — atomic upsert (spec §1.2.C)
-- ---------------------------------------------------------------------------

create function save_participant(
  p_user_id uuid,
  p_name text,
  p_age_range text,
  p_gender text,
  p_gender_other text,
  p_country text,
  p_ui_language text,
  p_languages jsonb
) returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_user users;
begin
  if jsonb_array_length(coalesce(p_languages, '[]'::jsonb)) < 1 then
    raise exception 'at least one spoken language is required';
  end if;

  if p_user_id is null then
    insert into users (
      name, age_range, gender, gender_other, country, ui_language
    )
    values (
      p_name, p_age_range, p_gender, p_gender_other, p_country, p_ui_language
    )
    returning * into v_user;
  else
    update users
    set name = p_name,
        age_range = p_age_range,
        gender = p_gender,
        gender_other = p_gender_other,
        country = p_country,
        ui_language = p_ui_language,
        updated_at = now()
    where id = p_user_id
    returning * into v_user;

    if v_user.id is null then
      raise exception 'unknown participant %', p_user_id;
    end if;

    delete from user_languages where user_id = v_user.id;
  end if;

  insert into user_languages (user_id, language, fluency)
  select v_user.id, elem ->> 'language', elem ->> 'fluency'
  from jsonb_array_elements(p_languages) as elem;

  return to_jsonb(v_user);
end;
$$;

-- ---------------------------------------------------------------------------
-- record_trial — one spatial-relation response (spec §4.2)
-- ---------------------------------------------------------------------------

create function record_trial(
  p_user_id uuid,
  p_minigame text,
  p_spatial_category text,
  p_stimulus_id text,
  p_response jsonb,
  p_is_correct boolean,
  p_response_time_ms integer
) returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null then
    raise exception 'not authenticated';
  end if;

  insert into data (
    user_id, minigame, spatial_category, stimulus_id,
    response, is_correct, response_time_ms
  )
  values (
    p_user_id, p_minigame, p_spatial_category, p_stimulus_id,
    p_response, p_is_correct, p_response_time_ms
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Useful read shape: one row per participant with languages + latest consent
-- ---------------------------------------------------------------------------

create view participant_overview as
select
  u.id,
  u.name,
  u.age_range,
  u.gender,
  u.gender_other,
  u.country,
  u.ui_language,
  u.created_at,
  u.updated_at,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('language', l.language, 'fluency', l.fluency)
        order by l.language
      )
      from user_languages l
      where l.user_id = u.id
    ),
    '[]'::jsonb
  ) as languages,
  (
    select jsonb_build_object(
      'agreed', c.agreed,
      'consent_version', c.consent_version,
      'timestamp', c.timestamp
    )
    from consents c
    where c.user_id = u.id
    order by c.timestamp desc
    limit 1
  ) as latest_consent,
  (select count(*) from data d where d.user_id = u.id) as trial_count
from users u;

-- ---------------------------------------------------------------------------
-- accounts — login identity; research rows stay on users and are linked here
-- ---------------------------------------------------------------------------

create table accounts (
  id             uuid primary key default gen_random_uuid(),
  userid         text not null,
  password_hash  text not null,
  user_id        uuid unique references users (id) on delete set null,
  created_at     timestamptz not null default now(),
  constraint accounts_userid_format check (
    char_length(userid) between 3 and 32
    and userid ~ '^[A-Za-z0-9_]+$'
  )
);

create unique index accounts_userid_lower_idx on accounts (lower(userid));
create index accounts_user_id_idx on accounts (user_id);

-- ---------------------------------------------------------------------------
-- App role: OS user `hector` via peer auth on the Unix socket
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'hector') then
    create role hector login;
  end if;
end
$$;

grant connect on database jerboa to hector;
grant usage, create on schema public to hector;
grant select, insert, update, delete on all tables in schema public to hector;
grant usage, select on all sequences in schema public to hector;
grant execute on all functions in schema public to hector;
grant select on participant_overview to hector;

alter default privileges in schema public
  grant select, insert, update, delete on tables to hector;
alter default privileges in schema public
  grant usage, select on sequences to hector;
alter default privileges in schema public
  grant execute on functions to hector;

commit;
