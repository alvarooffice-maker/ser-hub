// Teste LOGADO por perfil (funciona no build Astro e no site atual).
// As credenciais vêm de variáveis de ambiente, definidas pelo roteiro rodar-perfis.sh no SEU terminal:
//   E2E_<CHAVE>_EMAIL / E2E_<CHAVE>_SENHA   com CHAVE = ADMIN | SUPERVISOR | VENDEDOR | INSTALADOR | HOMOLOGADOR
// Perfis sem credencial são ignorados. Nada é gravado no banco (a foto de teste fica só no aparelho e é apagada de lá).
const { test, expect } = require('@playwright/test');

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

// o que cada perfil DEVE e NÃO DEVE ver no menu (rótulos como aparecem na barra lateral)
const PERFIS = [
  { chave: 'ADMIN',       papel: 'admin',       ve: ['Dashboard', 'Comissões', 'Financeiro', 'Usuários'], naoVe: [] },
  { chave: 'SUPERVISOR',  papel: 'supervisor',  ve: ['Dashboard', 'Comissões', 'Financeiro'], naoVe: [] },
  { chave: 'VENDEDOR',    papel: 'vendedor',    ve: ['Dashboard', 'Pipeline', 'Clientes'], naoVe: ['Comissões', 'Financeiro', 'Usuários', 'Custo por Projeto', 'Gestão de Custos'] },
  { chave: 'INSTALADOR',  papel: 'tec_instalacao', ve: ['Dashboard', 'Minhas Instalações'], naoVe: ['Comissões', 'Financeiro', 'Usuários', 'Pipeline', 'Minhas Homologações'] },
  { chave: 'HOMOLOGADOR', papel: 'tec_homologacao', ve: ['Dashboard', 'Minhas Homologações'], naoVe: ['Comissões', 'Financeiro', 'Usuários', 'Pipeline', 'Minhas Instalações'] },
];

async function entrar(page, email, senha) {
  await page.goto('/?v=' + Date.now());
  await page.fill('#loginEmail', email);
  await page.fill('#loginPassword', senha);
  await page.click('#loginBtn');
  await page.waitForFunction(() => typeof window.userRole === 'function' && !!window.userRole(), null, { timeout: 30000 });
  await page.waitForTimeout(2500); // deixa o app carregar os dados
}

for (const p of PERFIS) {
  const email = process.env[`E2E_${p.chave}_EMAIL`], senha = process.env[`E2E_${p.chave}_SENHA`];
  test.describe(`perfil ${p.chave}`, () => {
    test.skip(!email || !senha, `sem credenciais para ${p.chave}`);

    test(`${p.chave}: entra, menu certo e sem erros de script`, async ({ page }) => {
      const erros = [];
      page.on('pageerror', e => erros.push(e.message));
      await entrar(page, email, senha);

      expect(await page.evaluate(() => window.userRole())).toBe(p.papel);

      const menu = (await page.locator('#nav').innerText()).replace(/\s+/g, ' ');
      for (const rotulo of p.ve) expect(menu, `deveria ver "${rotulo}"`).toContain(rotulo);
      for (const rotulo of p.naoVe) expect(menu, `NÃO deveria ver "${rotulo}"`).not.toContain(rotulo);

      await page.evaluate(() => window.navigate('dashboard'));
      await page.waitForTimeout(3000);
      expect((await page.locator('#content').innerText()).length).toBeGreaterThan(20);
      expect(erros, 'erros de script na página').toEqual([]);
    });
  });
}

