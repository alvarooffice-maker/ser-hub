-- ============================================================
-- MIGRAÇÃO SER — Deduplicação + constraints UNIQUE no funil
-- Execute no SQL Editor do Supabase
-- Gerado em: maio 2026
-- ============================================================

-- ─── PASSO 1: Remove duplicatas (mantém o registro mais recente) ──

-- logistica: remove duplicatas por contrato_id
DELETE FROM logistica
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY contrato_id
             ORDER BY criado_em DESC NULLS LAST
           ) AS rn
    FROM logistica
    WHERE contrato_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- instalacoes: remove duplicatas por logistica_id
DELETE FROM instalacoes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY logistica_id
             ORDER BY criado_em DESC NULLS LAST
           ) AS rn
    FROM instalacoes
    WHERE logistica_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- homologacoes: remove duplicatas por instalacao_id
DELETE FROM homologacoes
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY instalacao_id
             ORDER BY criado_em DESC NULLS LAST
           ) AS rn
    FROM homologacoes
    WHERE instalacao_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- posvenda: remove duplicatas por homologacao_id
DELETE FROM posvenda
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY homologacao_id
             ORDER BY criado_em DESC NULLS LAST
           ) AS rn
    FROM posvenda
    WHERE homologacao_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- contratos: remove duplicatas por vistoria_id
DELETE FROM contratos
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY vistoria_id
             ORDER BY criado_em DESC NULLS LAST
           ) AS rn
    FROM contratos
    WHERE vistoria_id IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- ─── PASSO 2: Adiciona UNIQUE constraints (previne futuras duplicatas) ──
-- Usa DROP + ADD para ser idempotente (seguro rodar múltiplas vezes)

ALTER TABLE contratos    DROP CONSTRAINT IF EXISTS uq_contratos_vistoria;
ALTER TABLE contratos    ADD  CONSTRAINT uq_contratos_vistoria    UNIQUE (vistoria_id);

ALTER TABLE logistica    DROP CONSTRAINT IF EXISTS uq_logistica_contrato;
ALTER TABLE logistica    ADD  CONSTRAINT uq_logistica_contrato    UNIQUE (contrato_id);

ALTER TABLE instalacoes  DROP CONSTRAINT IF EXISTS uq_instalacoes_logistica;
ALTER TABLE instalacoes  ADD  CONSTRAINT uq_instalacoes_logistica UNIQUE (logistica_id);

ALTER TABLE homologacoes DROP CONSTRAINT IF EXISTS uq_homologacoes_instalacao;
ALTER TABLE homologacoes ADD  CONSTRAINT uq_homologacoes_instalacao UNIQUE (instalacao_id);

ALTER TABLE posvenda     DROP CONSTRAINT IF EXISTS uq_posvenda_homologacao;
ALTER TABLE posvenda     ADD  CONSTRAINT uq_posvenda_homologacao  UNIQUE (homologacao_id);

-- ─── VERIFICAÇÃO ──────────────────────────────────────────────────────
-- SELECT conname, contype, conrelid::regclass AS tabela
--   FROM pg_constraint
--  WHERE conname LIKE 'uq_%'
--  ORDER BY tabela;
