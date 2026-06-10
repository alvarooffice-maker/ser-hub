-- ============================================================
-- SISTEMA SER v2 — SCHEMA COMPLETO
-- Execute no SQL Editor do Supabase (projeto existente)
-- ============================================================

-- ─── 1. REMOVE TABELAS ANTIGAS ────────────────────────────
DROP TABLE IF EXISTS tentativas_remarketing CASCADE;
DROP TABLE IF EXISTS tentativas_contato CASCADE;
DROP TABLE IF EXISTS remarketing CASCADE;
DROP TABLE IF EXISTS posvenda CASCADE;
DROP TABLE IF EXISTS homologacoes CASCADE;
DROP TABLE IF EXISTS instalacoes CASCADE;
DROP TABLE IF EXISTS logistica CASCADE;
DROP TABLE IF EXISTS contratos CASCADE;
DROP TABLE IF EXISTS vistorias CASCADE;
DROP TABLE IF EXISTS propostas CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS comissoes CASCADE;
DROP TABLE IF EXISTS financeiro_receitas CASCADE;
DROP TABLE IF EXISTS financeiro_despesas CASCADE;
DROP TABLE IF EXISTS cadastros CASCADE;
DROP TABLE IF EXISTS perfis CASCADE;

-- ─── 2. EXTENSÕES ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 3. PERFIS DE USUÁRIO ─────────────────────────────────
CREATE TABLE perfis (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome      text NOT NULL,
  email     text,
  perfil    text NOT NULL DEFAULT 'vendedor'
              CHECK (perfil IN ('admin','supervisor','vendedor',
                                'tec_vistoria','tec_instalacao',
                                'tec_homologacao','financeiro')),
  ativo     boolean DEFAULT true,
  criado_em timestamptz DEFAULT now()
);

-- ─── 4. LEADS ─────────────────────────────────────────────
CREATE TABLE leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             text NOT NULL,
  telefone         text,
  kwh              numeric DEFAULT 0,
  canal            text,   -- PAP, Network, Captação, Indicação, Tráfego pago, Redes sociais
  vendedor         text,
  captador         text,
  sdr              text,
  status           text DEFAULT 'em_contato'
                     CHECK (status IN ('em_contato','proposta','perdido')),
  motivo_perda     text
                     CHECK (motivo_perda IN ('sem_interesse','sem_credito',
                                             'concorrente','sem_resposta',
                                             'vistoria_reprovada','oportunidade_futura')),
  data_reativacao  date,
  obs              text,
  criado_por       uuid REFERENCES auth.users(id),
  criado_em        timestamptz DEFAULT now(),
  atualizado_em    timestamptz DEFAULT now()
);

-- ─── 5. TENTATIVAS DE CONTATO (timestamp imutável) ────────
CREATE TABLE tentativas_contato (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo        text NOT NULL
                CHECK (tipo IN ('whatsapp','ligacao','email','visita','outro')),
  resultado   text
                CHECK (resultado IN ('sem_resposta','contato_feito',
                                     'agendou_retorno','interessado','nao_interessado')),
  obs         text,
  criado_por  uuid REFERENCES auth.users(id),
  criado_em   timestamptz DEFAULT now()  -- IMUTÁVEL: gerado pelo servidor
);

-- ─── 6. PROPOSTAS ─────────────────────────────────────────
CREATE TABLE propostas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid REFERENCES leads(id),
  nome            text NOT NULL,
  telefone        text,
  email           text,
  -- Endereço
  cep             text,
  rua             text,
  numero          text,
  complemento     text,
  bairro          text,
  cidade          text,
  estado          text,
  -- Kit preliminar
  qtd_modulos     integer DEFAULT 0,
  marca_modulo    text,
  pot_modulo      numeric DEFAULT 0,   -- watts
  qtd_inversores  integer DEFAULT 1,
  marca_inversor  text,
  pot_inversor    numeric DEFAULT 0,   -- kW
  qtd_baterias    integer DEFAULT 0,
  marca_bateria   text,
  pot_bateria     numeric DEFAULT 0,   -- kWh
  kwp             numeric DEFAULT 0,
  kwh             numeric DEFAULT 0,
  -- Proposta
  valor           numeric DEFAULT 0,
  validade        text DEFAULT '7 dias',
  status          text DEFAULT 'em_aberto'
                    CHECK (status IN ('em_aberto','enviada','aceita','recusada')),
  -- Vendedor
  vendedor        text,
  vend_telefone   text,
  vend_email      text,
  -- Meta
  criado_por      uuid REFERENCES auth.users(id),
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

