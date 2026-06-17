-- Logística: valor da nota, valor da compra e valor de repasse (calculado)
ALTER TABLE logistica ADD COLUMN IF NOT EXISTS valor_nota     numeric;
ALTER TABLE logistica ADD COLUMN IF NOT EXISTS valor_compra   numeric;
ALTER TABLE logistica ADD COLUMN IF NOT EXISTS valor_repasse  numeric;

NOTIFY pgrst, 'reload schema';
