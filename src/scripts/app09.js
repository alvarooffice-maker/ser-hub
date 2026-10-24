/* ============================================================
   ANOTAÇÕES DO CLIENTE + TAREFAS AGENDADAS
   - "Observações e Anotações": histórico que acompanha o cliente em
     todas as etapas (lead → pós-venda), ligado pelo lead de origem.
   - "Agendar tarefa": follow-up / visita / ligação com dia e hora,
     aparece no calendário, no "Para agir hoje" e avisa no horário.
   ============================================================ */
import { $, $$, State, STAGES, esc, normName, supa, toast, userRole, loadTable } from './app01.js';
import { uiConfirm, uiPrompt } from './app08.js';

const TIPOS = {
  followup: { ic: '📞', rot: 'Follow-up' },
  visita:   { ic: '🏠', rot: 'Retorno na casa do cliente' },
  ligar:    { ic: '☎️', rot: 'Ligar' },
  proposta: { ic: '📄', rot: 'Enviar proposta' },
  outro:    { ic: '📌', rot: 'Outro' },
};
export const tarefaTipoRotulo = t => (TIPOS[t] || TIPOS.outro).ic + ' ' + (TIPOS[t] || TIPOS.outro).rot;
const PODE_ESCREVER = ['admin', 'supervisor', 'vendedor'];
const podeEscrever = () => PODE_ESCREVER.includes(userRole());
const etapaRot = id => (STAGES || []).find(s => s.id === id)?.label || id;

/* ---------- identifica o cliente do card aberto ---------- */
let cardAtual = null; // { stage, item, consumido }
export function setCardAtual(stage, item) { cardAtual = item ? { stage, item, consumido: false } : null; }

export function chaveCliente(stage, item) {
  if (!item) return null;
  if (stage === 'lead') return item.id ? String(item.id) : null;
  let lid = item.lead_id;
  const acha = (tab, id) => (State[tab] || []).find(x => String(x.id) === String(id))?.lead_id;
  if (!lid && item.contrato_id) lid = acha('contratos', item.contrato_id);
  if (!lid && item.proposta_id) lid = acha('propostas', item.proposta_id);
  if (!lid && item.vistoria_id) lid = acha('vistorias', item.vistoria_id);
  if (!lid && item.instalacao_id) lid = acha('instalacoes', item.instalacao_id);
  if (!lid && item.homologacao_id) lid = acha('homologacoes', item.homologacao_id);
  if (!lid && item.nome) lid = (State.leads || []).find(l => normName(l.nome) === normName(item.nome))?.id;
  if (lid) return String(lid);
  return item.nome ? 'n:' + normName(item.nome) : null;
}
const ehUuid = s => /^[0-9a-f-]{36}$/i.test(String(s || ''));
const fmtQuando = iso => {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};
const fmtHora = iso => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const fmtData = iso => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
const atrasada = t => t.status === 'pendente' && new Date(t.data_hora) < new Date();

