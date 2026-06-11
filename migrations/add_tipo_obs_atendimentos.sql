-- Re-Serviço (antiga aba "Atendimentos"): novos tipos de serviço
-- (retorno_tecnico, sombreamento, goteira, falta_de_energia, outros) e
-- campo de especificação livre quando o tipo for "outros".
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS tipo_obs text;

-- Dados de endereço e localização (Google Maps)
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS gmap text;

NOTIFY pgrst, 'reload schema';
