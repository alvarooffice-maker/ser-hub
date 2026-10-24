/* ============================================================
   EXPERIÊNCIA DO TIME — diálogos próprios, tema claro/escuro,
   central de avisos, indicador de salvando/offline, formulários
   em passos e menu lateral por grupos.
   ============================================================ */
import { $, $$, State, userRole, calcLeadsParados, getOfflineQueue, navigate, ROUTES } from './app01.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- 5. Diálogos próprios (no lugar de alert/confirm/prompt) ---------- */
function abrirDialogo({ titulo, texto, entrada, ok = 'OK', cancelar = null, perigo = false, tipo = 'text', valor = '' }) {
  return new Promise(resolve => {
    const raiz = document.createElement('div');
    raiz.className = 'ui-dialog-overlay';
    raiz.innerHTML = `<div class="ui-dialog" role="dialog" aria-modal="true">
      ${titulo ? `<h3>${esc(titulo)}</h3>` : ''}
      <p>${esc(texto).replace(/\n/g, '<br>')}</p>
      ${entrada ? `<input class="ui-dialog-input" type="${tipo}" value="${esc(valor)}" autocomplete="off">` : ''}
      <div class="ui-dialog-acoes">
        ${cancelar ? `<button type="button" class="btn btn-secondary" data-r="0">${esc(cancelar)}</button>` : ''}
        <button type="button" class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" data-r="1">${esc(ok)}</button>
      </div></div>`;
    const anterior = document.activeElement;
    const fechar = v => { document.removeEventListener('keydown', tecla, true); raiz.remove(); try { anterior?.focus?.(); } catch (e) {} resolve(v); };
    const input = raiz.querySelector('input');
    const valorFinal = () => (entrada ? input.value : true);
    const tecla = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(entrada ? null : false); }
      else if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); fechar(valorFinal()); }
    };
    raiz.addEventListener('click', e => {
      const b = e.target.closest('[data-r]');
      if (b) fechar(b.dataset.r === '1' ? valorFinal() : (entrada ? null : false));
      else if (e.target === raiz && cancelar) fechar(entrada ? null : false);
    });
    document.addEventListener('keydown', tecla, true);
    document.body.appendChild(raiz);
    (input || raiz.querySelector('[data-r="1"]')).focus();
  });
}
export const uiConfirm = (texto, opts = {}) => abrirDialogo({ titulo: opts.titulo || 'Confirmar', texto, ok: opts.ok || 'Confirmar', cancelar: 'Cancelar', perigo: !!opts.perigo });
export const uiAlert = (texto, titulo = 'Aviso') => abrirDialogo({ titulo, texto, ok: 'Entendi' });
export const uiPrompt = (texto, valor = '', opts = {}) => abrirDialogo({ titulo: opts.titulo || 'Informe', texto, entrada: true, ok: opts.ok || 'Salvar', cancelar: 'Cancelar', tipo: opts.tipo || 'text', valor });
export function avisoPopupBloqueado() { return uiAlert('O navegador bloqueou a janela. Permita pop-ups para este site e tente de novo.', 'Pop-up bloqueado'); }
export async function alterarMargemMinima(atual) {
  const v = await uiPrompt('Margem mínima (%)', String(atual), { titulo: 'Margem mínima', tipo: 'number' });
  if (v && !isNaN(+v)) { try { localStorage.setItem('ser_margem_min', +v); } catch (e) {} if (window.renderFinanceiro) window.renderFinanceiro(); else location.reload(); }
}

