/* ============================================================
   HOMOLOGACAO MODAL
   ============================================================ */
function openHomologacaoModal(item=null){
  item = mergeChain(item || {});
  const linked = getLinkedDocs(item);
  const etapaOpts = [['aguardando_docs','Aguardando docs'],['projeto','Projeto'],['trt_art_pg','TRT/ART pago'],['parecer_acesso','Parecer de acesso'],['aumento_de_carga','Aumento de Carga'],['estudo_obra','Estudo/Obra na rede'],['vistoria_final','Vistoria final'],['aprovada','Aprovada'],['reprovada','Reprovada']];
  const docs = item.docs || {};
  const docKeys = ['procuracao','rg_cnh','contrato_assinado','fatura_ger','fatura_ben','arquivo_vist','datasheet_inv','datasheet_mod','analise_sombra','anexo_i','form_troca_padrao','art_trt','projeto_unifilar','memorial_tecnico','cert_inmetro','orcamento_conexao'];

  // ── Etapa tracker ──
  const etapaSeq = ['aguardando_docs','projeto','trt_art_pg','parecer_acesso','aumento_de_carga','estudo_obra','vistoria_final','aprovada'];
  const etapaInfo = {
    aguardando_docs:  {icon:'📋', label:'Aguardando Documentos'},
    projeto:          {icon:'📐', label:'Projeto'},
    trt_art_pg:       {icon:'💰', label:'TRT/ART Pago'},
    parecer_acesso:   {icon:'✅', label:'Parecer de Acesso'},
    aumento_de_carga: {icon:'🔌', label:'Aumento de Carga'},
    estudo_obra:      {icon:'🏗️', label:'Estudo/Obra na rede'},
    vistoria_final:   {icon:'🔍', label:'Vistoria Final'},
    aprovada:         {icon:'⚡', label:'Aprovada'},
  };
  function buildEtapaTrackerHTML(etapa){
    const isReprovada = etapa === 'reprovada';
    const idx = etapaSeq.indexOf(etapa);
    let html = '';
    etapaSeq.forEach((key, i)=>{
      const isDone    = !isReprovada && idx > i;
      const isCurrent = !isReprovada && idx === i;
      const info = etapaInfo[key];
      let bg, border, textColor, badgeStyle, badgeText;
      if(isDone){
        bg='#d1e7dd'; border='#a3cfbb'; textColor='#0f5132';
        badgeStyle='background:#0f5132;color:#fff'; badgeText='✓ Concluído';
      } else if(isCurrent){
        bg='#e3f0ff'; border='var(--primary)'; textColor='var(--primary)';
        badgeStyle='background:var(--primary);color:#fff'; badgeText='👈 Etapa atual';
      } else {
        bg='#f8f9fa'; border='#dee2e6'; textColor='#adb5bd';
        badgeStyle='background:#dee2e6;color:#6c757d'; badgeText='Pendente';
      }
      html += `<div class="hom-etapa-row" data-etapa="${key}" style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:${bg};border:1.5px solid ${border};border-radius:8px;margin-bottom:6px;cursor:pointer;transition:filter .15s" title="Clique para selecionar esta etapa">
        <span style="font-size:18px;flex-shrink:0">${info.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:700;color:${textColor}">${i+1}. ${info.label}</div>
        </div>
        <span style="${badgeStyle};border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;white-space:nowrap">${badgeText}</span>
      </div>`;
    });
    // Reprovada — row especial (fora da sequência)
    const repBg     = isReprovada ? 'background:#f8d7da;border:1.5px solid #842029' : 'background:#fff5f5;border:1.5px dashed #e57373';
    const repTxt    = isReprovada ? 'color:#842029;font-weight:700' : 'color:#e57373';
    const repBadge  = isReprovada
      ? `<span style="background:#842029;color:#fff;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;white-space:nowrap">❌ Reprovada</span>`
      : `<span style="background:#fce4ec;color:#c62828;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;white-space:nowrap">Marcar reprovada</span>`;
    html += `<div class="hom-etapa-row" data-etapa="reprovada" style="display:flex;align-items:center;gap:12px;padding:10px 14px;${repBg};border-radius:8px;margin-top:4px;cursor:pointer" title="Marcar como reprovada">
      <span style="font-size:18px;flex-shrink:0">❌</span>
      <div style="flex:1;min-width:0"><div style="font-size:12px;${repTxt}">Reprovada</div></div>
      ${repBadge}
    </div>`;
    return html;
  }

  // ── Equipamentos (herda do contrato / vistoria) ──
  const _c = linked.contrato || {};
  const _v = linked.vistoria  || {};
  const kwp      = item.kwp           || _c.kwp           || _v.kwp           || '';
  const qtdMod   = item.qtd_modulos   || _c.qtd_modulos   || '';
  const marcaMod  = item.marca_modulo  || _c.marca_modulo   || '';
  const potMod   = item.pot_modulo    || _c.pot_modulo    || '';
  const qtdInv   = item.qtd_inversores|| _c.qtd_inversores|| '';
  const marcaInv  = item.marca_inversor|| _c.marca_inversor || '';
  const potInv   = item.pot_inversor  || _c.pot_inversor  || '';

  // ── Google Maps ──
  const gmap = _c.gmap || _v.gmap || '';

  openModal(`
    <div class="modal-header"><h2>⚡ Homologação — ${esc(item.nome||'')}</h2><button class="modal-close">×</button></div>
    <form id="homForm">
      <div class="modal-body">

        ${gmap ? `<a href="${esc(gmap)}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#e8f5e9;border:2px solid #4caf50;border-radius:10px;text-decoration:none;color:#1b5e20;font-weight:700;font-size:14px;margin-bottom:14px">
          <span style="font-size:22px">📍</span>
          <span style="flex:1">Ver localização no Google Maps</span>
          <span style="font-size:12px;color:#388e3c;opacity:.8">↗ Abrir</span>
        </a>` : ''}

        <!-- Equipamentos do sistema -->
        <div style="background:#fff8e1;border:1.5px solid #ffc107;border-radius:10px;padding:12px 16px;margin-bottom:14px">
          <div style="font-size:11px;font-weight:700;color:#795548;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">⚙️ Equipamentos do Sistema</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="background:#fff;border-radius:7px;padding:10px 12px;border:1px solid #ffe082">
              <div style="font-size:10px;font-weight:700;color:#f57f17;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">☀️ Módulos</div>
              <div style="font-size:16px;font-weight:700;color:#333">${qtdMod?`${qtdMod}×`:'—'}</div>
              <div style="font-size:12px;color:#555">${esc(marcaMod||'Marca não informada')}</div>
              ${potMod?`<div style="font-size:11px;color:#888">${potMod} W/unid.</div>`:''}
            </div>
            <div style="background:#fff;border-radius:7px;padding:10px 12px;border:1px solid #ffe082">
              <div style="font-size:10px;font-weight:700;color:#1565c0;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">🔌 Inversores</div>
              <div style="font-size:16px;font-weight:700;color:#333">${qtdInv?`${qtdInv}×`:'—'}</div>
              <div style="font-size:12px;color:#555">${esc(marcaInv||'Marca não informada')}</div>
              ${potInv?`<div style="font-size:11px;color:#888">${potInv} kW/unid.</div>`:''}
            </div>
          </div>
          ${kwp?`<div style="margin-top:8px;text-align:center;font-size:15px;font-weight:700;color:var(--primary);background:#f1f8e9;border-radius:6px;padding:6px 12px">⚡ ${kwp} kWp total instalado</div>`:''}
        </div>

        <!-- Acompanhamento de etapas -->
        <div class="section" style="margin-bottom:14px">
          <div class="section-header"><h4>📊 Acompanhamento de Etapas</h4><span class="section-toggle">▼</span></div>
          <div class="section-body" style="padding:10px 0 4px">
            <div id="homEtapaTracker"></div>
            <select name="etapa" id="homEtapaSelect" style="display:none">
              ${etapaOpts.map(([v,l])=>`<option value="${v}"${v===(item.etapa||'aguardando_docs')?'selected':''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Técnico & Custos -->
        <div class="section collapsed" style="margin-bottom:14px">
          <div class="section-header"><h4>🔧 Técnico & Custos</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Google Maps URL',name:'gmap',value:item.gmap||gmap,full:true,placeholder:'Cole aqui o link do Google Maps'})}
            ${formField({label:'Técnico',name:'tecnico',value:item.tecnico,datalist:DL_TECNICO})}
            ${formField({label:'Concessionária',name:'concessionaria',value:item.concessionaria||_v.concessionaria||_c.concessionaria||''})}
            ${formField({label:'Valor TRT',name:'trt_val',type:'number',value:item.trt_val})}
            ${formField({label:'Valor ART',name:'art_val',type:'number',value:item.art_val})}
            ${formField({label:'Valor Técnico',name:'tecnico_val',type:'number',value:item.tecnico_val})}
            ${formField({label:'Estimado',name:'estimado',type:'number',value:item.estimado})}
            ${formField({label:'Pago',name:'pago',type:'number',value:item.pago})}
            ${formField({label:'Data Assinatura',name:'data_assinatura',type:'date',value:item.data_assinatura})}
            ${formField({label:'Data Ativação (homol.)',name:'data_ativacao',type:'date',value:item.data_ativacao,placeholder:'Data real da ativação'})}
          </div></div>
        </div>

        <!-- Dados do Homologador -->
        <div class="section collapsed" style="margin-bottom:14px">
          <div class="section-header"><h4>👤 Dados do Homologador</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Mesmo cliente?',name:'mesmo_cliente',type:'toggle',value:item.mesmo_cliente})}
            ${formField({label:'Nome Homologação',name:'hom_nome',value:item.hom_nome})}
            ${formField({label:'CPF Homologação',name:'hom_cpf',value:item.hom_cpf})}
            ${formField({label:'RG Homologação',name:'hom_rg',value:item.hom_rg})}
            ${formField({label:'Nascimento Hom.',name:'hom_nasc',type:'date',value:item.hom_nasc})}
          </div></div>
        </div>

        <!-- Dados gerais (leitura) + obs -->
        <div class="form-grid" style="margin-bottom:10px">
          ${formField({label:'Cliente',name:'_nome',value:item.nome,readonly:true})}
          ${formField({label:'kWp',name:'_kwp',value:item.kwp,readonly:true})}
          ${formField({label:'Vendedor',name:'_vendedor',value:item.vendedor,readonly:true})}
          ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
        </div>

        <div class="section" style="margin-top:14px"><div class="section-header"><h4>📑 Documentos</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${docKeys.map(k=>fileUploadBlock(k.replace(/_/g,' '), k, 'homologacoes', docs[k]||[], false)).join('')}
          </div></div>
        </div>
        ${renderLinkedDocBtns(linked)}
        ${histSection()}
      </div>
      <div class="modal-footer">
        ${isAdmin()?`<button type="button" class="btn btn-danger" id="delHomBtn">Excluir</button>`:''}
        ${canVerFinanceiro()?`<button type="button" class="btn btn-secondary" id="homProjFinBtn">💰 Financeiro</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>
  `,'lg');
  const form = $('#homForm');
  carregarHistorico($('#histList'), 'homologacoes', item.id);
  $('#homProjFinBtn')?.addEventListener('click', ()=>{
    const cont = linked.contrato || {};
    openProjetoFinanceiroModal(cont.id || item.contrato_id, item.nome || cont.nome || '');
  });

  // ── Etapa tracker — interação ──
  const trackerEl    = document.getElementById('homEtapaTracker');
  const etapaSelectEl = document.getElementById('homEtapaSelect');
  let activeEtapa = item.etapa || 'aguardando_docs';

  function refreshTracker(){
    trackerEl.innerHTML = buildEtapaTrackerHTML(activeEtapa);
    trackerEl.querySelectorAll('.hom-etapa-row').forEach(row=>{
      row.addEventListener('click', ()=>{
        activeEtapa = row.dataset.etapa;
        if(etapaSelectEl) etapaSelectEl.value = activeEtapa;
        refreshTracker();
      });
    });
  }
  refreshTracker();

  // ── Mesmo cliente: replica dados do contrato nos campos do homologador ──
  const _contrato = linked.contrato || {};
  function syncHomFields(fill){
    const map = {
      hom_nome: _contrato.nome       || '',
      hom_cpf:  _contrato.cpf        || '',
      hom_rg:   _contrato.rg         || '',
      hom_nasc: _contrato.nascimento || ''
    };
    Object.entries(map).forEach(([fname, val])=>{
      const el = form[fname];
      if(!el) return;
      if(fill){
        el.value    = val;
        el.readOnly = true;
        el.style.cssText = 'background:#f0ebfc;color:#5e35b1;cursor:not-allowed;';
      } else {
        el.readOnly  = false;
        el.style.cssText = '';
      }
    });
  }
  // Estado inicial (caso já salvo como mesmo_cliente=true)
  if(form.mesmo_cliente?.checked) syncHomFields(true);

  // ── Data Assinatura: herda do contrato vinculado se campo estiver vazio ──
  const _dtAssin = form.data_assinatura;
  if(_dtAssin && !_dtAssin.value && _contrato.data_assinatura){
    _dtAssin.value = _contrato.data_assinatura;
  }
  form.mesmo_cliente?.addEventListener('change', ()=> syncHomFields(form.mesmo_cliente.checked));

  attachLinkedDocListeners(linked);
  const docStore = {};
  docKeys.forEach(k=> docStore[k] = (docs[k]||[]).slice());
  attachFileUploads(form, docStore);
  const etapaHomMap = {aguardando_docs:'Aguardando docs', projeto:'Projeto', trt_art_pg:'TRT/ART pago',
    parecer_acesso:'Parecer de acesso', aumento_de_carga:'Aumento de carga', estudo_obra:'Estudo/Obra na rede',
    vistoria_final:'Vistoria final', aprovada:'Aprovada', reprovada:'Reprovada'};
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    ['trt_val','art_val','tecnico_val','estimado','pago'].forEach(k=>{ data[k] = data[k]!=null ? Number(data[k]) : null; });
    Object.keys(data).filter(k=>k.startsWith('_')).forEach(k=>delete data[k]);
    data.etapa = activeEtapa; // usa sempre o estado do tracker, não o select oculto
    data.docs = docStore;
    if(data.etapa==='aprovada' && !item.data_aprovacao) data.data_aprovacao = new Date().toISOString();
    const { error } = await supa.from('homologacoes').update(data).eq('id',item.id);
    if(error){ toast(error.message,'error'); return; }
    const mud = detectMudancas(item, data, [
      ['etapa','Etapa', v=>etapaHomMap[v]||v],
      ['tecnico','Técnico',null], ['concessionaria','Concessionária',null],
    ]);
    const acao = mud.some(m=>m.startsWith('Etapa')) ? (data.etapa==='aprovada'?'aprovado':data.etapa==='reprovada'?'reprovado':'etapa') : 'atualizado';
    await registrarHistorico('homologacoes', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');
    toast('Salvo','success'); await loadAll(); closeModal(); renderPipeline();
  });
  $('#delHomBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir?')) return;
    await supa.from('homologacoes').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal(); renderPipeline();
  });
}

