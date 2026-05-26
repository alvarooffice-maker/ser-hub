-- ============================================================
-- SISTEMA SER — MIGRAÇÃO COMPLETA
-- Consolida: auditoria + flags + dedup + backfill + homologação + pós venda + técnicos + instalação
-- Execute TODO de uma vez no SQL Editor do Supabase
-- 100% idempotente: seguro rodar mesmo que partes já existam
-- Atualizado em: maio 2026 (Blocos 1–12)
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- BLOCO 1 — NOVAS COLUNAS (IF NOT EXISTS)
-- ════════════════════════════════════════════════════════════

-- ─── LEADS ────────────────────────────────────────────────────
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS nascimento date;

-- ─── PROPOSTAS — campos de economia ──────────────────────────
ALTER TABLE propostas
  ADD COLUMN IF NOT EXISTS conta_sem_solar numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conta_com_solar  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS economia_mensal  numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS economia_5anos   numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS area_minima      numeric DEFAULT 0;

-- ─── LOGÍSTICA — rastreabilidade ─────────────────────────────
ALTER TABLE logistica
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ─── INSTALAÇÕES — rastreabilidade ───────────────────────────
ALTER TABLE instalacoes
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ─── HOMOLOGAÇÕES — rastreabilidade ──────────────────────────
ALTER TABLE homologacoes
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ─── PÓS VENDA — rastreabilidade ─────────────────────────────
ALTER TABLE posvenda
  ADD COLUMN IF NOT EXISTS proposta_id uuid REFERENCES propostas(id),
  ADD COLUMN IF NOT EXISTS vistoria_id uuid REFERENCES vistorias(id);

-- ════════════════════════════════════════════════════════════
-- BLOCO 2 — LIMPEZA DE DUPLICATAS
-- Mantém o registro mais recente por chave estrangeira
-- ════════════════════════════════════════════════════════════

DELETE FROM logistica
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY contrato_id ORDER BY criado_em DESC NULLS LAST) rn
    FROM logistica WHERE contrato_id IS NOT NULL
  ) t WHERE rn > 1
);

DELETE FROM instalacoes
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY logistica_id ORDER BY criado_em DESC NULLS LAST) rn
    FROM instalacoes WHERE logistica_id IS NOT NULL
  ) t WHERE rn > 1
);

DELETE FROM homologacoes
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY instalacao_id ORDER BY criado_em DESC NULLS LAST) rn
    FROM homologacoes WHERE instalacao_id IS NOT NULL
  ) t WHERE rn > 1
);

DELETE FROM posvenda
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY homologacao_id ORDER BY criado_em DESC NULLS LAST) rn
    FROM posvenda WHERE homologacao_id IS NOT NULL
  ) t WHERE rn > 1
);

DELETE FROM contratos
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY vistoria_id ORDER BY criado_em DESC NULLS LAST) rn
    FROM contratos WHERE vistoria_id IS NOT NULL
  ) t WHERE rn > 1
);

-- ════════════════════════════════════════════════════════════
-- BLOCO 3 — CONSTRAINTS UNIQUE (DROP + ADD = idempotente)
-- Impede duplicatas futuras no banco
-- ════════════════════════════════════════════════════════════

ALTER TABLE contratos    DROP CONSTRAINT IF EXISTS uq_contratos_vistoria;
ALTER TABLE contratos    ADD  CONSTRAINT uq_contratos_vistoria     UNIQUE (vistoria_id);

ALTER TABLE logistica    DROP CONSTRAINT IF EXISTS uq_logistica_contrato;
ALTER TABLE logistica    ADD  CONSTRAINT uq_logistica_contrato     UNIQUE (contrato_id);

ALTER TABLE instalacoes  DROP CONSTRAINT IF EXISTS uq_instalacoes_logistica;
ALTER TABLE instalacoes  ADD  CONSTRAINT uq_instalacoes_logistica  UNIQUE (logistica_id);

ALTER TABLE homologacoes DROP CONSTRAINT IF EXISTS uq_homologacoes_instalacao;
ALTER TABLE homologacoes ADD  CONSTRAINT uq_homologacoes_instalacao UNIQUE (instalacao_id);

ALTER TABLE posvenda     DROP CONSTRAINT IF EXISTS uq_posvenda_homologacao;
ALTER TABLE posvenda     ADD  CONSTRAINT uq_posvenda_homologacao   UNIQUE (homologacao_id);

-- ════════════════════════════════════════════════════════════
-- BLOCO 4 — BACKFILL DE FKs HISTÓRICAS
-- Popula vistoria_id / proposta_id / lead_id em registros
-- criados antes dessas colunas existirem (WHERE IS NULL)
-- ════════════════════════════════════════════════════════════

