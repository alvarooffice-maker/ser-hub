-- ============================================================
-- FIX: homologacoes_etapa_check estava sem 'aumento_de_carga'
-- ------------------------------------------------------------
-- O código do app permite selecionar a etapa "Aumento de Carga"
-- no kanban de Homologação, mas a constraint do banco não incluía
-- esse valor, causando o erro:
--   "new row for relation homologacoes violates check constraint
--    homologacoes_etapa_check"
--
-- Caso real: card do cliente Fernando Lourenço travado nessa etapa.
-- ============================================================

ALTER TABLE homologacoes
  DROP CONSTRAINT IF EXISTS homologacoes_etapa_check;

ALTER TABLE homologacoes
  ADD CONSTRAINT homologacoes_etapa_check
  CHECK (etapa IN (
    'aguardando_docs',
    'projeto',
    'trt_art_pg',
    'parecer_acesso',
    'aumento_de_carga',
    'vistoria_final',
    'aprovada',
    'reprovada'
  ));
