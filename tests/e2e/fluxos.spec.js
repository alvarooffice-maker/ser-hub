const { test, expect } = require('@playwright/test');
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const temLogin = !!(process.env.E2E_EMAIL && process.env.E2E_SENHA);

async function entrar(page) {
  await page.goto('/?v=' + Date.now());
  await page.fill('#loginEmail', process.env.E2E_EMAIL);
  await page.fill('#loginPassword', process.env.E2E_SENHA);
  await page.click('#loginBtn');
  await page.waitForFunction(() => window.State && State.profile, null, { timeout: 30000 });
}

test('smoke: página carrega, módulos JS e login presentes, sem erros', async ({ page }) => {
  const erros = [];
  page.on('pageerror', e => erros.push(e.message));
  await page.goto('/?v=' + Date.now());
  await expect(page.locator('#loginForm')).toBeVisible();
  const n = await page.evaluate(() => [...document.scripts].filter(s => s.src.includes('/js/')).length);
  expect(n).toBeGreaterThanOrEqual(7);
  expect(await page.evaluate(() => typeof salvarComOffline)).toBe('function');
  expect(erros).toEqual([]);
});

test('login: perfil carregado e dashboard com rankings (incl. Canais)', async ({ page }) => {
  test.skip(!temLogin, 'defina E2E_EMAIL e E2E_SENHA (conta de teste)');
  await entrar(page);
  await page.evaluate(() => navigate('dashboard'));
  await expect(page.locator('.rank-tab[data-rank="canais"]')).toBeVisible();
  await page.click('.rank-tab[data-rank="canais"]');
  await expect(page.locator('#rankBody')).not.toBeEmpty();
});

test('foto offline: guarda no aparelho e envia ao reconectar', async ({ page, context }) => {
  test.skip(!temLogin, 'defina E2E_EMAIL e E2E_SENHA (conta de teste)');
  await entrar(page);
  await context.setOffline(true);
  const ph = await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return guardarArquivoOffline('vistorias', new File([bin], 'e2e.png', { type: 'image/png' }), '_e2e');
  }, PNG.toString('base64'));
  expect(ph._pending).toBeTruthy();
  await context.setOffline(false);
  const r = await page.evaluate(async (ph) => {
    const usados = [];
    const out = await resolverArquivosPendentes({ fotos: { a: [ph] } }, usados);
    const it = out.fotos.a[0];
    const http = (await fetch(it.url)).status;
    await supa.storage.from('vistorias').remove([it.path]);        // limpeza
    await _idbOp('readwrite', s => s.delete(usados[0]));
    return { http, path: it.path };
  }, ph);
  expect(r.http).toBe(200);
});

test('fila offline: erro de rede enfileira e volta a sincronizar', async ({ page }) => {
  test.skip(!temLogin, 'defina E2E_EMAIL e E2E_SENHA (conta de teste)');
  await entrar(page);
  const res = await page.evaluate(async () => {
    const antes = JSON.parse(localStorage.getItem('ser_offline_queue') || '[]').length;
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
    const r = await salvarComOffline('leads', '00000000-0000-0000-0000-000000000000', { obs_e2e: 'x' }, 'teste e2e');
    const depois = JSON.parse(localStorage.getItem('ser_offline_queue') || '[]').length;
    localStorage.setItem('ser_offline_queue', JSON.stringify(JSON.parse(localStorage.getItem('ser_offline_queue')).filter(i => i.label !== 'teste e2e')));
    delete navigator.onLine;
    return { queued: r.queued, antes, depois };
  });
  expect(res.queued).toBe(true);
  expect(res.depois).toBe(res.antes + 1);
});
