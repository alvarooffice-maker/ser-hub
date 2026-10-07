/* ============================================================
   KANBAN DO INSTALADOR
   Visão dedicada para tec_instalacao: 4 colunas baseadas no
   status da instalação, filtradas pelo técnico logado.
   ============================================================ */
async function renderInstaladorKanban(){
  await loadAll();
  const tecNome = (State.profile?.nome||'').toLowerCase().trim();

  const INST_COLS = [
    { id:'aguardando', label:'Aguardando Agendamento', icon:'⏳',
      filter: i => i.status === 'aguardando_agendamento' || (!i.data_instalacao && i.status !== 'cancelada' && i.status !== 'concluida') },
    { id:'agendada',   label:'Agendada',   icon:'📅', filter: i => i.status === 'agendada' },
    { id:'concluida',  label:'Concluída',  icon:'✅', filter: i => i.status === 'concluida' || i.status === 'em_andamento' },
    { id:'cancelada',  label:'Cancelada',  icon:'❌', filter: i => i.status === 'cancelada' }
  ];

  const minhas = (State.instalacoes||[]).filter(i =>
    (i.tecnico||'').toLowerCase().trim() === tecNome
  );

  function buildCol(col){
    const items = minhas.filter(col.filter);
    const cards = items.map(i => {
      const data = i.data_instalacao
        ? `${fmtDate(i.data_instalacao)}${i.hora_instalacao ? ' às '+i.hora_instalacao : ''}`
        : '<span style="color:#888;font-style:italic">Sem data</span>';
      const end = i.endereco || '';
      return `
        <div class="kanban-card" data-id="${i.id}" data-col="${col.id}"
             data-search="${esc(i.nome||'').toLowerCase()}" style="cursor:pointer">
          <div class="kanban-card-inner">
            <div class="name">🔧 ${esc(i.nome||'—')}</div>
            ${i.telefone ? `<div class="meta">📞 ${esc(i.telefone)}</div>` : ''}
            ${end ? `<div class="meta">📍 ${esc(end)}</div>` : ''}
            <div class="meta">📅 ${data}</div>
            ${i.kwp ? `<div class="meta">${fmtNum(i.kwp,2)} kWp</div>` : ''}
            <div class="footer">${badge(i.status||'aguardando_agendamento')}</div>
          </div>
        </div>`;
    }).join('') || '<div class="empty" style="padding:20px;font-size:12px">Sem itens</div>';

    return `
      <div class="kanban-col" data-vcol="${col.id}">
        <div class="kanban-col-header">
          <span>${col.icon} ${col.label}</span>
          <span class="count">${items.length}</span>
        </div>
        <div class="kanban-col-body">${cards}</div>
      </div>`;
  }

  $('#pageActions').innerHTML = '';
  $('#content').innerHTML = `<div class="kanban" id="kanban">${INST_COLS.map(buildCol).join('')}${renderExtraCols()}</div>`;

  $$('.kanban-card[data-col]').forEach(card => {
    card.addEventListener('click', () => openStageModal('instalacao', card.dataset.id));
  });
  attachExtraKanbanCols();
}

/* ============================================================
   KANBAN DO HOMOLOGADOR
   Visão dedicada para tec_homologacao: colunas baseadas na
   etapa da homologação, filtradas pelo técnico logado.
   ============================================================ */
async function renderHomologadorKanban(){
  await loadAll();
  const tecNome = (State.profile?.nome||'').toLowerCase().trim();

  const HOM_COLS = [
    { id:'aguardando_docs',  label:'Aguardando Documentação', icon:'📋', key:'aguardando_docs' },
    { id:'projeto',          label:'Projeto',                 icon:'📐', key:'projeto' },
    { id:'trt_art_pg',       label:'TRT/ART Pago',            icon:'💰', key:'trt_art_pg' },
    { id:'parecer_acesso',   label:'Parecer de Acesso',       icon:'✅', key:'parecer_acesso' },
    { id:'aumento_de_carga', label:'Aumento de Carga',        icon:'🔌', key:'aumento_de_carga' },
    { id:'vistoria_final',   label:'Vistoria Final',          icon:'🔍', key:'vistoria_final' },
    { id:'aprovada',         label:'Aprovada',                icon:'🏆', key:'aprovada' },
    { id:'reprovada',        label:'Reprovada',               icon:'❌', key:'reprovada' }
  ];

  const minhas = (State.homologacoes||[]).filter(h =>
    (h.tecnico||'').toLowerCase().trim() === tecNome
  );

  function buildCol(col){
    const items = minhas.filter(h => h.etapa === col.key);
    const cards = items.map(h => {
      return `
        <div class="kanban-card" data-id="${h.id}" data-col="${col.id}"
             data-search="${esc(h.nome||'').toLowerCase()}" style="cursor:pointer">
          <div class="kanban-card-inner">
            <div class="name">📋 ${esc(h.nome||'—')}</div>
            ${h.telefone ? `<div class="meta">📞 ${esc(h.telefone)}</div>` : ''}
            ${h.concessionaria ? `<div class="meta">⚡ ${esc(h.concessionaria)}</div>` : ''}
            ${h.kwp ? `<div class="meta">${fmtNum(h.kwp,2)} kWp</div>` : ''}
            <div class="footer">${badge(h.etapa||'aguardando_docs')}</div>
          </div>
        </div>`;
    }).join('') || '<div class="empty" style="padding:20px;font-size:12px">Sem itens</div>';

    return `
      <div class="kanban-col" data-vcol="${col.id}" style="flex:0 0 220px">
        <div class="kanban-col-header">
          <span>${col.icon} ${col.label}</span>
          <span class="count">${items.length}</span>
        </div>
        <div class="kanban-col-body">${cards}</div>
      </div>`;
  }

  $('#pageActions').innerHTML = '';
  $('#content').innerHTML = `<div class="kanban" id="kanban">${HOM_COLS.map(buildCol).join('')}</div>`;

  $$('.kanban-card[data-col]').forEach(card => {
    card.addEventListener('click', () => openStageModal('homologacao', card.dataset.id));
  });
}

async function renderReservicoKanban(){
  await loadAll();
  const role = userRole();
  const tecNome = (State.profile?.nome||'').toLowerCase().trim();
  const isTec = ['tec_vistoria','tec_instalacao','tec_vistoria_instalacao'].includes(role);
  const items = (State.atendimentos || []).filter(i =>
    !isTec || (i.responsavel||'').toLowerCase().trim() === tecNome
  );

  const cols = [
    { status:'aberto',       label:'Aberto',       icon:'🔴', color:'#fef3c7' },
    { status:'em_andamento', label:'Em Andamento',  icon:'🟡', color:'#e0f2fe' },
    { status:'concluido',    label:'Concluído',     icon:'🟢', color:'#d1fae5' },
    { status:'cancelado',    label:'Cancelado',     icon:'⚫', color:'#f3f4f6' },
  ];

  const tipoMap = {retorno_tecnico:'Retorno Técnico',sombreamento:'Sombreamento',goteira:'Goteira',falta_de_energia:'Falta de Energia',outros:'Outros'};

  const canEdit = ['admin','supervisor','vendedor','tec_instalacao','tec_vistoria'].includes(role);
  $('#pageActions').innerHTML = canEdit ? `<button class="btn btn-primary" id="newReservicoBtn">+ Novo Re-Serviço</button>` : '';
  $('#newReservicoBtn')?.addEventListener('click', ()=> openAtendimentoModal());

  const renderCard = (item) => {
    const tipo = tipoMap[item.tipo] || item.tipo || '—';
    const statusBadgeClass = `badge-${item.status||'aberto'}`;
    const statusLabel = {aberto:'Aberto',em_andamento:'Em Andamento',concluido:'Concluído',cancelado:'Cancelado'}[item.status]||item.status;
    return `<div class="kanban-card" data-id="${item.id}" style="margin-bottom:8px;cursor:pointer">
      <div class="kanban-card-inner" style="padding:10px 12px;border-radius:8px;background:var(--card);border:1px solid var(--border)">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">${esc(item.nome||'—')}</div>
        <div style="font-size:11px;color:var(--text-light);margin-bottom:6px">${esc(tipo)}</div>
        ${item.data_agendamento?`<div style="font-size:11px;color:var(--text-light)">📅 ${item.data_agendamento}</div>`:''}
        ${item.responsavel?`<div style="font-size:11px;color:var(--text-light)">👤 ${esc(item.responsavel)}</div>`:''}
        <div style="margin-top:6px"><span class="badge ${statusBadgeClass}" style="font-size:10px">${statusLabel}</span></div>
      </div>
    </div>`;
  };

  $('#content').innerHTML = `<div class="kanban" id="kanbanRS">${cols.map(col=>{
    const colItems = items.filter(i=>(i.status||'aberto')===col.status);
    return `<div class="kanban-col" data-stage="${col.status}" style="min-width:260px">
      <div class="kanban-col-header" style="background:${col.color}">
        <span>${col.icon} ${col.label}</span>
        <span class="badge-count">${colItems.length}</span>
      </div>
      <div class="kanban-cards" id="rsCol_${col.status}">
        ${colItems.map(renderCard).join('')}
      </div>
    </div>`;
  }).join('')}</div>`;

  $$('#kanbanRS .kanban-card').forEach(card=>{
    card.addEventListener('click',()=>{
      const item = items.find(x=>String(x.id)===String(card.dataset.id));
      if(item) openAtendimentoModal(item);
    });
  });
}

async function renderAppManKanban(){
  await loadAll();
  const role = userRole();
  const tecNome = (State.profile?.nome||'').toLowerCase().trim();
  const isTec = ['tec_vistoria','tec_instalacao','tec_vistoria_instalacao'].includes(role);
  const items = (State.appman || []).filter(i =>
    !isTec || (i.tecnico_responsavel||'').toLowerCase().trim() === tecNome
  );

  const cols = [
    { status:'aberto',       label:'Aberto',       icon:'🔴', color:'#fef3c7' },
    { status:'em_andamento', label:'Em Andamento',  icon:'🟡', color:'#e0f2fe' },
    { status:'concluido',    label:'Concluído',     icon:'🟢', color:'#d1fae5' },
    { status:'cancelado',    label:'Cancelado',     icon:'⚫', color:'#f3f4f6' },
  ];

  const ITENS_LABEL = {app:'App Monitoramento',manutencao_preventiva:'Manutenção Preventiva',manutencao_corretiva:'Manutenção Corretiva',limpeza:'Limpeza de Módulos',vistoria_tecnica:'Vistoria Técnica',troca_inversor:'Troca de Inversor'};

  const canEdit = ['admin','supervisor','vendedor','tec_instalacao','tec_vistoria'].includes(role);
  $('#pageActions').innerHTML = canEdit ? `<button class="btn btn-primary" id="newAppManBtn">+ Novo App/Manutenção</button>` : '';
  $('#newAppManBtn')?.addEventListener('click', ()=> openAppManModal());

  const renderCard = (item) => {
    const itensAtivos = item.itens ? Object.entries(item.itens).filter(([,v])=>v?.ativo).map(([k])=>ITENS_LABEL[k]||k) : [];
    const statusBadgeClass = `badge-${item.status||'aberto'}`;
    const statusLabel = {aberto:'Aberto',em_andamento:'Em Andamento',concluido:'Concluído',cancelado:'Cancelado'}[item.status]||item.status;
    return `<div class="kanban-card" data-id="${item.id}" style="margin-bottom:8px;cursor:pointer">
      <div class="kanban-card-inner" style="padding:10px 12px;border-radius:8px;background:var(--card);border:1px solid var(--border)">
        <div style="font-weight:600;font-size:13px;margin-bottom:4px">${esc(item.nome||'—')}</div>
        ${itensAtivos.length?`<div style="font-size:11px;color:var(--text-light);margin-bottom:4px">${itensAtivos.slice(0,2).map(esc).join(', ')}${itensAtivos.length>2?' +mais':''}</div>`:''}
        ${item.responsavel?`<div style="font-size:11px;color:var(--text-light)">👤 ${esc(item.responsavel)}</div>`:''}
        ${item.valor_total?`<div style="font-size:11px;font-weight:600;color:var(--primary);margin-top:4px">${fmtBRL(item.valor_total)}</div>`:''}
        <div style="margin-top:6px"><span class="badge ${statusBadgeClass}" style="font-size:10px">${statusLabel}</span></div>
      </div>
    </div>`;
  };

  $('#content').innerHTML = `<div class="kanban" id="kanbanAM">${cols.map(col=>{
    const colItems = items.filter(i=>(i.status||'aberto')===col.status);
    return `<div class="kanban-col" data-stage="${col.status}" style="min-width:260px">
      <div class="kanban-col-header" style="background:${col.color}">
        <span>${col.icon} ${col.label}</span>
        <span class="badge-count">${colItems.length}</span>
      </div>
      <div class="kanban-cards" id="amCol_${col.status}">
        ${colItems.map(renderCard).join('')}
      </div>
    </div>`;
  }).join('')}</div>`;

  $$('#kanbanAM .kanban-card').forEach(card=>{
    card.addEventListener('click',()=>{
      const item = items.find(x=>String(x.id)===String(card.dataset.id));
      if(item) openAppManModal(item);
    });
  });
}

