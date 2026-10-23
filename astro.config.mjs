// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://crm.serenergiarenovavel.com.br',
  output: 'static',
  // portal.html continua com o mesmo endereço (links enviados aos clientes)
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
