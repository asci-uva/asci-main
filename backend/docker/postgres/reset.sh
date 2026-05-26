#!/usr/bin/env bash
# Drops all tables and re-runs init.sql

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INIT_SQL="${SCRIPT_DIR}/init.sql"

echo "Dropping all tables from public schema in database asci..."
docker exec ASCI_db psql -U asci -d asci -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Recreating schema from ${INIT_SQL}..."
docker exec -i ASCI_db psql -U asci -d asci -f - < "${INIT_SQL}"

echo "Reset complete."