-- ─── 7. VISTORIAS ─────────────────────────────────────────
CREATE TABLE vistorias (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id          uuid REFERENCES propostas(id),
  lead_id              uuid REFERENCES leads(id),
  nome                 text NOT NULL,
  telefone             text,
  email                text,
  -- Endereço
  cep                  text,
  rua                  text,
  numero               text,
  complemento          text,
  bairro               text,
  cidade               text,
  estado               text,
  gmap                 text,
  -- Kit confirmado
  qtd_modulos          integer DEFAULT 0,
  marca_modulo         text,
  pot_modulo           numeric DEFAULT 0,
  qtd_inversores       integer DEFAULT 1,
  marca_inversor       text,
  pot_inversor         numeric DEFAULT 0,
  qtd_baterias         integer DEFAULT 0,
  marca_bateria        text,
  pot_bateria          numeric DEFAULT 0,
  kwp                  numeric DEFAULT 0,
  -- Agendamento
  data_agendamento     date,
  hora_agendamento     text,
  tecnico              text,
  -- Presença
  cliente_presente     boolean,
  responsavel_ausencia text,
  -- Resultado
  resultado            text
                         CHECK (resultado IN ('aprovada','reprovada',
                                              'aprovada_com_obra',
                                              'aprovada_com_sombreamento',
                                              'aprovada_com_obra_e_sombreamento')),
  status               text DEFAULT 'agendada'
                         CHECK (status IN ('agendada','realizada',
                                           'aprovada','reprovada','cancelada')),
  -- Dados técnicos estruturados (JSONB por bloco)
  dados_padrao         jsonb DEFAULT '{}',
  -- { aumento_carga, tipo_caixa, tipo_cabo_linha, tipo_cabo_carga,
  --   dist_padrao_ancoragem, dist_ancoragem_ramal,
  --   qtd_eletroduto_carga, qtd_curvas_carga,
  --   qtd_eletroduto_linha, qtd_curvas_linha, obs }
  dados_eletrodutos    jsonb DEFAULT '{}',
  -- { cc: {qtd_eletroduto, qtd_curvas, qtd_condulete},
  --   ca: {qtd_eletroduto, qtd_curvas, qtd_condulete},
  --   at: {qtd_eletroduto, qtd_curvas, qtd_caixas} }
  dados_cabeamento     jsonb DEFAULT '{}',
  -- { flex_cc, cabo_cc_mod_inv, at_mod_inv, at_inv_art,
  --   flex_ca, cabo_ca_inv_conexao }
  dados_inversor       jsonb DEFAULT '{}',
  -- { obs }
  dados_estrutura      jsonb DEFAULT '{}',
  -- { tipo_estrutura, tipo_telha, estruturas_aptas,
  --   estruturas_obra, desc_obra, modulos_comporta,
  --   trocar_inversor_inclinacao, obs }
  parecer_final        text,
  -- Fotos e documentos (URLs Supabase Storage)
  fotos                jsonb DEFAULT '{}',
  -- { fachada, local_inversor, local_modulos:[], inversor,
  --   padrao, poste, google_maps, ramal_entrada,
  --   estrutura:[], telhado_aereo:[], croqui,
  --   padrao_atual, disjuntor, aterramento, telhas:[] }
  docs                 jsonb DEFAULT '{}',
  -- { laudo_tecnico, laudo_sombreamento }
  -- Vendedor
  vendedor             text,
  -- Meta
  criado_por           uuid REFERENCES auth.users(id),
  criado_em            timestamptz DEFAULT now(),
  atualizado_em        timestamptz DEFAULT now()
);