-- ─── LOGÍSTICA ────────────────────────────────────────────────
UPDATE logistica l SET vistoria_id = c.vistoria_id
FROM contratos c
WHERE l.contrato_id = c.id AND l.vistoria_id IS NULL AND c.vistoria_id IS NOT NULL;

UPDATE logistica l SET proposta_id = c.proposta_id
FROM contratos c
WHERE l.contrato_id = c.id AND l.proposta_id IS NULL AND c.proposta_id IS NOT NULL;

UPDATE logistica l SET lead_id = c.lead_id
FROM contratos c
WHERE l.contrato_id = c.id AND l.lead_id IS NULL AND c.lead_id IS NOT NULL;

-- ─── INSTALAÇÕES ──────────────────────────────────────────────
UPDATE instalacoes i SET vistoria_id = c.vistoria_id
FROM logistica l JOIN contratos c ON c.id = l.contrato_id
WHERE i.logistica_id = l.id AND i.vistoria_id IS NULL AND c.vistoria_id IS NOT NULL;

UPDATE instalacoes i SET proposta_id = c.proposta_id
FROM logistica l JOIN contratos c ON c.id = l.contrato_id
WHERE i.logistica_id = l.id AND i.proposta_id IS NULL AND c.proposta_id IS NOT NULL;

UPDATE instalacoes i SET lead_id = c.lead_id
FROM contratos c
WHERE i.contrato_id = c.id AND i.lead_id IS NULL AND c.lead_id IS NOT NULL;

-- ─── HOMOLOGAÇÕES ─────────────────────────────────────────────
UPDATE homologacoes h SET vistoria_id = c.vistoria_id
FROM instalacoes i JOIN logistica l ON l.id = i.logistica_id JOIN contratos c ON c.id = l.contrato_id
WHERE h.instalacao_id = i.id AND h.vistoria_id IS NULL AND c.vistoria_id IS NOT NULL;

UPDATE homologacoes h SET proposta_id = c.proposta_id
FROM instalacoes i JOIN logistica l ON l.id = i.logistica_id JOIN contratos c ON c.id = l.contrato_id
WHERE h.instalacao_id = i.id AND h.proposta_id IS NULL AND c.proposta_id IS NOT NULL;

UPDATE homologacoes h SET lead_id = c.lead_id
FROM contratos c
WHERE h.contrato_id = c.id AND h.lead_id IS NULL AND c.lead_id IS NOT NULL;

-- ─── PÓS VENDA ────────────────────────────────────────────────
UPDATE posvenda p SET vistoria_id = c.vistoria_id
FROM homologacoes h JOIN instalacoes i ON i.id = h.instalacao_id
  JOIN logistica l ON l.id = i.logistica_id JOIN contratos c ON c.id = l.contrato_id
WHERE p.homologacao_id = h.id AND p.vistoria_id IS NULL AND c.vistoria_id IS NOT NULL;

UPDATE posvenda p SET proposta_id = c.proposta_id
FROM homologacoes h JOIN instalacoes i ON i.id = h.instalacao_id
  JOIN logistica l ON l.id = i.logistica_id JOIN contratos c ON c.id = l.contrato_id
WHERE p.homologacao_id = h.id AND p.proposta_id IS NULL AND c.proposta_id IS NOT NULL;

UPDATE posvenda p SET lead_id = c.lead_id
FROM contratos c
WHERE p.contrato_id = c.id AND p.lead_id IS NULL AND c.lead_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════
-- BLOCO 5 — ADMIN
-- ════════════════════════════════════════════════════════════

UPDATE perfis SET perfil = 'admin' WHERE email = 'alvaro.office@gmail.com';