/* ============================================================
   POS VENDA MODAL
   ============================================================ */
/* Cria um registro vazio (apenas dados básicos do cliente) numa das tabelas
   do funil e vincula o id de volta ao registro de posvenda. Usado para
   "destravar" clientes importados via CSV (sem histórico de funil), permitindo
   ao time preencher Proposta/Vistoria/Contrato/Logística/Instalação/Homologação
   depois, pelo modal de Pós Venda. */
const POSVENDA_LINK_CFG = {
  proposta:    { table:'propostas',   fk:'proposta_id',   open:()=>openPropostaModal,    extra:()=>({status:'em_aberto'}) },
  vistoria:    { table:'vistorias',   fk:'vistoria_id',   open:()=>openVistoriaModal,    extra:()=>({status:'realizada'}) },
  contrato:    { table:'contratos',   fk:'contrato_id',   open:()=>openContratoModal,    extra:()=>({status:'assinado'}) },
  logistica:   { table:'logistica',   fk:'logistica_id',  open:()=>openLogisticaModal,   extra:()=>({status:'entregue'}) },
  instalacao:  { table:'instalacoes', fk:'instalacao_id', open:()=>openInstalacaoModal,  extra:()=>({status:'concluida'}) },
  homologacao: { table:'homologacoes',fk:'homologacao_id',open:()=>openHomologacaoModal, extra:()=>({etapa:'aprovada'}) },
};
async function criarRegistroVinculadoPosVenda(tipo, posItem){
  const cfg = POSVENDA_LINK_CFG[tipo];
  if(!cfg) return null;

  // Evita duplicar: se já existe um registro com o mesmo nome (cliente
  // importado sem cadeia de FKs), apenas vincula em vez de criar outro.
  const nome = (posItem.nome||'').toLowerCase().trim();
  const existente = nome ? (State[cfg.table]||[]).find(x=>(x.nome||'').toLowerCase().trim()===nome) : null;
  if(existente){
    const { error: linkErr } = await supa.from('posvenda').update({ [cfg.fk]: existente.id }).eq('id', posItem.id);
    if(linkErr){ toast('Erro ao vincular registro existente: '+linkErr.message,'error'); return null; }
    toast('Registro existente encontrado e vinculado! ✓','success');
    await loadAll();
    return existente.id;
  }

  const payload = {
    nome: posItem.nome,
    telefone: posItem.telefone,
    vendedor: posItem.vendedor,
    kwp: posItem.kwp,
    criado_por: State.user?.id,
    ...cfg.extra(),
  };
  const { data, error } = await supa.from(cfg.table).insert(payload).select('id').single();
  if(error){ toast('Erro ao criar registro: '+error.message,'error'); return null; }
  const { error: linkErr } = await supa.from('posvenda').update({ [cfg.fk]: data.id }).eq('id', posItem.id);
  if(linkErr){ toast('Registro criado, mas erro ao vincular: '+linkErr.message,'error'); }
  await registrarHistorico(cfg.table, data.id, 'criado', `Registro criado a partir do Pós Venda (cliente importado): ${posItem.nome||''}`);
  await loadAll();
  return data.id;
}