-- ─── 8. CONTRATOS ─────────────────────────────────────────
CREATE TABLE contratos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vistoria_id     uuid REFERENCES vistorias(id),
  proposta_id     uuid REFERENCES propostas(id),
  lead_id         uuid REFERENCES leads(id),
  -- Dados pessoais
  nome            text NOT NULL,
  cpf             text,
  rg              text,
  rg_orgao        text,
  nascimento      date,
  profissao       text,
  estado_civil    text,
  email           text,
  telefone        text,
  -- Endereço / instalação
  cep             text,
  rua             text,
  numero          text,
  complemento     text,
  bairro          text,
  cidade          text,
  estado          text,
  gmap            text,
  concessionaria  text,
  -- Kit
  kwp             numeric DEFAULT 0,
  qtd_modulos     integer DEFAULT 0,
  marca_modulo    text,
  pot_modulo      numeric DEFAULT 0,
  qtd_inversores  integer DEFAULT 1,
  marca_inversor  text,
  pot_inversor    numeric DEFAULT 0,
  qtd_baterias    integer DEFAULT 0,
  marca_bateria   text,
  pot_bateria     numeric DEFAULT 0,
  fase            text DEFAULT 'Monofásico',
  tensao          integer DEFAULT 220,
  -- Financeiro
  valor           numeric DEFAULT 0,
  forma_pgto      text,
  banco           text,
  pgto_desc       text,
  -- Status
  status          text DEFAULT 'pendente'
                    CHECK (status IN ('pendente','enviado','assinado','cancelado')),
  data_assinatura date,
  -- ClickSign
  clicksign_key   text,
  clicksign_url   text,
  -- Vendedor
  vendedor        text,
  -- Testemunhas (PDF do contrato)
  vend_cpf          text,
  supervisor_nome   text,
  supervisor_cpf    text,
  -- Meta
  criado_por      uuid REFERENCES auth.users(id),
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

-- ─── 9. LOGÍSTICA ─────────────────────────────────────────
CREATE TABLE logistica (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id           uuid REFERENCES contratos(id),
  lead_id               uuid REFERENCES leads(id),
  nome                  text NOT NULL,
  telefone              text,
  kwp                   numeric DEFAULT 0,
  vendedor              text,
  valor                 numeric DEFAULT 0,
  -- Logística
  distribuidora         text,
  num_pedido            text,
  num_nf                text,
  data_prevista_entrega date,
  status                text DEFAULT 'aguardando'
                          CHECK (status IN ('aguardando','comprado','enviado','entregue')),
  obs                   text,
  -- Meta
  criado_por            uuid REFERENCES auth.users(id),
  criado_em             timestamptz DEFAULT now(),
  atualizado_em         timestamptz DEFAULT now()
);

-- ─── 10. INSTALAÇÕES ──────────────────────────────────────
CREATE TABLE instalacoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logistica_id    uuid REFERENCES logistica(id),
  contrato_id     uuid REFERENCES contratos(id),
  lead_id         uuid REFERENCES leads(id),
  nome            text NOT NULL,
  telefone        text,
  email           text,
  -- Local
  endereco        text,
  gmap            text,
  -- Kit
  kwp             numeric DEFAULT 0,
  -- Equipe
  tecnico         text,
  vendedor        text,
  -- Agendamento
  data_instalacao date,
  hora_instalacao text,
  -- Status
  status          text DEFAULT 'aguardando_agendamento'
                    CHECK (status IN ('aguardando_agendamento','agendada','em_andamento','concluida','cancelada')),
  -- Custos extras
  tem_poste          boolean DEFAULT false,
  val_poste          numeric DEFAULT 0,
  tem_troca_padrao   boolean DEFAULT false,
  val_troca_padrao   numeric DEFAULT 0,
  estimado           numeric DEFAULT 0,
  pago               numeric DEFAULT 0,
  -- Pós-instalação
  fotos              jsonb DEFAULT '{}',
  laudo_url          text,
  obs                text,
  -- Financeiro
  valor              numeric DEFAULT 0,
  distribuidora      text,
  -- Meta
  criado_por         uuid REFERENCES auth.users(id),
  criado_em          timestamptz DEFAULT now(),
  atualizado_em      timestamptz DEFAULT now()
);

-- ─── 11. HOMOLOGAÇÕES ─────────────────────────────────────
CREATE TABLE homologacoes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instalacao_id     uuid REFERENCES instalacoes(id),
  contrato_id       uuid REFERENCES contratos(id),
  lead_id           uuid REFERENCES leads(id),
  nome              text NOT NULL,
  telefone          text,
  -- Sistema
  kwp               numeric DEFAULT 0,
  vendedor          text,
  concessionaria    text,
  tecnico           text,
  -- Homologador (quando diferente do cliente)
  mesmo_cliente     boolean DEFAULT true,
  hom_nome          text,
  hom_cpf           text,
  hom_rg            text,
  hom_nasc          date,
  -- Kanban interno
  etapa             text DEFAULT 'aguardando_docs'
                      CHECK (etapa IN ('aguardando_docs','projeto',
                                       'trt_art_pg','parecer_acesso',
                                       'aumento_de_carga',
                                       'vistoria_final','aprovada','reprovada')),
  -- Documentos (URLs Storage)
  docs              jsonb DEFAULT '{}',
  file_urls         jsonb DEFAULT '{}',
  file_names        jsonb DEFAULT '{}',
  -- Financeiro
  trt_val           numeric DEFAULT 0,
  art_val           numeric DEFAULT 0,
  tecnico_val       numeric DEFAULT 0,
  estimado          numeric DEFAULT 0,
  pago              numeric DEFAULT 0,
  data_assinatura   date,
  obs               text,
  -- Meta
  criado_por        uuid REFERENCES auth.users(id),
  criado_em         timestamptz DEFAULT now(),
  atualizado_em     timestamptz DEFAULT now()
);