/* ---------- 7. Central de avisos ---------- */
const AVISOS = [];
export function registrarAviso(msg, tipo = 'info') {
  AVISOS.unshift({ msg: String(msg), tipo, hora: new Date() });
  if (AVISOS.length > 30) AVISOS.pop();
  const b = $('#bellBadge'); if (b) { b.dataset.n = (+b.dataset.n || 0) + 1; atualizarSino(); }
}
function atualizarSino() {
  const b = $('#bellBadge'); if (!b) return;
  const n = +b.dataset.n || 0;
  b.textContent = n > 9 ? '9+' : n; b.style.display = n ? '' : 'none';
}
function pendenciasFixas() {
  const itens = [];
  try {
    const p = calcLeadsParados(3).length;
    if (p) itens.push({ icone: '⏳', msg: `${p} lead(s) parado(s) há mais de 3 dias`, rota: 'pipeline' });
    const f = getOfflineQueue().length;
    if (f) itens.push({ icone: '📡', msg: `${f} item(ns) aguardando sinal para sincronizar`, rota: null });
  } catch (e) {}
  return itens;
}
function abrirCentralAvisos() {
  let painel = $('#bellPanel');
  if (painel) { painel.remove(); return; }
  painel = document.createElement('div');
  painel.id = 'bellPanel'; painel.className = 'bell-panel';
  const fixas = pendenciasFixas();
  const hh = d => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const ic = { error: '⚠️', success: '✅', info: 'ℹ️' };
  painel.innerHTML = `<div class="bell-head"><b>Avisos</b><button type="button" class="btn btn-sm btn-secondary" id="bellLimpar">Limpar</button></div>
    ${fixas.length ? `<div class="bell-sec">Precisa de atenção</div>` + fixas.map(f => `<div class="bell-item ${f.rota ? 'click' : ''}" data-rota="${f.rota || ''}"><span>${f.icone}</span><div>${esc(f.msg)}</div></div>`).join('') : ''}
    <div class="bell-sec">Desta sessão</div>
    ${AVISOS.length ? AVISOS.map(a => `<div class="bell-item"><span>${ic[a.tipo] || 'ℹ️'}</span><div>${esc(a.msg)}<small>${hh(a.hora)}</small></div></div>`).join('') : '<div class="bell-vazio">Nada por enquanto.</div>'}`;
  document.body.appendChild(painel);
  const b = $('#bellBadge'); if (b) { b.dataset.n = 0; atualizarSino(); }
  painel.addEventListener('click', e => {
    if (e.target.id === 'bellLimpar') { AVISOS.length = 0; painel.remove(); return; }
    const it = e.target.closest('[data-rota]');
    if (it && it.dataset.rota) { painel.remove(); navigate(it.dataset.rota); }
  });
  setTimeout(() => document.addEventListener('click', function f(e) {
    if (!painel.contains(e.target) && !e.target.closest('#bellBtn')) { painel.remove(); document.removeEventListener('click', f); }
    else if (!document.body.contains(painel)) document.removeEventListener('click', f);
  }), 0);
}

/* ---------- 7. Indicador "Salvando… / Salvo / Sem internet" ---------- */
function iniciarIndicadorSalvando() {
  const pill = document.createElement('div');
  pill.id = 'saveState'; pill.className = 'save-state'; pill.style.display = 'none';
  document.body.appendChild(pill);
  let ativos = 0, t = null;
  const mostrar = (txt, cls, ms) => { clearTimeout(t); pill.className = 'save-state ' + cls; pill.textContent = txt; pill.style.display = ''; if (ms) t = setTimeout(() => { if (!ativos && navigator.onLine) pill.style.display = 'none'; }, ms); };
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const metodo = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const url = String((input && input.url) || input);
    const grava = metodo !== 'GET' && metodo !== 'HEAD' && /supabase\.co\/(rest|storage)/.test(url);
    if (!grava) return original(input, init);
    ativos++; mostrar('Salvando…', 'busy');
    try { const r = await original(input, init); ativos--; if (!ativos) mostrar(r.ok ? 'Salvo ✓' : 'Não foi possível salvar', r.ok ? 'ok' : 'err', 1800); return r; }
    catch (e) { ativos--; mostrar('Sem conexão — fica guardado no aparelho', 'err', 4000); throw e; }
  };
  const rede = () => { if (!navigator.onLine) mostrar('Sem internet', 'err'); else if (!ativos) mostrar('Conectado de novo', 'ok', 1800); };
  window.addEventListener('offline', rede); window.addEventListener('online', rede);
}