/* ---------- painel dentro do card ---------- */
async function injetarPainel(root) {
  const modal = root.querySelector('.modal'); const corpo = modal?.querySelector('.modal-body');
  if (!corpo || !cardAtual || cardAtual.consumido || modal.querySelector('#cliPanel')) return;
  const { stage, item } = cardAtual;
  const chave = chaveCliente(stage, item);
  cardAtual.consumido = true;
  const painel = document.createElement('div');
  painel.id = 'cliPanel'; painel.className = 'cli-panel';
  if (!chave) { painel.innerHTML = `<div class="cli-vazio">💾 Salve o card para liberar as anotações e tarefas deste cliente.</div>`; corpo.appendChild(painel); return; }
  const nome = item.nome || (State.leads || []).find(l => String(l.id) === String(chave))?.nome || '';
  painel.innerHTML = `<div class="cli-tabs">
      <button type="button" data-t="notas" class="on">📝 Observações e Anotações <b id="cliNN">…</b></button>
      <button type="button" data-t="tarefas">📅 Tarefas <b id="cliNT">…</b></button></div>
    <div class="cli-pane" data-p="notas">
      ${podeEscrever() ? `<textarea id="cliNotaTx" form="cliSemForm" rows="2" maxlength="4000" placeholder="Escreva uma observação sobre ${esc(nome.split(' ')[0] || 'o cliente')}… (aparece em todas as etapas)"></textarea>
      <div class="cli-linha"><small>Fica registrado com seu nome, a data e a etapa.</small><button type="button" class="btn btn-primary btn-sm" id="cliNotaAdd">Registrar</button></div>` : ''}
      <div id="cliNotas" class="cli-feed"><div class="cli-vazio">Carregando…</div></div></div>
    <div class="cli-pane" data-p="tarefas" hidden>
      ${podeEscrever() ? `<button type="button" class="btn btn-primary btn-sm" id="cliTarNova">📅 Agendar tarefa</button>` : ''}
      <div id="cliTarefas" class="cli-feed"><div class="cli-vazio">Carregando…</div></div></div>`;
  corpo.appendChild(painel);

  const ctx = { stage, chave, nome, telefone: item.telefone || item.cliente_telefone || (State.leads || []).find(l => String(l.id) === String(chave))?.telefone || '' };
  const abas = $$('.cli-tabs button', painel);
  abas.forEach(b => b.addEventListener('click', () => {
    abas.forEach(x => x.classList.toggle('on', x === b));
    $$('.cli-pane', painel).forEach(p => { p.hidden = p.dataset.p !== b.dataset.t; });
  }));
  const recarregar = async () => { await Promise.all([desenharNotas(painel, ctx), desenharTarefas(painel, ctx)]); };
  $('#cliNotaAdd', painel)?.addEventListener('click', async () => {
    const tx = $('#cliNotaTx', painel); const texto = tx.value.trim(); if (!texto) return;
    const { error } = await supa.from('cliente_notas').insert({ chave: ctx.chave, lead_id: ehUuid(ctx.chave) ? ctx.chave : null, cliente_nome: ctx.nome, etapa: ctx.stage, texto, autor_nome: State.profile?.nome || State.user?.email });
    if (error) return toast('Não foi possível salvar a anotação: ' + error.message, 'error');
    tx.value = ''; toast('Anotação registrada', 'success'); await desenharNotas(painel, ctx);
  });
  $('#cliTarNova', painel)?.addEventListener('click', () => abrirFormTarefa(ctx, null, recarregar));
  painel.addEventListener('click', async e => {
    const b = e.target.closest('[data-acao]'); if (!b) return;
    const id = b.dataset.id, acao = b.dataset.acao;
    if (acao === 'n-del') { if (!await uiConfirm('Apagar esta anotação?', { ok: 'Apagar', perigo: true })) return; const { error } = await supa.from('cliente_notas').delete().eq('id', id); if (error) return toast(error.message, 'error'); await desenharNotas(painel, ctx); }
    else if (acao === 'n-pin') { const fix = b.dataset.fix !== '1'; const { error } = await supa.from('cliente_notas').update({ fixada: fix }).eq('id', id); if (error) return toast(error.message, 'error'); await desenharNotas(painel, ctx); }
    else if (acao === 't-ok') { await concluirTarefa(id); await recarregar(); }
    else if (acao === 't-re') { const t = (State.tarefas || []).find(x => x.id === id); if (t) abrirFormTarefa(ctx, t, recarregar); }
    else if (acao === 't-x') { if (!await uiConfirm('Cancelar esta tarefa?', { ok: 'Cancelar tarefa', perigo: true })) return; await supa.from('tarefas').update({ status: 'cancelada' }).eq('id', id); await carregarTarefas(); await recarregar(); }
  });
  await recarregar();
}

