-- Nova aba do Kanban: App/Man (vendas de aplicativo de monitoramento e manutenção)
CREATE TABLE IF NOT EXISTS app_manutencao (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  nome             text        NOT NULL,
  telefone         text,
  responsavel      text,
  status           text        NOT NULL DEFAULT 'aberto',
  itens            jsonb       DEFAULT '{}',   -- {configuracao:{ativo,valor}, manutencao:{...}, app_monitoramento:{...}, vistoria_tecnica:{...}}
  valor_total      numeric,
  data_venda       date,
  data_servico     date,
  data_renovacao   date,
  obs              text,
  fotos            jsonb       DEFAULT '{}',   -- {fotos_servico:[{url,name}, ...]}
  criado_por       uuid,
  criado_em        timestamptz DEFAULT now(),
  atualizado_em    timestamptz
);

ALTER TABLE app_manutencao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "autenticados_appman" ON app_manutencao;
CREATE POLICY "autenticados_appman" ON app_manutencao
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_app_manutencao_criado ON app_manutencao (criado_em DESC);

-- IMPORTANTE: criar também o bucket de Storage "app_manutencao" (público,
-- igual ao bucket "atendimentos") no painel do Supabase, em
-- Storage > New bucket, para permitir o upload de fotos do serviço.