/* ---------- 6b. Modo escuro: remapeia cores claras escritas direto nos elementos ---------- */
const rgbDe = v => { const m = String(v || '').match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/); return m ? { r: +m[1] / 255, g: +m[2] / 255, b: +m[3] / 255, a: m[4] === undefined ? 1 : +m[4] } : null; };
const luzDe = c => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
function hsl2css(h, s, l) { return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`; }
function toHsl({ r, g, b }) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function escurecerInline(raiz = document) {
  if (document.documentElement.dataset.theme !== 'dark') return;
  raiz.querySelectorAll('[style*="background"],[style*="color"]').forEach(el => {
    if (el.dataset.ob === undefined) {
      const bg = rgbDe(el.style.backgroundColor);
      if (bg && bg.a > 0.5 && luzDe(bg) > 0.78) {
        el.dataset.ob = el.style.backgroundColor;
        const [h, s, l] = toHsl(bg);
        el.style.backgroundColor = s < 0.15 ? (l > 0.97 ? 'var(--card)' : 'var(--hover)') : hsl2css(h, Math.min(s, 0.5), Math.max(0.17, 0.30 - (l - 0.78) * 0.55));
      }
    }
    if (el.dataset.oc === undefined) {
      const tx = rgbDe(el.style.color);
      if (tx && luzDe(tx) < 0.55) { el.dataset.oc = el.style.color; const [h, s] = toHsl(tx); el.style.color = hsl2css(h, Math.min(s, 0.75), 0.84); }
    }
  });
}
function restaurarInline() {
  document.querySelectorAll('[data-ob],[data-oc]').forEach(el => {
    if (el.dataset.ob !== undefined) { el.style.backgroundColor = el.dataset.ob; delete el.dataset.ob; }
    if (el.dataset.oc !== undefined) { el.style.color = el.dataset.oc; delete el.dataset.oc; }
  });
}

/* ---------- 6. Tema claro/escuro ---------- */
function temaSalvo() { try { return localStorage.getItem('ser_tema') || 'auto'; } catch (e) { return 'auto'; } }
export function aplicarTema(modo = temaSalvo()) {
  const escuro = modo === 'dark' || (modo === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = escuro ? 'dark' : 'light';
  const b = $('#themeBtn'); if (b) b.textContent = escuro ? '☀️' : '🌙';
  if (escuro) escurecerInline(); else restaurarInline();
}
function alternarTema() {
  const novo = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('ser_tema', novo); } catch (e) {}
  aplicarTema(novo);
}

/* ---------- 4. Formulários grandes em passos ---------- */
export function transformarEmPassos(root) {
  const corpo = root.querySelector('.modal-body');
  if (!corpo || corpo.dataset.passos) return;
  const secoes = [...corpo.querySelectorAll(':scope > .section, :scope > form > .section, :scope > div > .section')]
    .filter(s => s.querySelector(':scope > .section-header'));
  if (secoes.length < 4 || !root.querySelector('.modal form')) return;
  corpo.dataset.passos = '1';
  const modal = root.querySelector('.modal'); modal.classList.add('em-passos');
  const nomes = secoes.map(s => (s.querySelector('.section-header h4')?.textContent || '').replace(/^[^\p{L}\d]+/u, '').trim() || 'Etapa');
  const barra = document.createElement('div'); barra.className = 'passos-barra';
  barra.innerHTML = nomes.map((n, i) => `<button type="button" class="passo-chip" data-i="${i}"><i>${i + 1}</i><span>${esc(n)}</span></button>`).join('');
  corpo.parentElement.insertBefore(barra, corpo);
  const nav = document.createElement('div'); nav.className = 'passos-nav';
  nav.innerHTML = `<button type="button" class="btn btn-secondary btn-sm" data-d="-1">← Anterior</button><span class="passos-pos"></span><button type="button" class="btn btn-primary btn-sm" data-d="1">Próximo →</button>`;
  corpo.appendChild(nav);
  let atual = 0;
  const ir = i => {
    atual = Math.max(0, Math.min(secoes.length - 1, i));
    secoes.forEach((s, k) => { s.classList.toggle('passo-ativo', k === atual); if (k === atual) s.classList.remove('collapsed'); });
    $$('.passo-chip', barra).forEach((c, k) => { c.classList.toggle('on', k === atual); c.classList.toggle('feito', k < atual); });
    nav.querySelector('.passos-pos').textContent = `Etapa ${atual + 1} de ${secoes.length}`;
    nav.querySelector('[data-d="-1"]').style.visibility = atual ? '' : 'hidden';
    nav.querySelector('[data-d="1"]').style.visibility = atual < secoes.length - 1 ? '' : 'hidden';
    corpo.scrollTo(0, 0);
  };
  barra.addEventListener('click', e => { const c = e.target.closest('.passo-chip'); if (c) ir(+c.dataset.i); });
  nav.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) ir(atual + +b.dataset.d); });
  // campo obrigatório vazio em etapa escondida: leva a pessoa até ele
  root.addEventListener('invalid', e => { const s = e.target.closest('.section'); const k = secoes.indexOf(s); if (k >= 0 && k !== atual) ir(k); }, true);
  ir(0);
}

/* ---------- 1. Menu lateral por grupos recolhíveis ---------- */
const GRUPOS = {
  FERRAMENTAS: ['reservico', 'appmanutencao', 'remarketing', 'baterias', 'disparador'],
};
export function agruparMenu() {
  const nav = $('#nav'); if (!nav) return;
  let abertos = {};
  try { abertos = JSON.parse(localStorage.getItem('ser_menu_grupos') || '{}'); } catch (e) {}
  const ativa = State.route;
  // cabeçalho "Ferramentas" antes do primeiro item do grupo
  const primeiro = GRUPOS.FERRAMENTAS.map(id => nav.querySelector(`[data-route="${id}"]`)).find(Boolean);
  if (primeiro && !nav.querySelector('.nav-section[data-g="FERRAMENTAS"]')) {
    const h = document.createElement('div'); h.className = 'nav-section'; h.textContent = 'Ferramentas';
    primeiro.before(h);
  }
  const secoes = $$('.nav-section', nav);
  secoes.forEach(h => {
    const nome = h.textContent.trim().toUpperCase(); h.dataset.g = nome;
    h.classList.add('colapsavel');
    const itens = []; let n = h.nextElementSibling;
    while (n && !n.classList.contains('nav-section')) { itens.push(n); n = n.nextElementSibling; }
    const contemAtiva = itens.some(i => i.dataset.route === ativa);
    const fechado = abertos[nome] === false && !contemAtiva;
    h.classList.toggle('fechado', fechado);
    itens.forEach(i => i.classList.toggle('oculto-grupo', fechado));
    h.onclick = () => {
      const f = !h.classList.contains('fechado');
      h.classList.toggle('fechado', f);
      itens.forEach(i => i.classList.toggle('oculto-grupo', f));
      abertos[nome] = !f; try { localStorage.setItem('ser_menu_grupos', JSON.stringify(abertos)); } catch (e) {}
    };
  });
}

/* ---------- inicialização ---------- */
export function initApp08() {
  aplicarTema();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (temaSalvo() === 'auto') aplicarTema('auto'); });
  iniciarIndicadorSalvando();
  // botões na barra superior: tema + sino
  const barra = $('.topbar');
  if (barra && !$('#bellBtn')) {
    const grupo = document.createElement('div'); grupo.className = 'topbar-tools';
    grupo.innerHTML = `<button type="button" class="btn-icon tool-btn" id="themeBtn" title="Modo claro/escuro" aria-label="Alternar tema">🌙</button>
      <button type="button" class="btn-icon tool-btn" id="bellBtn" title="Avisos" aria-label="Avisos">🔔<span id="bellBadge" class="bell-badge" data-n="0" style="display:none"></span></button>`;
    $('#globalSearchBtn').after(grupo);
    $('#themeBtn').addEventListener('click', alternarTema);
    $('#bellBtn').addEventListener('click', abrirCentralAvisos);
    aplicarTema();
  }
  // formulários em passos: observa quando um modal abre
  const mr = $('#modalRoot');
  if (mr) new MutationObserver(() => { if (mr.classList.contains('active')) transformarEmPassos(mr); }).observe(mr, { childList: true });
  let pendente = false;
  const reaplicar = () => { if (pendente) return; pendente = true; requestAnimationFrame(() => { pendente = false; escurecerInline(); }); };
  [$('#content'), mr, $('#bellPanel')?.parentElement].filter(Boolean).forEach(n => new MutationObserver(reaplicar).observe(n, { childList: true, subtree: true }));
}