async function desenharNotas(painel, ctx) {
  const { data, error } = await supa.from('cliente_notas').select('*').eq('chave', ctx.chave).order('fixada', { ascending: false }).order('criado_em', { ascending: false });
  const box = $('#cliNotas', painel); if (!box) return;
  if (error) { box.innerHTML = `<div class="cli-vazio">Não foi possível carregar as anotações.</div>`; return; }
  State.cliente_notas = [...(State.cliente_notas || []).filter(n => n.chave !== ctx.chave), ...(data || [])];
  $('#cliNN', painel).textContent = (data || []).length;
  const eu = State.user?.id, admin = userRole() === 'admin';
  box.innerHTML = (data || []).length ? data.map(n => `<div class="cli-nota ${n.fixada ? 'fixa' : ''}">
      <div class="cli-nota-top"><b>${esc(n.autor_nome || 'Alguém')}</b><span>${new Date(n.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${n.etapa ? ` · ${esc(etapaRot(n.etapa))}` : ''}</span>
        ${(n.autor_id === eu || admin) ? `<span class="cli-nota-acoes"><button type="button" data-acao="n-pin" data-id="${n.id}" data-fix="${n.fixada ? 1 : 0}" title="${n.fixada ? 'Desafixar' : 'Fixar no topo'}">${n.fixada ? '📌' : '📍'}</button><button type="button" data-acao="n-del" data-id="${n.id}" title="Apagar">🗑️</button></span>` : ''}</div>
      <div class="cli-nota-tx">${esc(n.texto).replace(/\n/g, '<br>')}</div></div>`).join('')
    : `<div class="cli-vazio">Nenhuma anotação ainda.</div>`;
}

async function desenharTarefas(painel, ctx) {
  const { data, error } = await supa.from('tarefas').select('*').eq('chave', ctx.chave).order('data_hora', { ascending: true });
  const box = $('#cliTarefas', painel); if (!box) return;
  if (error) { box.innerHTML = `<div class="cli-vazio">Não foi possível carregar as tarefas.</div>`; return; }
  State.tarefas = [...(State.tarefas || []).filter(t => t.chave !== ctx.chave), ...(data || [])];
  const pend = (data || []).filter(t => t.status === 'pendente'), feitas = (data || []).filter(t => t.status === 'feita').reverse().slice(0, 5);
  $('#cliNT', painel).textContent = pend.length;
  const linha = t => `<div class="cli-tar ${atrasada(t) ? 'atrasada' : ''} ${t.status}">
      <div class="cli-tar-ic">${(TIPOS[t.tipo] || TIPOS.outro).ic}</div>
      <div class="cli-tar-corpo"><b>${esc((TIPOS[t.tipo] || TIPOS.outro).rot)}</b> <span>${fmtQuando(t.data_hora)}${atrasada(t) ? ' · <em>atrasada</em>' : ''}</span>
        ${t.obs ? `<div class="cli-tar-obs">${esc(t.obs)}</div>` : ''}<small>${esc(t.responsavel_nome || '')}</small></div>
      ${t.status === 'pendente' ? `<div class="cli-tar-acoes"><button type="button" class="btn btn-sm btn-primary" data-acao="t-ok" data-id="${t.id}">✔ Feita</button><button type="button" class="btn btn-sm btn-secondary" data-acao="t-re" data-id="${t.id}">Reagendar</button><button type="button" class="btn btn-sm btn-secondary" data-acao="t-x" data-id="${t.id}">✕</button></div>` : '<span class="meta-chip chip-batida">feita</span>'}</div>`;
  box.innerHTML = (pend.length ? pend.map(linha).join('') : `<div class="cli-vazio">Nenhuma tarefa pendente.</div>`) + (feitas.length ? `<div class="cli-sub">Concluídas recentemente</div>` + feitas.map(linha).join('') : '');
}

