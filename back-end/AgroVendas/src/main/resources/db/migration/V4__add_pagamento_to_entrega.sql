-- On an existing installation, add the payment-tracking columns now.
-- On a new installation Hibernate creates them afterwards from the entity.
DO $$
BEGIN
    IF to_regclass('public.entrega') IS NOT NULL THEN
        ALTER TABLE entrega ADD COLUMN IF NOT EXISTS valor_total NUMERIC(38,2) NOT NULL DEFAULT 0;
        ALTER TABLE entrega ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(38,2) NOT NULL DEFAULT 0;
        ALTER TABLE entrega ADD COLUMN IF NOT EXISTS vales_pagos INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;
