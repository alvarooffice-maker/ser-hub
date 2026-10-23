const FUNCTION_URL = `${import.meta.env.PUBLIC_SUPABASE_URL}/functions/v1/portal-data`;

const esc = s => String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const token = new URLSearchParams(location.search).get('token');

function fmtDate(d){
  if(!d) return null;
  const dt = new Date(d+'T12:00:00');
  return dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
}

const logisticaStatusMap = {
  'em_separacao':  'Em separação no estoque',
  'comprado':      'Compra realizada',
  'aguardando':    'Aguardando fornecedor',
  'expedido':      'Expedido — em trânsito',
  'entregue':      'Entregue',
  'em_transito':   'Em trânsito',
};
function logisticaStatus(l){ return l?.status ? (logisticaStatusMap[l.status]||l.status) : null; }

const homoStatusMap = {
  'protocolado':      'Protocolo enviado',
  'em_analise':       'Em análise na concessionária',
  'vistoria_final':   'Aguardando vistoria final',
  'parecer_acesso':   'Parecer de acesso emitido',
  'aprovado':         'Aprovado',
  'reprovado':        'Reprovado — em revisão',
};
function homoStatus(h){ return h?.etapa ? (homoStatusMap[h.etapa]||h.etapa) : h?.status ? (homoStatusMap[h.status]||h.status) : null; }

function buildSteps(data){
  const {contrato, vistoria, logistica, instalacao, homologacao} = data;

  // Determina status real de cada etapa
  const isDone = {
    contrato:    !!contrato,
    vistoria:    ['realizada','concluida','aprovada'].includes(vistoria?.status),
    logistica:   ['expedido','entregue'].includes(logistica?.status),
    instalacao:  instalacao?.status === 'concluida',
    homologacao: ['aprovado','ativado'].includes(homologacao?.status),
    ligacao:     !!(homologacao?.data_ativacao),
  };

  // Etapa ativa = a primeira não concluída que tem registro ou vem após uma concluída
  const keys = ['contrato','vistoria','logistica','instalacao','homologacao','ligacao'];
  let activeKey = null;
  for(let i = 0; i < keys.length; i++){
    if(!isDone[keys[i]]){ activeKey = keys[i]; break; }
  }

  const steps = [
    {
      key:'contrato', icon:'📄',
      labelDone:'Contrato assinado', labelActive:'Contrato em elaboração', labelPending:'Contrato',
      date: null,
    },
    {
      key:'vistoria', icon:'🔍',
      labelDone:'Vistoria concluída', labelActive:'Vistoria agendada', labelPending:'Vistoria técnica',
      date: fmtDate(vistoria?.data_agendamento),
      subActive: vistoria?.parecer_final || null,
    },
    {
      key:'logistica', icon:'📦',
      labelDone:'Kit solar entregue', labelActive:'Kit solar a caminho', labelPending:'Envio do kit solar',
      date: fmtDate(logistica?.data_prevista_entrega),
      subActive: logisticaStatus(logistica),
    },
    {
      key:'instalacao', icon:'🔧',
      labelDone:'Instalação concluída', labelActive:'Instalação em andamento', labelPending:'Instalação',
      date: fmtDate(instalacao?.data_instalacao),
    },
    {
      key:'homologacao', icon:'📋',
      labelDone:'Homologação aprovada', labelActive:'Homologação em análise', labelPending:'Homologação na concessionária',
      date: fmtDate(homologacao?.data_assinatura),
      subActive: homoStatus(homologacao),
    },
    {
      key:'ligacao', icon:'☀️',
      labelDone:'Usina ligada e funcionando!', labelActive:'Aguardando ligação da usina', labelPending:'Usina ligada e funcionando',
      date: fmtDate(homologacao?.data_ativacao),
    },
  ];

  return steps.map(s => {
    const status = isDone[s.key] ? 'done' : s.key === activeKey ? 'active' : 'pending';
    const label = status === 'done' ? s.labelDone : status === 'active' ? s.labelActive : s.labelPending;
    return { ...s, status, label };
  });
}