// ---- verificações específicas ----
const credInst = [process.env.E2E_INSTALADOR_EMAIL, process.env.E2E_INSTALADOR_SENHA];
test.describe('INSTALADOR (específicos)', () => {
  test.skip(!credInst[0] || !credInst[1], 'sem credenciais do instalador');
test('INSTALADOR: laudo da vistoria só para leitura + foto offline fica guardada no aparelho', async ({ page, context }) => {
  await entrar(page, credInst[0], credInst[1]);
  // laudo (somente leitura) no modal de instalação
  await page.evaluate(() => window.navigate('instalador'));
  await page.waitForTimeout(3000);
  const card = page.locator('.kanban-card').first();
  if (await card.count()) {
    await card.click();
    await page.waitForTimeout(1500);
    const temLaudo = await page.locator('#lnkVistViewBtn').count();
    const temEditar = await page.locator('#lnkVistEditBtn').count();
    expect(temEditar, 'instalador não pode ter o botão de editar vistoria').toBe(0);
    console.log('laudo visível no modal do 1º serviço:', temLaudo ? 'sim' : 'não (serviço sem vistoria ligada)');
    await page.evaluate(() => window.closeModal && window.closeModal());
  }
  // foto offline: fica guardada no aparelho (IndexedDB) e a prévia volta após recarregar — sem enviar nada ao servidor
  await context.setOffline(true);
  const ph = await page.evaluate(async (b64) => {
    const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    return window.guardarArquivoOffline('vistorias', new File([bin], 'e2e.png', { type: 'image/png' }), '_e2e_perfil');
  }, PNG);
  expect(ph._pending, 'foto deve ficar guardada no aparelho').toBeTruthy();
  await page.reload();
  await page.waitForFunction(() => typeof window.carregarPreviewsPendentes === 'function', null, { timeout: 30000 }).catch(() => {});
  const restaurada = await page.evaluate(async (id) => {
    await window.carregarPreviewsPendentes();
    const todos = await window._idbOp('readonly', s => s.getAll());
    const achou = (todos || []).some(r => r.id === id);
    await window._idbOp('readwrite', s => s.delete(id));      // limpeza do teste
    return achou;
  }, ph._pending);
  await context.setOffline(false);
  expect(restaurada, 'a foto guardada deve sobreviver ao recarregamento da página').toBe(true);
});
});

const credHom = [process.env.E2E_HOMOLOGADOR_EMAIL, process.env.E2E_HOMOLOGADOR_SENHA];
test.describe('HOMOLOGADOR (específicos)', () => {
  test.skip(!credHom[0] || !credHom[1], 'sem credenciais do homologador');
test('HOMOLOGADOR: laudo da vistoria só para leitura no modal de homologação', async ({ page }) => {
  const e = credHom[0], s = credHom[1];
  await entrar(page, e, s);
  await page.evaluate(() => window.navigate('homologador'));
  await page.waitForTimeout(3000);
  const card = page.locator('.kanban-card').first();
  test.skip(!(await card.count()), 'sem cards de homologação para este usuário');
  await card.click();
  await page.waitForTimeout(1500);
  expect(await page.locator('#lnkVistEditBtn').count(), 'homologador não pode editar a vistoria').toBe(0);
});
});

const credGes = process.env.E2E_SUPERVISOR_EMAIL ? [process.env.E2E_SUPERVISOR_EMAIL, process.env.E2E_SUPERVISOR_SENHA] : [process.env.E2E_ADMIN_EMAIL, process.env.E2E_ADMIN_SENHA];
test.describe('GESTÃO (específicos)', () => {
  test.skip(!credGes[0] || !credGes[1], 'sem credenciais de supervisor/admin');
test('SUPERVISOR/ADMIN: tela Comissões abre e mostra o total a pagar', async ({ page }) => {
  const e = credGes[0], s = credGes[1];
  await entrar(page, e, s);
  await page.evaluate(() => window.navigate('comissoes'));
  await page.waitForSelector('#cpMes', { timeout: 20000 });
  const texto = await page.locator('#content').innerText();
  expect(texto).toMatch(/A PAGAR/i);
  await page.selectOption('#cpMes', { index: 1 });
  await page.waitForTimeout(1200);
  expect((await page.locator('#content').innerText())).toMatch(/Vendas de/i);
});
});