/* ---------- formulário de tarefa ---------- */
function abrirFormTarefa(ctx, existente, aoSalvar) {
  const agora = new Date(); agora.setMinutes(0, 0, 0); agora.setHours(agora.getHours() + 1);
  const base = existente ? new Date(existente.data_hora) : agora;
  const pad = n => String(n).padStart(2, '0');
  const dataIni = `${base.getFullYear()}-${pad(base.getMonth() + 1)}-${pad(base.getDate())}`, horaIni = `${pad(base.getHours())}:${pad(base.getMinutes())}`;
  const gestor = ['admin', 'supervisor'].includes(userRole());
  const quem = (State.perfis || []).filter(p => p.ativo !== false && ['vendedor', 'supervisor', 'admin'].includes(p.perfil) && p.nome);
  const raiz = document.createElement('div'); raiz.className = 'ui-dialog-overlay';
  raiz.innerHTML = `<form class="ui-dialog tar-form" autocomplete="off">
    <h3>${existente ? 'Reagendar tarefa' : 'Agendar tarefa'}</h3><p>${esc(ctx.nome || 'Cliente')}</p>
    <label>O que fazer<select id="tfTipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}" ${(existente?.tipo || 'followup') === k ? 'selected' : ''}>${v.ic} ${v.rot}</option>`).join('')}</select></label>
    <div class="tar-dh"><label>Dia<input type="date" id="tfData" value="${dataIni}" required></label><label>Hora<input type="time" id="tfHora" value="${horaIni}" required></label></div>
    ${gestor ? `<label>Responsável<select id="tfResp">${quem.map(p => `<option value="${p.id}" ${(existente?.responsavel_id || State.user?.id) === p.id ? 'selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></label>` : ''}
    <label>Observação (opcional)<textarea id="tfObs" rows="2" maxlength="500">${esc(existente?.obs || '')}</textarea></label>
    <div class="tar-av">🔔 Você será avisado <b>15 min antes</b> e <b>na hora</b>.</div>
    <div class="ui-dialog-acoes"><button type="button" class="btn btn-secondary" data-c="1">Cancelar</button><button type="submit" class="btn btn-primary">${existente ? 'Reagendar' : 'Agendar'}</button></div></form>`;
  document.body.appendChild(raiz);
  const fechar = () => raiz.remove();
  raiz.addEventListener('click', e => { if (e.target === raiz || e.target.dataset.c) fechar(); });
  raiz.querySelector('form').addEventListener('submit', async e => {
    e.preventDefault();
    const quando = new Date(`${$('#tfData', raiz).value}T${$('#tfHora', raiz).value}`);
    if (isNaN(quando)) return toast('Informe dia e hora.', 'error');
    if (quando < new Date() && !await uiConfirm('Essa data e hora já passou. Agendar mesmo assim?', { ok: 'Agendar' })) return;
    const respId = gestor ? $('#tfResp', raiz).value : State.user?.id;
    const respNome = (State.perfis || []).find(p => p.id === respId)?.nome || State.profile?.nome;
    const dados = { tipo: $('#tfTipo', raiz).value, obs: $('#tfObs', raiz).value.trim() || null, data_hora: quando.toISOString(), responsavel_id: respId, responsavel_nome: respNome };
    let error;
    if (existente) ({ error } = await supa.from('tarefas').update({ ...dados, avisos_enviados: {} }).eq('id', existente.id));
    else ({ error } = await supa.from('tarefas').insert({ ...dados, chave: ctx.chave, lead_id: ehUuid(ctx.chave) ? ctx.chave : null, cliente_nome: ctx.nome, cliente_telefone: ctx.telefone || null, etapa: ctx.stage, titulo: `${(TIPOS[dados.tipo] || TIPOS.outro).rot} — ${ctx.nome}` }));
    if (error) return toast('Não foi possível agendar: ' + error.message, 'error');
    fechar(); toast('Tarefa agendada para ' + fmtQuando(dados.data_hora), 'success');
    try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (er) {}
    await carregarTarefas(); if (aoSalvar) await aoSalvar();
  });
}

export async function concluirTarefa(id) {
  const t = (State.tarefas || []).find(x => x.id === id);
  const como = await uiPrompt('Como foi? (opcional — vira uma anotação no histórico do cliente)', '', { titulo: 'Concluir tarefa', ok: 'Concluir' });
  if (como === null) return;
  const { error } = await supa.from('tarefas').update({ status: 'feita', concluida_em: new Date().toISOString() }).eq('id', id);
  if (error) return toast(error.message, 'error');
  if (t && como.trim()) await supa.from('cliente_notas').insert({ chave: t.chave, lead_id: t.lead_id, cliente_nome: t.cliente_nome, etapa: t.etapa, texto: `✅ ${(TIPOS[t.tipo] || TIPOS.outro).rot} concluído: ${como.trim()}`, autor_nome: State.profile?.nome || State.user?.email });
  toast('Tarefa concluída', 'success');
  await carregarTarefas();
  if (State.route === 'dashboard' && window.renderDashboard) window.renderDashboard();
  if (State.route === 'calendario' && window.renderCalendario) window.renderCalendario();
}

/* ---------- dados + lembretes ---------- */
export async function carregarTarefas() {
  if (!State.profile) return [];
  const { data } = await supa.from('tarefas').select('*').in('status', ['pendente', 'feita']).order('data_hora', { ascending: true });
  State.tarefas = data || [];
  return State.tarefas;
}
const JA_AVISOU = 'ser_tarefas_avisadas';
const lerAvisadas = () => { try { return new Set(JSON.parse(sessionStorage.getItem(JA_AVISOU) || '[]')); } catch (e) { return new Set(); } };
const gravarAvisadas = s => { try { sessionStorage.setItem(JA_AVISOU, JSON.stringify([...s])); } catch (e) {} };
function avisar(titulo, corpo) {
  toast(`${titulo} — ${corpo}`, 'info', 15000);
  try { if ('Notification' in window && Notification.permission === 'granted') new Notification(titulo, { body: corpo, icon: 'logo.png' }); } catch (e) {}
}
function checarLembretes() {
  if (!State.profile) return;
  const agora = Date.now(), avisadas = lerAvisadas(); let mudou = false;
  (State.tarefas || []).filter(t => t.status === 'pendente' && t.responsavel_id === State.user?.id).forEach(t => {
    const alvo = new Date(t.data_hora).getTime();
    [15, 0].forEach(min => {
      const chave = `${t.id}:${t.data_hora}:${min}`;
      const gatilho = alvo - min * 60000;
      if (agora >= gatilho && agora < alvo + 60 * 60000 && !avisadas.has(chave)) {
        avisadas.add(chave); mudou = true;
        if (min === 0 || agora < alvo) avisar(min === 0 ? '⏰ Agora: ' + (TIPOS[t.tipo] || TIPOS.outro).rot : 'Em 15 min: ' + (TIPOS[t.tipo] || TIPOS.outro).rot, `${t.cliente_nome || ''} às ${fmtHora(t.data_hora)}`);
      }
    });
  });
  if (mudou) gravarAvisadas(avisadas);
}

/* ---------- aba "Tarefas" do Para agir hoje ---------- */
export function tarefasDeHoje() {
  const fim = new Date(); fim.setHours(23, 59, 59, 999);
  const meu = State.user?.id, gestor = ['admin', 'supervisor'].includes(userRole());
  return (State.tarefas || []).filter(t => t.status === 'pendente' && new Date(t.data_hora) <= fim && (gestor || t.responsavel_id === meu)).sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
}
export function buildPaneTarefas(lista) {
  if (!lista.length) return `<div class="pa-vazio">✅ Nenhuma tarefa para hoje.</div>`;
  const gestor = ['admin', 'supervisor'].includes(userRole());
  return lista.slice(0, 10).map(t => `<div class="pa-it" style="flex-wrap:wrap"><span class="pa-ic">${atrasada(t) ? '🔴' : (TIPOS[t.tipo] || TIPOS.outro).ic}</span>
      <div class="pa-tx" style="min-width:160px"><div class="pa-t">${esc(t.cliente_nome || '—')}</div><div class="pa-s">${esc((TIPOS[t.tipo] || TIPOS.outro).rot)} · ${atrasada(t) ? `<b style="color:#dc2626">atrasada (${fmtData(t.data_hora)} ${fmtHora(t.data_hora)})</b>` : fmtHora(t.data_hora)}${gestor && t.responsavel_nome ? ' · ' + esc(t.responsavel_nome) : ''}${t.obs ? ' · ' + esc(t.obs) : ''}</div></div>
      <div class="pa-acoes"><button class="pa-b" onclick="concluirTarefa('${t.id}')">✔ Feita</button><button class="pa-b pa-b2" onclick="openClientModalByNome(${JSON.stringify(t.cliente_nome || '').replace(/"/g, '&quot;')})">Abrir</button></div></div>`).join('')
    + (lista.length > 10 ? `<div class="pa-mais">+ ${lista.length - 10} outras</div>` : '');
}

