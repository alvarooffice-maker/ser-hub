-- Vincula receitas de repasse geradas automaticamente à logística
ALTER TABLE financeiro_receitas ADD COLUMN IF NOT EXISTS logistica_id uuid REFERENCES logistica(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_receitas_logistica_id ON financeiro_receitas (logistica_id);

NOTIFY pgrst, 'reload schema';
