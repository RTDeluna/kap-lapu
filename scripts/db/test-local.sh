#!/usr/bin/env bash
# Runs the migrations and the pgTAP suite against a throwaway local database.
# Needs Postgres 16 with PostGIS 3 and pgTAP, plus pg_prove.
#   PGHOST=/tmp PGPORT=54329 PGUSER=postgres scripts/db/test-local.sh
# CI and anyone with Docker can use `supabase start && supabase test db` instead.
set -euo pipefail

cd "$(dirname "$0")/../.."
DB="${LAOT_TEST_DB:-laot_test}"

dropdb --if-exists "$DB"
createdb "$DB"

psql -v ON_ERROR_STOP=1 -q -d "$DB" -f scripts/db/supabase_shim.sql
for f in supabase/migrations/*.sql; do
  psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$f"
done

pg_prove -d "$DB" supabase/tests/*.test.sql
