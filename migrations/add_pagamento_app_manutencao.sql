-- App/Manutenção: forma de pagamento e parcelamento (cartão)
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS forma_pagamento text;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS parcelado boolean DEFAULT false;
ALTER TABLE app_manutencao ADD COLUMN IF NOT EXISTS qtd_parcelas integer;

NOTIFY pgrst, 'reload schema';
