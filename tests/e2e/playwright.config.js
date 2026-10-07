// Uso: cd tests/e2e && npm install && npx playwright install chromium && npm test
// Variáveis: SER_URL (padrão: site publicado), E2E_EMAIL e E2E_SENHA (conta de TESTE; sem elas só roda o smoke)
module.exports = {
  testDir: '.',
  timeout: 60000,
  use: { baseURL: process.env.SER_URL || 'https://crm.serenergiarenovavel.com.br', serviceWorkers: 'allow' },
};
