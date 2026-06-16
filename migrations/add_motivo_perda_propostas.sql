-- Proposta recusada: motivo da recusa (mesmo campo usado em leads)
ALTER TABLE propostas ADD COLUMN IF NOT EXISTS motivo_perda text;

NOTIFY pgrst, 'reload schema';
