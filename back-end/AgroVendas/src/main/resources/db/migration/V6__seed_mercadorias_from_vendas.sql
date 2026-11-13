-- Sales used to accept free-text product names. Register the names already in
-- use so existing sales can still be edited now that products must be registered.
-- On a new installation the tables do not exist yet (Hibernate creates them later).
DO $$
BEGIN
    IF to_regclass('public.mercadoria') IS NOT NULL AND to_regclass('public.venda_mercadorias') IS NOT NULL THEN
        INSERT INTO mercadoria (nome)
        SELECT DISTINCT ON (lower(btrim(vm.nome))) btrim(vm.nome)
        FROM venda_mercadorias vm
        WHERE vm.nome IS NOT NULL AND btrim(vm.nome) <> ''
          AND NOT EXISTS (SELECT 1 FROM mercadoria m WHERE lower(m.nome) = lower(btrim(vm.nome)))
        ORDER BY lower(btrim(vm.nome)), btrim(vm.nome);
    END IF;
END $$;