function renderStageCol(stage){
  let items = filterByVendor(State[stage.dataKey]||[]);

  // (atendimentos/appman removed from pipeline — now independent kanban views)

  // ── tec_vistoria_instalacao: combina cadeia de vistoria + instalação ──────────
  if(userRole() === 'tec_vistoria_instalacao'){
    const tecNome = (State.profile?.nome||'').toLowerCase().trim();
    // Vistorias do técnico
    const minhasVist = (State.vistorias||[]).filter(v=>(v.tecnico||'').toLowerCase().trim()===tecNome);
    const vistIds = new Set(minhasVist.map(v=>v.id));
    // Instalações do técnico
    const minhasInst = (State.instalacoes||[]).filter(i=>(i.tecnico||'').toLowerCase().trim()===tecNome);
    const instIdsProprios = new Set(minhasInst.map(i=>i.id));
    // Cadeia para frente a partir das vistorias
    const contIdsV = new Set((State.contratos||[]).filter(c=>vistIds.has(c.vistoria_id)).map(c=>c.id));
    const logIdsV  = new Set((State.logistica||[]).filter(l=>contIdsV.has(l.contrato_id)).map(l=>l.id));
    const instIdsV = new Set((State.instalacoes||[]).filter(i=>logIdsV.has(i.logistica_id)).map(i=>i.id));
    // Cadeia para frente a partir das instalações
    const logIdsI  = new Set(minhasInst.map(i=>i.logistica_id).filter(Boolean));
    const contIdsI = new Set((State.logistica||[]).filter(l=>logIdsI.has(l.id)).map(l=>l.contrato_id).filter(Boolean));
    const vistIdsI = new Set((State.contratos||[]).filter(c=>contIdsI.has(c.id)).map(c=>c.vistoria_id).filter(Boolean));
    // Merge das instalações visíveis
    const instIds  = new Set([...instIdsProprios,...instIdsV]);
    const homIds   = new Set((State.homologacoes||[]).filter(h=>instIds.has(h.instalacao_id)).map(h=>h.id));
    // Cadeia para trás — unindo ambas as origens
    const propIdsV = new Set(minhasVist.map(v=>v.proposta_id).filter(Boolean));
    const propIdsI = new Set((State.vistorias||[]).filter(v=>new Set([...vistIds,...vistIdsI]).has(v.id)).map(v=>v.proposta_id).filter(Boolean));
    const propIds  = new Set([...propIdsV,...propIdsI]);
    const allVistIds = new Set([...vistIds,...vistIdsI]);
    const allContIds = new Set([...contIdsV,...contIdsI]);
    const allLogIds  = new Set([...logIdsV,...logIdsI]);
    const leadIds  = new Set((State.propostas||[]).filter(p=>propIds.has(p.id)).map(p=>p.lead_id).filter(Boolean));
    const filtroIds = {
      lead: leadIds, proposta: propIds, vistoria: allVistIds,
      contrato: allContIds, logistica: allLogIds, instalacao: instIds,
      homologacao: homIds
      // posvenda excluído
    };
    items = items.filter(i=>(filtroIds[stage.id]||new Set()).has(i.id));
  }

  // ── tec_instalacao: filtra por cadeia encadeada a partir das SUAS instalações ──
  if(userRole() === 'tec_instalacao'){
    const tecNome = (State.profile?.nome||'').toLowerCase().trim();
    const minhasInst = (State.instalacoes||[]).filter(i=>
      (i.tecnico||'').toLowerCase().trim() === tecNome
    );
    const instIds = new Set(minhasInst.map(i=>i.id));
    // Cadeia para frente (sem pós venda)
    const homIds  = new Set((State.homologacoes||[]).filter(h=>instIds.has(h.instalacao_id)).map(h=>h.id));
    // Cadeia para trás
    const logIds  = new Set(minhasInst.map(i=>i.logistica_id).filter(Boolean));
    const contIds = new Set((State.logistica||[]).filter(l=>logIds.has(l.id)).map(l=>l.contrato_id).filter(Boolean));
    const vistIds = new Set((State.contratos||[]).filter(c=>contIds.has(c.id)).map(c=>c.vistoria_id).filter(Boolean));
    const propIds = new Set((State.vistorias||[]).filter(v=>vistIds.has(v.id)).map(v=>v.proposta_id).filter(Boolean));
    const leadIds = new Set((State.propostas||[]).filter(p=>propIds.has(p.id)).map(p=>p.lead_id).filter(Boolean));
    const filtroIds = {
      lead: leadIds, proposta: propIds, vistoria: vistIds,
      contrato: contIds, logistica: logIds, instalacao: instIds,
      homologacao: homIds
      // posvenda: excluído — instalador não precisa ver cards em Pós Venda
    };
    items = items.filter(i => (filtroIds[stage.id]||new Set()).has(i.id));
  }

  // ── tec_vistoria: filtra por cadeia encadeada a partir das SUAS vistorias ──
  if(userRole() === 'tec_vistoria'){
    const tecNome = (State.profile?.nome||'').toLowerCase().trim();
    const minhasVist = (State.vistorias||[]).filter(v=>
      (v.tecnico||'').toLowerCase().trim() === tecNome
    );
    const vistIds = new Set(minhasVist.map(v=>v.id));
    // Cadeia para frente
    const contIds = new Set((State.contratos||[]).filter(c=>vistIds.has(c.vistoria_id)).map(c=>c.id));
    const logIds  = new Set((State.logistica||[]).filter(l=>contIds.has(l.contrato_id)).map(l=>l.id));
    const instIds = new Set((State.instalacoes||[]).filter(i=>logIds.has(i.logistica_id)).map(i=>i.id));
    const homIds  = new Set((State.homologacoes||[]).filter(h=>instIds.has(h.instalacao_id)).map(h=>h.id));
    // Cadeia para trás
    const propIds = new Set(minhasVist.map(v=>v.proposta_id).filter(Boolean));
    const leadIds = new Set((State.propostas||[]).filter(p=>propIds.has(p.id)).map(p=>p.lead_id).filter(Boolean));
    const filtroIds = {
      lead: leadIds, proposta: propIds, vistoria: vistIds,
      contrato: contIds, logistica: logIds, instalacao: instIds,
      homologacao: homIds
      // posvenda: excluído — vistoriador não precisa ver cards em Pós Venda
    };
    items = items.filter(i => (filtroIds[stage.id]||new Set()).has(i.id));
  }

  return renderStageColBody(stage, items);
}

// Ordem do funil, do menos ao mais avançado. Usado para ocultar cards de
// clientes importados sem cadeia de FKs — quando o mesmo nome já existe
// numa etapa mais avançada, o card da etapa atual é escondido.
const FUNIL_ORDEM = ['lead','proposta','vistoria','contrato','logistica','instalacao','homologacao','posvenda'];
const FUNIL_STATE_KEY = { lead:'leads', proposta:'propostas', vistoria:'vistorias', contrato:'contratos', logistica:'logistica', instalacao:'instalacoes', homologacao:'homologacoes', posvenda:'posvenda' };
function nomesEmEtapasMaisAvancadas(stageId){
  const idx = FUNIL_ORDEM.indexOf(stageId);
  const nomes = new Set();
  if(idx === -1) return nomes;
  for(let i=idx+1;i<FUNIL_ORDEM.length;i++){
    const key = FUNIL_STATE_KEY[FUNIL_ORDEM[i]];
    (State[key]||[]).forEach(it=>{
      const n = (it.nome||'').toLowerCase().trim();
      if(n) nomes.add(n);
    });
  }
  return nomes;
}

