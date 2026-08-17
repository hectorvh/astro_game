-- Upgrade an existing `jerboa` database: fold `consents` into `users`.
-- Safe to re-run. Fresh installs should use db/local.sql instead.
--
-- Apply with: pnpm db:merge

begin;

alter table users add column if not exists consent_version text;
alter table users add column if not exists consent_agreed boolean;
alter table users add column if not exists consent_at timestamptz;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'consents'
  ) then
    update users u
    set consent_version = c.consent_version,
        consent_agreed = c.agreed,
        consent_at = c.timestamp
    from (
      select distinct on (user_id)
        user_id, consent_version, agreed, timestamp
      from consents
      order by user_id, timestamp desc
    ) c
    where c.user_id = u.id
      and u.consent_version is null;
  end if;
end
$$;

update users
set consent_version = coalesce(consent_version, 'migrated'),
    consent_agreed = coalesce(consent_agreed, true),
    consent_at = coalesce(consent_at, created_at);

alter table users alter column consent_version set not null;
alter table users alter column consent_agreed set not null;
alter table users alter column consent_at set not null;
alter table users alter column consent_agreed set default true;
alter table users alter column consent_at set default now();

drop table if exists consents cascade;

create or replace function create_account(
  p_userid text,
  p_password_hash text,
  p_name text,
  p_age_range text,
  p_gender text,
  p_gender_other text,
  p_country text,
  p_ui_language text,
  p_languages jsonb,
  p_consent_version text
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

  insert into users (
    userid, password_hash, name, age_range, gender, gender_other,
    country, ui_language, consent_version, consent_agreed, consent_at
  )
  values (
    p_userid, p_password_hash, p_name, p_age_range, p_gender, p_gender_other,
    p_country, p_ui_language, p_consent_version, true, now()
  )
  returning * into v_user;

  insert into user_languages (user_id, language, fluency)
  select v_user.id, elem ->> 'language', elem ->> 'fluency'
  from jsonb_array_elements(p_languages) as elem;

  return to_jsonb(v_user);
end;
$$;

drop view if exists participant_overview;

create view participant_overview as
select
  u.id,
  u.userid,
  u.name,
  u.age_range,
  u.gender,
  u.gender_other,
  u.country,
  u.ui_language,
  u.consent_version,
  u.consent_agreed,
  u.consent_at,
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
  (select count(*) from data d where d.user_id = u.id) as trial_count
from users u;

grant execute on function create_account(
  text, text, text, text, text, text, text, text, jsonb, text
) to hector;
grant select on participant_overview to hector;

commit;