function openPosVendaModal(item=null){
  item = item || {};
  const linked = getLinkedDocsByNome(item);
  const statusOpts = [['ativo','Ativo'],['inativo','Inativo'],['manutencao','Manutenção']];

  // Resolve dados vinculados
  const lead      = (State.leads||[]).find(l=>String(l.id)===String(item.lead_id||linked.contrato?.lead_id));
  const instalacao= linked.instalacao || {};
  const contrato  = linked.contrato   || {};
  const logistica = linked.logistica  || {};
  const vistoria  = (State.vistorias||[]).find(v=>String(v.id)===String(contrato.vistoria_id)) || {};
  const nomeKey = (item.nome||'').toLowerCase().trim();
  const homologacao = (State.homologacoes||[]).find(h=>String(h.id)===String(item.homologacao_id))
                    || (nomeKey ? (State.homologacoes||[]).find(h=>(h.nome||'').toLowerCase().trim()===nomeKey) : null)
                    || null;
  const instDate  = instalacao.data_instalacao;

  // Helpers de data
  const todayMs = new Date(); todayMs.setHours(0,0,0,0);
  function addD(dateStr,n){ if(!dateStr)return null; const d=new Date(dateStr+'T12:00:00'); d.setDate(d.getDate()+n); return d; }
  function diff(d){ if(!d)return null; const t=new Date(d); t.setHours(0,0,0,0); return Math.round((t-todayMs)/86400000); }
  function fmtD(d){ return d?new Date(d).toLocaleDateString('pt-BR'):'—'; }
  function diffBadge(d, done){
    const dv=diff(d);
    if(done||dv<0) return `<span class="flag countdown done">✓ Feito</span>`;
    if(dv===0)     return `<span class="flag countdown urgent">HOJE!</span>`;
    if(dv<=7)      return `<span class="flag countdown urgent">${dv}d</span>`;
    return `<span class="flag countdown">${dv}d</span>`;
  }
  function pvRow(icon,label,sub,targetDate,checkName,checked){
    const dv=diff(targetDate);
    const done=checked||(dv!==null&&dv<0);
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f8f6fc;border-radius:8px;border:1px solid #e2daea;margin-bottom:6px">
      <span style="font-size:20px">${icon}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:600">${label}</div>
        <div style="font-size:11px;color:var(--text-light)">${sub}</div>
      </div>
      ${targetDate?diffBadge(targetDate,done):'<span style="font-size:11px;color:#aaa">sem data</span>'}
      ${checkName && !done?`<input type="checkbox" name="${checkName}" style="width:18px;height:18px;accent-color:var(--primary);cursor:pointer;flex-shrink:0" title="Marcar como feito">`:''}
      ${checkName && done?`<input type="checkbox" name="${checkName}" checked style="display:none">`:''}
    </div>`;
  }
  function statusRow(icon,label,s){
    if(!s)return '';
    const bg=/aprovada|assinado|conclu|comprado|ativo|realiz|entregue|pago/.test(s)?'#d1e7dd':/reprova|perdido|recusad|cancel/.test(s)?'#f8d7da':'#ccfbf1';
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:${bg};border-radius:6px;font-size:12px;font-weight:500;margin-bottom:4px">${icon} ${label}: <strong style="margin-left:4px">${s}</strong></div>`;
  }

  // Aniversário — sempre renderiza (com ou sem data de nascimento)
  // Fallback: lead → contrato (caso nascimento só esteja preenchido no contrato)
  const nascimento = lead?.nascimento || contrato?.nascimento || null;
  let nextBday = null;
  let bdaySub  = 'Data de nascimento não registrada';
  if(nascimento){
    const bday = new Date(nascimento+'T12:00:00');
    const next = new Date(todayMs.getFullYear(), bday.getMonth(), bday.getDate());
    if(next < todayMs) next.setFullYear(todayMs.getFullYear()+1);
    nextBday = next;
    bdaySub  = `Nascimento: ${fmtD(nascimento)} → Próximo: ${next.toLocaleDateString('pt-BR')}`;
  }

  openModal(`
    <div class="modal-header"><h2>Pós Venda — ${esc(item.nome||'')}</h2><button class="modal-close">×</button></div>
    <form id="pvForm">
      <div class="modal-body">
        <div class="form-grid">
          ${formField({label:'Cliente',name:'_nome',value:item.nome,readonly:true})}
          ${formField({label:'kWp',name:'_kwp',value:item.kwp,readonly:true})}
          ${formField({label:'Vendedor',name:'_vendedor',value:item.vendedor,readonly:true})}
          ${formField({label:'Status',name:'status',type:'select',value:item.status||'ativo',options:statusOpts})}
          ${formField({label:'Data Ativação',name:'data_ativacao',type:'date',value:item.data_ativacao})}
          ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
        </div>

        <!-- Histórico do funil -->
        <div class="section collapsed" style="margin-top:12px">
          <div class="section-header"><h4>📋 Histórico do Funil</h4><span class="section-toggle">▼</span></div>
          <div class="section-body" style="padding:10px 0 4px">
            ${statusRow('🔍','Vistoria',vistoria.resultado||vistoria.status)}
            ${statusRow('✍️','Contrato',contrato.status)}
            ${statusRow('📦','Logística',logistica.status)}
            ${statusRow('🔧','Instalação',instalacao.status)}
          </div>
        </div>

        <!-- Acompanhamento pós-venda -->
        <div class="section" style="margin-top:12px">
          <div class="section-header"><h4>⏰ Acompanhamento</h4><span class="section-toggle">▼</span></div>
          <div class="section-body" style="padding:10px 0 4px">
            ${pvRow('🎂','Aniversário',bdaySub,nextBday,null,false)}
            ${pvRow('🛡️','Manutenção preventiva (300 dias)',
              instDate?`Instalação: ${fmtD(instDate)} → Vence: ${fmtD(addD(instDate,300))}`:'Data de instalação não registrada',
              addD(instDate,300),null,false)}
            ${pvRow('🤝','Acolhimento (5 dias)',
              instDate?`Instalação: ${fmtD(instDate)} → Contato: ${fmtD(addD(instDate,5))}`:'Data de instalação não registrada',
              addD(instDate,5),'check_5d',!!item.check_5d)}
            ${pvRow('💛','Gratidão (30 dias)',
              instDate?`Instalação: ${fmtD(instDate)} → Contato: ${fmtD(addD(instDate,30))}`:'Data de instalação não registrada',
              addD(instDate,30),'check_30d',!!item.check_30d)}
            ${pvRow('🌟','Embaixador (90 dias)',
              instDate?`Instalação: ${fmtD(instDate)} → Contato: ${fmtD(addD(instDate,90))}`:'Data de instalação não registrada',
              addD(instDate,90),'check_90d',!!item.check_90d)}
          </div>
        </div>

        ${(()=>{
          const pendentes = [
            !linked.proposta    && {key:'proposta',    icon:'📄', label:'Proposta'},
            !linked.vistoria    && {key:'vistoria',    icon:'🔍', label:'Vistoria'},
            !linked.contrato    && {key:'contrato',    icon:'✍️', label:'Contrato'},
            !linked.logistica   && {key:'logistica',   icon:'📦', label:'Logística'},
            !linked.instalacao  && {key:'instalacao',  icon:'🔧', label:'Instalação'},
            !homologacao        && {key:'homologacao', icon:'⚡', label:'Homologação'},
          ].filter(Boolean);
          if(!pendentes.length) return '';
          return `
          <div class="section" style="margin-top:12px">
            <div class="section-header"><h4>➕ Cadastros Pendentes</h4><span class="section-toggle">▼</span></div>
            <div class="section-body" style="padding:10px 0 4px">
              <p style="font-size:12px;color:var(--text-light);margin:0 0 8px">Cliente importado da base antiga — crie os registros abaixo para completar o histórico do funil:</p>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                ${pendentes.map(p=>`<button type="button" class="btn btn-secondary btn-sm" data-create-link="${p.key}">➕ ${p.icon} Criar ${p.label}</button>`).join('')}
              </div>
            </div>
          </div>`;
        })()}
        ${renderLinkedDocBtns({...linked, homologacao})}
        ${histSection()}
      </div>
      <div class="modal-footer">
        ${canVerFinanceiro()?`<button type="button" class="btn btn-secondary" id="pvProjFinBtn">💰 Financeiro</button>`:''}
        ${isAdmin()?`<button type="button" class="btn btn-danger" id="delPvBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>
  `);
  const form = $('#pvForm');
  const pvContrato = linked.contrato || {};
  $('#pvProjFinBtn')?.addEventListener('click', ()=> openProjetoFinanceiroModal(pvContrato.id, item.nome||''));
  attachLinkedDocListeners({...linked, homologacao});
  carregarHistorico($('#histList'), 'posvenda', item.id);
  $$('[data-create-link]').forEach(b=>b.addEventListener('click', async ()=>{
    const tipo = b.dataset.createLink;
    b.disabled = true; b.textContent = 'Criando...';
    const newId = await criarRegistroVinculadoPosVenda(tipo, item);
    if(!newId){ b.disabled = false; return; }
    toast('Registro criado! Preencha os dados.','success');
    const cfg = POSVENDA_LINK_CFG[tipo];
    const novoItem = (State[cfg.table]||[]).find(x=>String(x.id)===String(newId));
    closeModal();
    cfg.open()(novoItem);
  }));
  const statusPvMap = {ativo:'Ativo', inativo:'Inativo', manutencao:'Manutenção'};
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    Object.keys(data).filter(k=>k.startsWith('_')).forEach(k=>delete data[k]);
    const { error } = await supa.from('posvenda').update(data).eq('id',item.id);
    if(error) return toast(error.message,'error');
    const mud = detectMudancas(item, data, [
      ['status','Status', v=>statusPvMap[v]||v],
      ['data_ativacao','Data Ativação',null],
      ['check_5d','Acolhimento (5d)', v=>v?'✓ Feito':'Pendente'],
      ['check_30d','Gratidão (30d)', v=>v?'✓ Feito':'Pendente'],
      ['check_90d','Embaixador (90d)', v=>v?'✓ Feito':'Pendente'],
    ]);
    const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
    await registrarHistorico('posvenda', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');
    toast('Salvo','success'); await loadAll(); closeModal(); renderPipeline();
  });
  $('#delPvBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir?')) return;
    await supa.from('posvenda').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal(); renderPipeline();
  });
}

/* ============================================================
   REMARKETING
   ============================================================ */
async function renderRemarketing(){
  await loadTable('remarketing');
  let items = filterByVendor(State.remarketing);
  $('#pageActions').innerHTML = `<input type="text" id="searchRem" placeholder="Buscar…" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px"/>`;
  $('#content').innerHTML = `
    <div class="card">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Telefone</th><th>Motivo</th><th>Reativação</th><th>Vendedor</th><th>Status</th><th></th></tr></thead>
          <tbody id="remBody">
            ${items.length?items.map(r=>`
              <tr>
                <td>${esc(r.nome||'')}</td>
                <td>${esc(r.telefone||'')}</td>
                <td>${esc((r.motivo_perda||'').replace(/_/g,' '))}</td>
                <td>${fmtDate(r.data_reativacao)}</td>
                <td>${esc(r.vendedor||'')}</td>
                <td>${badge(r.status)}</td>
                <td class="row-actions">
                  <button class="btn btn-sm btn-secondary" data-edit="${r.id}">Abrir</button>
                  <button class="btn btn-sm btn-primary" data-react="${r.id}">Reativar</button>
                </td>
              </tr>`).join(''):`<tr><td colspan="7" class="empty">Nenhum item.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
  $$('[data-edit]').forEach(b=>b.addEventListener('click', ()=> openRemarketingModal(items.find(x=>String(x.id)===b.dataset.edit))));
  $$('[data-react]').forEach(b=>b.addEventListener('click', async ()=>{
    const r = items.find(x=>String(x.id)===b.dataset.react);
    if(!r) return;

    const confirmado = await new Promise(resolve => {
      openModal(`
        <div style="text-align:center;padding:8px 0 4px;max-width:320px;margin:0 auto">
          <div style="font-size:32px;margin-bottom:12px">🔁</div>
          <h3 style="margin:0 0 8px">Reativar lead?</h3>
          <p style="color:#555;font-size:13px;margin:0 0 24px">
            <strong>${esc(r.nome)}</strong> voltará para a aba
            <strong>Lead</strong> do pipeline.
          </p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-secondary" id="cancelReact">Não, cancelar</button>
            <button class="btn" id="confirmReact" style="background:#6B21A8;color:#fff">Sim, reativar</button>
          </div>
        </div>
      `);
      $('#confirmReact')?.addEventListener('click', () => { closeModal(); resolve(true); });
      $('#cancelReact')?.addEventListener('click',  () => { closeModal(); resolve(false); });
    });
    if(!confirmado) return;

    let leadId = r.lead_id;
    if(leadId){
      await supa.from('leads').update({ status:'em_contato', motivo_perda:null, remarketing:true }).eq('id',leadId);
    } else {
      // Tenta encontrar lead existente pelo telefone ou nome antes de criar um novo
      let leadExistente = null;
      if(r.telefone){
        const { data: found } = await supa.from('leads').select('id').eq('telefone', r.telefone).maybeSingle();
        leadExistente = found;
      }
      if(!leadExistente && r.nome){
        const { data: found } = await supa.from('leads').select('id').eq('nome', r.nome).maybeSingle();
        leadExistente = found;
      }
      if(leadExistente){
        leadId = leadExistente.id;
        await supa.from('leads').update({ status:'em_contato', motivo_perda:null, remarketing:true }).eq('id',leadId);
      } else {
        const { data: novoLead, error: eLead } = await supa.from('leads').insert({
          nome: r.nome, telefone: r.telefone, vendedor: r.vendedor,
          status: 'em_contato', remarketing: true,
          criado_por: State.user?.id
        }).select('id').single();
        if(eLead) return toast(eLead.message,'error');
        leadId = novoLead.id;
      }
    }
    await supa.from('remarketing').update({ status:'reativado', lead_id: leadId }).eq('id',r.id);
    await loadAll();
    toast('Lead reativado ✓ Redirecionando para o pipeline…','success');
    navigate('pipeline');
  }));
  $('#searchRem')?.addEventListener('input', e=>{
    const q = e.target.value.toLowerCase();
    $$('#remBody tr').forEach(tr => tr.style.display = tr.textContent.toLowerCase().includes(q)?'':'none');
  });
}

function openRemarketingModal(item){
  if(!item) return;
  const statusOpts = [['pendente','Pendente'],['em_contato','Em contato'],['reativado','Reativado'],['descartado','Descartado']];
  openModal(`
    <div class="modal-header"><h2>Remarketing — ${esc(item.nome||'')}</h2><button class="modal-close">×</button></div>
    <form id="remForm">
      <div class="modal-body">
        <div class="form-grid">
          ${formField({label:'Nome',name:'nome',value:item.nome,readonly:true})}
          ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
          ${formField({label:'Motivo perda',name:'motivo_perda',value:item.motivo_perda,readonly:true})}
          ${formField({label:'Data reativação',name:'data_reativacao',type:'date',value:item.data_reativacao})}
          ${formField({label:'Vendedor',name:'vendedor',value:item.vendedor})}
          ${formField({label:'Status',name:'status',type:'select',value:item.status,options:statusOpts})}
          ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
        </div>
        ${renderContactLog(item.id,'remark')}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>
  `,'lg');
  attachContactLog(item.id,'remark');
  const form = $('#remForm');
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    delete data.nome; delete data.motivo_perda;
    const { error } = await supa.from('remarketing').update(data).eq('id',item.id);
    if(error) return toast(error.message,'error');
    toast('Salvo','success'); closeModal(); renderRemarketing();
  });
}

/* ============================================================
   CALCULADORA DE BATERIAS
   ============================================================ */
const BAT_EQUIPAMENTOS = [
  { icon:'💡', nome:'Iluminação LED', detalhe:'10 pontos de luz', potencia:100, qtd:1, horas:6 },
  { icon:'🌡️', nome:'Ar-condicionado 9.000 BTU', detalhe:'~700W médio', potencia:700, qtd:1, horas:4 },
  { icon:'🌡️', nome:'Ar-condicionado 12.000 BTU', detalhe:'~1100W médio', potencia:1100, qtd:1, horas:4 },
  { icon:'❄️', nome:'Geladeira (comum)', detalhe:'~150W médio', potencia:150, qtd:1, horas:6 },
  { icon:'❄️', nome:'Geladeira (duplex/frost-free)', detalhe:'~200W médio', potencia:200, qtd:1, horas:6 },
  { icon:'📺', nome:'Televisão 50"', detalhe:'~150W', potencia:150, qtd:1, horas:4 },
  { icon:'🌀', nome:'Ventilador de teto', detalhe:'~70W', potencia:70, qtd:2, horas:6 },
  { icon:'💻', nome:'Computador / Monitor', detalhe:'~200W', potencia:200, qtd:1, horas:4 },
  { icon:'📶', nome:'Roteador / Internet', detalhe:'~20W', potencia:20, qtd:1, horas:6 },
  { icon:'🔌', nome:"Bomba d'água", detalhe:'~500W', potencia:500, qtd:1, horas:2 },
  { icon:'🔒', nome:'CFTV / Câmeras', detalhe:'~80W (gravador + 4 câm)', potencia:80, qtd:1, horas:6 },
  { icon:'💊', nome:'Aparelho médico (CPAP)', detalhe:'~50W', potencia:50, qtd:1, horas:6 },
];
const BAT_CAPACIDADE_UNIDADE = 5; // kWh por bateria
const BAT_AUTONOMIAS = [
  {h:2, label:'Proteção básica'}, {h:4, label:'Uso diurno'}, {h:6, label:'Noite parcial'},
  {h:8, label:'Noite completa'}, {h:12, label:'12 horas'}, {h:24, label:'Dia completo'},
];