/* ---------- 📝 / 📅 nos cards do kanban ---------- */
function marcarCards() {
  const notas = State.cliente_notas || [], tarefas = (State.tarefas || []).filter(t => t.status === 'pendente');
  if (!notas.length && !tarefas.length) return;
  const cont = {}, tcont = {};
  notas.forEach(n => { cont[n.chave] = (cont[n.chave] || 0) + 1; });
  tarefas.forEach(t => { tcont[t.chave] = (tcont[t.chave] || 0) + 1; });
  $$('.kanban-card[data-stage][data-id]').forEach(card => {
    const st = STAGES.find(s => s.id === card.dataset.stage); if (!st) return;
    const item = (State[st.dataKey] || []).find(x => String(x.id) === card.dataset.id); if (!item) return;
    const ch = chaveCliente(st.id, item), n = cont[ch] || 0, t = tcont[ch] || 0;
    card.querySelector('.cli-badges')?.remove();
    if (!n && !t) return;
    const b = document.createElement('div'); b.className = 'cli-badges';
    b.innerHTML = (n ? `<span title="${n} anotação(ões)">📝 ${n}</span>` : '') + (t ? `<span title="${t} tarefa(s) pendente(s)">📅 ${t}</span>` : '');
    (card.querySelector('.kanban-card-inner') || card).appendChild(b);
  });
}
async function carregarContagens() {
  if (!State.profile) return;
  const { data } = await supa.from('cliente_notas').select('id,chave,etapa,criado_em');
  if (data) State.cliente_notas = data.map(n => ({ ...n }));
}

export function initApp09() {
  const mr = $('#modalRoot');
  if (mr) new MutationObserver(() => {
    if (!mr.classList.contains('active')) { cardAtual = null; return; }
    injetarPainel(mr);
  }).observe(mr, { childList: true });
  const content = $('#content');
  let ocupado = false;
  if (content) new MutationObserver(() => { if (ocupado) return; ocupado = true; setTimeout(() => { ocupado = false; marcarCards(); }, 150); }).observe(content, { childList: true, subtree: true });
  let ciclo = 0;
  setInterval(async () => {
    if (!State.profile || document.hidden && ciclo % 4) { ciclo++; return; }
    if (ciclo % 4 === 0) { await carregarTarefas(); if (ciclo % 20 === 0) await carregarContagens(); }
    ciclo++; checarLembretes();
  }, 30000);
  // primeira carga assim que o perfil existir
  const espera = setInterval(async () => { if (State.profile) { clearInterval(espera); await Promise.all([carregarTarefas(), carregarContagens()]); checarLembretes(); } }, 1500);
}
