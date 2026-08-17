#!/usr/bin/env bash
# Apply additive schema upgrades on the local `jerboa` database.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_UID="$(getent passwd postgres | cut -d: -f3)"
PG_GID="$(getent passwd postgres | cut -d: -f4)"

apply() {
  local file="$1"
  docker run --rm --user "$PG_UID:$PG_GID" \
    -v /var/run/postgresql:/var/run/postgresql \
    -v "$ROOT/db/$file:/sql/merge.sql:ro" \
    postgres:16-alpine \
    psql -h /var/run/postgresql -U postgres -d jerboa -v ON_ERROR_STOP=1 -f /sql/merge.sql
}

apply merge-accounts-into-users.sql
apply merge-consents-into-users.sql
