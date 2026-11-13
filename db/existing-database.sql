-- Moves an EXISTING AgroVendas database to least-privilege credentials without touching any data.
-- (New installs do not need this: db/init/01-app-role.sh does the same on first start.)
--
-- Run once, as the PostgreSQL superuser, against the application database. Take a backup first:
--   docker compose exec -T db pg_dump -U postgres agrovendas > backup.sql
--
--   docker compose exec -T db psql -U postgres -d agrovendas -v ON_ERROR_STOP=1 \
--     -v app_user=agrovendas_app -v app_pass="<new app password>" -v admin_pass="<new admin password>" \
--     < db/existing-database.sql
--
-- Then set DB_USERNAME, DB_PASSWORD and DB_ADMIN_PASSWORD in .env to match and restart the stack.

CREATE ROLE :"app_user" LOGIN PASSWORD :'app_pass' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
ALTER DATABASE agrovendas OWNER TO :"app_user";
ALTER SCHEMA public OWNER TO :"app_user";

-- The role name is spelled out here because psql variables are not expanded inside a DO block.
-- If you chose a name other than agrovendas_app, replace it below.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO agrovendas_app', r.tablename);
  END LOOP;
  FOR r IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO agrovendas_app', r.sequencename);
  END LOOP;
END $$;

REVOKE ALL ON DATABASE agrovendas FROM PUBLIC;
GRANT CONNECT ON DATABASE agrovendas TO :"app_user";
ALTER ROLE postgres PASSWORD :'admin_pass';
