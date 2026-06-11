-- Re-Serviço (antiga aba "Atendimentos"): novos tipos de serviço
-- (retorno_tecnico, sombreamento, goteira, outros) e campo de
-- especificação livre quando o tipo for "outros".
ALTER TABLE atendimentos ADD COLUMN IF NOT EXISTS tipo_obs text;

NOTIFY pgrst, 'reload schema';
