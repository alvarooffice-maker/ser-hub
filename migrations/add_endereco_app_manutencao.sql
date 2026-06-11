-- App/Manutenção: dados de endereço e localização (Google Maps)
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS cep text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS rua text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS numero text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS complemento text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS bairro text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS cidade text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS estado text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS gmap text;

NOTIFY pgrst, 'reload schema';
