#!/bin/bash
# Drops all table and re-runs init.sql

echo Dropping all tables from public schema...
docker exec ASCI_db psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
script=`cat init.sql`
docker exec ASCI_db psql -U postgres -c "$script"
