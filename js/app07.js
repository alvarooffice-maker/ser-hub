/* ============================================================
   CALENDÁRIO
   ============================================================ */
const CAL_FILTERS = [
  { key:'aniversario',  label:'🎂 Aniversários',       cls:'fc-aniversario'  },
  { key:'instalacao',   label:'🔧 Instalações',         cls:'fc-instalacao'   },
  { key:'entrega',      label:'📦 Entregas',             cls:'fc-entrega'      },
  { key:'vistoria',     label:'🔍 Vistorias',            cls:'fc-vistoria'     },
  { key:'homologacao',  label:'⏳ Prazo Homologação',   cls:'fc-homologacao'  },
  { key:'manutencao',   label:'🛡️ Manutenção',          cls:'fc-manutencao'   },
  { key:'acolhimento',  label:'🤝 Acolhimento',          cls:'fc-acolhimento'  },
  { key:'gratidao',     label:'💛 Gratidão',             cls:'fc-gratidao'     },
  { key:'embaixador',   label:'🌟 Embaixador',           cls:'fc-embaixador'   },
  { key:'renovacao',    label:'🔄 Renovação App',        cls:'fc-renovacao'    },
  { key:'reservico',    label:'🛠️ Re-Serviço',           cls:'fc-reservico'    },
];

let _calState = {
  view: 'month',   // 'month' | 'week'
  anchor: null,    // Date — 1st day of current period
  filters: Object.fromEntries(CAL_FILTERS.map(f=>[f.key, true]))
};

function calAddDays(dateStr, n){
  if(!dateStr) return null;
  const d = new Date(dateStr+'T12:00:00');
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}

function calIsoDate(d){ return d.toISOString().slice(0,10); }

function collectCalEvents(from, to){
  const events = []; // {date, label, type, item, modal}
  const s = _calState.filters;
  const inRange = dt => dt && dt >= from && dt <= to;

  // helper: posvenda linked chain
  const findInst = pv => {
    const hom = (State.homologacoes||[]).find(h=>h.id===pv.homologacao_id);
    return hom ? (State.instalacoes||[]).find(i=>i.id===hom.instalacao_id) : null;
  };
  const findLead = pv => (State.leads||[]).find(l=>l.id===pv.lead_id);

  // 1. ANIVERSÁRIOS — leads.nascimento (recorrente anual)
  if(s.aniversario){
    const fromD = new Date(from+'T12:00:00');
    const toD   = new Date(to+'T12:00:00');
    (State.leads||[]).forEach(lead=>{
      if(!lead.nascimento) return;
      const bday = new Date(lead.nascimento+'T12:00:00');
      // tenta os anos do intervalo
      for(let yr = fromD.getFullYear(); yr <= toD.getFullYear()+1; yr++){
        const candidate = new Date(yr, bday.getMonth(), bday.getDate());
        const iso = calIsoDate(candidate);
        if(iso >= from && iso <= to){
          events.push({date:iso, label:`🎂 ${lead.nome||'—'}`, type:'aniversario', item:lead, modal:'lead'});
        }
      }
    });
  }

  // 2. INSTALAÇÕES — oculta se já concluída ou cancelada
  if(s.instalacao){
    (State.instalacoes||[]).forEach(i=>{
      if(!inRange(i.data_instalacao)) return;
      if(['concluida','cancelada'].includes(i.status)) return;
      events.push({date:i.data_instalacao, label:`🔧 ${i.nome||'—'}`, type:'instalacao', item:i, nome:i.nome});
    });
  }

  // 3. ENTREGAS — oculta se já entregue ou cancelada
  if(s.entrega){
    (State.logistica||[]).forEach(l=>{
      if(!inRange(l.data_prevista_entrega)) return;
      if(['entregue','cancelada','cancelado'].includes(l.status)) return;
      events.push({date:l.data_prevista_entrega, label:`📦 ${l.nome||'—'}`, type:'entrega', item:l, nome:l.nome});
    });
  }

  // 4. VISTORIAS — oculta se já realizada ou cancelada
  if(s.vistoria){
    (State.vistorias||[]).forEach(v=>{
      if(!inRange(v.data_agendamento)) return;
      if(['realizada','cancelada'].includes(v.status) || ['realizada','aprovada'].includes(v.resultado)) return;
      events.push({date:v.data_agendamento, label:`🔍 ${v.nome||'—'}`, type:'vistoria', item:v, nome:v.nome});
    });
  }

  // 5. PRAZO HOMOLOGAÇÃO — oculta se homologação já aprovada ou concluída
  if(s.homologacao){
    (State.homologacoes||[]).forEach(hom=>{
      if(/aprovada|concluida|conclu/.test(hom.etapa||'')) return;
      const inst = (State.instalacoes||[]).find(i=>i.id===hom.instalacao_id);
      const log  = inst ? (State.logistica||[]).find(l=>l.id===inst.logistica_id) : null;
      const cont = log  ? (State.contratos||[]).find(c=>c.id===log.contrato_id)   : null;
      const dt = cont?.data_assinatura ? calAddDays(cont.data_assinatura, 90) : null;
      if(!inRange(dt)) return;
      events.push({date:dt, label:`⏳ Hom. ${hom.nome||cont?.nome||'—'}`, type:'homologacao', item:hom, nome:hom.nome||cont?.nome});
    });
  }

  // 6-9. PÓS-VENDA — oculta flags se posvenda inativo/cancelado
  (State.posvenda||[]).forEach(pv=>{
    if(pv.status === 'inativo') return;
    const inst = findInst(pv);
    const instDate = inst?.data_instalacao;
    if(s.manutencao){
      const dt = calAddDays(instDate, 300);
      if(inRange(dt)) events.push({date:dt, label:`🛡️ ${pv.nome||'—'}`, type:'manutencao', item:pv, nome:pv.nome});
    }
    if(s.acolhimento){
      const dt = calAddDays(instDate, 5);
      if(inRange(dt)) events.push({date:dt, label:`🤝 ${pv.nome||'—'}`, type:'acolhimento', item:pv, nome:pv.nome});
    }
    if(s.gratidao){
      const dt = calAddDays(instDate, 30);
      if(inRange(dt)) events.push({date:dt, label:`💛 ${pv.nome||'—'}`, type:'gratidao', item:pv, nome:pv.nome});
    }
    if(s.embaixador){
      const dt = calAddDays(instDate, 90);
      if(inRange(dt)) events.push({date:dt, label:`🌟 ${pv.nome||'—'}`, type:'embaixador', item:pv, nome:pv.nome});
    }
  });

  // 10. RENOVAÇÃO APP — oculta se concluído ou cancelado
  if(s.renovacao){
    (State.appman||[]).forEach(a=>{
      if(!inRange(a.data_renovacao)) return;
      if(['concluido','cancelado'].includes(a.status)) return;
      events.push({date:a.data_renovacao, label:`🔄 ${a.nome||'—'}`, type:'renovacao', item:a, nome:a.nome});
    });
  }

  // 11. RE-SERVIÇO — oculta se concluído ou cancelado
  if(s.reservico){
    (State.atendimentos||[]).forEach(a=>{
      if(!inRange(a.data_agendamento)) return;
      if(['concluido','cancelado'].includes(a.status)) return;
      events.push({date:a.data_agendamento, label:`🛠️ ${a.nome||'—'}`, type:'reservico', item:a, nome:a.nome});
    });
  }

  events.sort((a,b)=>a.date.localeCompare(b.date));
  return events;
}

function calEventHtml(ev, limit=null){
  const eventsForDay = ev;
  const shown = limit ? eventsForDay.slice(0,limit) : eventsForDay;
  const hidden = limit ? eventsForDay.slice(limit) : [];
  let html = shown.map(e=>`<div class="cal-event ce-${e.type}" data-cal-nome="${esc(e.nome||e.item?.nome||'')}" title="${esc(e.label)}">${esc(e.label)}</div>`).join('');
  if(hidden.length) html += `<div class="cal-more">+${hidden.length} mais</div>`;
  return html;
}

