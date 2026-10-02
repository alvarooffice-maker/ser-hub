// Smoke tests gratuitos: node tests/smoke.js
// Verifica sintaxe do JS inline e a presença dos fluxos críticos (offline, fotos, transições, assinatura).
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const js = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n');
let fail = 0;
const ok = (c, msg) => { console.log((c ? 'ok   ' : 'FAIL ') + msg); if (!c) fail++; };

try { new vm.Script(js); ok(true, 'sintaxe do JS inline'); } catch (e) { ok(false, 'sintaxe: ' + e.message); }

['salvarComOffline', 'sincronizarFilaOffline', 'posSyncVistoria', 'posSyncInstalacao',
 'guardarArquivoOffline', 'resolverArquivosPendentes', 'carregarPreviewsPendentes',
 'attachFileUploads', 'openVistoriaModal', 'openLaudoCampoModal', 'buildMargemProjetoSection']
  .forEach(f => ok(new RegExp('function\\s+' + f + '\\b').test(js), 'função ' + f));

ok(/offline:\s*!!item/.test(js), 'vistoria: foto offline só em edição');
ok(/ser_offline_queue/.test(js), 'fila offline em localStorage');
ok(/aguardando_agendamento/.test(js), 'transição proposta→vistoria');
ok(/getContext\('2d'\)/.test(js) && /pointerdown/.test(js), 'assinatura em canvas (pointer events)');
ok(/CACHE_NAME/.test(fs.readFileSync(__dirname + '/../sw.js', 'utf8')), 'service worker presente');

// Lógica pura: erro de rede detectado como "enfileirável"
const m = js.match(/function isNetworkError[\s\S]*?\n\}/);
if (m) {
  const ctx = { navigator: { onLine: true } }; vm.createContext(ctx); vm.runInContext(m[0] + ';this.f=isNetworkError', ctx);
  ok(ctx.f({ message: 'Failed to fetch' }) === true, 'isNetworkError(Failed to fetch)');
  ok(ctx.f({ message: 'violates check constraint' }) === false, 'isNetworkError(erro de negócio) = false');
}
process.exit(fail ? 1 : 0);
