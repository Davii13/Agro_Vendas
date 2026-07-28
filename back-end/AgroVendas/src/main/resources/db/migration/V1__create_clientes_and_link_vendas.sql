CREATE TABLE IF NOT EXISTS clientes (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(30),
    cpf_cnpj VARCHAR(18) UNIQUE,
    email VARCHAR(150),
    observacoes TEXT
);

DO $$
BEGIN
    -- On an existing installation, link the legacy vendas table immediately.
    -- On a new installation Hibernate creates it afterwards from the entity.
    IF to_regclass('public.vendas') IS NOT NULL THEN
        ALTER TABLE vendas ADD COLUMN IF NOT EXISTS cliente_id BIGINT;
        ALTER TABLE vendas DROP CONSTRAINT IF EXISTS fk_vendas_cliente;
        ALTER TABLE vendas ADD CONSTRAINT fk_vendas_cliente
            FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
