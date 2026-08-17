-- Upgrade an existing `jerboa` database that still has a separate `accounts`
-- table. Safe to re-run. Fresh installs should use db/local.sql instead.
--
-- Apply with: pnpm db:merge

begin;

alter table users add column if not exists userid text;
alter table users add column if not exists password_hash text;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'accounts'
  ) then
    update users u
    set userid = a.userid,
        password_hash = a.password_hash
    from accounts a
    where a.user_id = u.id
      and (u.userid is null or u.password_hash is null);
  end if;
end
$$;

-- Incomplete sign-ups never received a linked users row; drop leftover
-- research rows that cannot log in.
delete from users where userid is null or password_hash is null;

alter table users alter column userid set not null;
alter table users alter column password_hash set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'users_userid_format'
  ) then
    alter table users add constraint users_userid_format check (
      char_length(userid) between 3 and 32
      and userid ~ '^[A-Za-z0-9_]+$'
    );
  end if;
end
$$;

create unique index if not exists users_userid_lower_idx on users (lower(userid));

drop table if exists accounts cascade;

create or replace function save_participant(
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
  if p_user_id is null then
    raise exception 'unknown participant';
  end if;

  if jsonb_array_length(coalesce(p_languages, '[]'::jsonb)) < 1 then
    raise exception 'at least one spoken language is required';
  end if;

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

  insert into user_languages (user_id, language, fluency)
  select v_user.id, elem ->> 'language', elem ->> 'fluency'
  from jsonb_array_elements(p_languages) as elem;

  return to_jsonb(v_user);
end;
$$;

grant execute on function save_participant(
  uuid, text, text, text, text, text, text, jsonb
) to hector;

commit;
