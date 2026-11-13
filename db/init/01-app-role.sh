#!/bin/sh
# Runs once, when the database volume is first created (see docker-compose.yml).
#
# The application never connects as the PostgreSQL superuser. It uses its own role, which owns
# the application database and nothing else: no superuser, no CREATEDB, no CREATEROLE, no
# replication. The superuser password (DB_ADMIN_PASSWORD) is only for maintenance.
set -e

psql -v ON_ERROR_STOP=1 \
     -v app_user="$APP_DB_USER" -v app_pass="$APP_DB_PASSWORD" -v db_name="$POSTGRES_DB" \
     --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_pass' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
ALTER DATABASE :"db_name" OWNER TO :"app_user";
ALTER SCHEMA public OWNER TO :"app_user";
REVOKE ALL ON DATABASE :"db_name" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";
SQL
