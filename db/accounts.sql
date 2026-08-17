-- Additive: login accounts linked to the existing users row.
begin;

create table if not exists accounts (
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

create unique index if not exists accounts_userid_lower_idx on accounts (lower(userid));
create index if not exists accounts_user_id_idx on accounts (user_id);

grant select, insert, update, delete on accounts to hector;

commit;
