-- ============================================================
-- ADD: campos de vínculo direto em posvenda
-- ------------------------------------------------------------
-- Clientes importados via CSV (base antiga) entram em "posvenda"
-- sem nenhum registro vinculado de proposta/vistoria/logística/
-- instalação. Esses campos permitem que o time vincule (ou crie)
-- esses registros depois, completando o histórico do cliente.
--
-- contrato_id e homologacao_id já existem na tabela.
-- ============================================================

ALTER TABLE posvenda
  ADD COLUMN IF NOT EXISTS proposta_id   uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id   uuid REFERENCES vistorias(id),
  ADD COLUMN IF NOT EXISTS logistica_id  uuid REFERENCES logistica(id),
  ADD COLUMN IF NOT EXISTS instalacao_id uuid REFERENCES instalacoes(id);