-- ════════════════════════════════════════════════════════════
-- BLOCO 6 — TABELA METAS (meta mensal do dashboard)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS metas (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  mes         text        NOT NULL UNIQUE,   -- formato 'YYYY-MM'
  valor       numeric     DEFAULT 0,
  criado_em   timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autenticados_metas" ON metas;
CREATE POLICY "autenticados_metas" ON metas
  FOR ALL USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
-- BLOCO 7 — COLUNAS EXTRAS EM INSTALACOES
-- (endereço herdado do contrato e Google Maps)
-- ════════════════════════════════════════════════════════════

ALTER TABLE instalacoes
  ADD COLUMN IF NOT EXISTS cep  text,
  ADD COLUMN IF NOT EXISTS gmap text;

-- ════════════════════════════════════════════════════════════
-- BLOCO 8 — TABELA TENTATIVAS_CONTATO (se ainda não existir)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS tentativas_contato (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id    uuid        REFERENCES leads(id),
  tipo       text,
  resultado  text,
  obs        text,
  criado_por uuid,
  criado_em  timestamptz DEFAULT now()
);

ALTER TABLE tentativas_contato ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "autenticados_tc" ON tentativas_contato;
CREATE POLICY "autenticados_tc" ON tentativas_contato
  FOR ALL USING (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
-- BLOCO 9 — COLUNAS DO FORMULÁRIO DE HOMOLOGAÇÃO
-- Garante que todos os campos do modal existam na tabela
-- (seguro para instâncias antigas criadas antes desses campos)
-- ════════════════════════════════════════════════════════════

ALTER TABLE homologacoes
  ADD COLUMN IF NOT EXISTS mesmo_cliente   boolean     DEFAULT false,
  ADD COLUMN IF NOT EXISTS hom_nome        text,
  ADD COLUMN IF NOT EXISTS hom_cpf         text,
  ADD COLUMN IF NOT EXISTS hom_rg          text,
  ADD COLUMN IF NOT EXISTS hom_nasc        date,
  ADD COLUMN IF NOT EXISTS tecnico         text,
  ADD COLUMN IF NOT EXISTS concessionaria  text,
  ADD COLUMN IF NOT EXISTS trt_val         numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS art_val         numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tecnico_val     numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimado        numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pago            numeric     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_assinatura date,
  ADD COLUMN IF NOT EXISTS obs             text,
  ADD COLUMN IF NOT EXISTS docs            jsonb       DEFAULT '{}';

-- ════════════════════════════════════════════════════════════
-- BLOCO 10 — COLUNAS DO FORMULÁRIO DE PÓS VENDA
-- ════════════════════════════════════════════════════════════

ALTER TABLE posvenda
  ADD COLUMN IF NOT EXISTS data_ativacao   date,
  ADD COLUMN IF NOT EXISTS obs             text;

-- ════════════════════════════════════════════════════════════
-- BLOCO 11 — TÉCNICO EM VISTORIAS E INSTALAÇÕES
-- Campo adicionado ao datalist e formulários em mai/2026
-- ════════════════════════════════════════════════════════════

ALTER TABLE vistorias
  ADD COLUMN IF NOT EXISTS tecnico          text,
  ADD COLUMN IF NOT EXISTS hora_agendamento time;

ALTER TABLE instalacoes
  ADD COLUMN IF NOT EXISTS tecnico          text,
  ADD COLUMN IF NOT EXISTS data_instalacao  date;

-- ════════════════════════════════════════════════════════════
-- BLOCO 12 — COLUNAS COMPLETAS DO FORMULÁRIO DE INSTALAÇÃO
-- Valores extras, hora, obs e fotos
-- ════════════════════════════════════════════════════════════

ALTER TABLE instalacoes
  ADD COLUMN IF NOT EXISTS hora_instalacao   time,
  ADD COLUMN IF NOT EXISTS endereco          text,
  ADD COLUMN IF NOT EXISTS obs               text,
  ADD COLUMN IF NOT EXISTS fotos             jsonb    DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tem_poste         boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS val_poste         numeric  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tem_troca_padrao  boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS val_troca_padrao  numeric  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimado          numeric  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pago              numeric  DEFAULT 0;

-- ════════════════════════════════════════════════════════════
-- VERIFICAÇÃO — descomente e rode para confirmar
-- ════════════════════════════════════════════════════════════
/*
-- Colunas novas
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('leads','propostas','logistica','instalacoes','homologacoes','posvenda')
  AND column_name IN ('nascimento','conta_sem_solar','conta_com_solar','economia_mensal',
                      'economia_5anos','area_minima','proposta_id','vistoria_id')
ORDER BY table_name, column_name;

-- Constraints UNIQUE
SELECT conname, conrelid::regclass AS tabela
FROM pg_constraint WHERE conname LIKE 'uq_%' ORDER BY tabela;

-- Registros ainda sem FKs (deve retornar zeros)
SELECT 'logistica'    AS tabela,
  COUNT(*) FILTER (WHERE vistoria_id IS NULL) sem_vistoria,
  COUNT(*) FILTER (WHERE proposta_id IS NULL) sem_proposta,
  COUNT(*) FILTER (WHERE lead_id     IS NULL) sem_lead
FROM logistica
UNION ALL
SELECT 'instalacoes',
  COUNT(*) FILTER (WHERE vistoria_id IS NULL),
  COUNT(*) FILTER (WHERE proposta_id IS NULL),
  COUNT(*) FILTER (WHERE lead_id     IS NULL)
FROM instalacoes
UNION ALL
SELECT 'homologacoes',
  COUNT(*) FILTER (WHERE vistoria_id IS NULL),
  COUNT(*) FILTER (WHERE proposta_id IS NULL),
  COUNT(*) FILTER (WHERE lead_id     IS NULL)
FROM homologacoes
UNION ALL
SELECT 'posvenda',
  COUNT(*) FILTER (WHERE vistoria_id IS NULL),
  COUNT(*) FILTER (WHERE proposta_id IS NULL),
  COUNT(*) FILTER (WHERE lead_id     IS NULL)
FROM posvenda;
*/
