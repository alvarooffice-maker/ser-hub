-- ============================================================
-- MIGRAÇÃO SER — Backfill de FKs históricas no funil
-- Execute no SQL Editor do Supabase
-- Gerado em: maio 2026
--
-- Popula vistoria_id, proposta_id e lead_id em registros antigos
-- que foram criados antes dessas colunas existirem.
-- Seguro rodar múltiplas vezes (usa WHERE IS NULL).
-- ============================================================

-- ─── LOGÍSTICA ────────────────────────────────────────────────────

-- Herda vistoria_id do contrato
UPDATE logistica l
SET    vistoria_id = c.vistoria_id
FROM   contratos c
WHERE  l.contrato_id = c.id
  AND  l.vistoria_id IS NULL
  AND  c.vistoria_id IS NOT NULL;

-- Herda proposta_id do contrato
UPDATE logistica l
SET    proposta_id = c.proposta_id
FROM   contratos c
WHERE  l.contrato_id = c.id
  AND  l.proposta_id IS NULL
  AND  c.proposta_id IS NOT NULL;

-- Herda lead_id do contrato
UPDATE logistica l
SET    lead_id = c.lead_id
FROM   contratos c
WHERE  l.contrato_id = c.id
  AND  l.lead_id IS NULL
  AND  c.lead_id IS NOT NULL;

-- ─── INSTALAÇÕES ──────────────────────────────────────────────────

-- Herda vistoria_id da logística → contrato
UPDATE instalacoes i
SET    vistoria_id = c.vistoria_id
FROM   logistica l
JOIN   contratos c ON c.id = l.contrato_id
WHERE  i.logistica_id = l.id
  AND  i.vistoria_id IS NULL
  AND  c.vistoria_id IS NOT NULL;

-- Herda proposta_id da logística → contrato
UPDATE instalacoes i
SET    proposta_id = c.proposta_id
FROM   logistica l
JOIN   contratos c ON c.id = l.contrato_id
WHERE  i.logistica_id = l.id
  AND  i.proposta_id IS NULL
  AND  c.proposta_id IS NOT NULL;

-- Herda lead_id do contrato
UPDATE instalacoes i
SET    lead_id = c.lead_id
FROM   contratos c
WHERE  i.contrato_id = c.id
  AND  i.lead_id IS NULL
  AND  c.lead_id IS NOT NULL;

-- ─── HOMOLOGAÇÕES ─────────────────────────────────────────────────

-- Herda vistoria_id da instalação → logística → contrato
UPDATE homologacoes h
SET    vistoria_id = c.vistoria_id
FROM   instalacoes i
JOIN   logistica l  ON l.id = i.logistica_id
JOIN   contratos c  ON c.id = l.contrato_id
WHERE  h.instalacao_id = i.id
  AND  h.vistoria_id IS NULL
  AND  c.vistoria_id IS NOT NULL;

-- Herda proposta_id
UPDATE homologacoes h
SET    proposta_id = c.proposta_id
FROM   instalacoes i
JOIN   logistica l  ON l.id = i.logistica_id
JOIN   contratos c  ON c.id = l.contrato_id
WHERE  h.instalacao_id = i.id
  AND  h.proposta_id IS NULL
  AND  c.proposta_id IS NOT NULL;

-- Herda lead_id do contrato
UPDATE homologacoes h
SET    lead_id = c.lead_id
FROM   contratos c
WHERE  h.contrato_id = c.id
  AND  h.lead_id IS NULL
  AND  c.lead_id IS NOT NULL;

-- ─── PÓS VENDA ────────────────────────────────────────────────────

-- Herda vistoria_id via cadeia homologação → instalação → logística → contrato
UPDATE posvenda p
SET    vistoria_id = c.vistoria_id
FROM   homologacoes h
JOIN   instalacoes  i ON i.id = h.instalacao_id
JOIN   logistica    l ON l.id = i.logistica_id
JOIN   contratos    c ON c.id = l.contrato_id
WHERE  p.homologacao_id = h.id
  AND  p.vistoria_id IS NULL
  AND  c.vistoria_id IS NOT NULL;

-- Herda proposta_id
UPDATE posvenda p
SET    proposta_id = c.proposta_id
FROM   homologacoes h
JOIN   instalacoes  i ON i.id = h.instalacao_id
JOIN   logistica    l ON l.id = i.logistica_id
JOIN   contratos    c ON c.id = l.contrato_id
WHERE  p.homologacao_id = h.id
  AND  p.proposta_id IS NULL
  AND  c.proposta_id IS NOT NULL;

-- Herda lead_id do contrato
UPDATE posvenda p
SET    lead_id = c.lead_id
FROM   contratos c
WHERE  p.contrato_id = c.id
  AND  p.lead_id IS NULL
  AND  c.lead_id IS NOT NULL;

-- ─── VERIFICAÇÃO ──────────────────────────────────────────────────
-- SELECT 'logistica'    AS tabela, COUNT(*) FILTER (WHERE vistoria_id IS NULL) AS sem_vistoria, COUNT(*) FILTER (WHERE proposta_id IS NULL) AS sem_proposta, COUNT(*) FILTER (WHERE lead_id IS NULL) AS sem_lead FROM logistica
-- UNION ALL
-- SELECT 'instalacoes',  COUNT(*) FILTER (WHERE vistoria_id IS NULL), COUNT(*) FILTER (WHERE proposta_id IS NULL), COUNT(*) FILTER (WHERE lead_id IS NULL) FROM instalacoes
-- UNION ALL
-- SELECT 'homologacoes', COUNT(*) FILTER (WHERE vistoria_id IS NULL), COUNT(*) FILTER (WHERE proposta_id IS NULL), COUNT(*) FILTER (WHERE lead_id IS NULL) FROM homologacoes
-- UNION ALL
-- SELECT 'posvenda',     COUNT(*) FILTER (WHERE vistoria_id IS NULL), COUNT(*) FILTER (WHERE proposta_id IS NULL), COUNT(*) FILTER (WHERE lead_id IS NULL) FROM posvenda;