function renderBaterias(){
  $('#pageActions').innerHTML = '';
  let autonomiaHoras = 6;
  let customItems = [];
  let ultimoCalculo = null;

  $('#content').innerHTML = `
    <div class="card" style="max-width:1000px;margin:0 auto">
      <div style="margin-bottom:18px">
        <h2 style="font-size:21px;font-weight:800;color:var(--primary);margin-bottom:4px">🔋 Calculadora de Baterias</h2>
        <p style="font-size:13px;color:var(--text-light);line-height:1.6">Preencha os dados do cliente, selecione as cargas prioritárias e o tempo de autonomia desejado para dimensionar o banco de baterias do sistema híbrido.</p>
      </div>

      <div class="section">
        <div class="section-header"><h4>👤 Dados do Cliente</h4><span class="section-toggle">▼</span></div>
        <div class="section-body"><div class="form-grid">
          ${formField({label:'Nome do Cliente',name:'bat_nome',placeholder:'Ex.: João Silva'})}
          ${formField({label:'Cidade / Bairro',name:'bat_cidade',placeholder:'Ex.: Ananindeua, PA'})}
        </div></div>
      </div>

      <div class="section">
        <div class="section-header"><h4>⏱️ Tempo de Autonomia Desejado</h4><span class="section-toggle">▼</span></div>
        <div class="section-body">
          <p style="font-size:12.5px;color:var(--text-light);margin-bottom:12px">Quanto tempo as cargas prioritárias devem continuar funcionando durante a falta de energia?</p>
          <div class="bat-autonomia-grid" id="batAutonomiaGrid"></div>
        </div>
      </div>

      <div class="section">
        <div class="section-header"><h4>🔌 Cargas Prioritárias</h4><span class="section-toggle">▼</span></div>
        <div class="section-body">
          <p style="font-size:12.5px;color:var(--text-light);margin-bottom:14px">Marque os equipamentos que devem continuar funcionando durante a falta de energia. Ajuste a quantidade e as horas de uso (dentro da autonomia).</p>
          <table class="bat-table">
            <thead><tr>
              <th style="width:36%">Equipamento</th>
              <th style="width:14%;text-align:center">Qtd.</th>
              <th style="width:18%;text-align:center">Potência (W)</th>
              <th style="width:18%;text-align:center">Horas de uso</th>
              <th style="width:14%;text-align:center">Ativo</th>
            </tr></thead>
            <tbody id="batCargasBody"></tbody>
          </table>
          <div id="batCustomContainer"></div>
          <button type="button" class="btn-add-file" id="batAddCustomBtn" style="margin-top:12px">+ Adicionar equipamento personalizado</button>
          <div class="alert" id="batAlertaSemCarga" style="display:none;margin-top:12px;background:#fee2e2;color:#991b1b;padding:10px 14px;border-radius:8px;font-size:12.5px;font-weight:600">⚠️ Selecione ao menos uma carga prioritária para calcular.</div>
        </div>
      </div>

      <div style="display:flex;gap:10px;margin:18px 0;flex-wrap:wrap">
        <button type="button" class="btn btn-primary" id="batCalcularBtn">⚡ Calcular Baterias</button>
        <button type="button" class="btn btn-secondary" id="batLimparBtn">↺ Limpar tudo</button>
      </div>

      <div id="batResultadoWrap" style="display:none">
        <div class="section">
          <div class="section-header"><h4>✓ Resultado do Dimensionamento</h4><span class="section-toggle">▼</span></div>
          <div class="section-body">
            <div class="bat-resultado-main">
              <div class="bat-res-card">
                <div class="nome">Energia Total Necessária</div>
                <div class="valor" id="batResEnergia">—</div>
                <div class="unidade">kWh</div>
              </div>
              <div class="bat-res-card destaque">
                <div class="nome">Nº de Baterias (${BAT_CAPACIDADE_UNIDADE} kWh)</div>
                <div class="valor" id="batResBaterias">—</div>
                <div class="unidade">unidades</div>
              </div>
              <div class="bat-res-card">
                <div class="nome">Capacidade Total</div>
                <div class="valor" id="batResCapacidade">—</div>
                <div class="unidade">kWh instalados</div>
              </div>
            </div>
            <table class="bat-detail-table">
              <thead><tr>
                <th>Equipamento</th><th style="text-align:center">Qtd.</th>
                <th style="text-align:center">Pot. Unit. (W)</th><th style="text-align:center">Horas</th>
                <th style="text-align:right">Consumo (Wh)</th>
              </tr></thead>
              <tbody id="batDetalheBody"></tbody>
            </table>
            <div class="bat-nota" id="batNotaBox"></div>
            <div style="margin-top:16px">
              <button type="button" class="btn btn-primary" id="batPdfBtn">🖨️ Gerar Relatório PDF</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Seções colapsáveis (fora de modal — precisa bind manual) ──
  $$('#content .section-header').forEach(h=>{
    h.addEventListener('click', ()=> h.parentElement.classList.toggle('collapsed'));
  });

  // ── Autonomia ──
  const autGrid = $('#batAutonomiaGrid');
  function renderAutonomiaCards(){
    autGrid.innerHTML = BAT_AUTONOMIAS.map(a=>`
      <div class="bat-autonomia-card${a.h===autonomiaHoras?' selected':''}" data-horas="${a.h}">
        <div class="horas">${a.h}h</div>
        <div class="label">${a.label}${a.h===autonomiaHoras?' ✓':''}</div>
      </div>`).join('');
    $$('.bat-autonomia-card', autGrid).forEach(card=>{
      card.addEventListener('click', ()=>{
        autonomiaHoras = Number(card.dataset.horas);
        renderAutonomiaCards();
        // ajusta horas de uso para não ultrapassar a autonomia
        $$('[id^="batHor_"]').forEach(inp=>{
          inp.max = autonomiaHoras;
          if(parseFloat(inp.value) > autonomiaHoras) inp.value = autonomiaHoras;
        });
        $$('[data-bh]', $('#batCustomContainer')).forEach(inp=>{
          inp.max = autonomiaHoras;
          if(parseFloat(inp.value) > autonomiaHoras) inp.value = autonomiaHoras;
        });
      });
    });
  }
  renderAutonomiaCards();

  // ── Cargas padrão ──
  const cargasBody = $('#batCargasBody');
  cargasBody.innerHTML = BAT_EQUIPAMENTOS.map((eq,i)=>`
    <tr class="bat-row" style="opacity:.45" data-row="${i}">
      <td><div class="equip-name"><span class="equip-icon">${eq.icon}</span>
        <div><div class="equip-label">${esc(eq.nome)}</div><div class="equip-default">${esc(eq.detalhe)}</div></div>
      </div></td>
      <td><div class="bat-qty-control">
        <button type="button" class="bat-qty-btn" data-qty-dec="${i}">−</button>
        <span class="bat-qty-val" id="batQty_${i}">${eq.qtd}</span>
        <button type="button" class="bat-qty-btn" data-qty-inc="${i}">+</button>
      </div></td>
      <td><input class="bat-input-small" type="number" id="batPot_${i}" value="${eq.potencia}" min="1" max="99999"></td>
      <td><input class="bat-input-small" type="number" id="batHor_${i}" value="${eq.horas}" min="0.5" max="${autonomiaHoras}" step="0.5"></td>
      <td class="bat-toggle-col"><input type="checkbox" class="bat-toggle-check" id="batChk_${i}" data-toggle="${i}"></td>
    </tr>`).join('');

  $$('[data-toggle]', cargasBody).forEach(chk=>{
    chk.addEventListener('change', ()=>{
      const row = chk.closest('tr');
      row.style.opacity = chk.checked ? '1' : '.45';
    });
  });
  $$('[data-qty-dec]', cargasBody).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const el = $(`#batQty_${btn.dataset.qtyDec}`);
      el.textContent = Math.max(0, parseInt(el.textContent)-1);
    });
  });
  $$('[data-qty-inc]', cargasBody).forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const el = $(`#batQty_${btn.dataset.qtyInc}`);
      el.textContent = parseInt(el.textContent)+1;
    });
  });

  // ── Itens personalizados ──
  const customContainer = $('#batCustomContainer');
  function renderCustom(){
    customContainer.innerHTML = customItems.map((item,i)=>`
      <div class="bat-custom-row" data-custom="${i}">
        <input type="text" data-bn="${i}" placeholder="Nome do equipamento" value="${esc(item.nome)}">
        <input type="number" data-bp="${i}" placeholder="W" value="${item.potencia}" min="1" max="99999" title="Potência em Watts">
        <input type="number" data-bq="${i}" placeholder="Qtd" value="${item.qtd}" min="1" max="99" title="Quantidade">
        <input type="number" data-bh="${i}" placeholder="h" value="${item.horas}" min="0.5" max="${autonomiaHoras}" step="0.5" title="Horas de uso">
        <button type="button" class="bat-remove-btn" data-rmcustom="${i}" title="Remover">✕</button>
      </div>`).join('');
    $$('[data-rmcustom]', customContainer).forEach(b=>{
      b.addEventListener('click', ()=>{ customItems.splice(Number(b.dataset.rmcustom),1); renderCustom(); });
    });
  }
  $('#batAddCustomBtn').addEventListener('click', ()=>{
    customItems.push({ nome:'', potencia:100, horas:autonomiaHoras, qtd:1 });
    renderCustom();
  });

  // ── Calcular ──
  $('#batCalcularBtn').addEventListener('click', ()=>{
    $('#batAlertaSemCarga').style.display = 'none';
    let cargas = [];

    BAT_EQUIPAMENTOS.forEach((eq,i)=>{
      const chk = $(`#batChk_${i}`);
      if(!chk.checked) return;
      const qty = parseInt($(`#batQty_${i}`).textContent)||0;
      const pot = parseFloat($(`#batPot_${i}`).value)||0;
      const hor = parseFloat($(`#batHor_${i}`).value)||0;
      if(qty>0 && pot>0 && hor>0) cargas.push({ nome:eq.nome, icon:eq.icon, qtd:qty, potencia:pot, horas:hor });
    });

    customItems.forEach((_,i)=>{
      const nome = customContainer.querySelector(`[data-bn="${i}"]`)?.value || 'Equipamento personalizado';
      const pot  = parseFloat(customContainer.querySelector(`[data-bp="${i}"]`)?.value)||0;
      const qtd  = parseInt(customContainer.querySelector(`[data-bq="${i}"]`)?.value)||1;
      const hor  = parseFloat(customContainer.querySelector(`[data-bh="${i}"]`)?.value)||0;
      if(pot>0 && hor>0) cargas.push({ nome, icon:'🔌', qtd, potencia:pot, horas:hor });
    });

    if(cargas.length === 0){
      $('#batAlertaSemCarga').style.display = 'block';
      return;
    }

    let totalWh = 0;
    cargas.forEach(c=> totalWh += c.qtd*c.potencia*c.horas);

    const fatorSeguranca = 1.20; // perdas + temperatura + derating
    const dod = 0.80;            // profundidade de descarga (baterias de lítio)
    const energiaCorrigida = (totalWh*fatorSeguranca)/dod;
    const capacidadeBateriaWh = BAT_CAPACIDADE_UNIDADE*1000;
    const numBaterias = Math.ceil(energiaCorrigida/capacidadeBateriaWh);
    const capacidadeTotal = numBaterias*BAT_CAPACIDADE_UNIDADE;

    $('#batResEnergia').textContent = (energiaCorrigida/1000).toFixed(2);
    $('#batResBaterias').textContent = numBaterias;
    $('#batResCapacidade').textContent = capacidadeTotal;

    const detBody = $('#batDetalheBody');
    detBody.innerHTML = cargas.map(c=>{
      const consumo = c.qtd*c.potencia*c.horas;
      return `<tr><td>${c.icon} ${esc(c.nome)}</td><td style="text-align:center">${c.qtd}</td>
        <td style="text-align:center">${c.potencia}</td><td style="text-align:center">${c.horas}h</td>
        <td style="text-align:right">${consumo.toFixed(0)} Wh</td></tr>`;
    }).join('') + `<tr class="total"><td colspan="4" style="text-align:right;padding-right:16px">Consumo bruto total</td><td style="text-align:right">${totalWh.toFixed(0)} Wh</td></tr>`;

    $('#batNotaBox').innerHTML = `<strong>📐 Metodologia de cálculo:</strong><br>
      Consumo bruto: <strong>${totalWh.toFixed(0)} Wh</strong> &nbsp;|&nbsp;
      Fator de segurança: <strong>+20%</strong> (perdas + temperatura) &nbsp;|&nbsp;
      DOD (profundidade de descarga): <strong>80%</strong> (baterias de lítio) &nbsp;|&nbsp;
      Energia necessária líquida: <strong>${(energiaCorrigida/1000).toFixed(2)} kWh</strong><br>
      Autonomia configurada: <strong>${autonomiaHoras}h</strong> &nbsp;|&nbsp; Capacidade por bateria: <strong>${BAT_CAPACIDADE_UNIDADE} kWh</strong>`;

    ultimoCalculo = { cargas, totalWh, energiaCorrigida, numBaterias, capacidadeTotal, autonomiaHoras };

    $('#batResultadoWrap').style.display = '';
    $('#batResultadoWrap').scrollIntoView({behavior:'smooth', block:'start'});
  });

  // ── Limpar ──
  $('#batLimparBtn').addEventListener('click', async ()=>{
    if(!await confirmDel('Deseja limpar todos os dados preenchidos?')) return;
    autonomiaHoras = 6;
    customItems = [];
    ultimoCalculo = null;
    renderBaterias();
  });

  // ── PDF ──
  $('#batPdfBtn').addEventListener('click', ()=>{
    if(!ultimoCalculo) return;
    const cliente = $('#content [name="bat_nome"]')?.value || '';
    const cidade  = $('#content [name="bat_cidade"]')?.value || '';
    abrirBateriaPDF(ultimoCalculo, cliente, cidade, true);
  });
}

/* ============================================================
   RELATÓRIO DE DIMENSIONAMENTO DE BATERIAS — HTML/PDF
   ============================================================ */
