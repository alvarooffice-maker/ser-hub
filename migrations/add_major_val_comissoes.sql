-- Salva o valor base da comissão do vendedor e o majorado separadamente
ALTER TABLE comissoes ADD COLUMN IF NOT EXISTS vend_base  numeric;
ALTER TABLE comissoes ADD COLUMN IF NOT EXISTS major_val  numeric;

NOTIFY pgrst, 'reload schema';