function render(data){
  const {contrato, vistoria, logistica, instalacao, homologacao, proposta, monitoramento} = data;
  const steps = buildSteps(data);

  const nome = contrato?.nome || '—';
  const telefone = (contrato?.telefone||'').replace(/\D/g,'');
  const endereco = contrato?.cidade ? `${contrato.cidade}${contrato.estado?', '+contrato.estado:''}` : '';
  const potencia = proposta?.kwp ? proposta.kwp+' kWp' : instalacao?.kwp ? instalacao.kwp+' kWp' : '—';
  const modulosQtd = proposta?.qtd_modulos || '—';
  const modulosSub = [proposta?.marca_modulo, proposta?.pot_modulo ? proposta.pot_modulo+'W' : null].filter(Boolean).join(' · ') || null;
  const inversorVal = proposta?.marca_inversor || '—';
  const inversorSub = proposta?.pot_inversor ? proposta.pot_inversor+'W' : null;
  const economia = proposta?.economia_mensal ? 'R$ '+Number(proposta.economia_mensal).toLocaleString('pt-BR') : '—';

  const waLink = telefone ? ('https://wa.me/'+(telefone.length<=11?'55'+telefone:telefone)+'?text='+encodeURIComponent('Olá! Preciso de ajuda com meu projeto solar.')) : 'https://wa.me/5585999990000';

  const timelineHTML = steps.map((s,i)=>`
    <div class="step">
      <div class="step-connector ${s.status==='done'?'done':''}"></div>
      <div class="step-dot ${s.status==='done'?'dot-done':s.status==='active'?'dot-active':'dot-pending'}">
        ${s.status==='done'?'✓':s.icon}
      </div>
      <div class="step-body">
        <div class="step-label ${s.status}">
          ${esc(s.label)}
          ${s.status==='done'?'<span class="step-badge badge-done">concluído</span>':''}
        </div>
        ${s.date&&s.status==='done' ? `<div class="step-date">${esc(s.date)}</div>` : ''}
        ${s.date&&s.status==='active' ? `<div class="step-date active">Previsto: ${esc(s.date)}</div>` : ''}
        ${s.subActive&&s.status==='active' ? `<div class="step-sub">(${esc(s.subActive)})</div>` : ''}
      </div>
    </div>`).join('');

  const docsHTML = [
    proposta?.pdf_url ? `<a href="${esc(proposta.pdf_url)}" target="_blank" class="doc-btn"><div class="doc-icon">📋</div><span class="doc-label">Proposta comercial</span><span class="doc-arrow">↓</span></a>` : '',
    contrato?.contrato_url ? `<a href="${esc(contrato.contrato_url)}" target="_blank" class="doc-btn"><div class="doc-icon">📜</div><span class="doc-label">Contrato assinado</span><span class="doc-arrow">↓</span></a>` : '',
    instalacao?.laudo_url ? `<a href="${esc(instalacao.laudo_url)}" target="_blank" class="doc-btn"><div class="doc-icon">🔧</div><span class="doc-label">Laudo de instalação</span><span class="doc-arrow">↓</span></a>` : '',
  ].filter(Boolean).join('') || '<p style="font-size:13px;color:#c4b5fd;margin-top:4px">Documentos serão disponibilizados em breve.</p>';

  const leitura = monitoramento?.leitura;
  const monitoramentoHTML = leitura ? `
      <div class="card">
        <div class="card-title">⚡ Monitoramento em Tempo Real</div>
        <div class="sys-grid">
          <div class="sys-item"><div class="sys-val">${Number(leitura.current_power_kw||0).toFixed(2)} kW</div><div class="sys-label">Gerando agora</div></div>
          <div class="sys-item"><div class="sys-val">${Number(leitura.today_yield_kwh||0).toFixed(1)} kWh</div><div class="sys-label">Geração hoje</div></div>
          <div class="sys-item"><div class="sys-val">${Number(leitura.month_yield_kwh||0).toFixed(0)} kWh</div><div class="sys-label">Geração no mês</div></div>
          <div class="sys-item"><div class="sys-val">${Number(leitura.total_yield_kwh||0).toFixed(0)} kWh</div><div class="sys-label">Total gerado</div></div>
        </div>
        <div style="font-size:10px;color:#9ca3af;margin-top:10px;text-align:center">Atualizado em ${leitura.captured_at ? new Date(leitura.captured_at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '—'}</div>
      </div>` : '';

  document.getElementById('app').innerHTML = `
    <div class="header">
      <img src="ser_logo.jpg" class="logo" alt="SER Energia Renovável">
      <div class="header-sub">Portal do Cliente</div>
    </div>

    <div class="welcome-card">
      <div class="welcome-name">Olá, ${esc(nome.split(' ')[0])} 👋</div>
      <div class="welcome-addr">📍 ${esc(endereco||'Seu projeto solar')}</div>
    </div>

    <div class="content">
      <div class="card">
        <div class="card-title">Acompanhe seu projeto</div>
        <div class="timeline">${timelineHTML}</div>
      </div>

      <div class="card">
        <div class="card-title">Seu sistema</div>
        <div class="sys-grid">
          <div class="sys-item"><div class="sys-val">${esc(potencia)}</div><div class="sys-label">Potência do sistema</div></div>
          <div class="sys-item"><div class="sys-val">${esc(economia)}</div><div class="sys-label">Economia/mês</div></div>
          <div class="sys-item" style="grid-column:1/-1"><div class="sys-val" style="font-size:14px">${esc(modulosQtd)} módulos${modulosSub?` <span style="font-size:12px;font-weight:400;color:#9ca3af">· ${esc(modulosSub)}</span>`:''}</div><div class="sys-label">Módulos fotovoltaicos</div></div>
          <div class="sys-item" style="grid-column:1/-1"><div class="sys-val" style="font-size:14px">${esc(inversorVal)}${inversorSub?` <span style="font-size:12px;font-weight:400;color:#9ca3af">· ${esc(inversorSub)}</span>`:''}</div><div class="sys-label">Inversor</div></div>
        </div>
      </div>
${monitoramentoHTML}
      <div class="card">
        <div class="card-title">Seus documentos</div>
        ${docsHTML}
      </div>
    </div>

    <div class="footer">
      <div class="footer-logo">SER Energia Renovável</div>
      <a href="${esc(waLink)}" class="wa-btn" target="_blank">💬 Falar com a SER</a>
    </div>
  `;
}

async function init(){
  if(!token){
    document.getElementById('app').innerHTML = `
      <div class="error-box">
        <div class="error-icon">🔒</div>
        <div class="error-msg">Link inválido.<br>Solicite um novo link à equipe SER.</div>
      </div>`;
    return;
  }

  let data;
  try{
    const res = await fetch(`${FUNCTION_URL}?token=${encodeURIComponent(token)}`);
    data = await res.json();
    if(!res.ok || data.error){
      throw new Error(data.error || 'not_found');
    }
  } catch(e) {
    document.getElementById('app').innerHTML = `
      <div class="error-box">
        <div class="error-icon">❌</div>
        <div class="error-msg">Link não encontrado ou expirado.<br>Entre em contato com a equipe SER.</div>
      </div>`;
    return;
  }

  render(data);
}

init();
