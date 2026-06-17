-- Vincula receitas e despesas a um projeto (contrato) para o painel Financeiro do Projeto
ALTER TABLE financeiro_receitas ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES contratos(id) ON DELETE SET NULL;
ALTER TABLE financeiro_receitas ADD COLUMN IF NOT EXISTS recebedor text;

ALTER TABLE financeiro_despesas ADD COLUMN IF NOT EXISTS contrato_id uuid REFERENCES contratos(id) ON DELETE SET NULL;
ALTER TABLE financeiro_despesas ADD COLUMN IF NOT EXISTS recebedor text;

CREATE INDEX IF NOT EXISTS idx_receitas_contrato_id ON financeiro_receitas (contrato_id);
CREATE INDEX IF NOT EXISTS idx_despesas_contrato_id ON financeiro_despesas (contrato_id);

NOTIFY pgrst, 'reload schema';
