-- Access control: every account gets a role and a token version.
-- Existing accounts become OPERADOR; the first ADMIN is promoted at startup from
-- the ADMIN_EMAIL environment variable (see AdminInitializer), never by a fixed value here.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'OPERADOR';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
UPDATE usuarios SET ativo = TRUE WHERE ativo IS NULL;
ALTER TABLE usuarios ALTER COLUMN ativo SET NOT NULL;