-- ─── 12. PÓS VENDA ────────────────────────────────────────
CREATE TABLE posvenda (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homologacao_id  uuid REFERENCES homologacoes(id),
  contrato_id     uuid REFERENCES contratos(id),
  lead_id         uuid REFERENCES leads(id),
  nome            text NOT NULL,
  telefone        text,
  email           text,
  vendedor        text,
  kwp             numeric DEFAULT 0,
  status          text DEFAULT 'ativo'
                    CHECK (status IN ('ativo','inativo','manutencao')),
  data_ativacao   date,
  obs             text,
  criado_por      uuid REFERENCES auth.users(id),
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

-- ─── 13. REMARKETING ──────────────────────────────────────
CREATE TABLE remarketing (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          uuid REFERENCES leads(id) ON DELETE CASCADE,
  nome             text NOT NULL,
  telefone         text,
  motivo_perda     text,
  data_reativacao  date,
  status           text DEFAULT 'pendente'
                     CHECK (status IN ('pendente','em_contato','reativado','descartado')),
  vendedor         text,
  obs              text,
  criado_por       uuid REFERENCES auth.users(id),
  criado_em        timestamptz DEFAULT now(),
  atualizado_em    timestamptz DEFAULT now()
);

CREATE TABLE tentativas_remarketing (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remark_id    uuid NOT NULL REFERENCES remarketing(id) ON DELETE CASCADE,
  tipo         text NOT NULL
                 CHECK (tipo IN ('whatsapp','ligacao','email','visita','outro')),
  resultado    text
                 CHECK (resultado IN ('sem_resposta','contato_feito',
                                      'agendou_retorno','interessado','nao_interessado')),
  obs          text,
  criado_por   uuid REFERENCES auth.users(id),
  criado_em    timestamptz DEFAULT now()   -- IMUTÁVEL
);

-- ─── 14. COMISSÕES ────────────────────────────────────────
CREATE TABLE comissoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id     uuid REFERENCES contratos(id),
  lead_id         uuid REFERENCES leads(id),
  nome            text NOT NULL,
  valor_contrato  numeric DEFAULT 0,
  valor_vendido   numeric DEFAULT 0,
  status          text DEFAULT 'pendente'
                    CHECK (status IN ('pendente','aprovada','paga','cancelada')),
  -- Vendedor
  vend_nome       text,
  vend_pct        numeric DEFAULT 0,
  vend_major_pct  numeric DEFAULT 0,
  vend_val        numeric DEFAULT 0,
  -- Supervisor
  sup_nome        text,
  sup_pct         numeric DEFAULT 0,
  sup_val         numeric DEFAULT 0,
  -- SDR
  sdr_ativo       boolean DEFAULT false,
  sdr_nome        text,
  sdr_pct         numeric DEFAULT 0,
  sdr_val         numeric DEFAULT 0,
  -- Captador
  cap_ativo       boolean DEFAULT false,
  cap_nome        text,
  cap_pct         numeric DEFAULT 0,
  cap_val         numeric DEFAULT 0,
  -- Indicador
  ind_ativo       boolean DEFAULT false,
  ind_nome        text,
  ind_pct         numeric DEFAULT 0,
  ind_val         numeric DEFAULT 0,
  -- Extras
  obra_ativo      boolean DEFAULT false,
  obra_val        numeric DEFAULT 0,
  pres_ativo      boolean DEFAULT false,
  pres_val        numeric DEFAULT 0,
  -- Totais
  total_saidas    numeric DEFAULT 0,
  lucro_liquido   numeric DEFAULT 0,
  -- Meta
  criado_por      uuid REFERENCES auth.users(id),
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

-- ─── 15. FINANCEIRO ───────────────────────────────────────
CREATE TABLE financeiro_receitas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id     uuid REFERENCES contratos(id),
  descricao       text NOT NULL,
  valor           numeric DEFAULT 0,
  data_recebimento date,
  categoria       text CHECK (categoria IN ('venda','financiamento','servico','outro')),
  status          text DEFAULT 'pendente'
                    CHECK (status IN ('pendente','recebido','cancelado')),
  obs             text,
  criado_por      uuid REFERENCES auth.users(id),
  criado_em       timestamptz DEFAULT now()
);

