DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'clientes' AND column_name = 'email'
    ) THEN
        ALTER TABLE clientes RENAME COLUMN email TO localizacao;
    END IF;
END $$;
