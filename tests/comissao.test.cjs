// Testes das contas de comissão (rodar: node --test tests/)
// Extrai as funções puras de js/app05.js e confere os valores — qualquer mudança que altere um valor falha aqui.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('fs'), vm = require('vm');
const src = fs.readFileSync(__dirname + '/../src/scripts/app05.js', 'utf8');
const pega = nome => { const m = src.match(new RegExp('function ' + nome + '[\\s\\S]*?\\n\\}')); assert.ok(m, 'função não encontrada: ' + nome); return m[0]; };
const ctx = { State: { comissoes: [] } };
vm.createContext(ctx);
vm.runInContext(pega('baseComissao') + pega('calcComissaoTotal') + pega('totalComissoesAPagar') + ';this.base=baseComissao;this.total=calcComissaoTotal;this.aPagar=totalComissoesAPagar', ctx);
const cent = v => Math.round(v * 100) / 100;

test('sem taxa de cartão: base é o valor de referência (nada muda)', () => {
  const b = ctx.base({ valor_contrato: 45000, valor_vendido: 45000 });
  assert.equal(b.base, 45000); assert.equal(b.liquido, 45000);
});
test('caso Luciana: referência 45.000, vendido 45.000, taxa 3.045 → líquido e base 41.955', () => {
  const c = { valor_contrato: 45000, valor_vendido: 45000, taxa_ativo: true, taxa_val: 3045, vend_pct: 2, sup_pct: 1 };
  const b = ctx.base(c);
  assert.equal(b.liquido, 41955); assert.equal(b.base, 41955);
  assert.equal(cent(b.base * 0.02), 839.10); assert.equal(cent(b.base * 0.01), 419.55);
  assert.equal(cent(ctx.total(c)), 4303.65);          // 839,10 + 419,55 + 3.045 de taxa
});
test('vendido acima da referência: a taxa sai da sobra e a base continua sendo a referência', () => {
  const c = { valor_contrato: 20000, valor_vendido: 30000, taxa_ativo: true, taxa_val: 500, vend_pct: 2, vend_major_pct: 20 };
  assert.equal(ctx.base(c).base, 20000);
  assert.equal(cent(ctx.total(c)), 2800);             // 400 (2%) + 1.900 (20% de 9.500) + 500 de taxa
});
test('taxa inativa é ignorada', () => {
  const c = { valor_contrato: 20000, valor_vendido: 30000, taxa_ativo: false, taxa_val: 500, vend_pct: 2, vend_major_pct: 20, sup_pct: 0.4 };
  assert.equal(cent(ctx.total(c)), 2480);             // 400 + 2.000 + 80
});
test('taxa maior que a referência não gera base negativa', () => {
  assert.equal(ctx.base({ valor_contrato: 1000, valor_vendido: 1000, taxa_ativo: true, taxa_val: 5000 }).base, 0);
});
test('"a pagar" soma só aprovadas e pendentes — paga e cancelada ficam de fora', () => {
  const lista = [
    { status: 'aprovada', valor_contrato: 20000, vend_pct: 2, sup_val: 80 },
    { status: 'pendente', valor_contrato: 10000, vend_pct: 2 },
    { status: 'paga', valor_contrato: 99999, vend_pct: 5 },
    { status: 'cancelada', valor_contrato: 50000, vend_pct: 5 },
  ];
  assert.equal(cent(ctx.aPagar(lista)), 680);         // 400 + 80 + 200
});
test('extras (obra, presente, indicador) não entram em "a pagar"', () => {
  const lista = [{ status: 'aprovada', valor_contrato: 10000, vend_pct: 3, obra_ativo: true, obra_val: 800, pres_ativo: true, pres_val: 200 }];
  assert.equal(cent(ctx.aPagar(lista)), 300);
});
