-- ============================================================
-- MIGRAÇÃO SER — Flags do funil + aniversário do lead
-- Execute no SQL Editor do Supabase
-- Gerado em: maio 2026
-- SEGURO para rodar mesmo que migration_auditoria.sql já exista
-- ============================================================

-- ─── 1. LEADS — data de nascimento (para flag de aniversário) ───
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS nascimento date;

-- ─── 2. PROPOSTAS — campos de economia (v1 restaurados) ─────────
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS conta_sem_solar numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conta_com_solar  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS economia_mensal  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS economia_5anos   numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS area_minima      numeric DEFAULT 0;

-- ─── 3. LOGÍSTICA — rastreabilidade completa da cadeia ──────────
ALTER TABLE logistica
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ─── 4. INSTALAÇÕES — rastreabilidade completa da cadeia ────────
ALTER TABLE instalacoes
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ─── 5. HOMOLOGAÇÕES — rastreabilidade completa da cadeia ───────
ALTER TABLE homologacoes
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ─── 6. PÓS VENDA — rastreabilidade completa da cadeia ──────────
ALTER TABLE posvenda
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ─── 7. ADMIN — garantir perfil correto ─────────────────────────
UPDATE perfis SET perfil = 'admin' WHERE email = 'alvaro.office@gmail.com';

-- ============================================================
-- VERIFICAÇÃO — rode após a migração para confirmar
-- ============================================================
-- SELECT table_name, column_name, data_type
--   FROM information_schema.columns
--  WHERE table_name IN ('leads','propostas','logistica','instalacoes','homologacoes','posvenda')
--    AND column_name IN (
--          'nascimento',
--          'conta_sem_solar','conta_com_solar','economia_mensal','economia_5anos','area_minima',
--          'proposta_id','vistoria_id'
--        )
--  ORDER BY table_name, column_name;