function abrirBateriaPDF(calc, cliente, cidade, imprimir=false){
  const hoje = new Date().toLocaleDateString('pt-BR');
  const win = window.open('','_blank');
  if(!win){ alert('Popup bloqueado. Permita popups para este site.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Dimensionamento de Baterias — ${esc(cliente||'Cliente')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;background:#f0eaf8;color:#111;padding:20px}
.print-bar{position:sticky;top:0;z-index:100;background:#fff;padding:10px 20px;border-bottom:2px solid #4B0082;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.print-bar span{font-size:13px;color:#4B0082;font-weight:700}
.print-bar button{background:#4B0082;color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.wrap{max-width:820px;margin:0 auto;background:#fff;padding:36px 44px;box-shadow:0 2px 16px rgba(0,0,0,.1)}
.doc-header{text-align:center;margin-bottom:20px}
.doc-header img{height:60px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto}
.doc-header h1{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1a0a2e}
.doc-header .sub{font-size:10px;color:#666;margin-top:4px;letter-spacing:.06em;text-transform:uppercase}
hr.rule{border:none;border-top:2px solid #6B21A8;margin:14px 0 20px}
.id-box{background:#f5f0fc;border-left:4px solid #6B21A8;border-radius:6px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 16px;font-size:11.5px}
.id-box .lbl{font-weight:600;color:#4B0082;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
.id-box .val{color:#1a0a2e;margin-top:1px}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#4B0082;padding:5px 0 4px;border-bottom:1px solid #c4b5fd;margin:20px 0 10px}
.bat-pdf-main{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px}
.bat-pdf-card{background:#faf7ff;border:1px solid #e9e2f5;border-radius:10px;padding:16px;text-align:center}
.bat-pdf-card.destaque{background:#f5f0fc;border-color:#6B21A8}
.bat-pdf-card .nome{font-size:9.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#6b5f7a;margin-bottom:8px}
.bat-pdf-card .valor{font-size:28px;font-weight:900;color:#4B0082;line-height:1}
.bat-pdf-card .unidade{font-size:11px;color:#9ca3af;margin-top:4px}
table.kit{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:11px}
table.kit th{background:#4B0082;color:#fff;padding:6px 8px;text-align:left;font-size:10px;letter-spacing:.04em;font-weight:700}
table.kit td{padding:6px 8px;border-bottom:1px solid #e9e2f5}
table.kit tr:nth-child(even) td{background:#faf7ff}
table.kit tr.total td{font-weight:700;color:#4B0082;border-top:2px solid #6B21A8}
.parecer-box{background:#f5f0fc;border-radius:6px;padding:12px 16px;font-size:11.5px;line-height:1.8;margin-top:8px}
.parecer-box strong{color:#4B0082}
.disclaimer{background:#fffbeb;border:1px solid #f59e0b;border-radius:6px;padding:12px 16px;margin-top:18px;font-size:10.5px;color:#92400e;line-height:1.7}
.doc-footer{margin-top:28px;padding-top:14px;border-top:1px solid #e9e2f5;text-align:center;font-size:10px;color:#9ca3af;line-height:1.7}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff;padding:0}.wrap{box-shadow:none;padding:24px 32px}.print-bar{display:none!important}}
</style></head><body>
<div class="print-bar">
  <span>SER Energia — Dimensionamento de Baterias</span>
  <button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</div>
<div class="wrap">

<div class="doc-header">
  <img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/>
  <h1>Relatório de Dimensionamento de Baterias</h1>
  <div class="sub">Sistema Híbrido · SER Energia Renovável · CNPJ 58.656.750/0001-04</div>
</div>
<hr class="rule"/>

<div class="id-box">
  <div><div class="lbl">Cliente</div><div class="val">${esc(cliente||'—')}</div></div>
  <div><div class="lbl">Cidade / Bairro</div><div class="val">${esc(cidade||'—')}</div></div>
  <div><div class="lbl">Data</div><div class="val">${hoje}</div></div>
</div>

<h2>⚡ Resultado do Dimensionamento</h2>
<div class="bat-pdf-main">
  <div class="bat-pdf-card">
    <div class="nome">Energia Total Necessária</div>
    <div class="valor">${(calc.energiaCorrigida/1000).toFixed(2)}</div>
    <div class="unidade">kWh</div>
  </div>
  <div class="bat-pdf-card destaque">
    <div class="nome">Nº de Baterias (${BAT_CAPACIDADE_UNIDADE} kWh)</div>
    <div class="valor">${calc.numBaterias}</div>
    <div class="unidade">unidades</div>
  </div>
  <div class="bat-pdf-card">
    <div class="nome">Capacidade Total</div>
    <div class="valor">${calc.capacidadeTotal}</div>
    <div class="unidade">kWh instalados</div>
  </div>
</div>

<h2>🔌 Cargas Prioritárias Consideradas</h2>
<table class="kit">
  <thead><tr><th>Equipamento</th><th style="text-align:center">Qtd.</th><th style="text-align:center">Pot. Unit. (W)</th><th style="text-align:center">Horas</th><th style="text-align:right">Consumo (Wh)</th></tr></thead>
  <tbody>
    ${calc.cargas.map(c=>{
      const consumo = c.qtd*c.potencia*c.horas;
      return `<tr><td>${c.icon||'🔌'} ${esc(c.nome)}</td><td style="text-align:center">${c.qtd}</td><td style="text-align:center">${c.potencia}</td><td style="text-align:center">${c.horas}h</td><td style="text-align:right">${consumo.toFixed(0)} Wh</td></tr>`;
    }).join('')}
    <tr class="total"><td colspan="4" style="text-align:right;padding-right:16px">Consumo bruto total</td><td style="text-align:right">${calc.totalWh.toFixed(0)} Wh</td></tr>
  </tbody>
</table>

<h2>📐 Metodologia de Cálculo</h2>
<div class="parecer-box">
  Consumo bruto das cargas selecionadas: <strong>${calc.totalWh.toFixed(0)} Wh</strong><br>
  Fator de segurança aplicado (perdas de inversor + temperatura + derating): <strong>+20%</strong><br>
  Profundidade de descarga considerada — DOD (baterias de lítio): <strong>80%</strong><br>
  Energia líquida necessária: <strong>${(calc.energiaCorrigida/1000).toFixed(2)} kWh</strong><br>
  Autonomia configurada pelo cliente: <strong>${calc.autonomiaHoras} horas</strong><br>
  Capacidade unitária de cada bateria considerada: <strong>${BAT_CAPACIDADE_UNIDADE} kWh</strong>
</div>

<div class="disclaimer">
  ⚠️ <strong>Observação técnica:</strong> Este dimensionamento é uma estimativa baseada nas cargas e horas de uso informadas. O dimensionamento final do banco de baterias deve ser validado pela equipe técnica da SER Energia Renovável durante a vistoria, considerando o perfil real de consumo, a capacidade do inversor híbrido e as condições de instalação.
</div>

<div class="doc-footer">
  SER Energia Renovável &nbsp;|&nbsp; CNPJ 58.656.750/0001-04<br>
  serenergiarenovavel.pa@gmail.com &nbsp;|&nbsp; (91) 99356-0305
</div>

</div>
</body></html>`);
  win.document.close();
  if(imprimir) setTimeout(()=>{ win.focus(); win.print(); }, 600);
}

/* ============================================================
   COMISSOES
   ============================================================ */
async function renderCustoPorProjeto(){
  await Promise.all([loadTable('comissoes'), loadTable('contratos'), loadTable('financeiro_despesas'), loadTable('financeiro_receitas')]);
  const contratos = (State.contratos||[]).filter(c=>c.status==='assinado');
  const fR = v=>'R$ '+(Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});

  // Constrói resumo por pessoa para o painel de pagamento
  const comissoes = State.comissoes || [];
  const porPessoa = {};
  comissoes.forEach(com=>{
    const _vc   = Number(com.valor_contrato||0);
    const _vv   = Number(com.valor_vendido||0) || _vc;
    const _obra = com.obra_ativo ? Number(com.obra_val||0) : 0;
    const _pres = com.pres_ativo ? Number(com.pres_val||0) : 0;
    const _ind  = com.ind_ativo  ? Number(com.ind_val||0)  : 0;
    const _vend_base = _vc * (Number(com.vend_pct)||0) / 100;
    const _major_val = Math.max(0, _vv - _vc - _obra - _pres - _ind) * (Number(com.vend_major_pct)||0) / 100;
    const linhas = [];
    if(_vend_base) linhas.push({ tipo:'Comissão', val:_vend_base, nome:com.vend_nome||'—', cliente:com.nome, status:com.status, comId:com.id });
    if(_major_val) linhas.push({ tipo:'Majorado',  val:_major_val, nome:com.vend_nome||'—', cliente:com.nome, status:com.status, comId:com.id });
    if(Number(com.sup_val)) linhas.push({ tipo:'Supervisor', val:Number(com.sup_val), nome:com.sup_nome||'—', cliente:com.nome, status:com.status, comId:com.id });
    if(com.sdr_ativo&&Number(com.sdr_val)) linhas.push({ tipo:'SDR', val:Number(com.sdr_val), nome:com.sdr_nome||'—', cliente:com.nome, status:com.status, comId:com.id });
    if(com.cap_ativo&&Number(com.cap_val)) linhas.push({ tipo:'Captador', val:Number(com.cap_val), nome:com.cap_nome||'—', cliente:com.nome, status:com.status, comId:com.id });
    linhas.forEach(l=>{
      const key = (l.nome||'').trim().toLowerCase();
      if(!porPessoa[key]) porPessoa[key] = { nome:l.nome, total:0, pendente:0, pago:0, itens:[] };
      porPessoa[key].itens.push(l);
      porPessoa[key].total += l.val;
      if(l.status==='paga') porPessoa[key].pago += l.val;
      else porPessoa[key].pendente += l.val;
    });
  });
  const pessoas = Object.values(porPessoa).filter(p=>p.pendente>0).sort((a,b)=>b.pendente-a.pendente);
  const totalPend = pessoas.reduce((s,p)=>s+p.pendente,0);

  const pagarComissao = async (comId) => {
    await supa.from('comissoes').update({status:'paga'}).eq('id', comId);
    toast('Marcado como paga','success');
    renderCustoPorProjeto();
  };

  const painelPagamento = pessoas.length ? `
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--border)">
        <h3 style="margin:0">💰 Comissões a Pagar — <span style="color:#d97706">${fR(totalPend)}</span> pendente</h3>
        <button class="btn btn-secondary btn-sm" id="relComissaoPDFBtn">📄 PDF</button>
      </div>
      ${pessoas.map(p=>`
        <div style="border-bottom:1px solid var(--border)">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--bg-alt)">
            <span style="font-weight:700">👤 ${esc(p.nome)}</span>
            <span style="color:#d97706;font-weight:700">${fR(p.pendente)} pendente</span>
          </div>
          <div class="table-wrap"><table style="font-size:13px">
            <thead><tr><th>Cliente</th><th>Tipo</th><th style="text-align:right">Valor</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${p.itens.filter(it=>it.status!=='paga').map(it=>`
                <tr>
                  <td>${esc(it.cliente||'—')}</td>
                  <td style="color:var(--text-light)">${it.tipo}</td>
                  <td style="text-align:right;font-weight:600;color:#d97706">${fR(it.val)}</td>
                  <td><span class="badge badge-warn">Pendente</span></td>
                  <td><button class="btn btn-sm btn-success" data-pagar="${it.comId}">✓ Pagar</button></td>
                </tr>`).join('')}
            </tbody>
          </table></div>
        </div>`).join('')}
    </div>` : `<div class="card" style="margin-bottom:16px;padding:16px;color:var(--text-light)">✅ Nenhuma comissão pendente de pagamento.</div>`;

  $('#pageActions').innerHTML = ``;
  $('#content').innerHTML = painelPagamento + `
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Cliente</th><th>Valor Contrato</th><th>Total Custos</th><th>Receita</th><th>Margem</th><th></th></tr></thead>
      <tbody>
        ${contratos.length ? contratos.map(c=>{
          const desp = (State.despesas||[]).filter(d=>String(d.contrato_id)===String(c.id));
          const rec  = (State.receitas||[]).filter(r=>String(r.contrato_id)===String(c.id));
          const com  = (State.comissoes||[]).find(x=>(x.nome||'').toLowerCase().trim()===(c.nome||'').toLowerCase().trim());
          const totalDesp = desp.reduce((s,d)=>s+(Number(d.valor)||0),0) + (com ? Number(com.total_saidas)||0 : 0);
          const totalRec  = rec.reduce((s,r)=>s+(Number(r.valor)||0),0) || Number(c.valor)||0;
          const margem    = totalRec - totalDesp;
          const mColor    = margem>=0?'#16a34a':'#dc2626';
          return `<tr style="cursor:pointer" data-proj-id="${c.id}" data-proj-nome="${esc(c.nome||'')}">
            <td><strong>${esc(c.nome||'')}</strong></td>
            <td>${fR(c.valor)}</td>
            <td style="color:#dc2626">${fR(totalDesp)}</td>
            <td style="color:#16a34a">${fR(totalRec)}</td>
            <td style="color:${mColor};font-weight:700">${fR(margem)}</td>
            <td><button class="btn btn-sm btn-primary" data-abrir="${c.id}">Abrir</button></td>
          </tr>`;
        }).join('') : `<tr><td colspan="6" class="empty">Nenhum contrato assinado.</td></tr>`}
      </tbody>
    </table></div></div>`;

  $('#relComissaoPDFBtn')?.addEventListener('click', ()=> gerarRelatorioComissoesPDF());
  $$('[data-pagar]').forEach(b=> b.addEventListener('click', ()=> pagarComissao(b.dataset.pagar)));
  $$('[data-abrir]').forEach(b=>{
    const c = contratos.find(x=>String(x.id)===b.dataset.abrir);
    b.addEventListener('click', e=>{ e.stopPropagation(); openProjetoFinanceiroModal(c.id, c.nome||''); });
  });
  $$('[data-proj-id]').forEach(tr=>{
    tr.addEventListener('click', ()=>{
      const c = contratos.find(x=>String(x.id)===tr.dataset.projId);
      if(c) openProjetoFinanceiroModal(c.id, c.nome||'');
    });
  });
}

async function renderComissoes(){ renderCustoPorProjeto(); }

function gerarRelatorioComissoesPDF(){
  const comissoes = State.comissoes || [];
  const contratos = (State.contratos || []).filter(c=>c.status==='assinado');
  const fR = v=>'R$ '+(Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const pct = (v,base)=> base ? ' ('+(((Number(v)||0)/(Number(base)||1))*100).toFixed(1)+'%)' : '';
  const hoje = new Date().toLocaleDateString('pt-BR');

  // Agrupa linhas de comissão por pessoa
  const porPessoa = {};
  comissoes.forEach(com=>{
    const _vc   = Number(com.valor_contrato||0);
    const _vv   = Number(com.valor_vendido||0) || _vc;
    const _obra = com.obra_ativo ? Number(com.obra_val||0) : 0;
    const _pres = com.pres_ativo ? Number(com.pres_val||0) : 0;
    const _ind  = com.ind_ativo  ? Number(com.ind_val||0)  : 0;
    const _vend_base = _vc * (Number(com.vend_pct)||0) / 100;
    const _base_maj  = _vv - _vc - _obra - _pres - _ind;
    const _major_val = Math.max(0, _base_maj) * (Number(com.vend_major_pct)||0) / 100;

    const linhas = [];
    if(_vend_base)                     linhas.push({ tipo:'Comissão Vendedor', val:_vend_base, nome:com.vend_nome||'Vendedor', cliente:com.nome, status:com.status });
    if(_major_val)                     linhas.push({ tipo:'Majorado',          val:_major_val, nome:com.vend_nome||'Vendedor', cliente:com.nome, status:com.status });
    if(Number(com.sup_val))            linhas.push({ tipo:'Supervisor',        val:Number(com.sup_val), nome:com.sup_nome||'Supervisor', cliente:com.nome, status:com.status });
    if(com.sdr_ativo&&Number(com.sdr_val)) linhas.push({ tipo:'SDR',          val:Number(com.sdr_val), nome:com.sdr_nome||'SDR', cliente:com.nome, status:com.status });
    if(com.cap_ativo&&Number(com.cap_val)) linhas.push({ tipo:'Captador',     val:Number(com.cap_val), nome:com.cap_nome||'Captador', cliente:com.nome, status:com.status });

    linhas.forEach(l=>{
      const key = l.nome.trim().toLowerCase();
      if(!porPessoa[key]) porPessoa[key] = { nome:l.nome, itens:[], total:0, pago:0, pendente:0 };
      porPessoa[key].itens.push(l);
      porPessoa[key].total += l.val;
      if(l.status==='paga') porPessoa[key].pago += l.val;
      else porPessoa[key].pendente += l.val;
    });
  });

  const pessoas = Object.values(porPessoa).sort((a,b)=>b.total-a.total);
  const totalGeral = pessoas.reduce((s,p)=>s+p.total,0);
  const totalPago  = pessoas.reduce((s,p)=>s+p.pago,0);
  const totalPend  = pessoas.reduce((s,p)=>s+p.pendente,0);

  const statusBadge = s => {
    const map = { paga:'#16a34a', pendente:'#d97706', aprovada:'#2563eb', cancelada:'#9ca3af' };
    return `<span style="background:${map[s]||'#6b7280'}20;color:${map[s]||'#6b7280'};border:1px solid ${map[s]||'#6b7280'}40;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:600;text-transform:uppercase">${s||'—'}</span>`;
  };

  const pessoasSecs = pessoas.map(p=>`
    <div style="margin-bottom:28px;page-break-inside:avoid">
      <div style="display:flex;align-items:center;justify-content:space-between;background:#1a3a5c;color:#fff;padding:8px 14px;border-radius:6px 6px 0 0">
        <span style="font-weight:700;font-size:14px">👤 ${p.nome}</span>
        <span style="font-size:13px">${fR(p.total)}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #e2e8f0">Cliente</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #e2e8f0">Tipo</th>
            <th style="text-align:right;padding:6px 10px;border-bottom:1px solid #e2e8f0">Valor</th>
            <th style="text-align:center;padding:6px 10px;border-bottom:1px solid #e2e8f0">Status</th>
          </tr>
        </thead>
        <tbody>
          ${p.itens.map((it,i)=>`
          <tr style="background:${i%2?'#f8fafc':'#fff'}">
            <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9">${it.cliente||'—'}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;color:#64748b">${it.tipo}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600;color:#dc2626">${fR(it.val)}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #f1f5f9;text-align:center">${statusBadge(it.status)}</td>
          </tr>`).join('')}
          <tr style="background:#fef9f0">
            <td colspan="2" style="padding:6px 10px;font-weight:700;font-size:11px;color:#92400e">SUBTOTAL</td>
            <td style="padding:6px 10px;text-align:right;font-weight:700;color:#92400e">${fR(p.total)}</td>
            <td style="padding:6px 10px;text-align:center;font-size:11px;color:#64748b">
              <span style="color:#16a34a">Pago: ${fR(p.pago)}</span> &nbsp;
              <span style="color:#d97706">Pend: ${fR(p.pendente)}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>`).join('');

  const w = window.open('','_blank');
  if(!w){ alert('Popup bloqueado. Permita popups para este site.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Relatório de Comissões — SER Energia</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;background:#fff;padding:32px}
    .print-bar{position:fixed;top:0;left:0;right:0;background:#1a3a5c;color:#fff;padding:10px 24px;display:flex;align-items:center;justify-content:space-between;z-index:999;font-size:13px}
    .print-bar button{background:#f59e0b;color:#1a3a5c;border:none;border-radius:6px;padding:6px 16px;font-weight:700;cursor:pointer;font-size:13px}
    .report-body{margin-top:56px}
    @media print{.print-bar{display:none}.report-body{margin-top:0}}
    h1{font-size:22px;color:#1a3a5c;margin-bottom:4px}
    .sub{font-size:13px;color:#64748b;margin-bottom:24px}
    .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
    .summary-card{border-radius:8px;padding:16px;text-align:center}
    .summary-card .label{font-size:11px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px;font-weight:600}
    .summary-card .value{font-size:20px;font-weight:800}
    @media print{body{padding:16px}h1{font-size:18px}}
  </style>
  </head><body>
  <div class="print-bar">
    <span>SER Energia Renovável — Relatório de Comissões</span>
    <button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
  </div>
  <div class="report-body">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:24px">
      <div>
        <h1>Relatório de Comissões</h1>
        <div class="sub">Gerado em ${hoje} &nbsp;·&nbsp; ${comissoes.length} contrato${comissoes.length!==1?'s':''} &nbsp;·&nbsp; ${pessoas.length} colaborador${pessoas.length!==1?'es':''}</div>
      </div>
      <div style="text-align:right;font-size:11px;color:#94a3b8;font-weight:600;letter-spacing:.5px">SER ENERGIA RENOVÁVEL</div>
    </div>

    <div class="summary-grid">
      <div class="summary-card" style="background:#eff6ff;border:1px solid #bfdbfe">
        <div class="label" style="color:#1d4ed8">Total Comissões</div>
        <div class="value" style="color:#1d4ed8">${fR(totalGeral)}</div>
      </div>
      <div class="summary-card" style="background:#f0fdf4;border:1px solid #bbf7d0">
        <div class="label" style="color:#15803d">Total Pago</div>
        <div class="value" style="color:#15803d">${fR(totalPago)}</div>
      </div>
      <div class="summary-card" style="background:#fffbeb;border:1px solid #fde68a">
        <div class="label" style="color:#b45309">Total Pendente</div>
        <div class="value" style="color:#b45309">${fR(totalPend)}</div>
      </div>
    </div>

    ${pessoas.length ? pessoasSecs : '<p style="color:#94a3b8;text-align:center;padding:40px">Nenhuma comissão lançada.</p>'}

    <div style="margin-top:32px;padding-top:16px;border-top:2px solid #1a3a5c;display:flex;justify-content:space-between;font-size:12px;color:#64748b">
      <span>SER Energia Renovável</span>
      <span>Relatório gerado automaticamente pelo SER Hub</span>
    </div>
  </div>
  <script>window.onload=()=>{};<\/script>
  </body></html>`);
  w.document.close();
}

function openComissaoModal(item=null, nomePreenchido=null){
  const isNew = !item;
  item = item || {};
  if(nomePreenchido && isNew) item = { ...item, nome: nomePreenchido };
  const statusOpts = [['pendente','Pendente'],['aprovada','Aprovada'],['paga','Paga'],['cancelada','Cancelada']];

  // Listas por perfil vindas de State.perfis
  const perfisAtivos = (State.perfis||[]).filter(p=>p.ativo!==false && p.nome);
  const nomesPorPerfil = perfil => ['', ...perfisAtivos.filter(p=> perfil==='vendedor' ? ['vendedor','supervisor'].includes(p.perfil) : p.perfil===perfil).map(p=>p.nome)];
  const selectOpts    = perfil => nomesPorPerfil(perfil).map(n=>n?[n,n]:['','— selecione —']);

  // Todos os contratos válidos (exceto cancelado/perdido) para busca de cliente
  const contratosAssinados = (State.contratos||[]).filter(c=>!['cancelado','perdido'].includes(c.status));
  const clientesDL = [...new Set(contratosAssinados.map(c=>c.nome).filter(Boolean))];

  openModal(`
    <div class="modal-header"><h2>${isNew?'Nova Comissão':'Editar Comissão'}</h2><button class="modal-close">×</button></div>
    <form id="comForm">
      <div class="modal-body">
        <div class="form-grid">
          ${formField({label:'Cliente',name:'nome',value:item.nome,required:true,datalist:clientesDL})}
          ${formField({label:'Valor Referência',name:'valor_contrato',type:'number',value:item.valor_contrato,required:true})}
          ${formField({label:'Valor Vendido (R$)',name:'valor_vendido',type:'number',value:item.valor_vendido,readonly:true})}
          ${formField({label:'Status',name:'status',type:'select',value:item.status||'pendente',options:statusOpts})}
        </div>
        <div class="section"><div class="section-header"><h4>Vendedor</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Nome',name:'vend_nome',type:'select',value:item.vend_nome||'',options:selectOpts('vendedor')})}
            ${formField({label:'%',name:'vend_pct',type:'number',value:item.vend_pct})}
            ${formField({label:'% Major',name:'vend_major_pct',type:'number',value:item.vend_major_pct})}
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>Supervisor</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Nome',name:'sup_nome',type:'select',value:item.sup_nome||'',options:selectOpts('supervisor')})}
            ${formField({label:'%',name:'sup_pct',type:'number',value:item.sup_pct})}
          </div></div>
        </div>
        <div class="section collapsed"><div class="section-header"><h4>SDR / Captador / Indicador</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'SDR ativo',name:'sdr_ativo',type:'toggle',value:item.sdr_ativo})}
            ${formField({label:'SDR nome',name:'sdr_nome',type:'select',value:item.sdr_nome||'',options:selectOpts('sdr')})}
            ${formField({label:'SDR %',name:'sdr_pct',type:'number',value:item.sdr_pct})}
            ${formField({label:'Captador ativo',name:'cap_ativo',type:'toggle',value:item.cap_ativo})}
            ${formField({label:'Captador nome',name:'cap_nome',type:'select',value:item.cap_nome||'',options:selectOpts('captador')})}
            ${formField({label:'Captador %',name:'cap_pct',type:'number',value:item.cap_pct})}
            ${formField({label:'Indicador ativo',name:'ind_ativo',type:'toggle',value:item.ind_ativo})}
            ${formField({label:'Indicador nome',name:'ind_nome',value:item.ind_nome})}
            ${formField({label:'Indicador R$',name:'ind_val',type:'number',value:item.ind_val})}
          </div></div>
        </div>
        <div class="section collapsed"><div class="section-header"><h4>Obra / Presente</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Obra ativo',name:'obra_ativo',type:'toggle',value:item.obra_ativo})}
            ${formField({label:'Obra valor',name:'obra_val',type:'number',value:item.obra_val})}
            ${formField({label:'Presente ativo',name:'pres_ativo',type:'toggle',value:item.pres_ativo})}
            ${formField({label:'Presente valor',name:'pres_val',type:'number',value:item.pres_val})}
          </div></div>
        </div>
        <div id="comPreview" class="preview-box"></div>
      </div>
      <div class="modal-footer">
        ${!isNew?`<button type="button" class="btn btn-danger" id="delComBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'lg');

  const form = $('#comForm');

  const logisticasAll = State.logistica || [];

  // Preenche valor_vendido (readonly) com contrato.valor e valor_contrato com kit*2.5 (se vazio)
  const applyAutoFill = (contrato) => {
    if(!contrato) return;
    if(contrato.valor) form.elements['valor_vendido'].value = fmtInputNum(contrato.valor);
    if(!Number(parseBR(form.elements['valor_contrato'].value))){
      const log = logisticasAll.find(l=>String(l.contrato_id)===String(contrato.id));
      if(log?.valor_compra) form.elements['valor_contrato'].value = fmtInputNum(Number(log.valor_compra)*2.5);
    }
    recalc();
  };

  // Ao abrir: preenche a partir do contrato vinculado
  if(item.contrato_id){
    applyAutoFill(contratosAssinados.find(c=>c.id===item.contrato_id));
  } else if(item.nome){
    applyAutoFill(contratosAssinados.find(c=>(c.nome||'').trim().toLowerCase()===item.nome.trim().toLowerCase()));
  }

  // Auto-preenche Valor Vendido com o valor do contrato ao digitar/selecionar o cliente
  form.elements['nome'].addEventListener('change', ()=>{
    applyAutoFill(contratosAssinados.find(c=>(c.nome||'').trim().toLowerCase()===form.elements['nome'].value.trim().toLowerCase()));
  });
  form.elements['nome'].addEventListener('input', ()=>{
    const contrato = contratosAssinados.find(c=>(c.nome||'').trim().toLowerCase()===form.elements['nome'].value.trim().toLowerCase());
    applyAutoFill(contrato);
  });

  function recalc(){
    const raw = readForm(form);
    const vc  = Number(raw.valor_contrato)||0;
    const vv  = Number(raw.valor_vendido)||0;
    const vp  = Number(raw.vend_pct)||0;
    const vmp = Number(raw.vend_major_pct)||0;
    const sup_val  = vc * ((Number(raw.sup_pct)||0)/100);
    const sdr_val  = raw.sdr_ativo ? vc*((Number(raw.sdr_pct)||0)/100) : 0;
    const cap_val  = raw.cap_ativo ? vc*((Number(raw.cap_pct)||0)/100) : 0;
    const ind_val  = raw.ind_ativo ? (Number(raw.ind_val)||0) : 0;
    const obra_val = raw.obra_ativo ? (Number(raw.obra_val)||0) : 0;
    const pres_val = raw.pres_ativo ? (Number(raw.pres_val)||0) : 0;
    // Majorado: (valor_vendido − valor_referencia − obra − presente − indicador) × % majorado, mínimo R$ 0
    const base_major = vv - vc - obra_val - pres_val - ind_val;
    const major_val  = Math.max(0, base_major) * (vmp/100);
    const vend_base  = vc * (vp/100);
    const vend_val   = vend_base + major_val;
    const total = vend_val + sup_val + sdr_val + cap_val + ind_val + obra_val + pres_val;
    const lucro = vc - total;
    $('#comPreview').innerHTML = `
      <div class="preview-row"><span>Comissão Vendedor</span><span>${fmtBRL(vend_base)}</span></div>
      ${major_val>0?`<div class="preview-row"><span>Majorado Vendedor</span><span>${fmtBRL(major_val)}</span></div>`:''}
      <div class="preview-row"><span>Supervisor</span><span>${fmtBRL(sup_val)}</span></div>
      <div class="preview-row"><span>SDR</span><span>${fmtBRL(sdr_val)}</span></div>
      <div class="preview-row"><span>Captador</span><span>${fmtBRL(cap_val)}</span></div>
      <div class="preview-row"><span>Indicador</span><span>${fmtBRL(ind_val)}</span></div>
      <div class="preview-row"><span>Obra</span><span>${fmtBRL(obra_val)}</span></div>
      <div class="preview-row"><span>Presente</span><span>${fmtBRL(pres_val)}</span></div>
      <div class="preview-row"><span>Total saídas</span><span>${fmtBRL(total)}</span></div>
      <div class="preview-row"><span>Lucro Líquido</span><span>${fmtBRL(lucro)}</span></div>
    `;
    return { vend_val, vend_base, major_val, sup_val, sdr_val, cap_val, ind_val, total_saidas:total, lucro_liquido:lucro };
  }
  form.addEventListener('input', recalc);
  recalc();

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    const calc = recalc();
    Object.assign(data, calc);
    ['valor_contrato','valor_vendido','vend_pct','vend_major_pct','vend_base','major_val','sup_pct','sdr_pct','cap_pct','ind_val','obra_val','pres_val'].forEach(k=>{ data[k] = data[k]!=null ? Number(data[k]) : null; });
    if(isNew){
      data.criado_por = State.user?.id;
      const { data: criada, error } = await supa.from('comissoes').insert(data).select('id').single();
      if(error) return toast(error.message,'error');
      await sincronizarDespesaComissao(criada.id, data);
    } else {
      const { error } = await supa.from('comissoes').update(data).eq('id',item.id);
      if(error) return toast(error.message,'error');
      await sincronizarDespesaComissao(item.id, data);
    }
    toast('Salvo','success'); closeModal(); renderComissoes();
  });
  $('#delComBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir comissão?')) return;
    await supa.from('financeiro_despesas').delete().eq('comissao_id', item.id);
    await supa.from('comissoes').delete().eq('id',item.id);
    toast('Excluído','success'); closeModal(); renderComissoes();
  });
}

async function sincronizarReceitaRepasse(logisticaId, log){
  if(!log.valor_repasse || Number(log.valor_repasse) <= 0){
    // Se não há repasse, remove eventual receita anterior vinculada
    await supa.from('financeiro_receitas').delete().eq('logistica_id', logisticaId);
    return;
  }
  const receita = {
    descricao: `Repasse – ${log.distribuidora||log.nome||''}`,
    valor: Number(log.valor_repasse),
    categoria: 'repasse',
    status: 'pendente',
    logistica_id: logisticaId
  };
  const { data: existente } = await supa.from('financeiro_receitas')
    .select('id').eq('logistica_id', logisticaId).maybeSingle();
  if(existente){
    await supa.from('financeiro_receitas').update(receita).eq('id', existente.id);
  } else {
    receita.criado_por = State.user?.id;
    await supa.from('financeiro_receitas').insert(receita);
  }
}

async function sincronizarDespesaComissao(comissaoId, com){
  const statusMap = { pendente:'pendente', aprovada:'pendente', paga:'pago', cancelada:'cancelado' };
  const despesa = {
    descricao: `Comissão – ${com.nome||''}`,
    valor: Number(com.total_saidas)||0,
    categoria: 'comissao',
    status: statusMap[com.status] || 'pendente',
    comissao_id: comissaoId,
    obs: com.vend_nome ? `Vendedor: ${com.vend_nome}` : null
  };
  const { data: existente } = await supa.from('financeiro_despesas')
    .select('id').eq('comissao_id', comissaoId).maybeSingle();
  if(existente){
    await supa.from('financeiro_despesas').update(despesa).eq('id', existente.id);
  } else {
    despesa.criado_por = State.user?.id;
    await supa.from('financeiro_despesas').insert(despesa);
  }
}

/* ============================================================
   FINANCEIRO
   ============================================================ */
/* ============================================================
   CUSTO REAL / MARGEM POR PROJETO
   ============================================================ */
function calcComissaoTotal(com){
  if(!com) return 0;
  const vc  = Number(com.valor_contrato)||0;
  const vv  = Number(com.valor_vendido)||vc;
  const vp  = Number(com.vend_pct)||0;
  const vmp = Number(com.vend_major_pct)||0;
  const sup_val  = vc * ((Number(com.sup_pct)||0)/100);
  const sdr_val  = com.sdr_ativo ? vc*((Number(com.sdr_pct)||0)/100) : 0;
  const cap_val  = com.cap_ativo ? vc*((Number(com.cap_pct)||0)/100) : 0;
  const ind_val  = com.ind_ativo ? (Number(com.ind_val)||0) : 0;
  const obra_val = com.obra_ativo ? (Number(com.obra_val)||0) : 0;
  const pres_val = com.pres_ativo ? (Number(com.pres_val)||0) : 0;
  const base_major = vv - vc - obra_val - pres_val - ind_val;
  const major_val  = Math.max(0, base_major) * (vmp/100);
  const vend_val = vc*(vp/100) + major_val;
  return vend_val + sup_val + sdr_val + cap_val + ind_val + obra_val + pres_val;
}

function buildMargemProjetoSection(despesas){
  const contratos = (State.contratos||[]).filter(c=>c.status==='assinado');
  const instalacoes = State.instalacoes||[];
  const comissoes = State.comissoes||[];

  const rows = contratos.map(c=>{
    const receita = Number(c.valor)||0;
    const despesasContrato = (despesas||[])
      .filter(d=>String(d.contrato_id)===String(c.id) && d.status!=='cancelado')
      .reduce((s,d)=>s+(Number(d.valor)||0),0);
    const inst = instalacoes.find(i=>String(i.contrato_id)===String(c.id));
    const extrasInstalacao = inst ? (Number(inst.val_poste)||0)+(Number(inst.val_troca_padrao)||0) : 0;
    const com = comissoes.find(x=>normName(x.nome||'')===normName(c.nome||''));
    const comissaoTotal = calcComissaoTotal(com);
    const custoTotal = despesasContrato + extrasInstalacao + comissaoTotal;
    const margem = receita - custoTotal;
    const margemPct = receita>0 ? (margem/receita*100) : null;
    return { c, receita, despesasContrato, extrasInstalacao, comissaoTotal, custoTotal, margem, margemPct };
  }).filter(r=>r.receita>0)
    .sort((a,b)=>(a.margemPct??999)-(b.margemPct??999));

  if(!rows.length) return `<div class="empty" style="padding:24px">Nenhum contrato assinado com valor definido.</div>`;

  const totalReceita = rows.reduce((s,r)=>s+r.receita,0);
  const totalCusto   = rows.reduce((s,r)=>s+r.custoTotal,0);
  const totalMargem  = totalReceita - totalCusto;
  const margemMediaPct = totalReceita>0 ? (totalMargem/totalReceita*100) : 0;

  const corMargem = pct => pct==null ? 'var(--text-light)' : pct>=30 ? '#16a34a' : pct>=15 ? '#ca8a04' : '#dc2626';

  const margemMin = Number(localStorage.getItem('ser_margem_min')) || 15;
  const abaixo = rows.filter(r=>r.margemPct!=null && r.margemPct<margemMin);
  const alertaMargem = abaixo.length ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#991b1b">
      ⚠️ <b>${abaixo.length} projeto(s) abaixo da margem mínima de ${margemMin}%:</b> ${abaixo.slice(0,8).map(r=>esc(r.c.nome||'')+' ('+r.margemPct.toFixed(1)+'%)').join(', ')}${abaixo.length>8?'…':''}
      <button type="button" class="btn btn-secondary btn-sm" style="margin-left:8px" onclick="(function(){const v=prompt('Margem mínima (%)',${margemMin});if(v&&!isNaN(+v)){localStorage.setItem('ser_margem_min',+v);if(window.renderFinanceiro)renderFinanceiro();else location.reload();}})()">Alterar mínimo</button>
    </div>` : '';

  return alertaMargem + `
    <div class="metrics" style="margin-bottom:16px">
      <div class="metric"><div class="metric-label">Receita Total</div><div class="metric-value" style="font-size:15px">${fmtBRL(totalReceita)}</div></div>
      <div class="metric" style="border-color:var(--danger)"><div class="metric-label">Custo Total (kit+instalação+homolog+comissões)</div><div class="metric-value" style="font-size:15px">${fmtBRL(totalCusto)}</div></div>
      <div class="metric" style="border-color:${corMargem(margemMediaPct)}"><div class="metric-label">Margem Total</div><div class="metric-value" style="font-size:15px;color:${corMargem(margemMediaPct)}">${fmtBRL(totalMargem)}</div></div>
      <div class="metric"><div class="metric-label">Margem Média</div><div class="metric-value" style="color:${corMargem(margemMediaPct)}">${margemMediaPct.toFixed(1)}%</div></div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>Cliente</th><th>Vendedor</th><th>Receita</th><th>Custos</th><th>Comissões</th><th>Margem</th><th>Margem %</th>
      </tr></thead>
      <tbody>
        ${rows.map(r=>`<tr>
          <td>${esc(r.c.nome||'')}</td>
          <td>${esc(r.c.vendedor||'—')}</td>
          <td>${fmtBRL(r.receita)}</td>
          <td>${fmtBRL(r.despesasContrato+r.extrasInstalacao)}</td>
          <td>${fmtBRL(r.comissaoTotal)}</td>
          <td style="font-weight:700;color:${corMargem(r.margemPct)}">${fmtBRL(r.margem)}</td>
          <td style="font-weight:700;color:${corMargem(r.margemPct)}">${r.margemPct!=null?r.margemPct.toFixed(1)+'%':'—'}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
    <div style="font-size:11px;color:var(--text-light);margin-top:10px">
      Custos = despesas lançadas no contrato (kit, vistoria, instalação, homologação) + extras de instalação (poste/troca de padrão) + comissões calculadas (vendedor+supervisor+SDR+captador+indicador+obra+presente). Ordenado da menor para a maior margem, para destacar projetos com risco de prejuízo.
    </div>`;
}

async function renderFinanceiro(){
  await Promise.all([ loadTable('financeiro_receitas'), loadTable('financeiro_despesas'), loadTable('comissoes'), loadTable('contratos') ]);
  const receitas = State.receitas;
  const despesas = State.despesas;
  const totalR = receitas.filter(r=>r.status!=='cancelado').reduce((s,r)=>s+(Number(r.valor)||0),0);
  const totalD = despesas.filter(d=>d.status!=='cancelado').reduce((s,d)=>s+(Number(d.valor)||0),0);
  const lucro = totalR - totalD;
  const comissoesPag = State.comissoes.filter(c=>c.status==='aprovada').reduce((s,c)=>s+(Number(c.total_saidas)||0),0);

  const months = {};
  receitas.forEach(r=>{
    if(!r.data_recebimento) return;
    const k = r.data_recebimento.slice(0,7);
    months[k] = months[k] || { rec:0, desp:0 };
    months[k].rec += Number(r.valor)||0;
  });
  despesas.forEach(d=>{
    if(!d.data_pagamento) return;
    const k = d.data_pagamento.slice(0,7);
    months[k] = months[k] || { rec:0, desp:0 };
    months[k].desp += Number(d.valor)||0;
  });
  const mKeys = Object.keys(months).sort();

  const rank = {};
  State.contratos.filter(c=>c.status==='assinado').forEach(c=>{
    const v = c.vendedor||'—';
    rank[v] = (rank[v]||0) + (Number(c.valor)||0);
  });
  const rankSorted = Object.entries(rank).sort((a,b)=>b[1]-a[1]).slice(0,10);

  $('#pageActions').innerHTML = `
    <button class="btn btn-secondary" id="newReceitaBtn">+ Receita</button>
    <button class="btn btn-primary" id="newDespesaBtn">+ Despesa</button>
    <button class="btn btn-secondary" id="despPadraoBtn" title="Verificar e preencher despesas padrão em lote">📋 Despesas Padrão</button>
    <button class="btn btn-secondary" id="auditReceitasBtn" title="Auditar contratos sem receita">🔍 Auditar Receitas</button>
  `;
  $('#newReceitaBtn').addEventListener('click', ()=> openReceitaModal());
  $('#newDespesaBtn').addEventListener('click', ()=> openDespesaModal());
  $('#despPadraoBtn').addEventListener('click', ()=> openDespesasPadraoModal());
  $('#auditReceitasBtn').addEventListener('click', ()=> openAuditoriaReceitasModal());

  $('#content').innerHTML = `
    <div class="metrics">
      <div class="metric"><div class="metric-label">Receita Total</div><div class="metric-value">${fmtBRL(totalR)}</div></div>
      <div class="metric" style="border-color:var(--danger)"><div class="metric-label">Despesa Total</div><div class="metric-value">${fmtBRL(totalD)}</div></div>
      <div class="metric" style="border-color:var(--info)"><div class="metric-label">Lucro</div><div class="metric-value">${fmtBRL(lucro)}</div></div>
      <div class="metric" style="border-color:var(--warning)"><div class="metric-label">Comissões a Pagar</div><div class="metric-value">${fmtBRL(comissoesPag)}</div></div>
    </div>
    <div class="charts-grid">
      <div class="card"><div class="card-header"><h3>Movimentação Mensal</h3></div><canvas id="chartFin" height="220"></canvas></div>
      <div class="card"><div class="card-header"><h3>Ranking Vendedores</h3></div>
        <table>
          <thead><tr><th>#</th><th>Vendedor</th><th>Valor</th></tr></thead>
          <tbody>${rankSorted.map(([v,val],i)=>`<tr><td>${i+1}</td><td>${esc(v)}</td><td>${fmtBRL(val)}</td></tr>`).join('')||'<tr><td colspan="3" class="empty">Sem dados</td></tr>'}</tbody>
        </table>
      </div>
    </div>
    <div class="tabs"><div class="tab active" data-tab="r">Receitas</div><div class="tab" data-tab="d">Despesas</div><div class="tab" data-tab="m">💰 Margem por Projeto</div></div>
    <div id="finTab">
      <div class="card" id="tabR">
        <div class="table-wrap"><table>
          <thead><tr><th>Descrição</th><th>Valor</th><th>Data</th><th>Categoria</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${receitas.map(r=>`
              <tr>
                <td>${esc(r.descricao||'')}</td><td>${fmtBRL(r.valor)}</td><td>${fmtDate(r.data_recebimento)}</td>
                <td>${esc(r.categoria||'')}</td><td>${badge(r.status)}</td>
                <td class="row-actions"><button class="btn btn-sm btn-secondary" data-rec="${r.id}">Editar</button></td>
              </tr>`).join('')||'<tr><td colspan="6" class="empty">Sem receitas</td></tr>'}
          </tbody>
        </table></div>
      </div>
      <div class="card" id="tabD" style="display:none">
        <div class="table-wrap"><table>
          <thead><tr><th>Descrição</th><th>Valor</th><th>Data</th><th>Categoria</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${despesas.map(d=>`
              <tr>
                <td>${esc(d.descricao||'')}</td><td>${fmtBRL(d.valor)}</td><td>${fmtDate(d.data_pagamento)}</td>
                <td>${esc(d.categoria||'')}</td><td>${badge(d.status)}</td>
                <td class="row-actions"><button class="btn btn-sm btn-secondary" data-desp="${d.id}">Editar</button></td>
              </tr>`).join('')||'<tr><td colspan="6" class="empty">Sem despesas</td></tr>'}
          </tbody>
        </table></div>
      </div>
      <div class="card" id="tabM" style="display:none">
        ${buildMargemProjetoSection(despesas)}
      </div>
    </div>
  `;

  $$('.tab').forEach(t => t.addEventListener('click', ()=>{
    $$('.tab').forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    $('#tabR').style.display = t.dataset.tab==='r' ? '' : 'none';
    $('#tabD').style.display = t.dataset.tab==='d' ? '' : 'none';
    $('#tabM').style.display = t.dataset.tab==='m' ? '' : 'none';
  }));

  $$('[data-rec]').forEach(b=>b.addEventListener('click', ()=> openReceitaModal(receitas.find(r=>String(r.id)===b.dataset.rec))));
  $$('[data-desp]').forEach(b=>b.addEventListener('click', ()=> openDespesaModal(despesas.find(d=>String(d.id)===b.dataset.desp))));

  if(State.charts.fin){ try{State.charts.fin.destroy();}catch(_){} }
  const ctx = $('#chartFin')?.getContext('2d');
  if(ctx){
    State.charts.fin = new Chart(ctx,{
      type:'bar',
      data:{
        labels: mKeys,
        datasets:[
          { label:'Receita', data: mKeys.map(k=>months[k].rec), backgroundColor:'#3B6D11' },
          { label:'Despesa', data: mKeys.map(k=>months[k].desp), backgroundColor:'#c0392b' }
        ]
      },
      options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
    });
  }
}

function openReceitaModal(item=null, opts={}){
  const isNew = !item;
  item = item || {};
  const { contratoId=null, onSave=null } = opts;
  const catOpts = [['venda','Venda'],['financiamento','Financiamento'],['servico','Serviço'],['repasse','Repasse'],['outro','Outro']];
  const statusOpts = [['pendente','Pendente'],['recebido','Recebido'],['cancelado','Cancelado']];
  openModal(`
    <div class="modal-header"><h2>${isNew?'Nova Receita':'Editar Receita'}</h2><button class="modal-close">×</button></div>
    <form id="recForm"><div class="modal-body"><div class="form-grid">
      ${formField({label:'Descrição',name:'descricao',value:item.descricao,required:true,full:true})}
      ${formField({label:'Valor (R$)',name:'valor',type:'number',value:item.valor,required:true})}
      ${formField({label:'Recebedor / Origem',name:'recebedor',value:item.recebedor,placeholder:'Ex: cliente, distribuidora…',full:true})}
      ${formField({label:'Data',name:'data_recebimento',type:'date',value:item.data_recebimento})}
      ${formField({label:'Categoria',name:'categoria',type:'select',value:item.categoria||'venda',options:catOpts})}
      ${formField({label:'Status',name:'status',type:'select',value:item.status||'pendente',options:statusOpts})}
      ${formField({label:'Obs',name:'obs',type:'textarea',value:item.obs,full:true})}
    </div></div>
    <div class="modal-footer">
      ${!isNew?`<button type="button" class="btn btn-danger" id="delRec">Excluir</button>`:''}
      <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
      <button type="submit" class="btn btn-primary">Salvar</button>
    </div></form>
  `,'sm');
  const form = $('#recForm');
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    data.valor = Number(data.valor)||0;
    if(contratoId) data.contrato_id = contratoId;
    if(isNew){ data.criado_por = State.user?.id; await supa.from('financeiro_receitas').insert(data); }
    else await supa.from('financeiro_receitas').update(data).eq('id',item.id);
    await loadTable('financeiro_receitas');
    toast('Salvo','success');
    closeModal();
    if(onSave) onSave(); else renderFinanceiro();
  });
  $('#delRec')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir?')) return;
    await supa.from('financeiro_receitas').delete().eq('id',item.id);
    await loadTable('financeiro_receitas');
    closeModal();
    if(onSave) onSave(); else renderFinanceiro();
  });
}
function openDespesaModal(item=null, opts={}){
  const isNew = !item;
  item = item || {};
  const { contratoId=null, onSave=null, categoriaFixa=null } = opts;
  const catLabels = {kit:'Kit / Equipamentos',equipamentos:'Equipamentos',mao_de_obra:'Mão de obra',homologacao:'Homologação',comissao:'Comissão',vistoria:'Vistoria',instalacao:'Instalação',maquininha:'Maquininha (taxas)',extras:'Extras',outro:'Outro'};
  const catOpts = [['kit','Kit / Equipamentos'],['equipamentos','Equipamentos'],['mao_de_obra','Mão de obra'],['vistoria','Vistoria'],['instalacao','Instalação'],['homologacao','Homologação'],['comissao','Comissão'],['maquininha','Maquininha (taxas)'],['extras','Extras'],['outro','Outro']];
  const catAtual = categoriaFixa || item.categoria || 'outro';
  const statusOpts = [['pendente','Pendente'],['pago','Pago'],['cancelado','Cancelado']];
  const tituloModal = categoriaFixa ? `${isNew?'Lançar':'Editar'} — ${catLabels[categoriaFixa]||categoriaFixa}` : (isNew?'Nova Despesa':'Editar Despesa');
  openModal(`
    <div class="modal-header"><h2>${tituloModal}</h2><button class="modal-close">×</button></div>
    <form id="despForm"><div class="modal-body"><div class="form-grid">
      ${formField({label:'Descrição',name:'descricao',value:item.descricao,required:true,full:true})}
      ${formField({label:'Valor (R$)',name:'valor',type:'number',value:item.valor,required:true})}
      ${formField({label:'Recebedor / Fornecedor',name:'recebedor',value:item.recebedor,placeholder:'Ex: nome do técnico, empresa…',full:true})}
      ${formField({label:'Data',name:'data_pagamento',type:'date',value:item.data_pagamento})}
      ${categoriaFixa
        ? `<input type="hidden" name="categoria" value="${esc(categoriaFixa)}">`
        : formField({label:'Categoria',name:'categoria',type:'select',value:catAtual,options:catOpts})}
      ${formField({label:'Status',name:'status',type:'select',value:item.status||'pendente',options:statusOpts})}
      ${formField({label:'Obs',name:'obs',type:'textarea',value:item.obs,full:true})}
    </div></div>
    <div class="modal-footer">
      ${!isNew?`<button type="button" class="btn btn-danger" id="delDesp">Excluir</button>`:''}
      <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
      <button type="submit" class="btn btn-primary">Salvar</button>
    </div></form>
  `,'sm');
  const form = $('#despForm');
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    data.valor = Number(data.valor)||0;
    if(contratoId) data.contrato_id = contratoId;
    let err;
    if(isNew){ data.criado_por = State.user?.id; ({ error:err } = await supa.from('financeiro_despesas').insert(data)); }
    else ({ error:err } = await supa.from('financeiro_despesas').update(data).eq('id',item.id));
    if(err){ toast(err.message,'error'); return; }
    await loadTable('financeiro_despesas');
    toast('Salvo','success');
    closeModal();
    if(onSave) onSave(); else renderFinanceiro();
  });
  $('#delDesp')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir?')) return;
    const { error:err } = await supa.from('financeiro_despesas').delete().eq('id',item.id);
    if(err){ toast(err.message,'error'); return; }
    await loadTable('financeiro_despesas');
    closeModal();
    if(onSave) onSave(); else renderFinanceiro();
  });
}