CREATE TABLE financeiro_despesas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao       text NOT NULL,
  valor           numeric DEFAULT 0,
  data_pagamento  date,
  categoria       text CHECK (categoria IN ('equipamentos','mao_de_obra',
                                            'homologacao','comissao','outro')),
  status          text DEFAULT 'pendente'
                    CHECK (status IN ('pendente','pago','cancelado')),
  obs             text,
  criado_por      uuid REFERENCES auth.users(id),
  criado_em       timestamptz DEFAULT now()
);

-- ─── 16. CADASTROS ────────────────────────────────────────
CREATE TABLE cadastros (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  tipo        text CHECK (tipo IN ('vendedor','tecnico','captador','sdr',
                                   'supervisor','distribuidor','cliente','outro')),
  telefone    text,
  email       text,
  doc         text,
  cep         text,
  rua         text,
  numero      text,
  complemento text,
  cidade      text,
  estado      text,
  obs         text,
  nascimento  date,
  criado_por  uuid REFERENCES auth.users(id),
  criado_em   timestamptz DEFAULT now()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Atualiza atualizado_em automaticamente
CREATE OR REPLACE FUNCTION fn_set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_leads_atualizado
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_propostas_atualizado
  BEFORE UPDATE ON propostas FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_vistorias_atualizado
  BEFORE UPDATE ON vistorias FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_contratos_atualizado
  BEFORE UPDATE ON contratos FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_logistica_atualizado
  BEFORE UPDATE ON logistica FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_instalacoes_atualizado
  BEFORE UPDATE ON instalacoes FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_homologacoes_atualizado
  BEFORE UPDATE ON homologacoes FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_posvenda_atualizado
  BEFORE UPDATE ON posvenda FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_remarketing_atualizado
  BEFORE UPDATE ON remarketing FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();
CREATE TRIGGER trg_comissoes_atualizado
  BEFORE UPDATE ON comissoes FOR EACH ROW EXECUTE FUNCTION fn_set_atualizado_em();

-- Protege timestamp de tentativas (anti-fraude)
CREATE OR REPLACE FUNCTION fn_lock_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.criado_em = OLD.criado_em;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lock_tentativa_contato
  BEFORE UPDATE ON tentativas_contato
  FOR EACH ROW EXECUTE FUNCTION fn_lock_timestamp();

CREATE TRIGGER trg_lock_tentativa_remarketing
  BEFORE UPDATE ON tentativas_remarketing
  FOR EACH ROW EXECUTE FUNCTION fn_lock_timestamp();

-- Cria perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfis (id, nome, email, perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'perfil', 'vendedor')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

-- ============================================================
-- RLS — ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE perfis              ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentativas_contato  ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE vistorias           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contratos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistica           ENABLE ROW LEVEL SECURITY;
ALTER TABLE instalacoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE homologacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE posvenda            ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarketing         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentativas_remarketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_receitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadastros           ENABLE ROW LEVEL SECURITY;

-- Todos os usuários autenticados leem e escrevem tudo
-- Controle fino de perfil é feito no frontend
CREATE POLICY "acesso_total" ON perfis              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON leads               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON propostas           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON vistorias           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON contratos           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON logistica           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON instalacoes         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON homologacoes        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON posvenda            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON remarketing         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON comissoes           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON financeiro_receitas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON financeiro_despesas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso_total" ON cadastros           FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tentativas: podem inserir, mas NÃO podem deletar nem alterar timestamp
CREATE POLICY "inserir_tentativa" ON tentativas_contato
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ler_tentativa" ON tentativas_contato
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "inserir_tentativa_remark" ON tentativas_remarketing
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "ler_tentativa_remark" ON tentativas_remarketing
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('vistorias',    'vistorias',    true),
       ('homologacoes', 'homologacoes', true),
       ('instalacoes',  'instalacoes',  true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_vistoria"    ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'vistorias')    WITH CHECK (bucket_id = 'vistorias');
CREATE POLICY "storage_homo"        ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'homologacoes') WITH CHECK (bucket_id = 'homologacoes');
CREATE POLICY "storage_instalacao"  ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'instalacoes')  WITH CHECK (bucket_id = 'instalacoes');