function renderStageColBody(stage, items){
  // ── Oculta cards de clientes (por nome) que já têm registro numa etapa
  // mais avançada do funil — cobre clientes importados sem cadeia de FKs,
  // que o filtro de "promovidos" abaixo (baseado em FK) não detecta.
  if(FUNIL_ORDEM.includes(stage.id) && stage.id !== 'posvenda'){
    const nomesAvancados = nomesEmEtapasMaisAvancadas(stage.id);
    if(nomesAvancados.size){
      const leadsComProjeto = new Set((State.leads||[]).filter(l=>(l.projeto||'').trim()).map(l=>l.id));
      items = items.filter(it => {
        // Item com "projeto" preenchido (próprio ou propagado) → nunca esconder por nome
        if((it.projeto||'').trim()) return true;
        // Fallback: lead de origem tem "projeto" → nunca esconder por nome
        if(it.lead_id && leadsComProjeto.has(it.lead_id)) return true;
        return !nomesAvancados.has((it.nome||'').toLowerCase().trim());
      });
    }
  }

  // ── Oculta itens enviados para Remarketing (pendente de reativação) ──
  // Vale para lead/proposta/vistoria/contrato, que são os estágios que
  // alimentam o Remarketing quando perdido/recusada/reprovada/cancelado.
  if(['lead','proposta','vistoria','contrato'].includes(stage.id)){
    const leadIdsRemarketing = new Set(
      (State.remarketing||[]).filter(r=>r.status==='pendente').map(r=>r.lead_id).filter(Boolean)
    );
    if(leadIdsRemarketing.size){
      items = items.filter(it=>{
        const leadId = stage.id==='lead' ? it.id : it.lead_id;
        return !leadIdsRemarketing.has(leadId);
      });
    }
  }

  // ── Oculta itens já promovidos — igual para TODOS os perfis ──
  // Garante 1 card por cliente em cada coluna (aparece só na etapa mais avançada)
  if(stage.id === 'lead'){
    const promovidos = new Set((State.propostas||[]).map(p=>p.lead_id).filter(Boolean));
    items = items.filter(l => !promovidos.has(l.id) || l.remarketing);
  }
  if(stage.id === 'proposta'){
    const promovidos = new Set((State.vistorias||[]).map(v=>v.proposta_id).filter(Boolean));
    items = items.filter(p => !promovidos.has(p.id) && p.status !== 'recusada');
  }
  if(stage.id === 'vistoria'){
    const promovidos = new Set((State.contratos||[]).map(c=>c.vistoria_id).filter(Boolean));
    items = items.filter(v => !promovidos.has(v.id));
  }
  if(stage.id === 'contrato'){
    const promovidos = new Set((State.logistica||[]).map(l=>l.contrato_id).filter(Boolean));
    items = items.filter(c => !promovidos.has(c.id));
  }
  if(stage.id === 'logistica'){
    const promovidos = new Set((State.instalacoes||[]).map(i=>i.logistica_id).filter(Boolean));
    items = items.filter(l => !promovidos.has(l.id));
  }
  if(stage.id === 'instalacao'){
    const promovidos = new Set((State.homologacoes||[]).map(h=>h.instalacao_id).filter(Boolean));
    items = items.filter(i => !promovidos.has(i.id));
  }
  if(stage.id === 'homologacao'){
    const promovidos = new Set((State.posvenda||[]).map(p=>p.homologacao_id).filter(Boolean));
    items = items.filter(h => !promovidos.has(h.id));
  }

  // Atendimentos / App-Man: sem deduplicação (múltiplos por cliente são esperados)
  if(!['atendimentos','appman'].includes(stage.id)){
    const seen = new Map();
    items.forEach(it => {
      let key;
      const _proj = (it.projeto||'').toLowerCase().trim();
      if(stage.id === 'lead')
        key = 'n:' + (it.nome||'').toLowerCase().trim() + '|p:' + _proj;
      else if(stage.id === 'proposta'){
        const lead = it.lead_id ? (State.leads||[]).find(l=>l.id===it.lead_id) : null;
        const proj = _proj || (lead?.projeto||'').toLowerCase().trim();
        key = it.lead_id ? (it.lead_id + '|p:' + proj) : ('n:' + (it.nome||'').toLowerCase().trim() + '|p:' + proj);
      } else if(stage.id === 'vistoria')
        key = (it.proposta_id || it.lead_id || ('n:' + (it.nome||'').toLowerCase().trim())) + '|p:' + _proj;
      else
        key = (it.lead_id || ('n:' + (it.nome||'').toLowerCase().trim())) + '|p:' + _proj;
      const prev = seen.get(key);
      if(!prev || (it.criado_em||'') > (prev.criado_em||'')) seen.set(key, it);
    });
    items = [...seen.values()];
  }

  // Botão "+" para criar novo registro direto na coluna
  const addBtn = stage.id === 'atendimentos'
    ? `<button class="col-search-btn" id="newAtendBtn" title="Novo Re-Serviço" style="font-size:16px;font-weight:700">＋</button>`
    : stage.id === 'appman'
    ? `<button class="col-search-btn" id="newAppManBtn" title="Novo App/Manutenção" style="font-size:16px;font-weight:700">＋</button>`
    : '';

  return `
    <div class="kanban-col" data-stage="${stage.id}">
      <div class="kanban-col-header">
        <span>${stage.icon} ${stage.label}</span>
        <div style="display:flex;align-items:center;gap:5px">
          <span class="count" id="col-count-${stage.id}">${items.length}</span>
          ${addBtn}
          <button class="col-search-btn" data-stage="${stage.id}" title="Pesquisar nesta coluna">🔍</button>
        </div>
      </div>
      <div class="col-search-bar" id="col-search-bar-${stage.id}" style="display:none">
        <input class="col-search-input" id="col-search-${stage.id}" placeholder="Buscar cliente, vendedor..." autocomplete="off">
      </div>
      <div class="kanban-col-body" data-drop="${stage.id}">
        ${items.map(it=>renderCard(it,stage)).join('') || '<div class="empty" style="padding:20px;font-size:12px">Sem itens</div>'}
      </div>
    </div>`;
}

// Retorna onde o cliente está no funil a partir de uma vistoria (para badge no card)
function etapaAtualDaVistoria(v){
  const c = (State.contratos||[]).find(x=>x.vistoria_id===v.id);
  if(!c) return null;
  const l = (State.logistica||[]).find(x=>x.contrato_id===c.id);
  if(!l) return {icon:'✍️', label:'Contrato', status:c.status};
  const i = (State.instalacoes||[]).find(x=>x.logistica_id===l.id);
  if(!i) return {icon:'📦', label:'Logística', status:l.status};
  const h = (State.homologacoes||[]).find(x=>x.instalacao_id===i.id);
  if(!h) return {icon:'🔧', label:'Instalação', status:i.status};
  const p = (State.posvenda||[]).find(x=>x.homologacao_id===h.id);
  if(!p) return {icon:'📋', label:'Homologação', status:h.etapa};
  return {icon:'⭐', label:'Pós Venda', status:p.status};
}

function _normNome(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim(); }
function resolvePropostaKwp(item, stageId){
  if(stageId === 'proposta') return item.kwp;
  // 1. proposta_id direto no próprio item
  if(item.proposta_id){
    const p = (State.propostas||[]).find(x=>x.id===item.proposta_id);
    if(p?.kwp) return p.kwp;
  }
  // 2. lead_id — todas as etapas herdam o lead_id, e a proposta também o tem
  if(item.lead_id){
    const p = (State.propostas||[]).find(x=>x.lead_id===item.lead_id);
    if(p?.kwp) return p.kwp;
  }
  // 3. chain de FKs (registros criados pelo fluxo normal)
  let propostaId = null;
  if(stageId === 'contrato'){
    const v = (State.vistorias||[]).find(x=>x.id===item.vistoria_id);
    propostaId = v?.proposta_id;
  } else if(stageId === 'logistica'){
    const c = (State.contratos||[]).find(x=>x.id===item.contrato_id);
    const v = c && (State.vistorias||[]).find(x=>x.id===c.vistoria_id);
    propostaId = c?.proposta_id || v?.proposta_id;
  } else if(stageId === 'instalacao'){
    const l = (State.logistica||[]).find(x=>x.id===item.logistica_id);
    const c = l && (State.contratos||[]).find(x=>x.id===l.contrato_id);
    const v = c && (State.vistorias||[]).find(x=>x.id===c.vistoria_id);
    propostaId = l?.proposta_id || c?.proposta_id || v?.proposta_id;
  } else if(stageId === 'homologacao'){
    const i = (State.instalacoes||[]).find(x=>x.id===item.instalacao_id);
    const l = i && (State.logistica||[]).find(x=>x.id===i.logistica_id);
    const c = l && (State.contratos||[]).find(x=>x.id===l.contrato_id);
    const v = c && (State.vistorias||[]).find(x=>x.id===c.vistoria_id);
    propostaId = i?.proposta_id || l?.proposta_id || c?.proposta_id || v?.proposta_id;
  } else if(stageId === 'posvenda'){
    const h = (State.homologacoes||[]).find(x=>x.id===item.homologacao_id);
    const i = h && (State.instalacoes||[]).find(x=>x.id===h.instalacao_id);
    const l = i && (State.logistica||[]).find(x=>x.id===i.logistica_id);
    const c = l && (State.contratos||[]).find(x=>x.id===l.contrato_id);
    const v = c && (State.vistorias||[]).find(x=>x.id===c.vistoria_id);
    propostaId = h?.proposta_id || i?.proposta_id || l?.proposta_id || c?.proposta_id || v?.proposta_id;
  }
  if(propostaId){
    const p = (State.propostas||[]).find(x=>x.id===propostaId);
    if(p?.kwp) return p.kwp;
  }
  // 4. fallback por nome normalizado (sem acentos, case-insensitive)
  const nome = _normNome(item.nome);
  if(nome){
    const p = (State.propostas||[]).find(x=>_normNome(x.nome)===nome);
    if(p?.kwp) return p.kwp;
  }
  return item.kwp;
}

function renderCard(item,stage){
  const stat = stageStatus(item,stage);
  const kwh = item.kwh ? `${fmtNum(item.kwh,0)} kWh` : '';
  const rawKwp = resolvePropostaKwp(item, stage.id);
  const kwp = rawKwp ? `${fmtNum(rawKwp,2)} kWp` : '';
  const flags = stageFlags(item,stage);
  const role = userRole();
  const isTecVist  = role === 'tec_vistoria';
  const isTecInst  = role === 'tec_instalacao';
  const isTecBoth  = role === 'tec_vistoria_instalacao';
  // técnicos restritos: sem drag
  const draggable = (isTecVist || isTecInst || isTecBoth) ? 'false' : 'true';

  // chip informativo nos cards de outras colunas
  const tecHint = (isTecVist && stage.id !== 'vistoria')
    ? `<div style="font-size:10px;color:#6B21A8;font-style:italic;margin-top:3px">🔍 Clique → editar vistoria</div>`
    : (isTecInst && stage.id !== 'instalacao')
    ? `<div style="font-size:10px;color:#0369a1;font-style:italic;margin-top:3px">🔍 Clique → editar instalação</div>`
    : (isTecBoth && !['vistoria','instalacao'].includes(stage.id))
    ? `<div style="font-size:10px;color:#6B21A8;font-style:italic;margin-top:3px">🔍 Clique → editar vistoria / instalação</div>`
    : '';

  const tipoAtendMap = {retorno_tecnico:'Retorno Técnico',sombreamento:'Sombreamento',goteira:'Goteira',falta_de_energia:'Falta de Energia',outros:'Outros'};
  const isAtend = stage.id === 'atendimentos';
  const isAppMan = stage.id === 'appman';
  const itensAppManMap = {configuracao:'Configuração',manutencao:'Manutenção',app_monitoramento:'App Monitoramento',vistoria_tecnica:'Vistoria Técnica'};
  const itensAtivos = isAppMan ? Object.entries(item.itens||{}).filter(([,v])=>v?.ativo).map(([k])=>itensAppManMap[k]||k) : [];
  const meta1 = isAtend ? '' : isAppMan ? (itensAtivos.join(', ')||'—') : (kwp || kwh || '');
  const meta2 = isAtend ? (item.responsavel||'') : isAppMan
    ? [item.valor_total!=null?fmtBRL(item.valor_total):'', item.tecnico_responsavel?'🔧 '+item.tecnico_responsavel:''].filter(Boolean).join(' · ')
    : (item.vendedor||'');
  const tipoBadge = isAtend && item.tipo
    ? `<span class="badge badge-${esc(item.tipo)}" title="${esc(item.tipo==='outros'&&item.tipo_obs?item.tipo_obs:'')}">${esc(tipoAtendMap[item.tipo]||item.tipo)}</span>`
    : '';

  // Badge de projeto: mostra em TODAS as etapas se o campo estiver preenchido
  const projetoBadge = item.projeto
    ? `<span style="display:inline-block;font-size:10px;background:#ede9fe;color:#6B21A8;border-radius:4px;padding:1px 6px;margin-top:2px;font-weight:600">📌 ${esc(item.projeto)}</span>`
    : '';

  // Badge de remarketing: aparece no card do lead reativado
  const remarketingBadge = item.remarketing
    ? `<span style="display:inline-block;font-size:10px;background:#fce7f3;color:#be185d;border-radius:4px;padding:1px 6px;margin-top:2px;font-weight:600">🔁 Remarketing</span>`
    : '';

  // SLA por etapa: [amarelo, vermelho] em dias
  const SLA_ETAPA = {
    lead:        [3,  7],
    proposta:    [5, 10],
    vistoria:    [5, 10],
    contrato:    [5, 10],
    logistica:   [5, 10],
    instalacao:  [7, 15],
    homologacao: [20, 40],
  };
  const _slaDate = stage.id==='lead' ? (item.atualizado_em||item.criado_em) : item.criado_em;
  const _slaDias = _slaDate ? Math.floor((Date.now()-new Date(_slaDate).getTime())/86400000) : null;
  const showSla  = _slaDias!=null && !['atendimentos','appman','posvenda'].includes(stage.id);
  const [_slaWarn=3, _slaDanger=7] = SLA_ETAPA[stage.id] || [3,7];
  const _slaClass = !showSla || _slaDias<_slaWarn ? '' : _slaDias<_slaDanger ? 'sla-warn' : 'sla-danger';
  const slaDaysLabel = showSla && _slaDias>=_slaWarn ? `<span class="sla-days">${_slaDias}d</span>` : '';

  return `
    <div class="kanban-card ${_slaClass}" draggable="${draggable}" data-id="${item.id}" data-stage="${stage.id}" data-search="${(esc(item.nome||'')+' '+esc(item.responsavel||item.vendedor||'')+' '+esc(item.projeto||'')).toLowerCase()}">
      <div class="kanban-card-inner" style="position:relative">
        ${slaDaysLabel}
        <div class="name">${stage.icon} ${esc(item.nome||'—')}${projetoBadge?'<br>'+projetoBadge:''}${remarketingBadge?'<br>'+remarketingBadge:''}</div>
        ${meta1?`<div class="meta">${esc(meta1)}</div>`:''}
        <div class="meta">${esc(meta2)}</div>
        ${flags}
        ${tecHint}
        <div class="footer">${tipoBadge}${badge(stat)}</div>
      </div>
    </div>`;
}