function renderCalendario(){
  const content = $('#content');
  if(!_calState.anchor){
    const now = new Date();
    _calState.anchor = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  content.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  loadAll().then(()=>{
    content.innerHTML = buildCalHTML();
    attachCalEvents();
  });
}

function buildCalHTML(){
  const { view, anchor, filters } = _calState;
  const today = calIsoDate(new Date());

  // Period label
  const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  let periodLabel, from, to, cells;

  if(view === 'month'){
    periodLabel = `${MESES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    from = calIsoDate(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    to   = calIsoDate(new Date(anchor.getFullYear(), anchor.getMonth()+1, 0));
    // pad to full weeks
    const firstCell = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    firstCell.setDate(firstCell.getDate() - firstCell.getDay());
    const lastCell  = new Date(anchor.getFullYear(), anchor.getMonth()+1, 0);
    lastCell.setDate(lastCell.getDate() + (6 - lastCell.getDay()));
    const fromExt = calIsoDate(firstCell);
    const toExt   = calIsoDate(lastCell);
    const events  = collectCalEvents(fromExt, toExt);
    const evByDay = {};
    events.forEach(e=>{ (evByDay[e.date]||(evByDay[e.date]=[])).push(e); });

    let gridHtml = DIAS.map(d=>`<div class="cal-dow">${d}</div>`).join('');
    let cur = new Date(firstCell);
    while(calIsoDate(cur) <= toExt){
      const iso = calIsoDate(cur);
      const isToday = iso === today;
      const isOther = cur.getMonth() !== anchor.getMonth();
      const dayEvs  = evByDay[iso]||[];
      gridHtml += `<div class="cal-cell${isToday?' today':''}${isOther?' other-month':''}">
        <div class="cal-day-num">${cur.getDate()}</div>
        ${calEventHtml(dayEvs, 3)}
      </div>`;
      cur.setDate(cur.getDate()+1);
    }
    cells = `<div class="cal-grid-month">${gridHtml}</div>`;

  } else {
    // WEEK view — anchor is always Mon of current week
    const mon = new Date(anchor);
    const sun = new Date(mon); sun.setDate(sun.getDate()+6);
    from = calIsoDate(mon); to = calIsoDate(sun);
    const startM = mon.getMonth(); const startY = mon.getFullYear();
    const endM   = sun.getMonth(); const endY   = sun.getFullYear();
    if(startM === endM) periodLabel = `${startY === endY ? '' : startY+' · '}${MESES[startM]} ${startY}`;
    else periodLabel = `${MESES[startM]}${startY!==endY?' '+startY:''} – ${MESES[endM]} ${endY}`;

    const events  = collectCalEvents(from, to);
    const evByDay = {};
    events.forEach(e=>{ (evByDay[e.date]||(evByDay[e.date]=[])).push(e); });

    let cols = '';
    for(let i=0;i<7;i++){
      const d = new Date(mon); d.setDate(d.getDate()+i);
      const iso = calIsoDate(d);
      const isToday = iso === today;
      const dayEvs  = evByDay[iso]||[];
      cols += `<div class="cal-week-col${isToday?' today':''}">
        <div class="cal-week-header">
          <div class="cal-week-dow">${DIAS[d.getDay()]}</div>
          <div class="cal-week-date">${d.getDate()}</div>
        </div>
        ${calEventHtml(dayEvs)}
      </div>`;
    }
    cells = `<div class="cal-grid-week">${cols}</div>`;
  }

  const filterChips = CAL_FILTERS.map(f=>`
    <span class="cal-filter-chip ${f.cls}${filters[f.key]?' on':''}" data-cal-filter="${f.key}">${f.label}</span>
  `).join('');

  return `
    <div class="cal-toolbar">
      <div class="cal-nav">
        <button id="calPrev">◀</button>
        <span class="cal-period">${esc(periodLabel)}</span>
        <button id="calNext">▶</button>
        <button id="calToday" style="margin-left:4px;font-size:12px">Hoje</button>
      </div>
      <div class="cal-view-toggle">
        <button id="calViewMonth" class="${view==='month'?'active':''}">Mês</button>
        <button id="calViewWeek"  class="${view==='week' ?'active':''}">Semana</button>
      </div>
    </div>
    <div class="cal-filters">${filterChips}</div>
    ${cells}
  `;
}

function attachCalEvents(){
  // Nav
  $('#calPrev')?.addEventListener('click', ()=>{
    if(_calState.view==='month') _calState.anchor = new Date(_calState.anchor.getFullYear(), _calState.anchor.getMonth()-1, 1);
    else { _calState.anchor.setDate(_calState.anchor.getDate()-7); }
    $('#content').innerHTML = buildCalHTML(); attachCalEvents();
  });
  $('#calNext')?.addEventListener('click', ()=>{
    if(_calState.view==='month') _calState.anchor = new Date(_calState.anchor.getFullYear(), _calState.anchor.getMonth()+1, 1);
    else { _calState.anchor.setDate(_calState.anchor.getDate()+7); }
    $('#content').innerHTML = buildCalHTML(); attachCalEvents();
  });
  $('#calToday')?.addEventListener('click', ()=>{
    const now = new Date();
    if(_calState.view==='month') _calState.anchor = new Date(now.getFullYear(), now.getMonth(), 1);
    else {
      const mon = new Date(now); mon.setDate(now.getDate()-now.getDay()+1);
      _calState.anchor = mon;
    }
    $('#content').innerHTML = buildCalHTML(); attachCalEvents();
  });

  // View toggle
  $('#calViewMonth')?.addEventListener('click', ()=>{
    if(_calState.view==='month') return;
    _calState.view='month';
    const a = _calState.anchor;
    _calState.anchor = new Date(a.getFullYear(), a.getMonth(), 1);
    $('#content').innerHTML = buildCalHTML(); attachCalEvents();
  });
  $('#calViewWeek')?.addEventListener('click', ()=>{
    if(_calState.view==='week') return;
    _calState.view='week';
    const now = new Date();
    const mon = new Date(now); mon.setDate(now.getDate()-now.getDay()+1);
    _calState.anchor = mon;
    $('#content').innerHTML = buildCalHTML(); attachCalEvents();
  });

  // Filter chips
  $$('.cal-filter-chip').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const k = chip.dataset.calFilter;
      _calState.filters[k] = !_calState.filters[k];
      chip.classList.toggle('on', _calState.filters[k]);
      $('#content').innerHTML = buildCalHTML(); attachCalEvents();
    });
  });

  // Event click → abre o modal da etapa mais avançada do cliente
  $$('.cal-event').forEach(el=>{
    el.addEventListener('click', ()=> openClientModalByNome(el.dataset.calNome));
  });
}

/* ============================================================
   BUSCA GLOBAL — Ctrl+K / botão 🔍
   ============================================================ */
(function initGlobalSearch(){
  const overlay = $('#globalSearchOverlay');
  const input   = $('#globalSearchInput');
  const results = $('#globalSearchResults');
  let active = -1;

  const stageColors = {
    lead:'#9333ea', proposta:'#2980b9', vistoria:'#8e44ad', contrato:'#27ae60',
    logistica:'#e67e22', instalacao:'#1565c0', homologacao:'#c0392b', posvenda:'#f39c12',
    atendimentos:'#475569', appman:'#0891b2'
  };
  const stageLabels = {
    lead:'Lead', proposta:'Proposta', vistoria:'Vistoria', contrato:'Contrato',
    logistica:'Logística', instalacao:'Instalação', homologacao:'Homologação', posvenda:'Pós-Venda',
    atendimentos:'Re-Serviço', appman:'App/Manutenção'
  };
  const stageDataKey = {
    lead:'leads', proposta:'propostas', vistoria:'vistorias', contrato:'contratos',
    logistica:'logistica', instalacao:'instalacoes', homologacao:'homologacoes', posvenda:'posvenda',
    atendimentos:'atendimentos', appman:'appman'
  };

  function openSearch(){
    overlay.classList.add('open');
    input.value = '';
    results.innerHTML = '';
    active = -1;
    setTimeout(()=>input.focus(), 50);
  }
  function closeSearch(){ overlay.classList.remove('open'); active = -1; }

  function search(q){
    if(!q.trim()){ results.innerHTML = ''; active=-1; return; }
    const norm = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
    const hits = [];
    Object.entries(stageDataKey).forEach(([stageId, key])=>{
      (State[key]||[]).forEach(item=>{
        const hay = ((item.nome||'')+' '+(item.telefone||'')+' '+(item.cpf||'')+(item.email||''))
          .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
        if(hay.includes(norm)) hits.push({stageId, item});
      });
    });
    // Dedup: same item can appear in multiple stages — keep most advanced
    const seen = new Map();
    hits.forEach(h=>{
      const key = (h.item.nome||'').toLowerCase().trim();
      const prev = seen.get(key);
      if(!prev || Object.keys(stageDataKey).indexOf(h.stageId) > Object.keys(stageDataKey).indexOf(prev.stageId))
        seen.set(key, h);
    });
    const deduped = [...seen.values()].slice(0,12);
    if(!deduped.length){
      results.innerHTML = `<div class="gsr-empty">Nenhum resultado para "<strong>${esc(q)}</strong>"</div>`;
      active = -1; return;
    }
    results.innerHTML = deduped.map((h,i)=>`
      <div class="gsr-item" data-idx="${i}" data-stage="${h.stageId}" data-id="${h.item.id}">
        <span class="gsr-badge" style="background:${stageColors[h.stageId]||'#6b7280'}">${stageLabels[h.stageId]||h.stageId}</span>
        <div style="flex:1;min-width:0">
          <div class="gsr-name">${esc(h.item.nome||'—')}</div>
          <div class="gsr-sub">${[h.item.telefone, h.item.vendedor, h.item.projeto].filter(Boolean).join(' · ')}</div>
        </div>
      </div>`).join('');
    active = -1;
    results.querySelectorAll('.gsr-item').forEach(el=>{
      el.addEventListener('click',()=>{ closeSearch(); openStageModal(el.dataset.stage, el.dataset.id); });
    });
  }

  function setActive(idx){
    const items = results.querySelectorAll('.gsr-item');
    if(!items.length) return;
    active = Math.max(0, Math.min(idx, items.length-1));
    items.forEach((el,i)=>el.classList.toggle('gsr-active', i===active));
    items[active]?.scrollIntoView({block:'nearest'});
  }

  input.addEventListener('input', e=>search(e.target.value));
  input.addEventListener('keydown', e=>{
    const items = results.querySelectorAll('.gsr-item');
    if(e.key==='ArrowDown'){ e.preventDefault(); setActive(active+1); }
    else if(e.key==='ArrowUp'){ e.preventDefault(); setActive(active-1); }
    else if(e.key==='Enter'){
      e.preventDefault();
      const el = active>=0 ? items[active] : items[0];
      if(el){ closeSearch(); openStageModal(el.dataset.stage, el.dataset.id); }
    }
    else if(e.key==='Escape'){ closeSearch(); }
  });
  overlay.addEventListener('click', e=>{ if(e.target===overlay) closeSearch(); });

  // Botão na topbar
  $('#globalSearchBtn')?.addEventListener('click', openSearch);

  // Ctrl+K (ou Cmd+K no Mac)
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key==='k'){
      e.preventDefault();
      overlay.classList.contains('open') ? closeSearch() : openSearch();
    }
  });
})();

/* ============================================================
   MONITORAMENTO SOLAR
   ============================================================ */
// Agrupa leituras por usina e por dia, mantendo o maior valor do dia (caso haja mais de uma sincronização)
function monSeriesPorDia(leituras){
  const porUsinaDia = new Map();
  (leituras||[]).forEach(l=>{
    if(!l.captured_at) return;
    const dia = l.captured_at.slice(0,10);
    if(!porUsinaDia.has(l.usina_id)) porUsinaDia.set(l.usina_id, new Map());
    const m = porUsinaDia.get(l.usina_id);
    const val = Number(l.today_yield_kwh||0);
    if(val > (m.get(dia)||0)) m.set(dia, val);
  });
  return porUsinaDia;
}

function monPeriodDias(period){
  const hojeD = new Date(); hojeD.setHours(0,0,0,0);
  let start = new Date(hojeD);
  if(period==='semana') start.setDate(start.getDate()-6);
  else if(period==='mes') start.setDate(1);
  else if(period==='ano'){ start.setMonth(0); start.setDate(1); }
  const dias = [];
  const d = new Date(start);
  while(d<=hojeD){
    dias.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
    d.setDate(d.getDate()+1);
  }
  return dias;
}

// Alertas: desligamento (gerou 0 hoje) e baixa produção (<80% da média histórica)
function monComputeAlertas(usinas, leituras){
  const porUsinaDia = monSeriesPorDia(leituras);
  const hojeStr = today();
  const alertas = [];
  (usinas||[]).forEach(u=>{
    const serieMap = porUsinaDia.get(u.id);
    if(!serieMap || serieMap.size===0) return;
    const dias = [...serieMap.keys()].sort();
    const diasAnteriores = dias.filter(d=>d!==hojeStr);
    if(diasAnteriores.length < 5) return; // dados insuficientes pra ter uma média confiável
    const historico = diasAnteriores.slice(-30).map(d=>serieMap.get(d));
    const media = historico.reduce((a,b)=>a+b,0) / historico.length;
    if(media <= 0) return;
    const valorHoje = serieMap.get(hojeStr);
    if(valorHoje == null) return; // ainda sem leitura de hoje
    if(valorHoje === 0){
      alertas.push({ usina:u, tipo:'desligamento', valorHoje, media });
    } else if(valorHoje < media*0.8){
      alertas.push({ usina:u, tipo:'baixa_producao', valorHoje, media, pct: Math.round(valorHoje/media*100) });
    }
  });
  return alertas.sort((a,b)=> (a.tipo==='desligamento'?0:1) - (b.tipo==='desligamento'?0:1));
}

async function renderMonitoramento(){
  if(!isAdmin()){ $('#content').innerHTML='<div class="empty">Acesso restrito.</div>'; return; }

  const PROVIDERS = [
    { id:'auxsol',  label:'Auxsol',  icon:'🟢' },
    { id:'goodwe',  label:'GoodWe',  icon:'🔵' },
    { id:'growatt', label:'Growatt', icon:'🟠' },
    { id:'saj',     label:'SAJ',     icon:'🟣' },
    { id:'huawei',  label:'Huawei',  icon:'🔴' },
  ];

  $('#content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  // Buscar dados
  const [{ data: usinas }, { data: leituras }, { data: syncLog }] = await Promise.all([
    supa.from('monitoramento_usinas').select('*').order('plant_name'),
    supa.from('monitoramento_leituras').select('*').order('captured_at', { ascending: false }),
    supa.from('monitoramento_sync_log').select('*').order('executado_em', { ascending: false }).limit(50),
  ]);

  // Última leitura por usina
  const ultimaLeitura = {};
  (leituras||[]).forEach(l => { if(!ultimaLeitura[l.usina_id]) ultimaLeitura[l.usina_id] = l; });

  // Último sync por provider
  const ultimoSync = {};
  (syncLog||[]).forEach(s => { if(!ultimoSync[s.provider]) ultimoSync[s.provider] = s; });

  const kwpTotal = (usinas||[]).reduce((a,u) => a + Number(u.capacity_kwp||0), 0);
  const potAtual = Object.values(ultimaLeitura).reduce((a,l) => a + Number(l.current_power_kw||0), 0);
  const geracaoHoje = Object.values(ultimaLeitura).reduce((a,l) => a + Number(l.today_yield_kwh||0), 0);
  const usinasAtivas = (usinas||[]).filter(u => ultimaLeitura[u.id]?.current_power_kw > 0).length;

  const fmtDt = iso => iso ? new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—';
  const fmtN = (n,dec=1) => Number(n||0).toFixed(dec).replace('.',',');

  const statusColor = s => s==='success'?'#16a34a':s==='error'?'#dc2626':'#d97706';

  // Alertas
  const alertas = monComputeAlertas(usinas, leituras);
  const nDeslig = alertas.filter(a=>a.tipo==='desligamento').length;
  const nBaixa  = alertas.filter(a=>a.tipo==='baixa_producao').length;

  // Período do gráfico (persiste entre re-renders)
  const monPeriod = State._monPeriod || 'semana';
  const porUsinaDiaChart = monSeriesPorDia(leituras);
  let diasChart;
  if(monPeriod==='total'){
    const todasDatas = new Set();
    porUsinaDiaChart.forEach(m=>m.forEach((_,d)=>todasDatas.add(d)));
    diasChart = [...todasDatas].sort();
  } else {
    diasChart = monPeriodDias(monPeriod);
  }
  const chartLabels = diasChart.map(d=>{ const [y,mo,da]=d.split('-'); return `${da}/${mo}`; });
  const chartData = diasChart.map(d=>{
    let total = 0;
    porUsinaDiaChart.forEach(m=>{ total += m.get(d)||0; });
    return Math.round(total*10)/10;
  });

  $('#content').innerHTML = `
  <style>
    .mon-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}
    .mon-kpi{background:var(--card);border-radius:10px;padding:16px 18px;box-shadow:var(--shadow)}
    .mon-kpi .mk-val{font-size:26px;font-weight:700;color:var(--primary);line-height:1.1}
    .mon-kpi .mk-lbl{font-size:11px;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px;margin-top:4px}
    .mon-sync{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;align-items:center}
    .mon-sync-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:8px;border:1px solid var(--border);background:var(--card);cursor:pointer;font-size:12.5px;font-weight:600;transition:background .15s}
    .mon-sync-btn:hover{background:var(--bg)}
    .mon-sync-btn.loading{opacity:.6;pointer-events:none}
    .mon-sync-status{font-size:11px;color:var(--text-light)}
    .mon-table{width:100%;border-collapse:collapse;font-size:13px}
    .mon-table th{font-size:11px;font-weight:600;letter-spacing:.3px;color:var(--text-light);text-align:left;padding:8px 12px;border-bottom:2px solid var(--border)}
    .mon-table td{padding:10px 12px;border-bottom:1px solid rgba(0,0,0,.04)}
    .mon-table tr:hover td{background:var(--bg)}
    .mon-badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10.5px;font-weight:600}
    .mon-badge.on{background:#dcfce7;color:#166534}
    .mon-badge.off{background:#fee2e2;color:#991b1b}
    .mon-badge.unk{background:#f3f4f6;color:#6b7280}
    .mon-section{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-light);margin:20px 0 10px}
    .mon-alert{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;font-size:13px;margin-bottom:8px}
    .mon-alert.desligamento{background:#fee2e2;border:1px solid #fca5a5;color:#991b1b}
    .mon-alert.baixa_producao{background:#fef3c7;border:1px solid #fcd34d;color:#92400e}
    .mon-period{display:flex;gap:2px;background:var(--bg);border-radius:8px;padding:3px}
    .mon-period-btn{padding:6px 14px;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;color:var(--text-light)}
    .mon-period-btn.active{background:var(--card);color:var(--primary);box-shadow:var(--shadow)}
  </style>

  <div class="mon-kpis">
    <div class="mon-kpi"><div class="mk-val">${(usinas||[]).length}</div><div class="mk-lbl">Usinas cadastradas</div></div>
    <div class="mon-kpi"><div class="mk-val">${fmtN(kwpTotal,2)} kWp</div><div class="mk-lbl">Capacidade total</div></div>
    <div class="mon-kpi"><div class="mk-val">${fmtN(potAtual,1)} kW</div><div class="mk-lbl">Potência agora</div></div>
    <div class="mon-kpi"><div class="mk-val">${fmtN(geracaoHoje,1)} kWh</div><div class="mk-lbl">Geração hoje · ${usinasAtivas} ativas</div></div>
  </div>

  ${alertas.length ? `
  <div class="mon-section">⚠️ Alertas (${alertas.length})</div>
  <div style="margin-bottom:12px">
    ${nDeslig ? `<div class="mon-alert desligamento"><strong>🔴 ${nDeslig} usina${nDeslig!==1?'s':''} desligada${nDeslig!==1?'s':''}</strong> — gerou 0 kWh hoje, apesar do histórico normal</div>` : ''}
    ${nBaixa ? `<div class="mon-alert baixa_producao"><strong>🟠 ${nBaixa} usina${nBaixa!==1?'s':''} com baixa produção</strong> — abaixo de 80% da média histórica</div>` : ''}
    <div style="display:flex;flex-direction:column;gap:6px;margin-top:8px">
      ${alertas.map(a=>`
        <div class="mon-alert ${a.tipo}" style="justify-content:space-between">
          <span>${a.tipo==='desligamento'?'🔴':'🟠'} <strong>${esc(a.usina.plant_name||'—')}</strong> (${a.usina.provider})</span>
          <span>${a.tipo==='desligamento' ? 'gerou 0 kWh hoje (média: '+fmtN(a.media,1)+' kWh)' : fmtN(a.valorHoje,1)+' kWh hoje · '+a.pct+'% da média ('+fmtN(a.media,1)+' kWh)'}</span>
        </div>`).join('')}
    </div>
  </div>` : ''}

  <div class="mon-section" style="display:flex;align-items:center;justify-content:space-between">
    <span>📈 Geração diária (kWh)</span>
    <div class="mon-period" id="monPeriodFilter">
      <div class="mon-period-btn ${monPeriod==='semana'?'active':''}" data-p="semana">Semana</div>
      <div class="mon-period-btn ${monPeriod==='mes'?'active':''}" data-p="mes">Mês</div>
      <div class="mon-period-btn ${monPeriod==='ano'?'active':''}" data-p="ano">Ano</div>
      <div class="mon-period-btn ${monPeriod==='total'?'active':''}" data-p="total">Total</div>
    </div>
  </div>
  <div class="card" style="margin-bottom:20px">
    <div style="position:relative;height:220px;padding:12px 4px 4px">
      <canvas id="monChart"></canvas>
    </div>
  </div>

  <div class="mon-section">Sincronização manual</div>
  <div class="mon-sync">
    ${PROVIDERS.map(p => {
      const s = ultimoSync[p.id];
      const temDados = (usinas||[]).some(u=>u.provider===p.id);
      return `<div style="display:flex;flex-direction:column;gap:3px">
        <button class="mon-sync-btn" id="syncBtn_${p.id}" data-provider="${p.id}">
          ${p.icon} ${p.label} <span id="syncSpinner_${p.id}" style="display:none">⏳</span>
        </button>
        <div class="mon-sync-status" id="syncStatus_${p.id}">
          ${s ? `${s.status==='success'?'✅':'❌'} ${fmtDt(s.executado_em)} · ${s.plantas_sincronizadas||0} usinas` : temDados?'Aguardando sync':'Sem credenciais'}
        </div>
      </div>`;
    }).join('')}
    <button class="mon-sync-btn" id="syncAllBtn" style="background:var(--primary);color:#fff;border-color:var(--primary)">⚡ Sync Tudo</button>
  </div>

  <div class="mon-section">Usinas (${(usinas||[]).length})</div>
  <div class="table-wrap">
    <table class="mon-table">
      <thead><tr>
        <th>Usina</th><th>Provider</th><th>kWp</th><th>Status</th>
        <th>Potência atual</th><th>Geração hoje</th><th>Total</th><th>Última leitura</th>
      </tr></thead>
      <tbody>
        ${(usinas||[]).map(u => {
          const l = ultimaLeitura[u.id];
          const ativa = l && Number(l.current_power_kw) > 0;
          const badge = l ? (ativa ? '<span class="mon-badge on">Gerando</span>' : '<span class="mon-badge off">Parada</span>') : '<span class="mon-badge unk">Sem dados</span>';
          return `<tr>
            <td style="font-weight:600">${esc(u.plant_name||'—')}</td>
            <td>${u.provider}</td>
            <td>${fmtN(u.capacity_kwp,2)}</td>
            <td>${badge}</td>
            <td>${l ? fmtN(l.current_power_kw,2)+' kW' : '—'}</td>
            <td>${l ? fmtN(l.today_yield_kwh,1)+' kWh' : '—'}</td>
            <td>${l ? fmtN(l.total_yield_kwh,0)+' kWh' : '—'}</td>
            <td style="font-size:11px;color:var(--text-light)">${fmtDt(l?.captured_at)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div>`;

  // Listeners de sync
  async function callSync(provider){
    const btn = $(`#syncBtn_${provider}`);
    const spinner = $(`#syncSpinner_${provider}`);
    const statusEl = $(`#syncStatus_${provider}`);
    if(btn) btn.classList.add('loading');
    if(spinner) spinner.style.display='';
    try{
      const { data, error } = await supa.functions.invoke(`monitoramento-${provider}-sync`, { method:'POST' });
      if(error) throw new Error(error.message||String(error));
      const sincronizadas = data?.plantas_sincronizadas ?? data?.synced ?? '?';
      if(statusEl) statusEl.innerHTML = `✅ agora · ${sincronizadas} usinas`;
      toast(`${provider}: sync concluído!`,'success');
      setTimeout(()=>renderMonitoramento(), 1500);
    } catch(e){
      if(statusEl) statusEl.innerHTML = `❌ ${e.message}`;
      toast(`Erro sync ${provider}: ${e.message}`,'error',5000);
    } finally {
      if(btn) btn.classList.remove('loading');
      if(spinner) spinner.style.display='none';
    }
  }

  PROVIDERS.forEach(p => {
    $(`#syncBtn_${p.id}`)?.addEventListener('click', ()=>callSync(p.id));
  });

  $('#syncAllBtn')?.addEventListener('click', async ()=>{
    const btn = $('#syncAllBtn');
    if(btn){ btn.textContent='⏳ Sincronizando…'; btn.disabled=true; }
    const providers = PROVIDERS.map(p=>p.id).filter(id=>(usinas||[]).some(u=>u.provider===id));
    for(const p of providers) await callSync(p).catch(()=>{});
    if(btn){ btn.textContent='⚡ Sync Tudo'; btn.disabled=false; }
  });

  // Filtro de período do gráfico
  $$('#monPeriodFilter .mon-period-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      State._monPeriod = btn.dataset.p;
      renderMonitoramento();
    });
  });

  // Gráfico de geração diária
  if(State.charts.mon){ try{ State.charts.mon.destroy(); }catch(_){} }
  const monCtx = $('#monChart')?.getContext('2d');
  if(monCtx){
    State.charts.mon = new Chart(monCtx, {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: [{
          label: 'Geração (kWh)',
          data: chartData,
          backgroundColor: 'rgba(107,33,168,.65)',
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

/* ============================================================
   RELATÓRIO PÓS-VENDA
   ============================================================ */
async function renderGestaoCustos(){
  if(!isGestor()){ $('#content').innerHTML='<div class="empty">Acesso restrito.</div>'; return; }
  await loadAll();
  await Promise.all([loadTable('financeiro_despesas'),loadTable('contratos'),loadTable('custos_fixos')]);

  const td = today();
  const mesAtual = td.slice(0,7);
  const fR = v=>'R$ '+(Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const fN = (v,d=1)=>(Number(v)||0).toFixed(d);

  // ── Custos variáveis médios (projetos com kit+inst+homol preenchidos) ──
  const contratos = (State.contratos||[]).filter(c=>c.status==='assinado');
  const despAll   = State.despesas || State.financeiro_despesas || [];
  const projDados = contratos.map(c=>{
    const desp = despAll.filter(d=>String(d.contrato_id)===String(c.id));
    const kit   = desp.filter(d=>d.categoria==='kit').reduce((s,d)=>s+(Number(d.valor)||0),0);
    const inst  = desp.filter(d=>d.categoria==='instalacao').reduce((s,d)=>s+(Number(d.valor)||0),0);
    const homol = desp.filter(d=>d.categoria==='homologacao').reduce((s,d)=>s+(Number(d.valor)||0),0);
    const outros= desp.filter(d=>!['kit','instalacao','homologacao','comissao'].includes(d.categoria)).reduce((s,d)=>s+(Number(d.valor)||0),0);
    const comis = desp.filter(d=>d.categoria==='comissao').reduce((s,d)=>s+(Number(d.valor)||0),0);
    const valor = Number(c.valor)||0;
    return { nome:c.nome, valor, kit, inst, homol, outros, comis, totalVar:kit+inst+homol+outros+comis };
  }).filter(p=>p.kit>0 && p.inst>0 && p.homol>0 && p.valor>0);

  const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
  const avgKit   = avg(projDados.map(p=>p.kit));
  const avgInst  = avg(projDados.map(p=>p.inst));
  const avgHomol = avg(projDados.map(p=>p.homol));
  const avgVar   = avg(projDados.map(p=>p.totalVar));
  const avgContrato = avg(projDados.map(p=>p.valor));

  // Comissões não têm contrato_id — calcular globalmente
  const todasComissoes = despAll.filter(d=>d.categoria==='comissao');
  const avgComis = todasComissoes.length ? todasComissoes.reduce((s,d)=>s+(Number(d.valor)||0),0)/todasComissoes.length : 0;
  const totalComisGlobal = todasComissoes.reduce((s,d)=>s+(Number(d.valor)||0),0);
  const pct = (v,base) => base>0 ? (v/base*100).toFixed(1)+'%' : '—';

  // ── Custos fixos do mês selecionado ──
  const [mesSel, setMesSel] = [State._gcMes||mesAtual, m=>{ State._gcMes=m; renderGestaoCustos(); }];
  const fixosMes = (State.custos_fixos||[]).filter(f=>f.mes===mesSel);
  const totalFixo = fixosMes.reduce((s,f)=>s+(Number(f.valor)||0),0);

  // ── Ponto de equilíbrio ──
  const margemBrutaMedia = avgContrato - avgVar;
  const peProj = margemBrutaMedia>0 ? Math.ceil(totalFixo/margemBrutaMedia) : null;

  const catFixaOpts = [['aluguel','Aluguel'],['folha','Folha de Pagamento'],['energia','Energia'],['internet','Internet'],['software','Software/Assinaturas'],['marketing','Marketing'],['contabilidade','Contabilidade'],['veiculo','Veículo'],['outros','Outros']];
  const catFixaMap  = Object.fromEntries(catFixaOpts);

  $('#pageActions').innerHTML = '';
  $('#content').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:20px">

      <!-- KPIs variáveis -->
      <div class="card">
        <div class="card-header"><h3>📦 Custos Variáveis Médios <span style="font-size:12px;color:var(--text-light);font-weight:400">(${projDados.length} projetos completos)</span></h3></div>
        <div class="metrics" style="margin:0;padding:12px 0 4px">
          <div class="metric"><div class="metric-label">Kit / Equipamentos</div><div class="metric-value" style="font-size:16px">${fR(avgKit)}</div><div class="metric-sub">${pct(avgKit,avgContrato)} do contrato</div></div>
          <div class="metric"><div class="metric-label">Instalação</div><div class="metric-value" style="font-size:16px">${fR(avgInst)}</div><div class="metric-sub">${pct(avgInst,avgContrato)} do contrato</div></div>
          <div class="metric"><div class="metric-label">Homologação</div><div class="metric-value" style="font-size:16px">${fR(avgHomol)}</div><div class="metric-sub">${pct(avgHomol,avgContrato)} do contrato</div></div>
          <div class="metric"><div class="metric-label">Comissões (média global)</div><div class="metric-value" style="font-size:16px">${fR(avgComis)}</div><div class="metric-sub">${todasComissoes.length} pagamentos · ${fR(totalComisGlobal)} total</div></div>
          <div class="metric"><div class="metric-label">Total Variável</div><div class="metric-value" style="font-size:16px;color:#dc2626">${fR(avgVar)}</div><div class="metric-sub">${pct(avgVar,avgContrato)} do contrato</div></div>
          <div class="metric"><div class="metric-label">Margem Bruta Média</div><div class="metric-value" style="font-size:16px;color:#16a34a">${fR(margemBrutaMedia)}</div><div class="metric-sub">${pct(margemBrutaMedia,avgContrato)} do contrato</div></div>
        </div>
      </div>

      <!-- Custos fixos -->
      <div class="card">
        <div class="card-header" style="justify-content:space-between;display:flex;align-items:center;flex-wrap:wrap;gap:8px">
          <h3>🏢 Custos Fixos — <input type="month" id="gcMesInput" value="${mesSel}" style="border:1px solid var(--border);border-radius:6px;padding:3px 8px;font-size:13px;font-family:inherit;background:var(--card);color:var(--text)"></h3>
          <button class="btn btn-primary btn-sm" id="gcAddFixoBtn">+ Lançar custo fixo</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Categoria</th><th>Descrição</th><th>Valor</th><th></th></tr></thead>
            <tbody>
              ${fixosMes.length ? fixosMes.sort((a,b)=>a.categoria.localeCompare(b.categoria)).map(f=>`
                <tr>
                  <td><span class="badge" style="background:var(--bg-accent);color:var(--text-accent)">${catFixaMap[f.categoria]||f.categoria}</span></td>
                  <td>${esc(f.descricao)}</td>
                  <td style="font-weight:600">${fR(f.valor)}</td>
                  <td style="display:flex;gap:6px">
                    <button class="btn btn-sm btn-secondary" data-gc-edit="${f.id}">✏️</button>
                    <button class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:none" data-gc-del="${f.id}">🗑️</button>
                  </td>
                </tr>`).join('') : `<tr><td colspan="4" class="empty">Nenhum custo fixo lançado para ${mesSel}.</td></tr>`}
              ${fixosMes.length ? `<tr style="border-top:2px solid var(--border)"><td colspan="2"><strong>Total</strong></td><td style="font-weight:700;color:#dc2626">${fR(totalFixo)}</td><td></td></tr>` : ''}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Ponto de equilíbrio -->
      <div class="card">
        <div class="card-header"><h3>⚖️ Ponto de Equilíbrio</h3></div>
        <div style="padding:16px;display:flex;flex-wrap:wrap;gap:24px;align-items:flex-start">
          <div>
            <div style="font-size:13px;color:var(--text-light);margin-bottom:4px">Ticket médio dos contratos</div>
            <div style="font-size:20px;font-weight:700">${fR(avgContrato)}</div>
          </div>
          <div>
            <div style="font-size:13px;color:var(--text-light);margin-bottom:4px">Custo variável médio</div>
            <div style="font-size:20px;font-weight:700;color:#dc2626">${fR(avgVar)}</div>
          </div>
          <div>
            <div style="font-size:13px;color:var(--text-light);margin-bottom:4px">Margem bruta por projeto</div>
            <div style="font-size:20px;font-weight:700;color:#16a34a">${fR(margemBrutaMedia)}</div>
          </div>
          <div>
            <div style="font-size:13px;color:var(--text-light);margin-bottom:4px">Custo fixo do mês</div>
            <div style="font-size:20px;font-weight:700;color:#ca8a04">${fR(totalFixo)}</div>
          </div>
          <div style="background:var(--primary);color:#fff;border-radius:12px;padding:16px 24px;text-align:center">
            <div style="font-size:12px;opacity:.85;margin-bottom:4px">Projetos p/ fechar os fixos</div>
            <div style="font-size:36px;font-weight:800">${peProj!=null ? peProj : '—'}</div>
            <div style="font-size:11px;opacity:.75">${totalFixo>0&&peProj!=null ? 'projetos/mês' : 'lance custos fixos'}</div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Troca de mês
  $('#gcMesInput').addEventListener('change', e=> setMesSel(e.target.value));

  // Abrir modal custo fixo (novo)
  $('#gcAddFixoBtn').addEventListener('click', ()=> openCustoFixoModal(null, mesSel));

  // Editar
  $$('[data-gc-edit]').forEach(b=>{
    const f = (State.custos_fixos||[]).find(x=>String(x.id)===b.dataset.gcEdit);
    b.addEventListener('click', ()=> openCustoFixoModal(f, mesSel));
  });

  // Excluir
  $$('[data-gc-del]').forEach(b=>{
    b.addEventListener('click', async ()=>{
      if(!confirm('Excluir este custo fixo?')) return;
      await supa.from('custos_fixos').delete().eq('id', b.dataset.gcDel);
      await loadTable('custos_fixos');
      renderGestaoCustos();
    });
  });
}

function openCustoFixoModal(item=null, mes=today().slice(0,7)){
  const isNew = !item;
  item = item || {};
  const catOpts = [['aluguel','Aluguel'],['folha','Folha de Pagamento'],['energia','Energia'],['internet','Internet'],['software','Software/Assinaturas'],['marketing','Marketing'],['contabilidade','Contabilidade'],['veiculo','Veículo'],['outros','Outros']];
  openModal(`
    <div class="modal-header"><h2>${isNew?'Novo Custo Fixo':'Editar Custo Fixo'}</h2><button class="modal-close">×</button></div>
    <form id="custoFixoForm">
      <div class="modal-body">
        <div class="form-grid">
          ${formField({label:'Mês',name:'mes',type:'month',value:item.mes||mes})}
          ${formField({label:'Categoria',name:'categoria',type:'select',value:item.categoria||'outros',options:catOpts})}
          ${formField({label:'Descrição',name:'descricao',value:item.descricao,required:true,full:true})}
          ${formField({label:'Valor (R$)',name:'valor',type:'number',value:item.valor,required:true})}
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>
  `,'sm');
  $('#custoFixoForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm($('#custoFixoForm'));
    data.valor = Number(data.valor)||0;
    if(isNew){
      await supa.from('custos_fixos').insert({...data, criado_em:new Date().toISOString(), atualizado_em:new Date().toISOString()});
    } else {
      await supa.from('custos_fixos').update({...data, atualizado_em:new Date().toISOString()}).eq('id',item.id);
    }
    toast('Salvo!','success');
    await loadTable('custos_fixos');
    closeModal();
    renderGestaoCustos();
  });
}

async function renderRelatorioPosvenda(){
  await loadAll();
  const pv = State.posvenda || [];
  const td = today();
  const mesAtual = td.slice(0,7);

  const total   = pv.length;
  const env5d   = pv.filter(p=>p.msg_5d_enviada_em).length;
  const env30d  = pv.filter(p=>p.msg_30d_enviada_em).length;
  const env90d  = pv.filter(p=>p.msg_90d_enviada_em).length;
  const anivMes = pv.filter(p=>{
    if(!p.nascimento) return false;
    const nasc = new Date(p.nascimento);
    return `${String(nasc.getMonth()+1).padStart(2,'0')}` === td.slice(5,7);
  });

  // Marcos próximos (clientes que estão chegando nos 5/30/90 dias)
  const diasAtivacao = p => p.data_ativacao ? Math.floor((Date.now()-new Date(p.data_ativacao).getTime())/86400000) : null;
  const prox5  = pv.filter(p=>{ const d=diasAtivacao(p); return d!=null && d>=3 && d<5 && !p.msg_5d_enviada_em; });
  const prox30 = pv.filter(p=>{ const d=diasAtivacao(p); return d!=null && d>=27 && d<30 && !p.msg_30d_enviada_em; });
  const prox90 = pv.filter(p=>{ const d=diasAtivacao(p); return d!=null && d>=87 && d<90 && !p.msg_90d_enviada_em; });

  $('#pageActions').innerHTML = '';
  $('#content').innerHTML = `
    <div class="metrics" style="margin-bottom:16px">
      <div class="metric"><div class="metric-label">Total Pós-Venda</div><div class="metric-value">${total}</div></div>
      <div class="metric"><div class="metric-label">Msg 5 dias enviada</div><div class="metric-value">${env5d}</div></div>
      <div class="metric"><div class="metric-label">Msg 30 dias enviada</div><div class="metric-value">${env30d}</div></div>
      <div class="metric"><div class="metric-label">Msg 90 dias enviada</div><div class="metric-value">${env90d}</div></div>
      <div class="metric"><div class="metric-label">Aniversários no mês</div><div class="metric-value">${anivMes.length}</div></div>
    </div>

    ${(prox5.length||prox30.length||prox90.length) ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><h3>⏰ Próximas Mensagens Automáticas</h3></div>
      <div style="display:flex;flex-direction:column;gap:6px;padding:4px 0">
        ${prox5.map(p=>`<div style="padding:8px 12px;background:#eff6ff;border-radius:8px;font-size:13px;border-left:3px solid #2563eb">
          📅 <strong>${esc(p.nome)}</strong> — mensagem de <strong>5 dias</strong> em breve (${diasAtivacao(p)}d de ativação)
        </div>`).join('')}
        ${prox30.map(p=>`<div style="padding:8px 12px;background:#f0fdf4;border-radius:8px;font-size:13px;border-left:3px solid #16a34a">
          📅 <strong>${esc(p.nome)}</strong> — mensagem de <strong>30 dias</strong> em breve (${diasAtivacao(p)}d de ativação)
        </div>`).join('')}
        ${prox90.map(p=>`<div style="padding:8px 12px;background:#fefce8;border-radius:8px;font-size:13px;border-left:3px solid #ca8a04">
          📅 <strong>${esc(p.nome)}</strong> — mensagem de <strong>90 dias</strong> em breve (${diasAtivacao(p)}d de ativação)
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${anivMes.length ? `
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><h3>🎂 Aniversários deste Mês</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Nome</th><th>Data Nasc.</th><th>Telefone</th><th>Mensagem enviada?</th></tr></thead>
        <tbody>
          ${anivMes.map(p=>{
            const nasc = new Date(p.nascimento);
            const jaEnviou = p.msg_aniversario_ultimo_ano === new Date().getFullYear();
            return `<tr>
              <td><strong>${esc(p.nome)}</strong></td>
              <td>${nasc.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}</td>
              <td>${esc(p.telefone||'—')}</td>
              <td>${jaEnviou ? '<span style="color:#16a34a;font-weight:600">✅ Sim</span>' : '<span style="color:#dc2626">⏳ Não</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
    </div>` : ''}

    <div class="card">
      <div class="card-header"><h3>📋 Todos os Clientes em Pós-Venda</h3></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Nome</th><th>Ativação</th><th>Dias</th><th>5d</th><th>30d</th><th>90d</th><th>Aniversário</th></tr></thead>
        <tbody>
          ${pv.length ? pv.map(p=>{
            const dias = diasAtivacao(p);
            const anoAtual = new Date().getFullYear();
            const ck = v => v ? '✅' : '—';
            return `<tr>
              <td><strong>${esc(p.nome)}</strong></td>
              <td>${p.data_ativacao ? fmtDate(p.data_ativacao) : '—'}</td>
              <td>${dias!=null ? dias+'d' : '—'}</td>
              <td style="text-align:center">${ck(p.msg_5d_enviada_em)}</td>
              <td style="text-align:center">${ck(p.msg_30d_enviada_em)}</td>
              <td style="text-align:center">${ck(p.msg_90d_enviada_em)}</td>
              <td style="text-align:center">${p.msg_aniversario_ultimo_ano===anoAtual ? '✅ '+anoAtual : '—'}</td>
            </tr>`;
          }).join('') : '<tr><td colspan="7" class="empty">Nenhum cliente em pós-venda.</td></tr>'}
        </tbody>
      </table></div>
    </div>
  `;
}

/* ============================================================
   TEMPO MÉDIO POR ETAPA  (seção do dashboard)
   ============================================================ */
/* ============================================================
   DASHBOARD PREDITIVO DE RECEITA
   Baseado no pipeline atual × taxa histórica de conversão × ticket médio
   ============================================================ */
function buildPreditivoSection(){
  const contratos = State.contratos||[];
  const props = State.propostas||[];
  const contratosAssinados = contratos.filter(c=>c.status==='assinado');
  const contratosAbertos = contratos.filter(c=>c.status && c.status!=='assinado' && c.status!=='cancelado');
  const propsAbertas = props.filter(p=>!['aceita','recusada'].includes(p.status));

  // Taxa histórica de conversão proposta → contrato assinado (mínimo 5%, máximo 95% para não distorcer com poucos dados)
  const taxaConv = props.length>0 ? Math.min(0.95, Math.max(0.05, contratosAssinados.length/props.length)) : 0.25;

  // Ticket médio dos contratos já assinados
  const ticketMedio = contratosAssinados.length
    ? contratosAssinados.reduce((s,c)=>s+(Number(c.valor)||0),0)/contratosAssinados.length
    : 0;

  // Receita ponderada: propostas abertas pesam pela taxa histórica; contratos já em negociação (não assinados ainda) pesam mais alto (85%), pois já passaram da fase de proposta
  const receitaPropostas = propsAbertas.length * ticketMedio * taxaConv;
  const receitaContratos = contratosAbertos.length * ticketMedio * 0.85;
  const totalPrevisto = receitaPropostas + receitaContratos;

  // Distribuição temporal heurística: contratos em negociação fecham mais rápido (pesam mais em 30d);
  // propostas ainda abertas se distribuem mais no médio/longo prazo
  const d30 = receitaContratos*0.65 + receitaPropostas*0.25;
  const d60 = receitaContratos*0.25 + receitaPropostas*0.40;
  const d90 = receitaContratos*0.10 + receitaPropostas*0.35;

  const card = (label,val,sub,color) => `
    <div style="flex:1;min-width:140px;background:var(--bg-alt);border-radius:10px;padding:14px 16px;border-left:4px solid ${color}">
      <div style="font-size:11px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.4px">${label}</div>
      <div style="font-size:20px;font-weight:800;color:${color};margin-top:4px">${fmtBRL(val)}</div>
      <div style="font-size:10.5px;color:var(--text-light);margin-top:2px">${sub}</div>
    </div>`;

  return `<div class="card" style="margin-bottom:16px">
    <div class="card-header"><h3>📈 Dashboard Preditivo de Receita</h3></div>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">
      ${card('Próximos 30 dias', d30, 'previsão', '#16a34a')}
      ${card('Próximos 60 dias', d60, 'previsão', '#2563eb')}
      ${card('Próximos 90 dias', d90, 'previsão', '#7c3aed')}
      ${card('Total no pipeline', totalPrevisto, `${propsAbertas.length} propostas + ${contratosAbertos.length} contratos em andamento`, '#ea580c')}
    </div>
    <div style="font-size:11px;color:var(--text-light);line-height:1.6">
      Cálculo: ${propsAbertas.length} proposta${propsAbertas.length!==1?'s':''} aberta${propsAbertas.length!==1?'s':''} × ticket médio (${fmtBRL(ticketMedio)}) × taxa histórica de conversão (${Math.round(taxaConv*100)}%), somado a ${contratosAbertos.length} contrato${contratosAbertos.length!==1?'s':''} em negociação × probabilidade alta (85%). Distribuição 30/60/90 dias é uma estimativa heurística — não substitui o julgamento comercial.
    </div>
  </div>`;
}

function buildTempoMedioSection(){
  const stageInfo = [
    { id:'lead',        key:'leads',        label:'Lead',       icon:'👤' },
    { id:'proposta',    key:'propostas',     label:'Proposta',   icon:'📋' },
    { id:'vistoria',    key:'vistorias',     label:'Vistoria',   icon:'🔍' },
    { id:'contrato',    key:'contratos',     label:'Contrato',   icon:'✍️' },
    { id:'logistica',   key:'logistica',     label:'Logística',  icon:'📦' },
    { id:'instalacao',  key:'instalacoes',   label:'Instalação', icon:'🔧' },
    { id:'homologacao', key:'homologacoes',  label:'Homolog.',   icon:'📋' },
  ];
  const now = Date.now();
  const rows = stageInfo.map(s=>{
    const items = State[s.key]||[];
    if(!items.length) return { ...s, avg:0, count:0 };
    const dias = items.map(it=>{
      const d = it.criado_em ? Math.floor((now-new Date(it.criado_em).getTime())/86400000) : null;
      return d;
    }).filter(d=>d!=null && d>=0);
    const avg = dias.length ? Math.round(dias.reduce((a,b)=>a+b,0)/dias.length) : 0;
    return { ...s, avg, count:items.length };
  });
  const maxAvg = Math.max(1,...rows.map(r=>r.avg));
  const color = avg => avg<=3?'#16a34a':avg<=7?'#ca8a04':avg<=14?'#ea580c':'#dc2626';

  return `<div class="card" style="margin-bottom:16px">
    <div class="card-header"><h3>⏱️ Tempo Médio por Etapa</h3></div>
    <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0">
      ${rows.map(r=>`
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:80px;font-size:12px;color:var(--text-light);flex-shrink:0">${r.icon} ${r.label}</span>
          <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${r.avg?Math.max(4,Math.round(r.avg/maxAvg*100)):0}%;background:${color(r.avg)};border-radius:4px;transition:width .4s"></div>
          </div>
          <span style="width:52px;text-align:right;font-weight:700;font-size:13px;color:${color(r.avg)}">${r.avg}d</span>
          <span style="width:36px;text-align:right;font-size:11px;color:var(--text-light)">${r.count}</span>
        </div>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--text-light);margin-top:8px">Média de dias que os registros permanecem em cada etapa atualmente.</div>
  </div>`;
}

/* ============================================================
   METAS POR VENDEDOR  (seção do dashboard)
   ============================================================ */
async function renderMetasVendedor(){
  const td = today();
  const mesAtual = td.slice(0,7);
  const [mesStart] = getPeriodRange('mes');
  const perfisVend = (State.perfis||[]).filter(p=>p.ativo!==false && ['vendedor','supervisor'].includes(p.perfil) && p.nome);
  const contratosDoMes = (State.contratos||[]).filter(c=>c.status==='assinado' && (c.data_assinatura||'')>=mesStart && (c.data_assinatura||'')<=td);

  const rows = perfisVend.map(p=>{
    const metaRec = (State.metas_vendedores||[]).find(m=>m.mes===mesAtual && normName(m.vendedor)===normName(p.nome));
    const meta = Number(metaRec?.valor||0);
    const realizado = contratosDoMes.filter(c=>normName(c.vendedor)===normName(p.nome)).reduce((s,c)=>s+(Number(c.valor)||0),0);
    const pct = meta>0 ? Math.min(1, realizado/meta) : 0;
    const diaMes = Number(td.slice(8,10))||1, diasNoMes = new Date(Number(td.slice(0,4)), Number(td.slice(5,7)), 0).getDate();
    const proj = realizado/diaMes*diasNoMes;
    return { nome:p.nome, meta, realizado, pct, metaRec, proj };
  }).filter(r=>r.meta>0 || r.realizado>0).sort((a,b)=>b.realizado-a.realizado);

  const gaugeSVG = (r) => {
    const pct = r.meta>0 ? Math.min(1.02, r.pct) : 0;
    const cx=80, cy=76, R=58, tW=11;
    // 0% = -180° (esquerda), 100% = 0° (direita) — semicírculo superior
    const angDeg = -180 + Math.min(1.02,pct)*180;
    const angRad = angDeg*Math.PI/180;
    const nx = cx + R*0.68*Math.cos(angRad);
    const ny = cy + R*0.68*Math.sin(angRad);
    const _gaugeCol=(pv)=>{const s=[[239,68,68],[249,115,22],[234,179,8],[34,197,94]],sc=Math.min(pv,1)*3,i=Math.min(2,Math.floor(sc)),t=sc-i,[r1,g1,b1]=s[i],[r2,g2,b2]=s[i+1];return'rgb('+Math.round(r1+(r2-r1)*t)+','+Math.round(g1+(g2-g1)*t)+','+Math.round(b1+(b2-b1)*t)+')';};
    const col = _gaugeCol(pct);
    const arc = (r2,a1,a2) => { const s=a1*Math.PI/180,e=a2*Math.PI/180; return 'M '+(cx+r2*Math.cos(s))+' '+(cy+r2*Math.sin(s))+' A '+r2+' '+r2+' 0 0 1 '+(cx+r2*Math.cos(e))+' '+(cy+r2*Math.sin(e)); };
    const fillEnd = Math.min(0, angDeg);
    const tick = (pm,c) => { const a=(-180+pm*180)*Math.PI/180; return '<line x1="'+(cx+(R+5)*Math.cos(a))+'" y1="'+(cy+(R+5)*Math.sin(a))+'" x2="'+(cx+(R+12)*Math.cos(a))+'" y2="'+(cy+(R+12)*Math.sin(a))+'" stroke="'+c+'" stroke-width="2.5" stroke-linecap="round"/>'; };
    const pctLabel = r.meta>0 ? Math.round(Math.min(1,pct)*100)+'%' : '0%';
    const emoji = pct>=1?'🏆':pct>=.7?'💪':pct>=.4?'⚡':'🔥';
    const firstName = r.nome.split(' ')[0];
    return '<div style="display:flex;flex-direction:column;align-items:center;min-width:140px;max-width:160px">'
      +'<svg width="160" height="92" viewBox="0 0 160 92" style="overflow:visible">'
      +'<path d="'+arc(R,-180,0)+'" fill="none" stroke="#e5e7eb" stroke-width="'+tW+'" stroke-linecap="round"/>'
      +(pct>0?'<path d="'+arc(R,-180,fillEnd)+'" fill="none" stroke="'+col+'" stroke-width="'+tW+'" stroke-linecap="round" opacity="0.9"/>':'')
      +tick(.4,'#ea580c')+tick(.7,'#ca8a04')+tick(1,'#16a34a')
      +'<line x1="'+cx+'" y1="'+cy+'" x2="'+nx+'" y2="'+ny+'" stroke="'+col+'" stroke-width="3.5" stroke-linecap="round"/>'
      +'<circle cx="'+cx+'" cy="'+cy+'" r="5.5" fill="'+col+'"/>'
      +'<text x="'+cx+'" y="'+(cy+20)+'" text-anchor="middle" font-size="17" font-weight="700" fill="'+col+'" font-family="inherit">'+pctLabel+'</text>'
      +'<text x="'+cx+'" y="12" text-anchor="middle" font-size="13">'+emoji+'</text>'
      +'</svg>'
      +'<div style="font-weight:700;font-size:13px;margin-top:-2px">'+esc(firstName)+'</div>'
      +'<div style="font-size:10px;color:var(--text-light);margin-top:2px">'+fmtBRL(r.realizado)+' / '+(r.meta?fmtBRL(r.meta):'sem meta')+'</div>'
      +(r.meta>0?'<div style="font-size:10px;margin-top:1px;color:'+(r.proj>=r.meta?'#16a34a':'#ca8a04')+'">Projeção: '+fmtBRL(r.proj)+(r.proj>=r.meta?' ✔':'')+'</div>':'')
      +'</div>';
  };

  if(!rows.length) return `<div class="card" style="margin-bottom:16px">
    <div class="card-header" style="justify-content:space-between;display:flex;align-items:center">
      <h3>🎯 Metas por Vendedor</h3>
      ${isAdmin()?`<button class="btn btn-sm btn-secondary" id="editMetasVendBtn">✏️ Definir metas</button>`:''}
    </div>
    <div class="empty" style="padding:24px">Nenhuma meta definida para o mês. ${isAdmin()?'Clique em "Definir metas" para configurar.':''}</div>
  </div>`;

  return `<div class="card" style="margin-bottom:16px">
    <div class="card-header" style="justify-content:space-between;display:flex;align-items:center">
      <h3>🎯 Metas por Vendedor — <span style="font-weight:400;font-size:13px;color:var(--text-light)">${mesAtual}</span></h3>
      ${isAdmin()?`<button class="btn btn-sm btn-secondary" id="editMetasVendBtn">✏️ Definir metas</button>`:''}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;padding:8px 0;justify-content:center">
      ${rows.map(r=>gaugeSVG(r)).join('')}
    </div>
  </div>`;
}

function openMetasVendedoresModal(){
  const td = today();
  const mesAtual = td.slice(0,7);
  const perfisVend = (State.perfis||[]).filter(p=>p.ativo!==false && ['vendedor','supervisor'].includes(p.perfil) && p.nome);
  openModal(`
    <div class="modal-header"><h2>Metas por Vendedor — ${mesAtual}</h2><button class="modal-close">×</button></div>
    <form id="metasVendForm">
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:10px">
          ${perfisVend.map(p=>{
            const metaRec = (State.metas_vendedores||[]).find(m=>m.mes===mesAtual && normName(m.vendedor)===normName(p.nome));
            return `<div style="display:flex;align-items:center;gap:12px">
              <label style="min-width:140px;font-size:13px;font-weight:600">${esc(p.nome)}</label>
              <input type="number" name="meta_${esc(p.nome)}" value="${metaRec?.valor||''}" placeholder="R$ 0" style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-size:13px" min="0" step="1000">
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar metas</button>
      </div>
    </form>
  `,'sm');
  $('#metasVendForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const mesAtual = today().slice(0,7);
    const perfisVend = (State.perfis||[]).filter(p=>p.ativo!==false && ['vendedor','supervisor'].includes(p.perfil) && p.nome);
    for(const p of perfisVend){
      const val = Number(e.target.elements[`meta_${p.nome}`]?.value||0);
      if(!val) continue;
      await supa.from('metas_vendedores').upsert({ mes:mesAtual, vendedor:p.nome, valor:val, atualizado_em:new Date().toISOString() }, { onConflict:'mes,vendedor' });
    }
    toast('Metas salvas!','success'); closeModal(); renderDashboard();
  });
}

// boot
checkSession();
