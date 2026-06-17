-- Vincula despesas geradas automaticamente às comissões
ALTER TABLE financeiro_despesas ADD COLUMN IF NOT EXISTS comissao_id uuid REFERENCES comissoes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_despesas_comissao_id ON financeiro_despesas (comissao_id);

NOTIFY pgrst, 'reload schema';