function stageStatus(item,stage){
  switch(stage.id){
    case 'lead': return item.status;
    case 'proposta': return item.status;
    case 'vistoria': return item.resultado || item.status;
    case 'contrato': return item.status;
    case 'logistica': return item.status;
    case 'instalacao': return item.status;
    case 'homologacao': return item.etapa;
    case 'posvenda':     return item.status;
    case 'atendimentos': return item.status;
    case 'appman': return item.status;
  }
  return '';
}

/* ─────────────────────────────────────────────────────────────
   FLAGS DE HISTÓRICO DO FUNIL — aparece nos cards do kanban
   Contrato → flag vistoria
   Logística → + flag contrato
   Instalação → + flag logística
   Homologação → + flag instalação
   Pós-venda → + 5 flags de contagem regressiva
   ───────────────────────────────────────────────────────────── */
function stageFlags(item, stage){
  const sid = stage.id;

  // ── FLAGS DE CONTATO PARA LEADS ───────────────────────────
  if(sid === 'lead' && item.status !== 'proposta'){
    const attempts = (State.tentativas_contato||[])
      .filter(t=>t.lead_id===item.id)
      .sort((a,b)=> (a.criado_em||'')<(b.criado_em||'') ? -1 : 1);
    if(!attempts.length) return '';
    const ordinal = n => n===1?'1º':n===2?'2º':n===3?'3º':`${n}º`;
    const flagsL = attempts.map((t,i)=>{
      const res = t.resultado||'';
      let c = 'warn';
      if(/contato_feito|interessado|agendou_retorno/.test(res)) c = 'ok';
      else if(/nao_interessado/.test(res)) c = 'danger';
      return `<span class="flag ${c}" title="${ordinal(i+1)} Contato: ${t.tipo} → ${res}">📞 ${ordinal(i+1)} ${t.tipo}</span>`;
    });
    return `<div class="card-flags">${flagsL.join('')}</div>`;
  }

  // ── CONTADOR DE PRÓXIMA MANUTENÇÃO PARA APP/MAN ───────────
  if(sid === 'appman'){
    if(!item.data_renovacao) return '';
    const today0 = new Date(); today0.setHours(0,0,0,0);
    const t = new Date(item.data_renovacao+'T12:00:00'); t.setHours(0,0,0,0);
    const diff = Math.round((t-today0)/86400000);
    let c = 'countdown', txt;
    if(diff < 0)       { c+=' urgent'; txt=`🔄 Vencida há ${Math.abs(diff)}d`; }
    else if(diff===0)  { c+=' urgent'; txt='🔄 Renovar HOJE!'; }
    else if(diff<=7)   { c+=' urgent'; txt=`🔄 Renovação em ${diff}d`; }
    else               {               txt=`🔄 Renovação em ${diff}d`; }
    return `<div class="card-flags"><span class="flag ${c}" title="Próxima renovação: ${item.data_renovacao}">${txt}</span></div>`;
  }

  if(!['contrato','logistica','instalacao','homologacao','posvenda'].includes(sid)) return '';

  const flags = [];
  const today = new Date(); today.setHours(0,0,0,0);

  // ── Lookups da cadeia do funil ────────────────────────────
  const find = (arr, id) => id ? (arr||[]).find(x=>String(x.id)===String(id)) : null;

  let contrato = find(State.contratos, item.contrato_id);
  // Fallback: vistoria via contrato (registros antigos sem vistoria_id direto)
  let vistoria = find(State.vistorias, item.vistoria_id)
               || (contrato ? find(State.vistorias, contrato.vistoria_id) : null);

  // Logística e Instalação: trace a cadeia conforme o estágio
  let logistica = null, instalacao = null;
  if(sid === 'instalacao'){
    logistica  = find(State.logistica,  item.logistica_id);
  } else if(sid === 'homologacao'){
    instalacao = find(State.instalacoes, item.instalacao_id);
    logistica  = find(State.logistica,   instalacao?.logistica_id);
  } else if(sid === 'posvenda'){
    const homolog = find(State.homologacoes, item.homologacao_id);
    instalacao = find(State.instalacoes, homolog?.instalacao_id);
    logistica  = find(State.logistica,   instalacao?.logistica_id);
  }

  // Contrato via cadeia logística → contrato (quando não vier direto no item)
  if(!contrato && logistica){
    contrato = find(State.contratos, logistica.contrato_id);
    if(!vistoria) vistoria = find(State.vistorias, contrato?.vistoria_id);
  }

  // ── Cor da flag conforme o status ────────────────────────
  function cls(s){
    if(!s) return '';
    if(/aprovad|assinado|conclu|comprado|ativo|realiz|entregue|pago|paga|recebido|reativado|aceita/.test(s)) return 'ok';
    if(/reprova|perdido|recusad|cancel|descart|inativo/.test(s)) return 'danger';
    if(/agendad|trt_art|parecer|vistoria_final|manutencao/.test(s)) return 'purple';
    if(/obra|sombr/.test(s)) return 'amber';
    return 'teal';
  }

  // ── Flags de histórico ────────────────────────────────────
  if(vistoria){
    const s = vistoria.resultado || vistoria.status || '—';
    flags.push(`<span class="flag ${cls(s)}" title="Vistoria: ${s}">🔍 ${s}</span>`);
  }
  if(['logistica','instalacao','homologacao','posvenda'].includes(sid) && contrato){
    const s = contrato.status || '—';
    flags.push(`<span class="flag ${cls(s)}" title="Contrato: ${s}">✍️ ${s}</span>`);
  }
  if(['instalacao','homologacao','posvenda'].includes(sid) && logistica){
    const s = logistica.status || '—';
    flags.push(`<span class="flag ${cls(s)}" title="Logística: ${s}">📦 ${s}</span>`);
  }
  if(['homologacao','posvenda'].includes(sid) && instalacao){
    const s = instalacao.status || '—';
    flags.push(`<span class="flag ${cls(s)}" title="Instalação: ${s}">🔧 ${s}</span>`);
  }

  // ── Contagem regressiva: prazo de 90 dias para homologação,
  // a contar da data de assinatura do contrato ─────────────
  if(sid === 'homologacao' && contrato?.data_assinatura){
    const t = new Date(contrato.data_assinatura+'T12:00:00'); t.setHours(0,0,0,0);
    t.setDate(t.getDate()+90);
    const diff = Math.round((t-today)/86400000);
    let c = 'countdown', txt;
    if(diff < 0)       { c+=' urgent'; txt=`⏳ Prazo vencido há ${Math.abs(diff)}d`; }
    else if(diff===0)  { c+=' urgent'; txt='⏳ Prazo vence HOJE!'; }
    else if(diff<=15)  { c+=' urgent'; txt=`⏳ Prazo: ${diff}d`; }
    else               {               txt=`⏳ Prazo: ${diff}d`; }
    flags.push(`<span class="flag ${c}" title="Prazo contratual de 90 dias para homologação (assinatura: ${contrato.data_assinatura})">${txt}</span>`);
  }

  // ── Pós-venda: 5 contagens regressivas ───────────────────
  if(sid === 'posvenda'){
    function addDays(dateStr, n){
      if(!dateStr) return null;
      const d = new Date(dateStr+'T12:00:00');
      d.setDate(d.getDate()+n);
      return d;
    }
    function cdFlag(icon, label, targetDate){
      if(!targetDate) return null;
      const t = new Date(targetDate); t.setHours(0,0,0,0);
      const diff = Math.round((t - today)/86400000);
      let c = 'countdown', txt;
      if(diff < 0)        { c+=' done';   txt=`${icon} ✓`; }
      else if(diff === 0) { c+=' urgent'; txt=`${icon} HOJE!`; }
      else if(diff <= 7)  { c+=' urgent'; txt=`${icon} ${diff}d`; }
      else                {               txt=`${icon} ${diff}d`; }
      return `<span class="flag ${c}" title="${label}: ${diff>=0?diff+' dias':'concluído'}">${txt}</span>`;
    }

    // 1. Aniversário (próximo)
    const lead = find(State.leads, item.lead_id);
    if(lead?.nascimento){
      const bday = new Date(lead.nascimento+'T12:00:00');
      const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if(next < today) next.setFullYear(today.getFullYear()+1);
      const diff = Math.round((next-today)/86400000);
      const c = diff<=30 ? 'countdown urgent' : 'countdown';
      flags.push(`<span class="flag ${c}" title="Aniversário: ${diff===0?'HOJE':diff+' dias'}">🎂 ${diff===0?'HOJE!':diff+'d'}</span>`);
    }

    // 2. Manutenção (+300 dias da instalação)
    if(instalacao?.data_instalacao){
      const f = cdFlag('🛡️','Manutenção (300d)',addDays(instalacao.data_instalacao,300));
      if(f) flags.push(f);
    }

    if(instalacao?.data_instalacao){
      // 3. Acolhimento (+5 dias da instalação)
      const f3 = cdFlag('🤝','Acolhimento (5d)',addDays(instalacao.data_instalacao,5));
      if(f3) flags.push(f3);
      // 4. Gratidão (+30 dias da instalação)
      const f4 = cdFlag('💛','Gratidão (30d)',addDays(instalacao.data_instalacao,30));
      if(f4) flags.push(f4);
      // 5. Embaixador (+90 dias da instalação)
      const f5 = cdFlag('🌟','Embaixador (90d)',addDays(instalacao.data_instalacao,90));
      if(f5) flags.push(f5);
    }
  }

  if(!flags.length) return '';
  return `<div class="card-flags">${flags.join('')}</div>`;
}

