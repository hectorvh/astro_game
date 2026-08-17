#!/usr/bin/env bash
# Apply db/local.sql to the local Postgres 16 cluster's `jerboa` database.
# Uses the Unix socket as the `postgres` OS user (via Docker) because this
# machine has no peer role for the logged-in user until the script creates one.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_UID="$(getent passwd postgres | cut -d: -f3)"
PG_GID="$(getent passwd postgres | cut -d: -f4)"
docker run --rm --user "$PG_UID:$PG_GID" \
  -v /var/run/postgresql:/var/run/postgresql \
  -v "$ROOT/db/local.sql:/sql/local.sql:ro" \
  postgres:16-alpine \
  psql -h /var/run/postgresql -U postgres -d jerboa -v ON_ERROR_STOP=1 -f /sql/local.sql
