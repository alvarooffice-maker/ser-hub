-- ============================================================
-- ADD: campos de Testemunhas (Vendedor + Supervisor) em contratos
-- ------------------------------------------------------------
-- O modal de Contrato (seção Comercial) agora coleta o CPF do
-- vendedor e o nome/CPF do supervisor para preencher
-- automaticamente o bloco de assinaturas (Testemunha 1 e 2)
-- no PDF do contrato.
-- ============================================================

ALTER TABLE contratos
  ADD COLUMN IF NOT EXISTS vend_cpf         text,
  ADD COLUMN IF NOT EXISTS supervisor_nome  text,
  ADD COLUMN IF NOT EXISTS supervisor_cpf   text;