function filterColCards(stageId, term){
  const t = (term||'').toLowerCase().trim();
  const col = document.querySelector(`.kanban-col[data-stage="${stageId}"]`);
  if(!col) return;
  const cards = col.querySelectorAll('.kanban-card');
  let visible = 0;
  cards.forEach(card=>{
    const hay = card.dataset.search || '';
    const show = !t || hay.includes(t);
    card.style.display = show ? '' : 'none';
    if(show) visible++;
  });
  const countEl = document.getElementById(`col-count-${stageId}`);
  if(countEl) countEl.textContent = t ? `${visible}/${cards.length}` : String(cards.length);
}

// Re-Serviço e App/Manutenção agora são kanbans independentes no menu.
function renderExtraCols(){ return ''; }
function attachExtraKanbanCols(){ attachKanbanSearch(); }

function attachKanbanSearch(){
  $$('.col-search-btn').forEach(btn=>{
    const sid = btn.dataset.stage;
    const bar = document.getElementById(`col-search-bar-${sid}`);
    const inp = document.getElementById(`col-search-${sid}`);
    if(!bar || !inp) return;

    btn.addEventListener('click', ()=>{
      const isOpen = bar.style.display !== 'none';
      if(isOpen){
        bar.style.display = 'none';
        inp.value = '';
        btn.classList.remove('active');
        filterColCards(sid, '');
      } else {
        bar.style.display = '';
        btn.classList.add('active');
        inp.focus();
      }
    });

    inp.addEventListener('input', ()=> filterColCards(sid, inp.value));

    inp.addEventListener('keydown', e=>{
      if(e.key === 'Escape'){
        bar.style.display = 'none';
        inp.value = '';
        btn.classList.remove('active');
        filterColCards(sid, '');
      }
    });
  });
}

let _dropLock = false;
function attachKanbanDnD(){
  let dragging = null;
  $$('.kanban-card').forEach(card=>{
    card.addEventListener('dragstart', e=>{
      dragging = { id:card.dataset.id, stage:card.dataset.stage, el:card };
      card.classList.add('dragging');
      try{ e.dataTransfer.effectAllowed='move'; e.dataTransfer.setData('text/plain',card.dataset.id); }catch(_){}
    });
    card.addEventListener('dragend', ()=>{ card.classList.remove('dragging'); $$('.kanban-col-body').forEach(c=>c.classList.remove('drag-over')); });
    card.addEventListener('click', ()=> openStageModal(card.dataset.stage, card.dataset.id));
  });
  $$('.kanban-col-body').forEach(col=>{
    col.addEventListener('dragover', e=>{ e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', ()=> col.classList.remove('drag-over'));
    col.addEventListener('drop', async e=>{
      e.preventDefault();
      col.classList.remove('drag-over');
      if(!dragging || _dropLock) return;
      _dropLock = true;
      setTimeout(()=>{ _dropLock = false; }, 2000);
      const fromStage = dragging.stage;
      const toStage = col.dataset.drop;
      const drag = dragging;
      dragging = null;
      if(fromStage === toStage) return;
      const fromIdx = STAGES.findIndex(s=>s.id===fromStage);
      const toIdx   = STAGES.findIndex(s=>s.id===toStage);
      if(toIdx === fromIdx+1){
        // Avanço normal
        await transitionCard(drag.id, fromStage, toStage);
      } else if(toIdx < fromIdx){
        // Regressão: pede confirmação antes de desfazer
        const fromLabel = STAGES[fromIdx]?.label || fromStage;
        const toLabel   = STAGES[toIdx]?.label   || toStage;
        confirmDialog(
          `⚠️ Regredir card para "${toLabel}"?`,
          `O registro em "${fromLabel}" será excluído. Esta ação não pode ser desfeita.`,
          'Sim, regredir', 'Cancelar',
          async () => {
            await regressarCard(drag.id, fromStage, toStage);
          }
        );
      } else {
        toast('Só é permitido avançar uma etapa por vez.','error');
      }
    });
  });
}

async function transitionCard(id, fromStage, toStage){
  const fromCfg = STAGES.find(s=>s.id===fromStage);
  const toCfg = STAGES.find(s=>s.id===toStage);
  const item = (State[fromCfg.dataKey]||[]).find(x=>String(x.id)===String(id));
  if(!item){ toast('Item não encontrado.','error'); return; }

  const guard = checkGuard(item, fromStage, toStage);
  if(!guard.ok){ toast(guard.msg, 'error'); return; }

  // Check duplicate — consulta o banco para evitar race condition
  // lead→proposta nunca bloqueia (lead pode gerar nova proposta após remarketing)
  const linkField = fromStage+'_id';
  if(fromStage !== 'lead'){
    const { data: dupCheck } = await supa.from(toCfg.table).select('id').eq(linkField, item.id).maybeSingle();
    if(dupCheck){ toast('Já existe registro nesta etapa para este item.','info'); return; }
  }

  const payload = buildTransitionPayload(item, fromStage, toStage);
  payload.criado_por = State.user?.id;

  const { error } = await supa.from(toCfg.table).insert(payload);
  if(error){ toast('Erro: '+error.message,'error'); return; }
  toast(`Movido para ${toCfg.label}`,'success');
  await loadAll();
  renderPipeline();
}

function confirmDialog(title, body, okLabel, cancelLabel, onOk){
  openModal(`
    <div class="modal-header"><h2>${title}</h2><button class="modal-close">×</button></div>
    <div class="modal-body"><p style="margin:0;font-size:14px;color:var(--text-light)">${body}</p></div>
    <div class="modal-footer">
      <button class="btn btn-secondary modal-close">${cancelLabel}</button>
      <button class="btn btn-danger" id="confirmOkBtn">${okLabel}</button>
    </div>`,'sm');
  $('#confirmOkBtn').addEventListener('click',()=>{ closeModal(); onOk(); });
}

async function regressarCard(id, fromStage, toStage){
  const fromCfg = STAGES.find(s=>s.id===fromStage);
  if(!fromCfg){ toast('Etapa inválida.','error'); return; }
  const { error } = await supa.from(fromCfg.table).delete().eq('id', id);
  if(error){ toast('Erro ao regredir: '+error.message,'error'); return; }
  toast('Card regredido com sucesso.','success');
  await loadAll(); renderPipeline();
}

function checkGuard(item, fromStage, toStage){
  if(fromStage==='lead' && toStage==='proposta'){
    if(item.status !== 'proposta') return {ok:false, msg:'Lead precisa estar com status "Proposta".'};
  }
  if(fromStage==='proposta' && toStage==='vistoria'){
    if(item.status !== 'aceita') return {ok:false, msg:'Proposta precisa estar "Aceita".'};
  }
  if(fromStage==='vistoria' && toStage==='contrato'){
    const ok = ['aguardando_agendamento','agendada','realizada','aprovada'].includes(item.status);
    if(!ok) return {ok:false, msg:'Vistoria precisa estar com status Agendada, Realizada ou Aprovada.'};
  }
  if(fromStage==='contrato' && toStage==='logistica'){
    if(item.status !== 'assinado' || !item.data_assinatura) return {ok:false, msg:'Contrato precisa estar assinado com data preenchida.'};
  }
  if(fromStage==='logistica' && toStage==='instalacao'){
    // Qualquer status permite avançar
  }
  if(fromStage==='instalacao' && toStage==='homologacao'){
    if(item.status === 'cancelada') return {ok:false, msg:'Instalação cancelada não pode avançar para homologação.'};
    if(!['aguardando_agendamento','agendada','em_andamento','concluida'].includes(item.status)) return {ok:false, msg:'Status da instalação não permite avançar para homologação.'};
  }
  if(fromStage==='homologacao' && toStage==='posvenda'){
    if(item.etapa !== 'aprovada') return {ok:false, msg:'Homologação precisa estar "Aprovada".'};
  }
  return {ok:true};
}

// Envia um cliente para Remarketing quando proposta é recusada, contrato é
// cancelado ou vistoria é reprovada. Evita duplicar registros pendentes.
// Repete a cascata (aprovado→contrato / reprovado→remarketing) após sincronizar uma vistoria feita offline
async function posSyncVistoria(recordId, data){
  const parecerEhAprovado = v => ['aprovado','aprovado_com_obra','aprovado_com_sombreamento','aprovado_com_obra_e_sombreamento','aprovada','aprovada_com_obra','aprovada_com_sombreamento','aprovada_com_obra_e_sombreamento'].includes(v||'');
  const parecerEhReprovado = v => ['reprovado','reprovada'].includes(v||'');
  const itemAntigo = (State.vistorias||[]).find(v=>String(v.id)===String(recordId));
  const prevResultado = itemAntigo?.resultado || '';
  const { data: antes } = await supa.from('vistorias').select('*').eq('id', recordId).single();
  if(!antes) return;
  await registrarHistorico('vistorias', recordId, 'atualizado', 'Vistoria sincronizada (preenchida offline em campo)');
  if(parecerEhAprovado(data.resultado) && !parecerEhAprovado(prevResultado)){
    const jaExiste = (State.contratos||[]).find(c => c.vistoria_id === recordId);
    if(!jaExiste){
      const cPayload = buildTransitionPayload(antes, 'vistoria', 'contrato');
      cPayload.criado_por = State.user?.id;
      await supa.from('contratos').insert(cPayload);
    }
  } else if(parecerEhReprovado(data.resultado) && !parecerEhReprovado(prevResultado)){
    await enviarParaRemarketing(antes, 'vistoria_reprovada', 'Vistoria reprovada');
  }
}
// Repete o pós-processamento (histórico + agenda da régua de relacionamento) após sincronizar uma instalação feita offline
async function posSyncInstalacao(recordId, data){
  const itemAntigo = (State.instalacoes||[]).find(i=>String(i.id)===String(recordId));
  await registrarHistorico('instalacoes', recordId, 'atualizado', 'Instalação sincronizada (preenchida offline em campo)');
  if(data.data_instalacao && !itemAntigo?.data_instalacao){
    const contrato = (State.contratos||[]).find(c=>String(c.id)===String(itemAntigo?.contrato_id));
    const nome = contrato?.nome || itemAntigo?.nome || '';
    const tel  = contrato?.telefone || itemAntigo?.telefone || '';
    const base = new Date(data.data_instalacao+'T12:00:00');
    const addD = (d) => { const dt=new Date(base); dt.setDate(dt.getDate()+d); return dt.toISOString().slice(0,10); };
    const tiposDias = [['5dias',5],['30dias',30],['90dias',90],['180dias',180],['300dias',300]];
    const agendaRows = tiposDias.map(([tipo,dias])=>({
      contrato_id: itemAntigo?.contrato_id, instalacao_id: recordId,
      cliente_nome: nome, cliente_telefone: tel,
      tipo, data_disparo: addD(dias), status:'pendente'
    }));
    await supa.from('relacionamento_agenda').insert(agendaRows);
  }
}
async function enviarParaRemarketing(item, motivo, msg){
  const lead_id = item.lead_id || null;
  if(!lead_id){ toast(msg||'Status atualizado','success'); return; }
  const { data: jaExiste } = await supa.from('remarketing')
    .select('id').eq('lead_id', lead_id).eq('status','pendente').maybeSingle();
  if(jaExiste){ toast(msg||'Status atualizado','success'); return; }
  await supa.from('remarketing').insert({
    lead_id, nome:item.nome, telefone:item.telefone,
    motivo_perda:motivo, status:'pendente', vendedor:item.vendedor, criado_por:State.user?.id
  });
  toast((msg?msg+' → ':'')+'Cliente enviado para Remarketing! ✓','success');
}

function buildTransitionPayload(item, fromStage, toStage){
  const lead_id = item.lead_id || (fromStage==='lead'?item.id:null);
  // Propaga "projeto" do lead para todas as etapas downstream
  const lead = lead_id ? (State.leads||[]).find(l=>l.id===lead_id) : null;
  const projeto = item.projeto || lead?.projeto || null;
  const base = { nome:item.nome, telefone:item.telefone, vendedor:item.vendedor, lead_id, projeto };
  if(toStage==='proposta') return { ...base, kwh:item.kwh,
    email:item.email, cep:item.cep, rua:item.rua, numero:item.numero, complemento:item.complemento,
    bairro:item.bairro, cidade:item.cidade, estado:item.estado,
    qtd_modulos:item.qtd_modulos, marca_modulo:item.marca_modulo, pot_modulo:item.pot_modulo,
    qtd_inversores:item.qtd_inversores, marca_inversor:item.marca_inversor, pot_inversor:item.pot_inversor,
    qtd_baterias:item.qtd_baterias, marca_bateria:item.marca_bateria, pot_bateria:item.pot_bateria, kwp:item.kwp,
    status:'em_aberto' };
  if(toStage==='vistoria') return {
    ...base, proposta_id:item.id, email:item.email, cep:item.cep, rua:item.rua, numero:item.numero, complemento:item.complemento,
    bairro:item.bairro, cidade:item.cidade, estado:item.estado, qtd_modulos:item.qtd_modulos, marca_modulo:item.marca_modulo,
    pot_modulo:item.pot_modulo, qtd_inversores:item.qtd_inversores, marca_inversor:item.marca_inversor, pot_inversor:item.pot_inversor,
    qtd_baterias:item.qtd_baterias, marca_bateria:item.marca_bateria, pot_bateria:item.pot_bateria, kwp:item.kwp,
    status:'aguardando_agendamento'
  };
  if(toStage==='contrato'){
    const propContrato = (State.propostas||[]).find(p=>String(p.id)===String(item.proposta_id));
    return {
      ...base, vistoria_id:item.id, proposta_id:item.proposta_id, email:item.email, cep:item.cep, rua:item.rua, numero:item.numero,
      complemento:item.complemento, bairro:item.bairro, cidade:item.cidade, estado:item.estado, gmap:item.gmap,
      qtd_modulos:item.qtd_modulos, marca_modulo:item.marca_modulo, pot_modulo:item.pot_modulo,
      qtd_inversores:item.qtd_inversores, marca_inversor:item.marca_inversor, pot_inversor:item.pot_inversor,
      qtd_baterias:item.qtd_baterias, marca_bateria:item.marca_bateria, pot_bateria:item.pot_bateria, kwp:item.kwp,
      valor: item.valor || propContrato?.valor || null,
      vend_telefone: item.vend_telefone || propContrato?.vend_telefone || null,
      vend_email:    item.vend_email    || propContrato?.vend_email    || null,
      status:'pendente'
    };
  }
  if(toStage==='logistica') return {
    ...base, contrato_id:item.id, proposta_id:item.proposta_id||null, vistoria_id:item.vistoria_id||null,
    kwp:item.kwp, valor:item.valor, status:'aguardando'
  };
  if(toStage==='instalacao'){
    // Herda endereço do contrato para facilitar a equipe técnica
    const contrato = (State.contratos||[]).find(c=>String(c.id)===String(item.contrato_id));
    const endParts = [contrato?.rua, contrato?.numero?`nº ${contrato.numero}`:'', contrato?.complemento, contrato?.bairro, contrato?.cidade, contrato?.estado].filter(Boolean);
    const endereco = endParts.length ? endParts.join(', ') : (item.endereco||'');
    return {
      ...base, logistica_id:item.id, contrato_id:item.contrato_id, proposta_id:item.proposta_id||null, vistoria_id:item.vistoria_id||null,
      kwp:item.kwp, valor:item.valor, distribuidora:item.distribuidora, status:'aguardando_agendamento', endereco,
      cep:contrato?.cep||null, gmap:contrato?.gmap||null
    };
  }
  if(toStage==='homologacao') return {
    ...base, instalacao_id:item.id, contrato_id:item.contrato_id, proposta_id:item.proposta_id||null, vistoria_id:item.vistoria_id||null,
    kwp:item.kwp, etapa:'aguardando_docs'
  };
  if(toStage==='posvenda') return {
    ...base, homologacao_id:item.id, contrato_id:item.contrato_id, proposta_id:item.proposta_id||null, vistoria_id:item.vistoria_id||null,
    kwp:item.kwp, status:'ativo'
  };
  return base;
}

/* ============================================================
   HELPER — Documentos vinculados (cadeia completa do funil)
   Disponível em qualquer estágio: Proposta, Contrato, e ambos os PDFs
   ============================================================ */
function getLinkedDocs(item){
  const _f = (arr,id) => id ? (arr||[]).find(x=>String(x.id)===String(id)) : null;
  // Resolve cadeia de baixo para cima: instalação → logística → contrato
  // Isso garante que gmap e equipamentos sejam encontrados mesmo em registros antigos
  const instalacao = _f(State.instalacoes, item.instalacao_id)
                  || (() => {
                       const hom = _f(State.homologacoes, item.homologacao_id);
                       return hom ? _f(State.instalacoes, hom.instalacao_id) : null;
                     })();
  const logistica  = _f(State.logistica,  item.logistica_id)
                  || (instalacao ? _f(State.logistica,  instalacao.logistica_id) : null);
  // contrato_id direto (registros novos) ou via logistica (registros antigos)
  const contrato   = _f(State.contratos,  item.contrato_id)
                  || (logistica  ? _f(State.contratos,  logistica.contrato_id)  : null);
  const vistoria   = _f(State.vistorias,  item.vistoria_id)
                  || (contrato   ? _f(State.vistorias,  contrato.vistoria_id)   : null);
  const proposta   = _f(State.propostas,  item.proposta_id)
                  || (contrato   ? _f(State.propostas,  contrato.proposta_id)   : null)
                  || (vistoria   ? _f(State.propostas,  vistoria.proposta_id)   : null);
  return { proposta, vistoria, contrato, logistica, instalacao };
}

/* Mescla o registro atual com dados das etapas anteriores da cadeia.
   Campos já preenchidos no item têm prioridade; campos vazios são
   preenchidos com o valor mais recente encontrado nas etapas anteriores.
   Chamado no início de cada modal para evitar repreenchimento manual. */
function mergeChain(item) {
  if (!item || typeof item !== 'object') return item || {};
  const linked = getLinkedDocs(item);
  const lead_id = item.lead_id
    || linked.proposta?.lead_id
    || linked.vistoria?.lead_id
    || linked.contrato?.lead_id;
  const lead = (State.leads||[]).find(l => String(l.id) === String(lead_id));

  // Cadeia do mais antigo para o mais recente; item (etapa atual) tem maior prioridade
  const sources = [lead, linked.proposta, linked.vistoria, linked.contrato, linked.logistica, item].filter(Boolean);

  const FIELDS = [
    'nome','telefone','email','vendedor','cpf','nascimento','rg','rg_orgao',
    'cep','rua','numero','complemento','bairro','cidade','estado','gmap','kwh','kwp',
    'qtd_modulos','marca_modulo','pot_modulo',
    'qtd_inversores','marca_inversor','pot_inversor',
    'qtd_baterias','marca_bateria','pot_bateria',
    'concessionaria','profissao','estado_civil','projeto',
  ];

  const result = { ...item };
  for (const field of FIELDS) {
    if (result[field] == null || result[field] === '') {
      // Busca da etapa mais recente para a mais antiga (excluindo o próprio item)
      for (let i = sources.length - 2; i >= 0; i--) {
        const v = sources[i]?.[field];
        if (v != null && v !== '') { result[field] = v; break; }
      }
    }
  }
  return result;
}

/* Igual a getLinkedDocs, mas com fallback por nome do cliente — usado no
   Pós Venda para clientes importados sem cadeia de FKs, evitando que o
   sistema deixe de detectar registros já existentes (e crie duplicados). */
function getLinkedDocsByNome(item){
  const base = getLinkedDocs(item);
  const nome = (item.nome||'').toLowerCase().trim();
  if(!nome) return base;
  const byNome = (arr) => (arr||[]).find(x=>(x.nome||'').toLowerCase().trim()===nome) || null;
  return {
    proposta:   base.proposta   || byNome(State.propostas),
    vistoria:   base.vistoria   || byNome(State.vistorias),
    contrato:   base.contrato   || byNome(State.contratos),
    logistica:  base.logistica  || byNome(State.logistica),
    instalacao: base.instalacao || byNome(State.instalacoes),
  };
}

/* Renderiza barra de documentos vinculados dentro do modal-body.
   Cada doc: [✏️ Editar X]  +  [🖨️ PDF] (quando disponível). */
function renderLinkedDocBtns(linked){
  const { proposta, vistoria, contrato, logistica, instalacao, homologacao } = linked;
  const role = userRole();
  const all = [];
  if(proposta)  all.push({icon:'📄', label:'Proposta',   editId:'lnkPropEditBtn',  pdfId:'lnkPropDlBtn',  allowed:['admin','supervisor','vendedor','financeiro']});
  if(vistoria)  all.push({icon:'🔍', label:'Vistoria',   editId:'lnkVistEditBtn',  pdfId:'lnkVistDlBtn',  allowed:['admin','supervisor','vendedor','financeiro','tec_vistoria']});
  if(contrato)  all.push({icon:'✍️', label:'Contrato',   editId:'lnkContEditBtn',  pdfId:'lnkContDlBtn',  allowed:['admin','supervisor','vendedor','financeiro']});
  if(logistica) all.push({icon:'📦', label:'Logística',  editId:'lnkLogEditBtn',   pdfId:null,            allowed:['admin','supervisor','vendedor','financeiro','tec_instalacao']});
  if(instalacao)all.push({icon:'🔧', label:'Instalação', editId:'lnkInstEditBtn',  pdfId:null,            allowed:['admin','supervisor','vendedor','financeiro','tec_instalacao','tec_homologacao']});
  if(homologacao)all.push({icon:'⚡', label:'Homologação',editId:'lnkHomEditBtn',  pdfId:null,            allowed:['admin','supervisor','vendedor','financeiro','tec_homologacao']});
  const items = all.filter(it => !it.allowed || it.allowed.includes(role));
  if(!items.length) return '';
  return `
    <div class="linked-docs-bar">
      <span class="linked-docs-label">🔗 Vincular:</span>
      ${items.map(it=>`
        <div class="btn-group">
          <button type="button" class="btn btn-secondary btn-sm" id="${it.editId}">✏️ ${it.icon} ${it.label}</button>
          ${it.pdfId?`<button type="button" class="btn btn-secondary btn-sm" id="${it.pdfId}" title="Imprimir / PDF">🖨️</button>`:''}
        </div>`).join('')}
    </div>`;
}

function attachLinkedDocListeners(linked){
  const { proposta, vistoria, contrato, logistica, instalacao, homologacao } = linked;
  if(proposta){
    $('#lnkPropEditBtn')?.addEventListener('click', ()=>{ closeModal(); openPropostaModal(proposta); });
    $('#lnkPropDlBtn')?.addEventListener('click',   ()=> abrirPropostaJanela(proposta, true));
  }
  if(vistoria){
    $('#lnkVistEditBtn')?.addEventListener('click', ()=>{ closeModal(); openVistoriaModal(vistoria); });
    $('#lnkVistDlBtn')?.addEventListener('click',   ()=> abrirVistoriaJanela(vistoria, true));
  }
  if(contrato){
    $('#lnkContEditBtn')?.addEventListener('click', ()=>{ closeModal(); openContratoModal(contrato); });
    $('#lnkContDlBtn')?.addEventListener('click',   ()=> abrirContratoJanela(contrato, true));
  }
  if(logistica){
    $('#lnkLogEditBtn')?.addEventListener('click',  ()=>{ closeModal(); openLogisticaModal(logistica); });
  }
  if(instalacao){
    $('#lnkInstEditBtn')?.addEventListener('click', ()=>{ closeModal(); openInstalacaoModal(instalacao); });
  }
  if(homologacao){
    $('#lnkHomEditBtn')?.addEventListener('click', ()=>{ closeModal(); openHomologacaoModal(homologacao); });
  }
}

function openStageModal(stage,id){
  const cfg = STAGES.find(s=>s.id===stage);
  const item = (State[cfg.dataKey]||[]).find(x=>String(x.id)===String(id));
  if(!item) return;

  // tec_vistoria: só pode editar o modal de vistoria.
  if(userRole() === 'tec_vistoria' && stage !== 'vistoria'){
    const linked = getLinkedDocs(item);
    const vistoria = linked.vistoria
      || (State.vistorias||[]).find(v=>String(v.id)===String(item.vistoria_id));
    if(vistoria) openVistoriaModal(vistoria);
    else toast('Vistoria vinculada não encontrada.','warn');
    return;
  }

  // tec_vistoria_instalacao: pode editar vistoria e instalação.
  if(userRole() === 'tec_vistoria_instalacao' && !['vistoria','instalacao'].includes(stage)){
    const linked = getLinkedDocs(item);
    const vistoria  = linked.vistoria  || (State.vistorias||[]).find(v=>String(v.id)===String(item.vistoria_id));
    const instalacao= linked.instalacao|| (State.instalacoes||[]).find(i=>String(i.id)===String(item.instalacao_id));
    if(vistoria)   { openVistoriaModal(vistoria);   return; }
    if(instalacao) { openInstalacaoModal(instalacao); return; }
    toast('Modal vinculado não encontrado.','warn');
    return;
  }

  // tec_instalacao: só pode editar o modal de instalação.
  if(userRole() === 'tec_instalacao' && stage !== 'instalacao'){
    const linked = getLinkedDocs(item);
    const instalacao = linked.instalacao
      || (State.instalacoes||[]).find(i=>String(i.id)===String(item.instalacao_id));
    if(instalacao) openInstalacaoModal(instalacao);
    else toast('Instalação vinculada não encontrada.','warn');
    return;
  }

  switch(stage){
    case 'lead': openLeadModal(item); break;
    case 'proposta': openPropostaModal(item); break;
    case 'vistoria': openVistoriaModal(item); break;
    case 'contrato': openContratoModal(item); break;
    case 'logistica': openLogisticaModal(item); break;
    case 'instalacao': openInstalacaoModal(item); break;
    case 'homologacao': openHomologacaoModal(item); break;
    case 'posvenda':     openPosVendaModal(item); break;
    case 'atendimentos': openAtendimentoModal(item); break;
    case 'appman': openAppManModal(item); break;
  }
}

/* ============================================================
   MODAL UTILS
   ============================================================ */
function openModal(html, size=''){
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal ${size}">${html}</div>`;
  root.classList.add('active');
  $$('.modal-close',root).forEach(b=>b.addEventListener('click', closeModal));
  $$('.section-header',root).forEach(h=>{
    h.addEventListener('click', ()=> h.parentElement.classList.toggle('collapsed'));
  });
  // Evita duplo-clique / duplo-envio: bloqueia um segundo submit do mesmo
  // formulário dentro de 2s e desabilita o botão de salvar nesse intervalo.
  // Roda antes dos listeners de submit específicos de cada modal, pois é
  // registrado primeiro (mesma ordem de execução na mesma fase do evento).
  $$('form', root).forEach(form=>{
    form.addEventListener('submit', (e)=>{
      if(form._submitting){ e.preventDefault(); e.stopImmediatePropagation(); return; }
      form._submitting = true;
      const btn = form.querySelector('button[type="submit"]');
      if(btn) btn.disabled = true;
      setTimeout(()=>{ form._submitting = false; if(btn) btn.disabled = false; }, 10000);
    });
  });
  return root;
}
function closeModal(){
  const root = $('#modalRoot');
  $$('form', root).forEach(form=>{ form._submitting = false; });
  root.classList.remove('active');
  root.innerHTML='';
}
$('#modalRoot').addEventListener('click', e=>{ if(e.target.id==='modalRoot') closeModal(); });

/* ============================================================
   CPF / CNPJ / CEP UTILITIES
   ============================================================ */
function validarCPF(v){
  const c=v.replace(/\D/g,'');
  if(c.length!==11||/^(\d)\1{10}$/.test(c))return false;
  let s=0; for(let i=0;i<9;i++) s+=+c[i]*(10-i);
  let r=s%11; const d1=r<2?0:11-r;
  if(+c[9]!==d1) return false;
  s=0; for(let i=0;i<10;i++) s+=+c[i]*(11-i);
  r=s%11; const d2=r<2?0:11-r;
  return +c[10]===d2;
}
function validarCNPJ(v){
  const c=v.replace(/\D/g,'');
  if(c.length!==14||/^(\d)\1{13}$/.test(c))return false;
  const calc=(c,n)=>{let s=0,p=n-7;for(let i=0;i<n;i++){s+=+c[i]*p--;if(p<2)p=9;}const r=s%11;return r<2?0:11-r;};
  return +c[12]===calc(c,12)&&+c[13]===calc(c,13);
}
function attachCPF(formEl){
  const cpfFields = ['cpf','vend_cpf','supervisor_cpf'];
  cpfFields.forEach(fname=>{
    const el = formEl?.querySelector?.(`[name="${fname}"]`);
    if(!el) return;
    el.placeholder='000.000.000-00';
    el.addEventListener('input', ()=>{
      const v=el.value.replace(/\D/g,'');
      if(!v){el.style.borderColor='';el.title='';return;}
      if(v.length<11){el.style.borderColor='';return;}
      const ok=validarCPF(v);
      el.style.borderColor=ok?'#22c55e':'#ef4444';
      el.title=ok?'CPF válido ✓':'CPF inválido ✗';
    });
  });
}
async function lookupCEP(cep, formEl){
  const digits=cep.replace(/\D/g,'');
  if(digits.length!==8) return;
  try{
    const r=await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const d=await r.json();
    if(d.erro) return;
    const set=(name,val)=>{
      const el=formEl?.elements?.[name]||formEl?.querySelector?.(`[name="${name}"]`);
      if(el && !el.value && val) el.value=val;
    };
    set('rua', d.logradouro);
    set('bairro', d.bairro);
    set('cidade', d.localidade);
    const estado=formEl?.elements?.estado||formEl?.querySelector?.('[name="estado"]');
    if(estado && d.uf) estado.value=d.uf;
  }catch(e){}
}
function attachCEP(formEl){
  const el=formEl?.elements?.cep||formEl?.querySelector?.('[name="cep"]');
  if(!el) return;
  el.placeholder='00000-000';
  el.addEventListener('blur', ()=> lookupCEP(el.value, formEl));
}

function formField({label,name,type='text',value='',options=null,required=false,readonly=false,rows=null,full=false,placeholder='',datalist=null}){
  const v = value==null?'':value;
  const dlId = datalist ? 'dl_'+name+'_'+Math.random().toString(36).slice(2,7) : null;
  const dlHtml = datalist ? `<datalist id="${dlId}">${datalist.map(o=>`<option value="${esc(String(o))}">`).join('')}</datalist>` : '';
  let inp;
  if(type==='multicheck'){
    const vals = Array.isArray(v) ? v : (v ? [v] : []);
    inp = `<div class="multicheck-group" data-multicheck="${esc(name)}">
      ${(options||[]).filter(o=>o[0]).map(([val,text])=>`<label class="multicheck-pill"><input type="checkbox" value="${esc(val)}"${vals.includes(String(val))?'checked':''}><span>${esc(text)}</span></label>`).join('')}
    </div>`;
    return `<div class="form-group ${full?'full':''}"><label>${esc(label)}${required?' *':''}</label>${inp}</div>`;
  } else if(type==='select'){
    inp = `<select name="${name}" ${required?'required':''}>${options.map(o=>{
      const [val,text] = Array.isArray(o)?o:[o,o];
      return `<option value="${esc(val)}" ${String(val)===String(v)?'selected':''}>${esc(text)}</option>`;
    }).join('')}</select>`;
  } else if(type==='textarea'){
    inp = `<textarea name="${name}" rows="${rows||3}" placeholder="${esc(placeholder)}">${esc(v)}</textarea>`;
  } else if(type==='toggle'){
    inp = `<label class="toggle"><input type="checkbox" name="${name}" ${v?'checked':''}/><span>${esc(label)}</span></label>`;
    return `<div class="form-group ${full?'full':''}">${inp}</div>`;
  } else if(type==='number'){
    // Usa text+inputmode para aceitar vírgula decimal (padrão BR)
    inp = `<input type="text" inputmode="decimal" name="${name}" value="${esc(fmtInputNum(v))}" placeholder="${esc(placeholder||'0')}" data-numtype="1" ${datalist?`list="${dlId}"`:''}  ${required?'required':''} ${readonly?'readonly':''}/>`;
  } else {
    const dateAttrs = type==='date' ? 'min="1900-01-01" max="2100-12-31"' : '';
    inp = `<input type="${type}" name="${name}" value="${esc(v)}" placeholder="${esc(placeholder)}" ${dateAttrs} ${datalist?`list="${dlId}"`:''}  ${required?'required':''} ${readonly?'readonly':''}/>`;
  }
  return `<div class="form-group ${full?'full':''}"><label>${esc(label)}${required?' *':''}</label>${inp}${dlHtml}</div>`;
}

function readForm(formEl){
  const data = {};
  const badDates = [];
  $$('input,select,textarea',formEl).forEach(el=>{
    if(!el.name) return;
    if(el.type==='checkbox'){
      data[el.name] = el.checked;
    } else if(el.dataset.numtype){
      data[el.name] = parseBR(el.value); // converte "1.500,50" → 1500.5
    } else if(el.type==='date'){
      if(!el.value){ data[el.name] = null; return; }
      const m = el.value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const yr = m ? +m[1] : 0;
      if(!m || yr < 1900 || yr > 2100){
        badDates.push(el.labels?.[0]?.textContent || el.name);
        data[el.name] = null;
      } else {
        data[el.name] = el.value;
      }
    } else {
      data[el.name] = el.value === '' ? null : el.value;
    }
  });
  if(badDates.length) toast(`Data inválida em: ${badDates.join(', ')} — verifique o ano digitado.`,'error', 5000);
  // Coleta grupos multicheck como arrays
  $$('[data-multicheck]', formEl).forEach(div=>{
    const fname = div.dataset.multicheck;
    const checked = Array.from(div.querySelectorAll('input[type=checkbox]:checked')).map(cb=>cb.value);
    data[fname] = checked.length > 0 ? checked : null;
  });
  return data;
}

/* ============================================================
   HISTÓRICO DE ALTERAÇÕES
   ============================================================ */

// Detecta campos que mudaram entre o objeto antigo e o novo
function detectMudancas(antes, depois, campos){
  return campos.map(([key, label, mapFn])=>{
    const va = String(antes[key]??'');
    const vd = String(depois[key]??'');
    if(va === vd) return null;
    const fmt = v => mapFn ? (mapFn(v)||v||'—') : (v||'—');
    return `${label}: ${fmt(antes[key])} → ${fmt(depois[key])}`;
  }).filter(Boolean);
}

async function registrarHistorico(tabela, registroId, acao, descricao){
  if(!registroId) return;
  try{
    const perfil = (State.perfis||[]).find(p=>p.user_id===State.user?.id);
    const nomeUsuario = perfil?.nome || State.user?.email || 'Sistema';
    const { error } = await supa.from('historico').insert({
      tabela,
      registro_id: String(registroId),
      usuario_id: State.user?.id || null,
      usuario_nome: nomeUsuario,
      acao,
      descricao
    });
    if(error) console.error('[Histórico] Falha ao gravar:', error.message, error);
  }catch(e){ console.error('[Histórico] Exceção:', e); }
}

// Carrega e renderiza o histórico num elemento DOM
async function carregarHistorico(el, tabela, registroId){
  if(!el || !registroId) return;
  const { data, error } = await supa.from('historico')
    .select('*').eq('tabela', tabela).eq('registro_id', String(registroId))
    .order('criado_em', { ascending: false }).limit(60);
  if(error){
    console.error('[Histórico] Falha ao carregar:', error.message, error);
    el.innerHTML = `<div class="hist-empty" style="color:#dc2626;font-size:11px">
      ⚠️ Erro ao carregar histórico — verifique o console (F12).<br>
      <small>${error.message}</small>
    </div>`;
    return;
  }
  const icons = {criado:'🆕', atualizado:'✏️', status:'🔄', etapa:'🔖',
                 avancou:'➡️', aprovado:'✅', reprovado:'❌'};
  const fmtDT = ts => new Date(ts).toLocaleString('pt-BR',{
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
  if(!data?.length){
    el.innerHTML = '<div class="hist-empty">Nenhuma alteração registrada ainda.</div>';
    return;
  }
  el.innerHTML = data.map(h=>`
    <div class="hist-item">
      <div class="hist-icon">${icons[h.acao]||'📝'}</div>
      <div class="hist-body">
        <div class="hist-desc">${esc(h.descricao)}</div>
        <div class="hist-meta"><strong>${esc(h.usuario_nome||'Sistema')}</strong> · ${fmtDT(h.criado_em)}</div>
      </div>
    </div>`).join('');
}

// Retorna o HTML da seção de histórico (para incluir no modal)
function histSection(){
  return `<div class="section collapsed" id="histSection">
    <div class="section-header"><h4>📋 Histórico de Alterações</h4><span class="section-toggle">▼</span></div>
    <div class="section-body"><div class="hist-list" id="histList">
      <div class="hist-empty">Carregando…</div>
    </div></div>
  </div>`;
}

/* ============================================================
   LEAD MODAL
   ============================================================ */
function openLeadModal(item=null){
  const isNew = !item;
  item = item || {};
  const canalOpts = [['','— selecione —'],['PAP','PAP'],['Network','Network'],['Captação','Captação'],['Indicação','Indicação'],['Tráfego pago','Tráfego pago'],['Redes sociais','Redes sociais']];
  const statusOpts = [['em_contato','Em contato'],['proposta','Proposta'],['perdido','Perdido']];
  const motivoOpts = [['','— selecione —'],['sem_interesse','Sem interesse'],['sem_credito','Sem crédito'],['concorrente','Concorrente'],['sem_resposta','Sem resposta'],['vistoria_reprovada','Vistoria reprovada'],['oportunidade_futura','Oportunidade futura']];

  openModal(`
    <div class="modal-header">
      <h2>${isNew?'Novo Lead':'Editar Lead'}</h2>
      <button class="modal-close">×</button>
    </div>
    <form id="leadForm" autocomplete="off">
      <div class="modal-body">
        <div class="form-grid">
          ${formField({label:'Nome',name:'nome',value:item.nome,required:true})}
          ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
          ${formField({label:'Projeto',name:'projeto',value:item.projeto,placeholder:'ex: Residencial, Expansão, Comercial...'})}
          ${formField({label:'kWh',name:'kwh',type:'number',value:item.kwh})}
          ${formField({label:'Canal',name:'canal',type:'select',value:item.canal,options:canalOpts})}
          ${formField({label:'Vendedor',name:'vendedor',type:'select',value:item.vendedor||(isVend()?State.profile.nome:''),options:[['','— selecione —'],...(State.perfis||[]).filter(p=>p.ativo!==false&&['vendedor','supervisor','admin'].includes(p.perfil)&&p.nome).map(p=>[p.nome,p.nome])]})}
          ${formField({label:'Captador',name:'captador',value:item.captador})}
          ${formField({label:'SDR',name:'sdr',value:item.sdr})}
          ${formField({label:'Nascimento',name:'nascimento',type:'date',value:item.nascimento})}
          ${formField({label:'Status',name:'status',type:'select',value:item.status||'em_contato',options:statusOpts})}
        </div>
        <div class="form-grid" style="margin-top:14px">
          <div id="motivoWrap" style="display:${item.status==='perdido'?'block':'none'}">${formField({label:'Motivo da perda',name:'motivo_perda',type:'select',value:item.motivo_perda,options:motivoOpts})}</div>
          <div id="reatWrap" style="display:${item.status==='perdido'?'block':'none'}">${formField({label:'Data reativação',name:'data_reativacao',type:'date',value:item.data_reativacao})}</div>
        </div>
        <div class="form-grid" style="margin-top:14px">
          ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
        </div>
        ${!isNew ? renderContactLog(item.id,'lead') : ''}
        ${!isNew ? histSection() : ''}
      </div>
      <div class="modal-footer">
        ${!isNew?`<button type="button" class="btn btn-danger" id="delLeadBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'lg');

  const form = $('#leadForm');
  form.elements.status.addEventListener('change', e=>{
    const show = e.target.value==='perdido';
    $('#motivoWrap').style.display = show?'block':'none';
    $('#reatWrap').style.display = show?'block':'none';
  });

  // Autocomplete de cliente existente no campo Nome (apenas novo lead)
  if(isNew){
    const nomeInput = form.elements.nome;
    // Coleta todos os clientes conhecidos de todas as etapas
    const todosClientes = [
      ...(State.leads||[]),
      ...(State.propostas||[]),
      ...(State.vistorias||[]),
      ...(State.contratos||[]),
      ...(State.logistica||[]),
      ...(State.instalacoes||[]),
      ...(State.homologacoes||[]),
      ...(State.posvenda||[]),
    ].reduce((map, c) => {
      const n = (c.nome||'').trim();
      if(n && !map.has(n.toLowerCase())) map.set(n.toLowerCase(), c);
      return map;
    }, new Map());

    // Cria dropdown de sugestões
    const suggest = document.createElement('div');
    suggest.style.cssText = 'position:absolute;background:#fff;border:1px solid #d1d5db;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);z-index:9999;width:100%;max-height:200px;overflow-y:auto;display:none';
    nomeInput.parentElement.style.position = 'relative';
    nomeInput.parentElement.appendChild(suggest);

    nomeInput.addEventListener('input', ()=>{
      const q = nomeInput.value.trim().toLowerCase();
      suggest.innerHTML = '';
      if(q.length < 2){ suggest.style.display='none'; return; }
      const matches = [...todosClientes.values()].filter(c=>(c.nome||'').toLowerCase().includes(q)).slice(0,8);
      if(!matches.length){ suggest.style.display='none'; return; }
      matches.forEach(c=>{
        const div = document.createElement('div');
        div.style.cssText = 'padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid #f3f4f6';
        div.innerHTML = `<strong>${esc(c.nome)}</strong>${c.telefone?` <span style="color:#6b7280;font-size:12px">· ${esc(c.telefone)}</span>`:''}`;
        div.addEventListener('mousedown', e=>{ e.preventDefault();
          nomeInput.value = c.nome;
          if(c.telefone && !form.elements.telefone.value) form.elements.telefone.value = c.telefone;
          if(c.nascimento && !form.elements.nascimento.value) form.elements.nascimento.value = c.nascimento;
          if(c.canal && !form.elements.canal.value) form.elements.canal.value = c.canal;
          suggest.style.display='none';
        });
        suggest.appendChild(div);
      });
      suggest.style.display = 'block';
    });
    nomeInput.addEventListener('blur', ()=> setTimeout(()=>suggest.style.display='none', 150));
  }

  if(!isNew) carregarHistorico($('#histList'), 'leads', item.id);

  const statusLeadMap = {em_contato:'Em contato', proposta:'Proposta', perdido:'Perdido'};
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    data.kwh = data.kwh!=null ? Number(data.kwh) : null;
    // Motivo de perda obrigatório
    if(data.status==='perdido' && !data.motivo_perda){
      toast('Informe o motivo da perda antes de salvar.','error');
      form.elements.motivo_perda?.focus();
      return;
    }
    if(isNew){
      data.criado_por = State.user?.id;
      const { data: leadCriado, error } = await supa.from('leads').insert(data).select('id').single();
      if(error) return toast(error.message,'error');
      await registrarHistorico('leads', leadCriado.id, 'criado', `Lead criado: ${data.nome}`);
      // Lead criado já como "proposta" → cria proposta automaticamente
      if(data.status === 'proposta'){
        const pPayload = buildTransitionPayload({...data, id:leadCriado.id}, 'lead', 'proposta');
        pPayload.criado_por = State.user?.id;
        await supa.from('propostas').insert(pPayload);
        toast('Lead criado → Proposta criada automaticamente! ✓','success');
      } else { toast('Lead criado!','success'); }
    } else {
      const prevStatus = item.status;
      data.atualizado_em = new Date().toISOString();
      const { error } = await supa.from('leads').update(data).eq('id',item.id);
      if(error) return toast(error.message,'error');
      const mud = detectMudancas(item, data, [
        ['status','Status', v=>statusLeadMap[v]||v],
        ['vendedor','Vendedor',null], ['canal','Canal',null],
      ]);
      const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
      await registrarHistorico('leads', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');
      if(data.status==='perdido' && prevStatus!=='perdido'){
        await supa.from('remarketing').insert({
          lead_id:item.id, nome:data.nome, telefone:data.telefone,
          motivo_perda:data.motivo_perda, data_reativacao:data.data_reativacao,
          status:'pendente', vendedor:data.vendedor, criado_por:State.user?.id
        });
        toast('Lead perdido → Remarketing criado! ✓','success');
      } else if(data.status==='proposta' && prevStatus!=='proposta'){
        // Lead atualizado para "proposta" → cria proposta automaticamente
        const jaExiste = (State.propostas||[]).find(p => p.lead_id === item.id);
        if(!jaExiste){
          const pPayload = buildTransitionPayload({...item,...data}, 'lead', 'proposta');
          pPayload.criado_por = State.user?.id;
          const { error: pe } = await supa.from('propostas').insert(pPayload);
          if(pe) toast('Lead atualizado, mas erro ao criar proposta: '+pe.message,'error');
          else toast('Lead → Proposta criada automaticamente! ✓','success');
        } else { toast('Lead atualizado!','success'); }
      } else {
        toast('Lead atualizado!','success');
      }
    }
    closeModal();
    if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
  });

  $('#delLeadBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir este lead?')) return;
    const { error } = await supa.from('leads').delete().eq('id',item.id);
    if(error) return toast(error.message,'error');
    toast('Lead excluído','success'); closeModal();
    if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
  });

  if(!isNew) attachContactLog(item.id,'lead');
}

