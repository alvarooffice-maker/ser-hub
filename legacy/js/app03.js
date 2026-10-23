/* ============================================================
   CONTACT LOG
   ============================================================ */
function renderContactLog(parentId, kind){
  return `
    <div class="section" style="margin-top:14px">
      <div class="section-header"><h4>📞 Tentativas de Contato</h4><span class="section-toggle">▼</span></div>
      <div class="section-body">
        <div class="log-list" id="logList_${kind}_${parentId}">Carregando…</div>
        <div class="log-tools" id="logTools_${kind}_${parentId}">
          <button type="button" data-tipo="whatsapp">WhatsApp</button>
          <button type="button" data-tipo="ligacao">Ligação</button>
          <button type="button" data-tipo="email">Email</button>
          <button type="button" data-tipo="visita">Visita</button>
          <button type="button" data-tipo="outro">Outro</button>
        </div>
        <div id="logInput_${kind}_${parentId}"></div>
      </div>
    </div>`;
}

async function attachContactLog(parentId, kind){
  const table = kind==='lead' ? 'tentativas_contato' : 'tentativas_remarketing';
  const fk = kind==='lead' ? 'lead_id' : 'remark_id';
  const listEl = $(`#logList_${kind}_${parentId}`);
  const inputEl = $(`#logInput_${kind}_${parentId}`);
  const toolsEl = $(`#logTools_${kind}_${parentId}`);

  async function refresh(){
    const { data } = await supa.from(table).select('*').eq(fk,parentId).order('criado_em',{ascending:false});
    if(!data || !data.length){ listEl.innerHTML = '<div style="padding:14px;color:var(--text-light);font-size:12px">Nenhuma tentativa registrada.</div>'; return; }
    listEl.innerHTML = data.map(t=>`
      <div class="log-item">
        <div class="top"><span>${esc(t.tipo)} → ${esc(t.resultado||'')}</span><span style="color:var(--text-light)">${fmtDateTime(t.criado_em)}</span></div>
        ${t.obs?`<div class="obs">${esc(t.obs)}</div>`:''}
      </div>
    `).join('');
  }
  refresh();

  $$('button',toolsEl).forEach(b=> b.addEventListener('click', ()=>{
    const tipo = b.dataset.tipo;
    const resOpts = [['sem_resposta','Sem resposta'],['contato_feito','Contato feito'],['agendou_retorno','Agendou retorno'],['interessado','Interessado'],['nao_interessado','Não interessado']];
    inputEl.innerHTML = `
      <div class="log-input-row">
        <select id="logRes_${parentId}">${resOpts.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select>
        <input type="text" placeholder="Observação (opcional)" id="logObs_${parentId}"/>
        <button type="button" class="btn btn-primary btn-sm" id="logSave_${parentId}">Registrar ${tipo}</button>
      </div>`;
    $(`#logSave_${parentId}`).addEventListener('click', async ()=>{
      const payload = {
        [fk]: parentId, tipo,
        resultado: $(`#logRes_${parentId}`).value,
        obs: $(`#logObs_${parentId}`).value || null,
        criado_por: State.user?.id
      };
      const { error } = await supa.from(table).insert(payload);
      if(error) return toast(error.message,'error');
      toast('Tentativa registrada','success');
      inputEl.innerHTML='';
      refresh();
    });
  }));
}

/* ============================================================
   PROPOSTA MODAL
   ============================================================ */
function openPropostaModal(item=null){
  const isNew = !item;
  item = mergeChain(item || {});
  const statusOpts = [['em_aberto','Em aberto'],['enviada','Enviada'],['aceita','Aceita'],['recusada','Recusada']];
  const motivoPerdaOpts = [['','— selecione —'],['sem_interesse','Sem interesse'],['sem_credito','Sem crédito'],['concorrente','Concorrente'],['sem_resposta','Sem resposta'],['vistoria_reprovada','Vistoria reprovada'],['oportunidade_futura','Oportunidade futura']];

  openModal(`
    <div class="modal-header"><h2>${isNew?'Nova Proposta':'Editar Proposta'}</h2><button class="modal-close">×</button></div>
    <form id="propForm">
      <div class="modal-body">
        <div class="section"><div class="section-header"><h4>Cliente</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Nome',name:'nome',value:item.nome,required:true})}
            ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
            ${formField({label:'Email',name:'email',type:'email',value:item.email})}
            ${formField({label:'CPF',name:'cpf',value:item.cpf,placeholder:'000.000.000-00'})}
            ${formField({label:'Data de Nascimento',name:'nascimento',type:'date',value:item.nascimento})}
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>Endereço</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'CEP',name:'cep',value:item.cep})}
            ${formField({label:'Rua',name:'rua',value:item.rua})}
            ${formField({label:'Número',name:'numero',value:item.numero})}
            ${formField({label:'Complemento',name:'complemento',value:item.complemento})}
            ${formField({label:'Bairro',name:'bairro',value:item.bairro})}
            ${formField({label:'Cidade',name:'cidade',value:item.cidade})}
            ${formField({label:'Estado',name:'estado',value:item.estado})}
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>Kit Solar</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Qtd Módulos',name:'qtd_modulos',type:'number',value:item.qtd_modulos})}
            ${formField({label:'Marca Módulo',name:'marca_modulo',value:item.marca_modulo,datalist:DL_MARCA_MODULO})}
            ${formField({label:'Pot. Módulo (W)',name:'pot_modulo',type:'number',value:item.pot_modulo,datalist:DL_POT_MODULO})}
            ${formField({label:'Qtd Inversores',name:'qtd_inversores',type:'number',value:item.qtd_inversores})}
            ${formField({label:'Marca Inversor',name:'marca_inversor',value:item.marca_inversor,datalist:DL_MARCA_INVERSOR})}
            ${formField({label:'Pot. Inversor (kW)',name:'pot_inversor',type:'number',value:item.pot_inversor,datalist:DL_POT_INVERSOR})}
            ${formField({label:'Qtd Baterias',name:'qtd_baterias',type:'number',value:item.qtd_baterias})}
            ${formField({label:'Marca Bateria',name:'marca_bateria',value:item.marca_bateria,datalist:DL_MARCA_BATERIA})}
            ${formField({label:'Pot. Bateria (kWh)',name:'pot_bateria',type:'number',value:item.pot_bateria,datalist:DL_POT_BATERIA})}
            ${formField({label:'kWp (calculado)',name:'kwp',type:'number',value:item.kwp,readonly:true})}
            ${formField({label:'kWh consumo',name:'kwh',type:'number',value:item.kwh})}
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>Simulação Financeira</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Conta sem solar (R$)',name:'conta_sem_solar',type:'number',value:item.conta_sem_solar,readonly:true})}
            ${formField({label:'Conta com solar (R$)',name:'conta_com_solar',type:'number',value:item.conta_com_solar,readonly:true})}
            ${formField({label:'Economia mensal (R$)',name:'economia_mensal',type:'number',value:item.economia_mensal,readonly:true})}
            ${formField({label:'Economia em 5 anos (R$)',name:'economia_5anos',type:'number',value:item.economia_5anos,readonly:true})}
            ${formField({label:'Área mínima (m²)',name:'area_minima',type:'number',value:item.area_minima,readonly:true})}
            <div id="irradInfo" style="grid-column:1/-1;font-size:12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:8px 12px;color:#075985;display:none"></div>
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>Comercial</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Valor',name:'valor',type:'number',value:item.valor,required:true})}
            ${formField({label:'Validade',name:'validade',type:'date',value:item.validade,readonly:true})}
            ${formField({label:'Status',name:'status',type:'select',value:item.status||'em_aberto',options:statusOpts})}
            <div id="motivoPerdaPropWrap" style="display:${item.status==='recusada'?'':'none'}">
              ${formField({label:'Motivo da recusa',name:'motivo_perda',type:'select',value:item.motivo_perda||'',options:motivoPerdaOpts})}
            </div>
            ${formField({label:'Vendedor',name:'vendedor',type:'select',value:item.vendedor||(isVend()?State.profile.nome:''),options:[['','— selecione —'],...(State.perfis||[]).filter(p=>p.ativo!==false&&['vendedor','supervisor','admin'].includes(p.perfil)&&p.nome).map(p=>[p.nome,p.nome])]})}
            ${formField({label:'Tel. Vendedor',name:'vend_telefone',value:item.vend_telefone})}
            ${formField({label:'Email Vendedor',name:'vend_email',value:item.vend_email})}
          </div></div>
        </div>
        ${!isNew ? histSection() : ''}
      </div>
      <div class="modal-footer">
        ${!isNew?`<div class="btn-group"><button type="button" class="btn btn-secondary" id="vizPropBtn">👁️ Visualizar</button><button type="button" class="btn btn-secondary" id="dlPropBtn" title="Imprimir / PDF">🖨️ PDF</button></div>`:''}
        ${!isNew?`<button type="button" class="btn btn-danger" id="delPropBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'lg');

  const form = $('#propForm');
  attachCEP(form);

  // Auto-preenche telefone e email do vendedor ao selecionar
  const perfisMapProp = (State.perfis||[]).reduce((m,p)=>{ if(p.nome) m[p.nome]=p; return m; }, {});
  form.elements.vendedor?.addEventListener('change', e=>{
    const p = perfisMapProp[e.target.value];
    if(p){
      if(p.telefone) form.elements.vend_telefone.value = p.telefone;
      if(p.email)    form.elements.vend_email.value    = p.email;
    }
  });
  // Preenche ao abrir se os campos estiverem vazios
  if(item.vendedor){
    const p = perfisMapProp[item.vendedor];
    if(p){
      if(!form.elements.vend_telefone.value && p.telefone) form.elements.vend_telefone.value = p.telefone;
      if(!form.elements.vend_email.value    && p.email)    form.elements.vend_email.value    = p.email;
    }
  }

  // Exibe "Motivo da recusa" apenas quando status = recusada
  const statusPropSel = form.elements['status'];
  const motivoPerdaWrap = $('#motivoPerdaPropWrap');
  const toggleMotivoPerda = ()=>{
    motivoPerdaWrap.style.display = statusPropSel.value === 'recusada' ? '' : 'none';
  };
  statusPropSel.addEventListener('change', toggleMotivoPerda);

  // Validade automática (+7 dias) para novas propostas
  if(isNew && form.validade && !form.validade.value){
    const d = new Date(); d.setDate(d.getDate()+7);
    form.validade.value = d.toISOString().slice(0,10);
  }

  function recalc(){
    const qm = parseBR(form.qtd_modulos.value)||0;
    const pm = parseBR(form.pot_modulo.value)||0;
    const kwp = qm*pm/1000;
    form.kwp.value = kwp ? fmtInputNum(parseFloat(kwp.toFixed(4))) : '';
    // Área mínima: qtd_módulos × 3,5 m²
    form.area_minima.value = qm ? fmtInputNum(parseFloat((qm*3.5).toFixed(1))) : '';
  }
  // Irradiação média diária no plano inclinado (kWh/m²/dia, ordem de grandeza CRESESB/INMET) por UF; PR (performance ratio) 0,80
  const HSP_UF = {AC:4.6,AL:5.5,AP:4.8,AM:4.4,BA:5.6,CE:5.8,DF:5.5,ES:5.1,GO:5.5,MA:5.2,MT:5.3,MS:5.3,MG:5.4,PA:4.7,PB:5.7,PR:4.6,PE:5.6,PI:5.8,RJ:5.1,RN:5.8,RS:4.6,RO:4.7,RR:5.0,SC:4.5,SP:5.0,SE:5.5,TO:5.5};
  function recalcIrrad(){
    const box = $('#irradInfo'); if(!box) return;
    const kwp = parseBR(form.kwp.value)||0; const kwh = parseBR(form.kwh.value)||0;
    const uf = String(form.estado.value||'').trim().toUpperCase().slice(0,2);
    const hsp = HSP_UF[uf] || 4.8;
    if(!kwp){ box.style.display='none'; return; }
    const ger = kwp*hsp*30*0.80;
    const cob = kwh>0 ? Math.round(ger/kwh*100) : null;
    box.style.display='';
    box.innerHTML = `☀️ Geração estimada: <b>${Math.round(ger)} kWh/mês</b> (irradiação ${hsp.toFixed(1)} kWh/m²/dia${HSP_UF[uf]?' — '+uf:' — média; informe o Estado'}, PR 80%)` +
      (cob!=null ? ` · cobre <b>${cob}%</b> do consumo${cob<90?' ⚠️ kit abaixo do consumo':cob>115?' (sobra de crédito)':''}` : '');
  }
  function recalcSemSolar(){
    const kwh = parseBR(form.kwh.value)||0;
    if(kwh){
      const sem = parseFloat((kwh*1.32*1.13).toFixed(2)); // tarifa 1.32 + 13% CIP
      form.conta_sem_solar.value = fmtInputNum(sem);
      form.conta_com_solar.value = fmtInputNum(parseFloat((sem*0.15).toFixed(2)));
    }
    recalcEco();
  }
  function recalcComSolar(){
    const sem = parseBR(form.conta_sem_solar.value)||0;
    if(sem) form.conta_com_solar.value = fmtInputNum(parseFloat((sem*0.15).toFixed(2)));
    recalcEco();
  }
  function recalcEco(){
    const semSolar = parseBR(form.conta_sem_solar.value)||0;
    const comSolar = parseBR(form.conta_com_solar.value)||0;
    const eco = Math.max(0, semSolar - comSolar);
    form.economia_mensal.value = eco ? fmtInputNum(parseFloat(eco.toFixed(2))) : '';
    form.economia_5anos.value  = eco ? fmtInputNum(parseFloat((eco*60).toFixed(2))) : '';
  }
  ['qtd_modulos','pot_modulo'].forEach(n=> form[n].addEventListener('input',()=>{ recalc(); recalcIrrad(); }));
  form.kwh.addEventListener('input', ()=>{ recalcSemSolar(); recalcIrrad(); });
  form.estado.addEventListener('input', recalcIrrad);
  recalcIrrad();
  form.conta_sem_solar.addEventListener('input', recalcComSolar);
  form.conta_com_solar.addEventListener('input', recalcEco);

  // Recalcula ao abrir edição caso economia_mensal esteja zerada mas kwh esteja preenchido
  if(!isNew && !item.economia_mensal && item.kwh) recalcSemSolar();

  if(!isNew) carregarHistorico($('#histList'), 'propostas', item.id);

  const statusPropMap = {em_aberto:'Em aberto', enviada:'Enviada', aceita:'Aceita', perdida:'Perdida', recusada:'Recusada'};
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    ['qtd_modulos','pot_modulo','qtd_inversores','pot_inversor','qtd_baterias','pot_bateria','kwp','kwh','valor',
     'conta_sem_solar','conta_com_solar','economia_mensal','economia_5anos','area_minima'].forEach(k=>{ data[k] = data[k]!=null ? Number(data[k]) : null; });
    if(isNew){
      data.criado_por = State.user?.id;
      const { data: propCriada, error } = await supa.from('propostas').insert(data).select('id').single();
      if(error) return toast(error.message,'error');
      await registrarHistorico('propostas', propCriada.id, 'criado', `Proposta criada: ${data.nome||''}`);
      toast('Proposta criada','success');
    } else {
      const prevStatus = item.status;
      if(data.status !== 'recusada') data.motivo_perda = null;
      const { error } = await supa.from('propostas').update(data).eq('id',item.id);
      if(error) return toast(error.message,'error');
      const mud = detectMudancas(item, data, [
        ['status','Status', v=>statusPropMap[v]||v],
        ['vendedor','Vendedor',null], ['valor','Valor',null],
      ]);
      const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
      await registrarHistorico('propostas', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');

      // Proposta recusada → envia cliente para Remarketing
      if(data.status === 'recusada' && prevStatus !== 'recusada'){
        await enviarParaRemarketing({...item,...data}, 'proposta_recusada', 'Proposta recusada');
      } else
      // Proposta aceita → cria Vistoria automaticamente (se ainda não existir)
      if(data.status === 'aceita' && prevStatus !== 'aceita'){
        const jaExiste = (State.vistorias||[]).find(v => v.proposta_id === item.id);
        if(!jaExiste){
          await loadAll(); // garante dados frescos
          const propostaAtual = (State.propostas||[]).find(p=>p.id===item.id) || {...item,...data};
          const vPayload = buildTransitionPayload(propostaAtual, 'proposta', 'vistoria');
          vPayload.criado_por = State.user?.id;
          const { error: ve } = await supa.from('vistorias').insert(vPayload);
          if(ve) toast('Proposta aceita, mas erro ao criar vistoria: '+ve.message,'error');
          else toast('Proposta aceita → Vistoria criada automaticamente! ✓','success');
        } else {
          toast('Proposta atualizada','success');
        }
      } else {
        toast('Proposta atualizada','success');
      }
    }
    closeModal();
    if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
  });
  $('#vizPropBtn')?.addEventListener('click', ()=> abrirPropostaJanela(item, false));
  $('#dlPropBtn')?.addEventListener('click',  ()=> abrirPropostaJanela(item, true));

  $('#delPropBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir proposta?')) return;
    await supa.from('propostas').delete().eq('id',item.id);
    toast('Excluído','success'); closeModal();
    if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
  });
}

/* ============================================================
   FILE UPLOAD HELPER
   ============================================================ */
async function compressImage(file, maxPx=800, quality=0.55){
  const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp|heic|heif)$/i.test(file.name);
  if(!isImage) return file;
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if(width > maxPx || height > maxPx){
        if(width >= height){ height = Math.round(height * maxPx / width); width = maxPx; }
        else               { width  = Math.round(width  * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if(!blob){ resolve(file); return; }
        const compressed = new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {type:'image/jpeg'});
        resolve(compressed);
      }, 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function uploadFile(bucket, file, prefix=''){
  const processed = await compressImage(file);
  const ext = (processed.name.split('.').pop()||'bin').toLowerCase();
  const path = `${prefix?prefix+'/':''}${Date.now()}_${uid()}.${ext}`;
  const { error } = await supa.storage.from(bucket).upload(path, processed, { upsert:false, contentType:processed.type || 'application/octet-stream' });
  if(error) throw error;
  const { data:urlData } = supa.storage.from(bucket).getPublicUrl(path);
  return { url:urlData.publicUrl, path, name:file.name };
}

/* ============================================================
   FOTOS OFFLINE — guarda a imagem no aparelho (IndexedDB) quando não há
   internet e envia ao Storage automaticamente ao sincronizar
   ============================================================ */
const _OFFLINE_DB = 'ser_offline_files', _OFFLINE_STORE = 'files';
const _pendingUrls = {};
function _idb(){
  return new Promise((res,rej)=>{
    const r = indexedDB.open(_OFFLINE_DB, 1);
    r.onupgradeneeded = ()=> r.result.createObjectStore(_OFFLINE_STORE, { keyPath:'id' });
    r.onsuccess = ()=> res(r.result);
    r.onerror = ()=> rej(r.error);
  });
}
async function _idbOp(mode, fn){
  const db = await _idb();
  return new Promise((res,rej)=>{
    const tx = db.transaction(_OFFLINE_STORE, mode);
    const req = fn(tx.objectStore(_OFFLINE_STORE));
    tx.oncomplete = ()=> res(req?.result);
    tx.onerror = ()=> rej(tx.error);
  });
}
async function guardarArquivoOffline(bucket, file, prefix){
  const processed = await compressImage(file);
  const id = uid();
  await _idbOp('readwrite', s=>s.put({ id, bucket, prefix, blob:processed, fileName:file.name, ts:Date.now() }));
  _pendingUrls[id] = URL.createObjectURL(processed);
  return { url:_pendingUrls[id], name:file.name, path:'', _pending:id, _img:(processed.type||'').startsWith('image/') };
}
// Recria as miniaturas das fotos pendentes após recarregar a página e limpa registros com mais de 7 dias
async function carregarPreviewsPendentes(){
  try{
    const all = await _idbOp('readonly', s=>s.getAll());
    for(const rec of (all||[])){
      if(Date.now()-rec.ts > 7*86400000){ await _idbOp('readwrite', s=>s.delete(rec.id)); continue; }
      if(!_pendingUrls[rec.id]) _pendingUrls[rec.id] = URL.createObjectURL(rec.blob);
    }
  }catch(e){}
}
// Envia ao Storage as fotos pendentes citadas em `v` e devolve a estrutura já com as URLs definitivas
async function resolverArquivosPendentes(v, usados){
  if(!JSON.stringify(v||null).includes('"_pending"')) return v;
  if(Array.isArray(v)){
    const out = [];
    for(const it of v){ const r = await resolverArquivosPendentes(it, usados); if(r!==undefined) out.push(r); }
    return out;
  }
  if(v && typeof v === 'object'){
    if(v._pending){
      const rec = await _idbOp('readonly', s=>s.get(v._pending));
      if(!rec) return undefined; // arquivo local sumiu: descarta a referência
      const ext = (rec.fileName.split('.').pop()||'jpg').toLowerCase();
      const path = `${rec.prefix?rec.prefix+'/':''}${Date.now()}_${uid()}.${ext}`;
      const { error } = await supa.storage.from(rec.bucket).upload(path, rec.blob, { upsert:false, contentType:rec.blob.type||'application/octet-stream' });
      if(error) throw error;
      const { data:urlData } = supa.storage.from(rec.bucket).getPublicUrl(path);
      if(usados) usados.push(rec.id); else await _idbOp('readwrite', s=>s.delete(rec.id));
      return { url:urlData.publicUrl, path, name:rec.fileName };
    }
    const out = {};
    for(const k of Object.keys(v)){ const r = await resolverArquivosPendentes(v[k], usados); if(r!==undefined) out[k] = r; }
    return out;
  }
  return v;
}

function fileUploadBlock(label, name, bucket, currentList=[], multiple=true, contain=false){
  const list = Array.isArray(currentList)?currentList:[];
  const btnLabel = multiple ? '+ Adicionar fotos' : '+ Selecionar arquivo';
  return `
    <div class="file-upload" data-fu="${name}">
      <label>${esc(label)}</label>
      <div class="file-thumbs" data-thumbs="${name}" ${contain?'data-contain="1"':''}>
        ${list.map((f,i)=>thumbHtml(f,name,i,contain)).join('')}
      </div>
      <button type="button" class="btn-add-file" data-trigger="${name}">${btnLabel}</button>
      <input type="file" data-bucket="${bucket}" data-name="${name}" ${multiple?'multiple':''} accept="image/*,application/pdf" />
    </div>`;
}
function thumbHtml(f,name,i,contain=false){
  const containClass = contain ? ' contain' : '';
  const containStyle = contain ? ' style="width:120px;height:90px"' : '';
  if(f._pending){
    const pu = _pendingUrls[f._pending];
    const body = (pu && f._img)
      ? `<a href="${esc(pu)}" target="_blank"><img src="${esc(pu)}" alt="${esc(f.name||'')}"/></a>`
      : `<span style="font-size:11px">${esc(f.name||'arquivo')}</span>`;
    return `<div class="file-thumb ${(pu&&f._img)?'':'doc'}${containClass}" data-name="${name}" data-i="${i}"${containStyle} title="Salva no aparelho — será enviada ao reconectar">
      ${body}<span style="position:absolute;left:4px;bottom:4px;background:#f59e0b;color:#fff;border-radius:6px;font-size:10px;padding:1px 4px">📡</span>
      <button type="button" class="rm" data-rm="${name}" data-i="${i}">×</button>
    </div>`;
  }
  const isImg = (f.url||'').match(/\.(jpe?g|png|gif|webp|bmp)$/i);
  return `<div class="file-thumb ${isImg?'':'doc'}${containClass}" data-name="${name}" data-i="${i}"${containStyle}>
    ${isImg ? `<a href="${esc(f.url)}" target="_blank"><img src="${esc(f.url)}" alt="${esc(f.name||'')}"/></a>` : `<a href="${esc(f.url)}" target="_blank">${esc(f.name||'arquivo')}</a>`}
    <button type="button" class="rm" data-rm="${name}" data-i="${i}">×</button>
  </div>`;
}

function attachFileUploads(rootEl, fileStore, opts={}){
  function bindRemove(){
    $$('[data-rm]',rootEl).forEach(b=>{
      if(b._bound) return; b._bound = true;
      b.addEventListener('click', ()=>{
        const name = b.dataset.rm, i = Number(b.dataset.i);
        if(!fileStore[name]) return;
        fileStore[name].splice(i,1);
        const wrap = rootEl.querySelector(`[data-thumbs="${name}"]`);
        const isContain = wrap?.dataset.contain === '1';
        wrap.innerHTML = fileStore[name].map((f,i)=>thumbHtml(f,name,i,isContain)).join('');
        bindRemove();
      });
    });
  }
  // Botão "+ Adicionar fotos/arquivo" → dispara o input oculto
  $$('.btn-add-file',rootEl).forEach(btn=>{
    if(btn._bound) return; btn._bound = true;
    btn.addEventListener('click', ()=>{
      const inp = rootEl.querySelector(`input[type=file][data-name="${btn.dataset.trigger}"]`);
      if(inp) inp.click();
    });
  });

  $$('input[type=file]',rootEl).forEach(inp=>{
    inp.addEventListener('change', async ()=>{
      const bucket = inp.dataset.bucket;
      const name = inp.dataset.name;
      fileStore[name] = fileStore[name] || [];
      for(const file of inp.files){
        const MB = file.size / 1024 / 1024;
        if(MB > 48){
          toast(`❌ Arquivo muito grande (${MB.toFixed(0)} MB). Limite: 48 MB. Comprima o PDF antes de enviar.`,'error',6000);
          continue;
        }
        const guardarLocal = async ()=>{
          const f = await guardarArquivoOffline(bucket, file, name);
          fileStore[name].push(f);
          toast('📡 Sem internet — foto salva no aparelho, será enviada ao reconectar.','info',3500);
        };
        try{
          if(opts.offline && !navigator.onLine){ await guardarLocal(); continue; }
          toast('Enviando '+file.name+'…','info',1500);
          const f = await uploadFile(bucket, file, name);
          fileStore[name].push(f);
        }catch(e){
          if(opts.offline && isNetworkError(e)){
            try{ await guardarLocal(); }catch(e2){ toast('Erro ao guardar foto: '+e2.message,'error'); }
          } else toast('Erro upload: '+e.message,'error');
        }
      }
      const wrap = rootEl.querySelector(`[data-thumbs="${name}"]`);
      const isContain = wrap?.dataset.contain === '1';
      wrap.innerHTML = fileStore[name].map((f,i)=>thumbHtml(f,name,i,isContain)).join('');
      bindRemove();
      inp.value = '';
    });
  });
  bindRemove();
}

/* ============================================================
   VISTORIA MODAL
   ============================================================ */
function openVistoriaModal(item=null){
  const isNew = !item;
  item = mergeChain(item || {});
  const linked = getLinkedDocs(item);

  const statusOpts   = [['aguardando_agendamento','Aguardando Agendamento'],['agendada','Agendada'],['realizada','Realizada'],['cancelada','Cancelada']];
  const parecerOpts  = [['','— selecione —'],['aprovado','Aprovado'],['aprovado_com_obra','Aprovado com Obra'],['aprovado_com_sombreamento','Aprovado com Sombreamento'],['aprovado_com_obra_e_sombreamento','Aprovado com Obra e Sombreamento'],['reprovado','Reprovado']];
  const redeOpts         = [['','— selecione —'],['monofasico','Monofásico'],['bifasico','Bifásico'],['trifasico','Trifásico'],['nova_uc','Nova Unidade Consumidora']];
  const aumentoCargaOpts = [['','— selecione —'],['bifasico','Bifásico'],['trifasico','Trifásico'],['nao_se_aplica','Não se aplica']];
  const locPadraoOpts    = [['','— selecione —'],['fachada_da_casa','Fachada da casa'],['muro','Muro'],['poste_auxiliar_existente','Poste auxiliar já existe no local'],['necessidade_de_pontalete','Necessidade de pontalete'],['necessidade_de_novo_poste','Necessidade de novo poste auxiliar']];
  const estOpts      = [['madeira','Madeira'],['metalica','Metálica'],['laje','Laje'],['solo','Solo']];
  const telhaOpts    = [['ceramica','Cerâmica / Colonial'],['americana','Americana'],['metalica','Metálica / Trapezoidal'],['fibrocimento','Fibrocimento'],['amianto','Amianto'],['aluzinco','Aluzinco'],['laje','Laje'],['platibanda','Platibanda'],['outro','Outro']];
  const aptasOpts    = [['nenhuma','Nenhuma das águas'],['agua_01','Água 01'],['agua_02','Água 02'],['agua_03','Água 03'],['agua_04','Água 04'],['agua_05','Água 05'],['agua_06','Água 06'],['todas','Todas as águas']];
  const obraOpts     = [['nao_ha','Não há necessidade'],['agua_01','Água 01'],['agua_02','Água 02'],['agua_03','Água 03'],['agua_04','Água 04'],['agua_05','Água 05'],['agua_06','Água 06'],['todas','Todas as águas']];

  const dp = item.dados_padrao    || {};
  const di = item.dados_inversor  || {};
  const de = item.dados_estrutura || {};
  const fotos = item.fotos || {};
  const docs  = item.docs  || {};

  // foto keys separados por seção (para o PDF e para pickFiles)
  const fotoKeysPadrao   = ['localizacao','fachada','poste','ramal_entrada','local_padrao','padrao_atual','disjuntor'];
  const fotoKeysInversor = ['local_inversor','local_cabo_cc','local_aterramento'];
  const fotoKeysEstrutura= ['estrutura','telhas','telhado_aereo','croqui'];
  const fotoKeys = [...fotoKeysPadrao, ...fotoKeysInversor, ...fotoKeysEstrutura];
  const docKeys  = ['pdf_sombreamento','laudo_tecnico'];

  openModal(`
    <div class="modal-header">
      <h2>${isNew?'Nova Vistoria':'Vistoria Técnica'}</h2>
      <span id="autosaveInd" style="font-size:11px;color:#6B21A8;margin-left:8px;flex:1"></span>
      <button class="modal-close">×</button>
    </div>
    <form id="vistForm" novalidate>
      <div class="modal-body">
        <div id="draftBanner" style="display:none;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:10px;display:none;align-items:center;justify-content:space-between;gap:12px;font-size:12px">
          <span>💾 <strong>Rascunho encontrado.</strong> Deseja restaurar o que foi preenchido?</span>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button type="button" id="draftRestoreBtn" class="btn btn-sm btn-primary">Restaurar</button>
            <button type="button" id="draftDiscardBtn" class="btn btn-sm btn-secondary">Descartar</button>
          </div>
        </div>

        <!-- ── AGENDAMENTO ───────────────────────────────── -->
        <div class="section"><div class="section-header"><h4>📅 Agendamento</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Nome',name:'nome',value:item.nome,required:true})}
            ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
            ${formField({label:'Email',name:'email',type:'email',value:item.email})}
            ${formField({label:'Data Agendamento',name:'data_agendamento',type:'date',value:item.data_agendamento,required:true})}
            ${formField({label:'Hora Agendamento',name:'hora_agendamento',type:'time',value:item.hora_agendamento})}
            ${formField({label:'Técnico',name:'tecnico',value:item.tecnico,datalist:DL_TECNICO})}
            ${formField({label:'Google Maps URL',name:'gmap',value:item.gmap,required:true,full:true,placeholder:'Cole aqui o link do Google Maps'})}
            ${formField({label:'Status',name:'status',type:'select',value:item.status||'agendada',options:statusOpts})}
          </div></div>
        </div>

        <!-- ── ENDEREÇO ──────────────────────────────────── -->
        <div class="section collapsed"><div class="section-header"><h4>📍 Endereço</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'CEP',name:'cep',value:item.cep})}
            ${formField({label:'Rua',name:'rua',value:item.rua})}
            ${formField({label:'Número',name:'numero',value:item.numero})}
            ${formField({label:'Complemento',name:'complemento',value:item.complemento})}
            ${formField({label:'Bairro',name:'bairro',value:item.bairro})}
            ${formField({label:'Cidade',name:'cidade',value:item.cidade})}
            ${formField({label:'Estado',name:'estado',value:item.estado})}
          </div></div>
        </div>

        <!-- ── KIT CONFIRMADO ────────────────────────────── -->
        <div class="section collapsed"><div class="section-header"><h4>🔋 Kit Confirmado</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Qtd Módulos',name:'qtd_modulos',type:'number',value:item.qtd_modulos})}
            ${formField({label:'Marca Módulo',name:'marca_modulo',value:item.marca_modulo,datalist:DL_MARCA_MODULO})}
            ${formField({label:'Pot. Módulo (W)',name:'pot_modulo',type:'number',value:item.pot_modulo,datalist:DL_POT_MODULO})}
            ${formField({label:'Qtd Inversores',name:'qtd_inversores',type:'number',value:item.qtd_inversores})}
            ${formField({label:'Marca Inversor',name:'marca_inversor',value:item.marca_inversor,datalist:DL_MARCA_INVERSOR})}
            ${formField({label:'Pot. Inversor',name:'pot_inversor',type:'number',value:item.pot_inversor,datalist:DL_POT_INVERSOR})}
            ${formField({label:'kWp',name:'kwp',type:'number',value:item.kwp})}
          </div></div>
        </div>

        <!-- ══ 1. DADOS DO PADRÃO ════════════════════════ -->
        <div class="section collapsed"><div class="section-header"><h4>⚡ 1. Dados do Padrão</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">

            ${formField({label:'Data de Realização',name:'dp_data_realizacao',type:'date',value:dp.data_realizacao})}
            ${formField({label:'Cliente presente? *',name:'cliente_presente',type:'select',value:item.cliente_presente===true?'sim':item.cliente_presente===false?'nao':'',options:[['','— selecione —'],['sim','Sim'],['nao','Não']],required:true})}
            <div id="respAusenciaWrap" style="display:${item.cliente_presente===false||item.cliente_presente==='false'||item.cliente_presente==='nao'?'block':'none'}">
              ${formField({label:'Responsável que acompanhou',name:'responsavel_ausencia',value:item.responsavel_ausencia,full:true})}
            </div>

            ${fileUploadBlock('Print da Localização *','localizacao','vistorias',fotos.localizacao||[],true)}
            ${fileUploadBlock('Foto da Fachada *','fachada','vistorias',fotos.fachada||[],true)}

            ${formField({label:'Fornecimento — Rede atual *',name:'dp_rede_atual',type:'select',value:dp.rede_atual,options:redeOpts,required:true})}
            ${formField({label:'Necessita aumento de carga? *',name:'dp_aumento_carga',type:'select',value:dp.aumento_carga,options:aumentoCargaOpts,required:true})}

            ${fileUploadBlock('Imagem do Poste *','poste','vistorias',fotos.poste||[],true)}

            ${formField({label:'Cabo Linha',name:'dp_cabo_linha',value:dp.cabo_linha})}
            ${formField({label:'Cabo Carga',name:'dp_cabo_carga',value:dp.cabo_carga})}

            ${fileUploadBlock('Foto do Ramal de Entrada','ramal_entrada','vistorias',fotos.ramal_entrada||[],true)}

            ${formField({label:'Distância Padrão → Ancoragem *',name:'dp_dist_padrao_ancoragem',value:dp.dist_padrao_ancoragem,required:true})}
            ${formField({label:'Distância Padrão → Ramal de Entrada *',name:'dp_dist_ancoragem_ramal',value:dp.dist_ancoragem_ramal,required:true})}
            ${formField({label:'Localização do Padrão *',name:'dp_localizacao_padrao',type:'select',value:dp.localizacao_padrao,options:locPadraoOpts,required:true})}

            ${fileUploadBlock('Foto do Local de Instalação do Padrão *','local_padrao','vistorias',fotos.local_padrao||[],true)}

            ${formField({label:'Caixa do Padrão *',name:'dp_tipo_caixa',value:dp.tipo_caixa,required:true})}

            ${fileUploadBlock('Foto do Padrão Atual *','padrao_atual','vistorias',fotos.padrao_atual||[],true)}

            ${formField({label:'Disjuntor Atual do Padrão *',name:'dp_disjuntor',value:dp.disjuntor,required:true})}

            ${fileUploadBlock('Foto do Disjuntor do Padrão *','disjuntor','vistorias',fotos.disjuntor||[],true)}

            ${formField({label:'Qtd Eletroduto — Carga do Padrão *',name:'dp_qtd_eletroduto_carga',type:'number',value:dp.qtd_eletroduto_carga,required:true})}
            ${formField({label:'Qtd Curvas — Carga do Padrão *',name:'dp_qtd_curvas_carga',type:'number',value:dp.qtd_curvas_carga,required:true})}
            ${formField({label:'Qtd Eletroduto — Linha do Padrão *',name:'dp_qtd_eletroduto_linha',type:'number',value:dp.qtd_eletroduto_linha,required:true})}
            ${formField({label:'Qtd Curvas — Linha do Padrão *',name:'dp_qtd_curvas_linha',type:'number',value:dp.qtd_curvas_linha,required:true})}
            ${formField({label:'Observação sobre o Padrão',name:'dp_obs_padrao',type:'textarea',value:dp.obs_padrao,full:true})}

          </div></div>
        </div>

        <!-- ══ 2. DADOS DO INVERSOR ══════════════════════ -->
        <div class="section collapsed"><div class="section-header"><h4>🔌 2. Dados do Inversor</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">

            ${formField({label:'Local de Instalação do Inversor *',name:'di_local_inversor',value:di.local_inversor,required:true,full:true})}
            ${fileUploadBlock('Foto do Local de Instalação do Inversor *','local_inversor','vistorias',fotos.local_inversor||[],true)}
            ${fileUploadBlock('Foto do Local de Passagem do Cabo CC *','local_cabo_cc','vistorias',fotos.local_cabo_cc||[],true)}

            ${formField({label:'Qtd Eletroduto — CC *',name:'di_qtd_eletroduto_cc',type:'number',value:di.qtd_eletroduto_cc,required:true})}
            ${formField({label:'Qtd Curvas — CC *',name:'di_qtd_curvas_cc',type:'number',value:di.qtd_curvas_cc,required:true})}
            ${formField({label:'Qtd Conduletes — CC',name:'di_qtd_conduletes_cc',type:'number',value:di.qtd_conduletes_cc})}
            ${formField({label:'Qtd Eletroduto — CA *',name:'di_qtd_eletroduto_ca',type:'number',value:di.qtd_eletroduto_ca,required:true})}
            ${formField({label:'Qtd Curvas — CA *',name:'di_qtd_curvas_ca',type:'number',value:di.qtd_curvas_ca,required:true})}
            ${formField({label:'Qtd Conduletes — CA *',name:'di_qtd_conduletes_ca',type:'number',value:di.qtd_conduletes_ca,required:true})}
            ${formField({label:'Qtd Eletroduto — Aterramento *',name:'di_qtd_eletroduto_at',type:'number',value:di.qtd_eletroduto_at,required:true})}
            ${formField({label:'Qtd Curvas — Aterramento *',name:'di_qtd_curvas_at',type:'number',value:di.qtd_curvas_at,required:true})}
            ${formField({label:'Qtd Caixas Conduletes — Aterramento *',name:'di_qtd_caixas_at',type:'number',value:di.qtd_caixas_at,required:true})}
            ${formField({label:'Metragem Tubulação Flexível CC *',name:'di_metro_flex_cc',value:di.metro_flex_cc,required:true})}
            ${formField({label:'Metragem Cabo CC (Módulos → Inversor) *',name:'di_metro_cabo_cc',value:di.metro_cabo_cc,required:true})}
            ${formField({label:'Metragem Cabo AT (Módulos → Inversor) *',name:'di_metro_at_mod_inv',value:di.metro_at_mod_inv,required:true})}
            ${formField({label:'Metragem Cabo AT (Inversor → Haste) *',name:'di_metro_at_inv_haste',value:di.metro_at_inv_haste,required:true})}
            ${formField({label:'Local do Aterramento *',name:'di_local_aterramento',value:di.local_aterramento,required:true,full:true})}
            ${fileUploadBlock('Foto do Local do Aterramento *','local_aterramento','vistorias',fotos.local_aterramento||[],true)}
            ${formField({label:'Metragem Tubulação Flexível CA *',name:'di_metro_flex_ca',value:di.metro_flex_ca,required:true})}
            ${formField({label:'Metragem Cabo CA (Inversor → Conexão) *',name:'di_metro_cabo_ca',value:di.metro_cabo_ca,required:true})}

          </div></div>
        </div>

        <!-- ══ 3. DADOS DA ESTRUTURA ═════════════════════ -->
        <div class="section collapsed"><div class="section-header"><h4>🏠 3. Dados da Estrutura</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">

            ${formField({label:'Tipo de Estrutura *',name:'de_tipo_estrutura',type:'multicheck',value:de.tipo_estrutura,options:estOpts,full:true})}
            ${formField({label:'Tipo da Telha *',name:'de_tipo_telha',type:'multicheck',value:de.tipo_telha,options:telhaOpts,full:true})}

            ${fileUploadBlock('Imagens das Estruturas','estrutura','vistorias',fotos.estrutura||[],true)}

            ${formField({label:'Estruturas Aptas *',name:'de_estruturas_aptas',type:'multicheck',value:de.estruturas_aptas,options:aptasOpts,full:true})}
            ${formField({label:'Estruturas com Necessidade de Obra *',name:'de_estruturas_obra',type:'multicheck',value:de.estruturas_obra,options:obraOpts,full:true})}
            ${formField({label:'Descrição da Obra',name:'de_desc_obra',type:'textarea',value:de.desc_obra,full:true})}
            ${formField({label:'Qtd Módulos que a Área Comporta *',name:'de_modulos_comporta',type:'number',value:de.modulos_comporta,required:true})}
            ${formField({label:'Necessita trocar inversor (inclinações)? *',name:'de_trocar_inversor_inclinacao',type:'select',value:de.trocar_inversor_inclinacao,options:[['','— selecione —'],['sim','Sim'],['nao','Não']],required:true})}

            ${fileUploadBlock('Foto das Telhas *','telhas','vistorias',fotos.telhas||[],true)}
            ${fileUploadBlock('Imagem Aérea *','telhado_aereo','vistorias',fotos.telhado_aereo||[],true)}
            ${fileUploadBlock('Imagem do Croqui *','croqui','vistorias',fotos.croqui||[],true,true)}

            ${formField({label:'Há risco de sombreamento? *',name:'de_risco_sombreamento',type:'select',value:de.risco_sombreamento,options:[['','— selecione —'],['sim','Sim'],['nao','Não']],required:true})}

            ${fileUploadBlock('PDF Análise de Sombreamento','pdf_sombreamento','vistorias',docs.pdf_sombreamento||[],true)}
            ${fileUploadBlock('Laudo Técnico','laudo_tecnico','vistorias',docs.laudo_tecnico||[],true)}

            ${formField({label:'Observação sobre Estrutura',name:'de_obs_estrutura',type:'textarea',value:de.obs_estrutura,full:true})}

            <div style="grid-column:1/-1;border-top:2px solid var(--primary);padding-top:14px;margin-top:6px">
              ${formField({label:'Parecer Final',name:'resultado',type:'select',value:item.resultado,options:parecerOpts,full:true})}
            </div>

          </div></div>
        </div>

        ${!isNew?renderLinkedDocBtns(linked):''}
        ${!isNew ? histSection() : ''}
      </div>
      <div class="modal-footer">
        ${!isNew && isAdmin()?`<button type="button" class="btn btn-danger" id="delVistBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        ${!isNew?`<button type="button" class="btn btn-secondary" id="vistPdfBtn">🖨️ Gerar Relatório</button>`:''}
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'lg');

  const form = $('#vistForm');
  attachCEP(form);

  // Mostrar/ocultar responsável ausência conforme toggle de presença
  const toggleRespWrap = () => {
    const val = form.elements.cliente_presente?.value;
    const wrap = document.getElementById('respAusenciaWrap');
    if(wrap) wrap.style.display = val === 'nao' ? 'block' : 'none';
  };
  form.elements.cliente_presente?.addEventListener('change', toggleRespWrap);
  toggleRespWrap();

  if(!isNew){ attachLinkedDocListeners(linked); carregarHistorico($('#histList'), 'vistorias', item.id); }

  const allFiles = {};
  [...fotoKeys, ...docKeys].forEach(k=>{
    allFiles[k] = (fotos[k] || docs[k] || []).slice();
  });
  attachFileUploads(form, allFiles, {offline: !!item});

  // ── Auto-save: persiste o rascunho no localStorage ───────
  const _draftKey = `vistoria_rascunho_${item.id||'nova'}`;
  const _saveDraft = ()=>{
    try{
      localStorage.setItem(_draftKey, JSON.stringify({
        ts: Date.now(),
        fields: readForm(form),
        files: JSON.parse(JSON.stringify(allFiles))
      }));
      const ind = document.getElementById('autosaveInd');
      if(ind){ const t=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); ind.textContent=`💾 salvo às ${t}`; }
    }catch(e){}
  };
  let _draftTimer = null;
  form.addEventListener('input',  ()=>{ clearTimeout(_draftTimer); _draftTimer=setTimeout(_saveDraft,1500); });
  form.addEventListener('change', ()=>{ clearTimeout(_draftTimer); _draftTimer=setTimeout(_saveDraft,1500); });

  // Verificar se existe rascunho e oferecer restauração
  try{
    const saved = localStorage.getItem(_draftKey);
    if(saved){
      const draft = JSON.parse(saved);
      const mins = Math.round((Date.now()-draft.ts)/60000);
      if(mins < 1440){
        const banner = document.getElementById('draftBanner');
        if(banner){
          banner.style.display='flex';
          banner.querySelector('span').innerHTML=`💾 <strong>Rascunho encontrado</strong> — salvo há ${mins<1?'menos de 1':mins} min. Deseja restaurar o que foi preenchido?`;
          document.getElementById('draftRestoreBtn')?.addEventListener('click',()=>{
            Object.entries(draft.fields||{}).forEach(([k,v])=>{
              // multicheck: restaura checkboxes pelo data-multicheck
              const mcDiv = form.querySelector(`[data-multicheck="${k}"]`);
              if(mcDiv){
                const vals = Array.isArray(v)?v:(v?[v]:[]);
                mcDiv.querySelectorAll('input[type=checkbox]').forEach(cb=>{ cb.checked=vals.includes(cb.value); });
                return;
              }
              const el = form.elements[k];
              if(!el) return;
              if(el.type==='checkbox') el.checked=!!v;
              else el.value=v;
            });
            Object.entries(draft.files||{}).forEach(([k,arr])=>{
              allFiles[k]=arr;
              const wrap=form.querySelector(`[data-thumbs="${k}"]`);
              if(wrap) wrap.innerHTML=arr.map((f,i)=>thumbHtml(f,k,i)).join('');
            });
            toggleRespWrap();
            banner.style.display='none';
            toast('Rascunho restaurado!','success');
            _saveDraft();
          });
          document.getElementById('draftDiscardBtn')?.addEventListener('click',()=>{
            localStorage.removeItem(_draftKey);
            banner.style.display='none';
          });
        }
      }
    }
  }catch(e){}
  // ─────────────────────────────────────────────────────────

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const raw = readForm(form);
    const data = {
      nome:raw.nome, telefone:raw.telefone, email:raw.email,
      data_agendamento:raw.data_agendamento, hora_agendamento:raw.hora_agendamento,
      tecnico:raw.tecnico, gmap:raw.gmap,
      cliente_presente: raw.cliente_presente==='sim' ? true : raw.cliente_presente==='nao' ? false : null,
      responsavel_ausencia:raw.responsavel_ausencia,
      resultado:raw.resultado, status:raw.status,
      cep:raw.cep, rua:raw.rua, numero:raw.numero, complemento:raw.complemento,
      bairro:raw.bairro, cidade:raw.cidade, estado:raw.estado,
      qtd_modulos:raw.qtd_modulos?Number(raw.qtd_modulos):null,
      marca_modulo:raw.marca_modulo||null,
      pot_modulo:raw.pot_modulo?Number(raw.pot_modulo):null,
      qtd_inversores:raw.qtd_inversores?Number(raw.qtd_inversores):null,
      marca_inversor:raw.marca_inversor||null,
      pot_inversor:raw.pot_inversor?Number(raw.pot_inversor):null,
      kwp:raw.kwp?Number(raw.kwp):null,
      dados_padrao:    extractJsonGroup(raw,'dp_'),
      dados_inversor:  extractJsonGroup(raw,'di_'),
      dados_estrutura: extractJsonGroup(raw,'de_'),
      fotos: pickFiles(allFiles, fotoKeys),
      docs:  pickFiles(allFiles, docKeys)
    };
    const parecerMap = {
      aprovado:'Aprovado', aprovado_com_obra:'Aprovado c/ Obra',
      aprovado_com_sombreamento:'Aprovado c/ Sombreamento',
      aprovado_com_obra_e_sombreamento:'Aprovado c/ Obra e Sombreamento',
      reprovado:'Reprovado',
      // backward compat
      aprovada:'Aprovada', aprovada_com_obra:'Aprovada c/ Obra',
      aprovada_com_sombreamento:'Aprovada c/ Sombreamento',
      aprovada_com_obra_e_sombreamento:'Aprovada c/ Obra e Sombreamento'
    };
    const eAprovado = v => ['aprovado','aprovado_com_obra','aprovado_com_sombreamento','aprovado_com_obra_e_sombreamento','aprovada','aprovada_com_obra','aprovada_com_sombreamento','aprovada_com_obra_e_sombreamento'].includes(v||'');
    const eReprovado = v => ['reprovado','reprovada'].includes(v||'');

    if(isNew){
      data.criado_por = State.user?.id;
      const { data: vistCriada, error } = await supa.from('vistorias').insert(data).select('id').single();
      if(error) return toast(error.message,'error');
      await registrarHistorico('vistorias', vistCriada.id, 'criado', `Vistoria criada: ${data.nome||''}`);
      toast('Vistoria salva','success');
    } else {
      const prevResultado = item.resultado || '';
      const { queued, error } = await salvarComOffline('vistorias', item.id, data, `Vistoria de ${item.nome||''}`);
      if(error) return toast(error.message,'error');
      if(queued){
        toast('📡 Sem internet — vistoria salva localmente. Será enviada automaticamente ao reconectar.','info',5000);
        localStorage.removeItem(_draftKey);
        closeModal();
        return;
      }
      const mud = detectMudancas(item, data, [
        ['resultado','Parecer', v=>parecerMap[v]||v],
        ['status','Status',null], ['tecnico','Técnico',null],
      ]);
      const acao = mud.some(m=>m.startsWith('Parecer')) ? 'status' : 'atualizado';
      await registrarHistorico('vistorias', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');

      if(eAprovado(data.resultado) && !eAprovado(prevResultado)){
        const jaExiste = (State.contratos||[]).find(c => c.vistoria_id === item.id);
        if(!jaExiste){
          await loadAll();
          const vistAtual = (State.vistorias||[]).find(v=>v.id===item.id) || {...item,...data};
          const cPayload = buildTransitionPayload(vistAtual, 'vistoria', 'contrato');
          cPayload.criado_por = State.user?.id;
          const { error: ce } = await supa.from('contratos').insert(cPayload);
          if(ce) toast('Vistoria salva, mas erro ao criar contrato: '+ce.message,'error');
          else toast('Vistoria aprovada → Contrato criado automaticamente! ✓','success');
        } else {
          toast('Vistoria salva','success');
        }
      } else if(eReprovado(data.resultado) && !eReprovado(prevResultado)){
        // Vistoria reprovada → envia cliente para Remarketing
        await enviarParaRemarketing({...item,...data}, 'vistoria_reprovada', 'Vistoria reprovada');
      } else {
        toast('Vistoria salva','success');
      }
    }
    localStorage.removeItem(_draftKey); // limpa rascunho após salvar
    closeModal();
    if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
  });

  $('#delVistBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir vistoria?')) return;
    await supa.from('vistorias').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal(); renderPipeline();
  });

  $('#vistPdfBtn')?.addEventListener('click', ()=>{
    const raw = readForm(form);
    const pdfItem = {
      ...item,
      nome:raw.nome, telefone:raw.telefone, email:raw.email,
      data_agendamento:raw.data_agendamento, hora_agendamento:raw.hora_agendamento,
      tecnico:raw.tecnico, gmap:raw.gmap,
      cliente_presente: raw.cliente_presente==='sim' ? true : raw.cliente_presente==='nao' ? false : null,
      responsavel_ausencia:raw.responsavel_ausencia,
      resultado:raw.resultado, status:raw.status,
      cep:raw.cep, rua:raw.rua, numero:raw.numero, complemento:raw.complemento,
      bairro:raw.bairro, cidade:raw.cidade, estado:raw.estado,
      qtd_modulos:raw.qtd_modulos?Number(raw.qtd_modulos):null,
      marca_modulo:raw.marca_modulo||null,
      pot_modulo:raw.pot_modulo?Number(raw.pot_modulo):null,
      qtd_inversores:raw.qtd_inversores?Number(raw.qtd_inversores):null,
      marca_inversor:raw.marca_inversor||null,
      pot_inversor:raw.pot_inversor?Number(raw.pot_inversor):null,
      kwp:raw.kwp?Number(raw.kwp):null,
      dados_padrao:    extractJsonGroup(raw,'dp_'),
      dados_inversor:  extractJsonGroup(raw,'di_'),
      dados_estrutura: extractJsonGroup(raw,'de_'),
      fotos: pickFiles(allFiles, fotoKeys),
      docs:  pickFiles(allFiles, docKeys)
    };
    abrirVistoriaJanela(pdfItem);
  });
}

/* ============================================================
   ATENDIMENTOS MODAL
   ============================================================ */
function openAtendimentoModal(item=null){
  const isNew = !item;
  item = item || {};

  const tipoOpts = [
    ['','— selecione —'],
    ['retorno_tecnico','Retorno Técnico'],
    ['sombreamento','Sombreamento'],
    ['goteira','Goteira'],
    ['falta_de_energia','Falta de Energia'],
    ['outros','Outros']
  ];
  const statusOpts = [
    ['aberto','Aberto'],
    ['em_andamento','Em Andamento'],
    ['concluido','Concluído'],
    ['cancelado','Cancelado']
  ];
  const tipoMap = {retorno_tecnico:'Retorno Técnico',sombreamento:'Sombreamento',goteira:'Goteira',falta_de_energia:'Falta de Energia',outros:'Outros'};

  const fotos = item.fotos || {};
  const docs  = item.docs  || {};
  const fotoKeys = ['fotos_atendimento'];
  const docKeys  = ['docs_atendimento'];

  openModal(`
    <div class="modal-header"><h2>${isNew?'Novo Re-Serviço':'Re-Serviço'}</h2><button class="modal-close">×</button></div>
    <form id="atendForm">
      <div class="modal-body">
        <div class="section"><div class="section-header"><h4>🛠️ Dados do Re-Serviço</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Cliente *',name:'nome',value:item.nome,required:true})}
            ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
            ${formField({label:'Tipo de Serviço *',name:'tipo',type:'select',value:item.tipo||'',options:tipoOpts,required:true})}
            <div id="campoTipoOutro" style="display:${item.tipo==='outros'?'':'none'}">
              ${formField({label:'Especifique *',name:'tipo_obs',value:item.tipo_obs})}
            </div>
            ${formField({label:'Data',name:'data_agendamento',type:'date',value:item.data_agendamento})}
            ${formField({label:'Hora',name:'hora_agendamento',type:'time',value:item.hora_agendamento})}
            ${formField({label:'Responsável',name:'responsavel',value:item.responsavel,datalist:DL_TECNICO})}
            ${formField({label:'Status *',name:'status',type:'select',value:item.status||'aberto',options:statusOpts,required:true})}
            ${formField({label:'Valor (R$)',name:'valor',type:'number',value:item.valor})}
            ${formField({label:'Descrição *',name:'descricao',type:'textarea',value:item.descricao,required:true,full:true})}
            ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
            ${fileUploadBlock('Fotos / Documentos','fotos_atendimento','atendimentos',fotos.fotos_atendimento||[],true)}
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>📍 Endereço</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'CEP',name:'cep',value:item.cep})}
            ${formField({label:'Rua',name:'rua',value:item.rua})}
            ${formField({label:'Número',name:'numero',value:item.numero})}
            ${formField({label:'Complemento',name:'complemento',value:item.complemento})}
            ${formField({label:'Bairro',name:'bairro',value:item.bairro})}
            ${formField({label:'Cidade',name:'cidade',value:item.cidade})}
            ${formField({label:'Estado',name:'estado',value:item.estado})}
            ${formField({label:'Localização (Google Maps)',name:'gmap',value:item.gmap,placeholder:'Cole aqui o link do Google Maps',full:true})}
          </div></div>
        </div>
        ${!isNew ? histSection() : ''}
      </div>
      <div class="modal-footer">
        ${!isNew && isAdmin()?`<button type="button" class="btn btn-danger" id="delAtendBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'lg');

  const form = $('#atendForm');
  if(!isNew) carregarHistorico($('#histList'), 'atendimentos', item.id);

  const allFiles = {};
  [...fotoKeys,...docKeys].forEach(k=>{ allFiles[k]=(fotos[k]||docs[k]||[]).slice(); });
  attachFileUploads(form, allFiles);
  attachCEP(form);

  const tipoSel = form.elements['tipo'];
  const campoTipoOutro = $('#campoTipoOutro');
  const toggleTipoOutro = ()=>{
    const isOutros = tipoSel.value === 'outros';
    campoTipoOutro.style.display = isOutros ? '' : 'none';
    form.elements['tipo_obs'].required = isOutros;
  };
  tipoSel.addEventListener('change', toggleTipoOutro);
  toggleTipoOutro();

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const raw = readForm(form);
    const data = {
      nome: raw.nome, telefone: raw.telefone,
      tipo: raw.tipo, tipo_obs: raw.tipo==='outros' ? raw.tipo_obs : null, descricao: raw.descricao,
      responsavel: raw.responsavel,
      data_agendamento: raw.data_agendamento || null,
      hora_agendamento: raw.hora_agendamento || null,
      status: raw.status || 'aberto',
      valor: raw.valor ? Number(raw.valor) : null,
      obs: raw.obs,
      cep: raw.cep, rua: raw.rua, numero: raw.numero, complemento: raw.complemento,
      bairro: raw.bairro, cidade: raw.cidade, estado: raw.estado, gmap: raw.gmap,
      fotos: pickFiles(allFiles, fotoKeys),
      docs:  pickFiles(allFiles, docKeys),
      atualizado_em: new Date().toISOString()
    };
    if(isNew){
      data.criado_por = State.user?.id;
      const { data:criado, error } = await supa.from('atendimentos').insert(data).select('id').single();
      if(error) return toast(error.message,'error');
      await registrarHistorico('atendimentos', criado.id, 'criado', `Re-Serviço criado: ${data.nome} — ${tipoMap[data.tipo]||data.tipo}`);
      toast('Re-Serviço criado! ✓','success');
    } else {
      const { error } = await supa.from('atendimentos').update(data).eq('id',item.id);
      if(error) return toast(error.message,'error');
      const mud = detectMudancas(item, data, [
        ['status','Status',null],['tipo','Tipo',v=>tipoMap[v]||v],['responsavel','Responsável',null]
      ]);
      const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
      await registrarHistorico('atendimentos', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');
      toast('Re-Serviço salvo! ✓','success');
    }
    closeModal();
    if(State.route==='reservico') renderReservicoKanban(); else if(State.route==='appmanutencao') renderAppManKanban(); else if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
  });

  $('#delAtendBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir Re-Serviço?')) return;
    await supa.from('atendimentos').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal();
    if(State.route==='reservico') renderReservicoKanban(); else renderPipeline();
  });
}

/* ============================================================
   APP / MANUTENÇÃO MODAL
   ============================================================ */
const ITENS_APPMAN = [
  ['configuracao','Configuração'],
  ['manutencao','Manutenção'],
  ['app_monitoramento','App Monitoramento'],
  ['vistoria_tecnica','Vistoria Técnica']
];

function openAppManModal(item=null){
  const isNew = !item;
  item = item || {};

  const statusOpts = [
    ['aberto','Aberto'],
    ['em_andamento','Em Andamento'],
    ['concluido','Concluído'],
    ['cancelado','Cancelado']
  ];
  const formaPagamentoOpts = [
    ['','— selecione —'],
    ['dinheiro','Dinheiro'],
    ['pix','Pix'],
    ['cartao','Cartão'],
    ['boleto','Boleto'],
    ['transferencia','Transferência']
  ];

  const itens = item.itens || {};
  const fotos = item.fotos || {};
  const fotoKeys = ['fotos_servico'];

  openModal(`
    <div class="modal-header"><h2>${isNew?'Novo App/Manutenção':'App/Manutenção'}</h2><button class="modal-close">×</button></div>
    <form id="appManForm">
      <div class="modal-body">
        <div class="section"><div class="section-header"><h4>📱 Dados da Venda</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Cliente *',name:'nome',value:item.nome,required:true})}
            ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
            ${formField({label:'Vendedor/Responsável',name:'responsavel',value:item.responsavel||State.profile?.nome||'',datalist:DL_TECNICO})}
            ${formField({label:'Técnico (Manutenção/Vistoria)',name:'tecnico_responsavel',value:item.tecnico_responsavel,datalist:DL_TECNICO})}
            ${formField({label:'Status *',name:'status',type:'select',value:item.status||'aberto',options:statusOpts,required:true})}
            <div class="form-group full">
              <label>Itens vendidos</label>
              <div class="appman-itens" id="amItens">
                ${ITENS_APPMAN.map(([key,label])=>`
                  <label class="multicheck-pill"><input type="checkbox" data-am-check="${key}" ${itens[key]?.ativo?'checked':''}><span>${esc(label)}</span></label>
                  <input type="text" inputmode="decimal" class="appman-valor" data-numtype="1" data-am-valor="${key}" placeholder="Valor (R$)" value="${esc(fmtInputNum(itens[key]?.valor))}">
                `).join('')}
              </div>
            </div>
            ${formField({label:'Valor total da venda (R$)',name:'valor_total',type:'number',value:item.valor_total,readonly:true})}
            ${formField({label:'Forma de Pagamento',name:'forma_pagamento',type:'select',value:item.forma_pagamento||'',options:formaPagamentoOpts})}
            <div id="campoParcelado" style="display:${item.forma_pagamento==='cartao'?'':'none'}">
              ${formField({label:'Parcelado?',name:'parcelado',type:'select',value:item.parcelado?'sim':'nao',options:[['nao','Não'],['sim','Sim']]})}
            </div>
            <div id="campoQtdParcelas" style="display:${item.forma_pagamento==='cartao'&&item.parcelado?'':'none'}">
              ${formField({label:'Quantidade de Parcelas',name:'qtd_parcelas',type:'number',value:item.qtd_parcelas})}
            </div>
            ${formField({label:'Data da venda',name:'data_venda',type:'date',value:item.data_venda})}
            ${formField({label:'Data de realização do serviço',name:'data_servico',type:'date',value:item.data_servico})}
            ${formField({label:'Data de renovação (manutenção de app)',name:'data_renovacao',type:'date',value:item.data_renovacao})}
            ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
            ${fileUploadBlock('Fotos do Serviço','fotos_servico','app_manutencao',fotos.fotos_servico||[],true)}
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>📍 Endereço</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'CEP',name:'cep',value:item.cep})}
            ${formField({label:'Rua',name:'rua',value:item.rua})}
            ${formField({label:'Número',name:'numero',value:item.numero})}
            ${formField({label:'Complemento',name:'complemento',value:item.complemento})}
            ${formField({label:'Bairro',name:'bairro',value:item.bairro})}
            ${formField({label:'Cidade',name:'cidade',value:item.cidade})}
            ${formField({label:'Estado',name:'estado',value:item.estado})}
            ${formField({label:'Localização (Google Maps)',name:'gmap',value:item.gmap,placeholder:'Cole aqui o link do Google Maps',full:true})}
          </div></div>
        </div>
        ${!isNew ? histSection() : ''}
      </div>
      <div class="modal-footer">
        ${!isNew && isAdmin()?`<button type="button" class="btn btn-danger" id="delAppManBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'lg');

  const form = $('#appManForm');
  if(!isNew) carregarHistorico($('#histList'), 'app_manutencao', item.id);

  const allFiles = {};
  fotoKeys.forEach(k=>{ allFiles[k]=(fotos[k]||[]).slice(); });
  attachFileUploads(form, allFiles);
  attachCEP(form);

  // Forma de pagamento: exibe parcelamento apenas para cartão
  const formaPagSel = form.elements['forma_pagamento'];
  const parceladoSel = form.elements['parcelado'];
  const campoParcelado = $('#campoParcelado');
  const campoQtdParcelas = $('#campoQtdParcelas');
  const togglePagamento = ()=>{
    const isCartao = formaPagSel.value === 'cartao';
    campoParcelado.style.display = isCartao ? '' : 'none';
    const isParcelado = isCartao && parceladoSel.value === 'sim';
    campoQtdParcelas.style.display = isParcelado ? '' : 'none';
    form.elements['qtd_parcelas'].required = isParcelado;
  };
  formaPagSel.addEventListener('change', togglePagamento);
  parceladoSel.addEventListener('change', togglePagamento);
  togglePagamento();

  // Soma automática do valor total a partir dos itens marcados
  const valorTotalInput = form.querySelector('[name="valor_total"]');
  function recalcTotal(){
    let total = 0;
    ITENS_APPMAN.forEach(([key])=>{
      const chk = form.querySelector(`[data-am-check="${key}"]`);
      const val = form.querySelector(`[data-am-valor="${key}"]`);
      if(chk?.checked) total += parseBR(val.value) || 0;
    });
    valorTotalInput.value = fmtInputNum(total);
  }
  $$('#amItens [data-am-check]', form).forEach(el=> el.addEventListener('change', recalcTotal));
  $$('#amItens [data-am-valor]', form).forEach(el=> el.addEventListener('input', recalcTotal));
  recalcTotal();

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const raw = readForm(form);
    const itensData = {};
    ITENS_APPMAN.forEach(([key])=>{
      const chk = form.querySelector(`[data-am-check="${key}"]`);
      const val = form.querySelector(`[data-am-valor="${key}"]`);
      itensData[key] = { ativo: !!chk?.checked, valor: parseBR(val.value) };
    });
    const data = {
      nome: raw.nome, telefone: raw.telefone,
      responsavel: raw.responsavel,
      tecnico_responsavel: raw.tecnico_responsavel,
      status: raw.status || 'aberto',
      itens: itensData,
      valor_total: raw.valor_total,
      forma_pagamento: raw.forma_pagamento || null,
      parcelado: raw.forma_pagamento==='cartao' && raw.parcelado==='sim',
      qtd_parcelas: (raw.forma_pagamento==='cartao' && raw.parcelado==='sim' && raw.qtd_parcelas) ? Number(raw.qtd_parcelas) : null,
      data_venda: raw.data_venda || null,
      data_servico: raw.data_servico || null,
      data_renovacao: raw.data_renovacao || null,
      obs: raw.obs,
      cep: raw.cep, rua: raw.rua, numero: raw.numero, complemento: raw.complemento,
      bairro: raw.bairro, cidade: raw.cidade, estado: raw.estado, gmap: raw.gmap,
      fotos: pickFiles(allFiles, fotoKeys),
      atualizado_em: new Date().toISOString()
    };
    if(isNew){
      data.criado_por = State.user?.id;
      const { data:criado, error } = await supa.from('app_manutencao').insert(data).select('id').single();
      if(error) return toast(error.message,'error');
      await registrarHistorico('app_manutencao', criado.id, 'criado', `Registro criado: ${data.nome}`);
      toast('Registro criado! ✓','success');
    } else {
      const { error } = await supa.from('app_manutencao').update(data).eq('id',item.id);
      if(error) return toast(error.message,'error');
      const mud = detectMudancas(item, data, [
        ['status','Status',null],['responsavel','Responsável',null],['tecnico_responsavel','Técnico',null],['valor_total','Valor Total',null]
      ]);
      const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
      await registrarHistorico('app_manutencao', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');
      toast('Registro salvo! ✓','success');
    }
    closeModal();
    if(State.route==='appmanutencao') renderAppManKanban(); else if(State.route==='pipeline') renderPipeline();
  });

  $('#delAppManBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir registro de App/Manutenção?')) return;
    await supa.from('app_manutencao').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal();
    if(State.route==='appmanutencao') renderAppManKanban(); else renderPipeline();
  });
}

function extractJsonGroup(obj,prefix){
  const out = {};
  Object.entries(obj).forEach(([k,v])=>{
    if(k.startsWith(prefix)){
      out[k.slice(prefix.length)] = v;
    }
  });
  return out;
}
function pickFiles(store, keys){
  const out = {};
  keys.forEach(k=>{ if(store[k]?.length) out[k] = store[k]; });
  return out;
}

/* ============================================================
   CONTRATO MODAL
   ============================================================ */
const TIPO_TERMO_OPTS = [
  ['responsabilidade_obra','Responsabilidade de Obra'],
  ['sombreamento','Sombreamento'],
  ['financeiro','Financeiro'],
  ['prazo_entrega','Prazo de Entrega'],
  ['outro','Outro'],
];
const TIPO_TERMO_LABEL = Object.fromEntries(TIPO_TERMO_OPTS);

function renderTermosAditivos(contratoId){
  const termos = (State.termos_aditivos||[]).filter(t=>t.contrato_id===contratoId);
  const rows = termos.length
    ? termos.map(t=>`
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f0f0f0">
          <div style="flex:1">
            <span style="font-weight:600;font-size:13px">${esc(TIPO_TERMO_LABEL[t.tipo]||t.tipo)}</span>
            ${t.data_assinatura?`<span style="font-size:11px;color:#888;margin-left:8px">${fmtDate(t.data_assinatura)}</span>`:''}
            ${t.descricao?`<div style="font-size:12px;color:#555;margin-top:2px">${esc(t.descricao)}</div>`:''}
          </div>
          <button type="button" class="btn btn-secondary btn-sm ta-print-btn" data-id="${t.id}" title="Imprimir">🖨️</button>
          <button type="button" class="btn btn-secondary btn-sm ta-edit-btn" data-id="${t.id}" title="Editar">✏️</button>
        </div>`).join('')
    : '<div style="font-size:12px;color:#aaa;padding:8px 0">Nenhum termo aditivo cadastrado.</div>';
  return `
    <div class="section" id="termosAditivosSection">
      <div class="section-header"><h4>📋 Termos Aditivos</h4><span class="section-toggle">▼</span></div>
      <div class="section-body">
        ${rows}
        <button type="button" class="btn btn-secondary btn-sm" id="addTermoBtn" style="margin-top:10px">＋ Novo Termo Aditivo</button>
      </div>
    </div>`;
}

function openTermoAditivoModal(contrato, termo=null){
  const isNew = !termo;
  termo = termo || {};
  openModal(`
    <div class="modal-header">
      <h2>${isNew?'Novo Termo Aditivo':'Editar Termo Aditivo'}</h2>
      <button class="modal-close">×</button>
    </div>
    <form id="termoForm">
      <div class="modal-body">
        <div class="form-grid">
          ${formField({label:'Tipo',name:'tipo',type:'select',value:termo.tipo||'',options:[['','— selecione —'],...TIPO_TERMO_OPTS],required:true})}
          ${formField({label:'Data Assinatura',name:'data_assinatura',type:'date',value:termo.data_assinatura})}
          ${formField({label:'Descrição / Detalhes',name:'descricao',type:'textarea',value:termo.descricao,full:true,rows:4})}
        </div>
        <div id="laudoWrap" style="display:${termo.tipo==='sombreamento'?'block':'none'};margin-top:14px;background:#f5f0ff;border:1px dashed #a78bfa;border-radius:8px;padding:12px 14px">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:#6B21A8">📎 Laudo de Sombreamento (PDF)</div>
          ${termo.laudo_url
            ? `<div style="margin-bottom:10px;display:flex;align-items:center;gap:8px">
                 <a href="${esc(termo.laudo_url)}" target="_blank" style="font-size:12px;color:#4B0082;font-weight:600">📄 Ver laudo atual</a>
                 <span style="font-size:11px;color:#888">— envie novo arquivo para substituir</span>
               </div>`
            : '<div style="font-size:12px;color:#888;margin-bottom:8px">Nenhum laudo enviado ainda.</div>'}
          <input type="file" id="laudoFile" accept="application/pdf" style="font-size:13px;width:100%">
        </div>
      </div>
      <div class="modal-footer">
        ${!isNew?`<button type="button" class="btn btn-danger" id="delTermoBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'sm');

  const form = $('#termoForm');

  // Mostra/esconde campo de laudo conforme o tipo
  form.elements.tipo.addEventListener('change', e=>{
    $('#laudoWrap').style.display = e.target.value==='sombreamento' ? 'block' : 'none';
  });

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    data.contrato_id = contrato.id;

    // Upload do laudo se for sombreamento e tiver arquivo selecionado
    const laudoFile = $('#laudoFile')?.files?.[0];
    if(data.tipo === 'sombreamento' && laudoFile){
      const ext = laudoFile.name.split('.').pop();
      const path = `${contrato.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supa.storage.from('termos_aditivos').upload(path, laudoFile, {upsert:true});
      if(upErr) return toast('Erro ao enviar laudo: '+upErr.message,'error');
      const { data: urlData } = supa.storage.from('termos_aditivos').getPublicUrl(path);
      data.laudo_url = urlData.publicUrl;
    } else {
      data.laudo_url = termo.laudo_url || null;
    }

    let err;
    if(isNew){ data.criado_por = State.user?.id; ({ error:err } = await supa.from('contratos_termos_aditivos').insert(data)); }
    else ({ error:err } = await supa.from('contratos_termos_aditivos').update(data).eq('id',termo.id));
    if(err) return toast(err.message,'error');
    toast(isNew?'Termo aditivo criado! ✓':'Termo atualizado! ✓','success');
    await loadAll(); closeModal();
    openContratoModal(contrato);
  });

  if(!isNew){
    $('#delTermoBtn')?.addEventListener('click', async ()=>{
      if(!confirm('Excluir este termo aditivo?')) return;
      const { error:err } = await supa.from('contratos_termos_aditivos').delete().eq('id',termo.id);
      if(err) return toast(err.message,'error');
      toast('Termo excluído','success');
      await loadAll(); closeModal();
      openContratoModal(contrato);
    });
  }
}

function imprimirTermoAditivo(contrato, termo){
  const _e = s => String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const tipoLabel = TIPO_TERMO_LABEL[termo.tipo] || termo.tipo;
  const w = window.open('','_blank');
  if(!w){ alert('Popup bloqueado. Permita popups para este site.'); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Termo Aditivo — ${tipoLabel}</title>
  <style>
    body{font-family:Arial,sans-serif;max-width:720px;margin:40px auto;color:#222;font-size:14px;line-height:1.7}
    .doc-header{display:flex;align-items:center;gap:20px;margin-bottom:16px}
    .doc-header img{height:52px;object-fit:contain}
    .doc-header-text h1{font-size:17px;text-transform:uppercase;letter-spacing:1px;margin:0 0 2px}
    .doc-header-text .sub{font-size:11px;color:#888}
    hr{border:none;border-top:2px solid #4B0082;margin:12px 0 20px}
    .subtitulo{text-align:center;font-size:13px;color:#555;margin:-10px 0 20px;font-style:italic}
    .bloco{border:1px solid #ddd;border-radius:6px;padding:16px 20px;margin:20px 0}
    .label{font-size:11px;text-transform:uppercase;color:#888;letter-spacing:.5px}
    .valor{font-size:14px;font-weight:600;margin-bottom:12px}
    .corpo{margin:24px 0;text-align:justify;white-space:pre-wrap}
    .assinaturas{display:flex;gap:40px;margin-top:60px}
    .ass{flex:1;border-top:1px solid #333;padding-top:6px;font-size:12px;text-align:center}
    @media print{body{margin:20px}}
  </style></head><body>
  <div class="doc-header">
    <img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER Energia Renovável">
    <div class="doc-header-text">
      <h1>Termo Aditivo ao Contrato</h1>
      <div class="sub">SER Energia Renovável · CNPJ 58.656.750/0001-04</div>
    </div>
  </div>
  <hr>
  <div class="subtitulo">${tipoLabel}</div>
  <div class="bloco">
    <div class="label">Cliente</div><div class="valor">${esc(contrato.nome||'')}</div>
    ${contrato.cpf?`<div class="label">CPF</div><div class="valor">${esc(contrato.cpf)}</div>`:''}
    ${contrato.endereco||contrato.rua?`<div class="label">Endereço</div><div class="valor">${esc([contrato.rua,contrato.numero,contrato.bairro,contrato.cidade,contrato.estado].filter(Boolean).join(', '))}</div>`:''}
    <div class="label">Data de Assinatura</div><div class="valor">${termo.data_assinatura ? fmtDate(termo.data_assinatura) : '___/___/______'}</div>
  </div>
  <div class="corpo">${esc(termo.descricao||'')}</div>
  <div class="assinaturas">
    <div class="ass">${esc(contrato.nome||'')}<br>Contratante</div>
    <div class="ass">SER Energia Renovável<br>Contratada</div>
    ${contrato.vendedor?`<div class="ass">${esc(contrato.vendedor)}<br>Testemunha</div>`:''}
  </div>
  ${termo.laudo_url ? `
  <div style="page-break-before:always;margin-top:40px">
    <h3 style="text-align:center;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Laudo de Sombreamento Anexo</h3>
    <embed src="${_e(termo.laudo_url)}" type="application/pdf" width="100%" height="900px" style="border:1px solid #ddd;border-radius:4px">
    <p style="font-size:11px;color:#888;margin-top:8px;text-align:center">Caso o laudo não apareça acima, <a href="${_e(termo.laudo_url)}" target="_blank">clique aqui para abrir</a>.</p>
  </div>` : ''}
  <script>
    const img = document.querySelector('.doc-header img');
    if(img && !img.complete){ img.onload = ()=>window.print(); img.onerror = ()=>window.print(); }
    else window.print();
  <\/script>
  </body></html>`);
  w.document.close();
}

function openContratoModal(item=null){
  const isNew = !item;
  item = mergeChain(item || {});
  const linked = getLinkedDocs(item);
  const statusOpts = [['pendente','Pendente'],['enviado','Enviado'],['assinado','Assinado'],['cancelado','Cancelado'],['perdido','Perdido']];
  const faseOpts = [['','—'],['Monofásico','Monofásico'],['Bifásico','Bifásico'],['Trifásico','Trifásico']];
  const pgtoOpts = [['','—'],['À Vista','À Vista'],['Cartão de Crédito','Cartão de Crédito'],['Financiamento Bancário','Financiamento Bancário'],['Parcelamento Interno','Parcelamento Interno'],['Misto','Misto']];

  openModal(`
    <div class="modal-header"><h2>${isNew?'Novo Contrato':'Editar Contrato'}</h2><button class="modal-close">×</button></div>
    <form id="contForm">
      <div class="modal-body">
        <div class="section"><div class="section-header"><h4>Dados Pessoais</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Nome',name:'nome',value:item.nome,required:true})}
            ${formField({label:'CPF',name:'cpf',value:item.cpf})}
            ${formField({label:'RG',name:'rg',value:item.rg})}
            ${formField({label:'Órgão Emissor',name:'rg_orgao',value:item.rg_orgao})}
            ${formField({label:'Nascimento',name:'nascimento',type:'date',value:item.nascimento})}
            ${formField({label:'Profissão',name:'profissao',value:item.profissao})}
            ${formField({label:'Estado Civil',name:'estado_civil',value:item.estado_civil})}
            ${formField({label:'Email',name:'email',type:'email',value:item.email})}
            ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
          </div></div>
        </div>
        <div class="section collapsed"><div class="section-header"><h4>Endereço</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'CEP',name:'cep',value:item.cep})}
            ${formField({label:'Rua',name:'rua',value:item.rua})}
            ${formField({label:'Número',name:'numero',value:item.numero})}
            ${formField({label:'Complemento',name:'complemento',value:item.complemento})}
            ${formField({label:'Bairro',name:'bairro',value:item.bairro})}
            ${formField({label:'Cidade',name:'cidade',value:item.cidade})}
            ${formField({label:'Estado',name:'estado',value:item.estado})}
            ${formField({label:'Google Maps',name:'gmap',value:item.gmap})}
          </div></div>
        </div>
        <div class="section collapsed"><div class="section-header"><h4>Kit / Técnico</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Concessionária',name:'concessionaria',value:item.concessionaria||linked.vistoria?.concessionaria||''})}
            ${formField({label:'kWp',name:'kwp',type:'number',value:item.kwp})}
            ${formField({label:'Qtd Módulos',name:'qtd_modulos',type:'number',value:item.qtd_modulos})}
            ${formField({label:'Marca Módulo',name:'marca_modulo',value:item.marca_modulo,datalist:DL_MARCA_MODULO})}
            ${formField({label:'Pot. Módulo (W)',name:'pot_modulo',type:'number',value:item.pot_modulo,datalist:DL_POT_MODULO})}
            ${formField({label:'Qtd Inversores',name:'qtd_inversores',type:'number',value:item.qtd_inversores})}
            ${formField({label:'Marca Inversor',name:'marca_inversor',value:item.marca_inversor,datalist:DL_MARCA_INVERSOR})}
            ${formField({label:'Pot. Inversor (kW)',name:'pot_inversor',type:'number',value:item.pot_inversor,datalist:DL_POT_INVERSOR})}
            ${formField({label:'Qtd Baterias',name:'qtd_baterias',type:'number',value:item.qtd_baterias})}
            ${formField({label:'Marca Bateria',name:'marca_bateria',value:item.marca_bateria,datalist:DL_MARCA_BATERIA})}
            ${formField({label:'Pot. Bateria (kWh)',name:'pot_bateria',type:'number',value:item.pot_bateria,datalist:DL_POT_BATERIA})}
            ${formField({label:'Fase',name:'fase',type:'select',value:item.fase,options:faseOpts})}
            ${formField({label:'Tensão',name:'tensao',value:item.tensao})}
          </div></div>
        </div>
        <div class="section"><div class="section-header"><h4>Comercial</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Valor',name:'valor',type:'number',value:item.valor,required:true})}
            ${formField({label:'Forma Pagto',name:'forma_pgto',type:'select',value:item.forma_pgto,options:pgtoOpts})}
            ${formField({label:'Banco (se financ.)',name:'banco',value:item.banco,datalist:DL_BANCO})}
            ${formField({label:'Descrição Pgto',name:'pgto_desc',type:'textarea',value:item.pgto_desc,full:true})}
            ${formField({label:'Status',name:'status',type:'select',value:item.status||'pendente',options:statusOpts})}
            <div class="form-field full" id="motivoPerdaWrap" style="display:${item.status==='perdido'?'block':'none'}">
              ${formField({label:'Motivo da Perda *',name:'motivo_perda',type:'select',value:item.motivo_perda||'',full:true,options:[['','— selecione —'],['sem_interesse','Sem interesse'],['sem_credito','Sem crédito / financiamento negado'],['problema_financeiro','Problema financeiro temporário'],['concorrente','Escolheu concorrente'],['sem_resposta','Sem resposta'],['desistencia','Desistência'],['oportunidade_futura','Oportunidade futura'],['outro','Outro']]})}
            </div>
            ${formField({label:'Data Assinatura',name:'data_assinatura',type:'date',value:item.data_assinatura})}
            ${formField({label:'Canal de aquisição',name:'canal',type:'select',value:item.canal||'',options:[['','— automático (do lead) —'],['PAP','PAP'],['Network','Network'],['Captação','Captação'],['Indicação','Indicação'],['Tráfego pago','Tráfego pago'],['Redes sociais','Redes sociais']]})}
            ${formField({label:'Vendedor (Testemunha 1)',name:'vendedor',type:'select',value:item.vendedor||'',options:[['','— selecione —'],...(State.perfis||[]).filter(p=>p.ativo!==false&&['vendedor','supervisor','admin'].includes(p.perfil)&&p.nome).map(p=>[p.nome,p.nome])]})}
            ${formField({label:'CPF do Vendedor',name:'vend_cpf',value:item.vend_cpf,placeholder:'000.000.000-00'})}
            ${formField({label:'Supervisor (Testemunha 2)',name:'supervisor_nome',type:'select',value:item.supervisor_nome||'',options:[['','— selecione —'],...(State.perfis||[]).filter(p=>p.ativo!==false&&['supervisor','admin'].includes(p.perfil)&&p.nome).map(p=>[p.nome,p.nome])]})}
            ${formField({label:'CPF do Supervisor',name:'supervisor_cpf',value:item.supervisor_cpf,placeholder:'000.000.000-00'})}
          </div></div>
        </div>
        ${!isNew && item.clicksign_url ? `<div class="card" style="background:#e6f7ed">📝 ClickSign: <a href="${esc(item.clicksign_url)}" target="_blank">${esc(item.clicksign_url)}</a></div>` : ''}
        ${!isNew?renderLinkedDocBtns(linked):''}
        ${!isNew?renderTermosAditivos(item.id):''}
        ${!isNew ? histSection() : ''}
      </div>
      <div class="modal-footer">
        ${!isNew?`<button type="button" class="btn btn-secondary" id="clickSignBtn">📝 ClickSign</button>`:''}
        ${!isNew?`<button type="button" class="btn btn-secondary" id="vizContBtn">👁️ Ver Contrato</button>`:''}
        ${!isNew?`<button type="button" class="btn btn-secondary" id="dlContBtn">🖨️ PDF</button>`:''}
        ${!isNew&&canVerFinanceiro()?`<button type="button" class="btn btn-secondary" id="projFinBtn">💰 Financeiro</button>`:''}
        ${!isNew?`<button type="button" class="btn btn-secondary" id="portalLinkBtn">🔗 Portal do cliente</button>`:''}
        ${!isNew?`<button type="button" class="btn btn-danger" id="delContBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
      </div>
    </form>
  `,'lg');

  const form = $('#contForm');
  attachCEP(form);
  attachCPF(form);

  // Auto-preenche CPF ao selecionar vendedor ou supervisor
  const perfisMap = (State.perfis||[]).reduce((m,p)=>{ if(p.nome) m[p.nome]=p; return m; }, {});
  const fillVendedorContrato = (perfil) => {
    if(!perfil) return;
    if(perfil.cpf)      form.elements.vend_cpf.value      = perfil.cpf;
    if(perfil.telefone && form.elements.vend_telefone) form.elements.vend_telefone.value = perfil.telefone;
    if(perfil.email    && form.elements.vend_email)    form.elements.vend_email.value    = perfil.email;
  };
  form.elements.vendedor?.addEventListener('change', e=>{
    fillVendedorContrato(perfisMap[e.target.value]);
  });
  // Preenche ao abrir se campos estiverem vazios
  if(item.vendedor) fillVendedorContrato(perfisMap[item.vendedor]);
  form.elements.supervisor_nome?.addEventListener('change', e=>{
    const p = perfisMap[e.target.value];
    if(p?.cpf) form.elements.supervisor_cpf.value = p.cpf;
  });

  // Mostra/esconde campo motivo de perda
  form.elements.status?.addEventListener('change', e=>{
    const wrap = document.getElementById('motivoPerdaWrap');
    if(wrap) wrap.style.display = e.target.value==='perdido' ? 'block' : 'none';
  });

  if(!isNew) carregarHistorico($('#histList'), 'contratos', item.id);

  if(!isNew){
    $('#addTermoBtn')?.addEventListener('click', ()=>{ closeModal(); openTermoAditivoModal(item); });
    $$('.ta-edit-btn').forEach(btn=>{ btn.addEventListener('click', ()=>{
      const t = (State.termos_aditivos||[]).find(x=>x.id===btn.dataset.id);
      if(t){ closeModal(); openTermoAditivoModal(item, t); }
    }); });
    $$('.ta-print-btn').forEach(btn=>{ btn.addEventListener('click', ()=>{
      const t = (State.termos_aditivos||[]).find(x=>x.id===btn.dataset.id);
      if(t) imprimirTermoAditivo(item, t);
    }); });
  }
  const statusContMap = {pendente:'Pendente', enviado:'Enviado', assinado:'Assinado', cancelado:'Cancelado', perdido:'Perdido'};
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    ['kwp','qtd_modulos','pot_modulo','qtd_inversores','pot_inversor','qtd_baterias','pot_bateria','valor'].forEach(k=>{ data[k] = data[k]!=null ? Number(data[k]) : null; });
    if(isNew){
      data.criado_por = State.user?.id;
      const { data: contCriado, error } = await supa.from('contratos').insert(data).select('id').single();
      if(error) return toast(error.message,'error');
      await registrarHistorico('contratos', contCriado.id, 'criado', `Contrato criado: ${data.nome||''}`);
    } else {
      const prevStatus = item.status;
      const { error } = await supa.from('contratos').update(data).eq('id',item.id);
      if(error) return toast(error.message,'error');
      const mud = detectMudancas(item, data, [
        ['status','Status', v=>statusContMap[v]||v],
        ['vendedor','Vendedor',null], ['valor','Valor',null],
      ]);
      const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
      await registrarHistorico('contratos', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');

      // Contrato cancelado → envia cliente para Remarketing
      if(data.status === 'cancelado' && prevStatus !== 'cancelado'){
        await enviarParaRemarketing({...item,...data}, 'contrato_cancelado', 'Contrato cancelado');
      }
      // Contrato perdido → valida motivo e envia para Remarketing
      if(data.status === 'perdido'){
        if(!data.motivo_perda){ toast('Selecione o motivo da perda','error'); return; }
        if(prevStatus !== 'perdido'){
          await enviarParaRemarketing({...item,...data}, 'contrato_perdido', 'Contrato perdido: '+data.motivo_perda.trim());
        }
      }

      // Auto-avançar para Logística quando assinado
      if(data.status === 'assinado'){
        // Verifica no banco (não no State) para evitar duplicata por race condition
        const { data: logExist } = await supa.from('logistica').select('id').eq('contrato_id', item.id).maybeSingle();
        if(!logExist){
          const contAtual = { ...item, ...data };
          const payload = buildTransitionPayload(contAtual,'contrato','logistica');
          payload.criado_por = State.user?.id;
          const { error: eLog } = await supa.from('logistica').insert(payload);
          if(eLog) toast('Avançou para Logística: '+eLog.message,'error');
          else toast('Contrato assinado → movido para Logística ✓','success');
          await loadAll(); closeModal();
          if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
          return;
        }
      }
    }
    toast('Contrato salvo','success'); await loadAll(); closeModal();
    if(State.route==='pipeline') renderPipeline(); else if(State.route==='vistoriador') renderVistoriadorKanban(); else if(State.route==='instalador') renderInstaladorKanban(); else if(State.route==='homologador') renderHomologadorKanban();
  });

  $('#clickSignBtn')?.addEventListener('click', async ()=>{
    const btn = $('#clickSignBtn');
    btn.disabled = true; btn.textContent = '⏳ Gerando PDF...';
    try{
      // Abre o popup do contrato em modo captura (passa o nome da janela)
      abrirContratoJanela(item, false, 'clicksign-capture');

      // Aguarda o PDF gerado via postMessage
      const pdf_base64 = await new Promise((resolve, reject) => {
        const t = setTimeout(()=>reject(new Error('Timeout ao gerar PDF do contrato')), 90000);
        window.addEventListener('message', function h(e){
          if(e.data?.type === 'CONTRACT_PDF'){
            clearTimeout(t); window.removeEventListener('message', h);
            resolve(e.data.base64);
          } else if(e.data?.type === 'CONTRACT_PDF_ERROR'){
            clearTimeout(t); window.removeEventListener('message', h);
            reject(new Error(e.data.error || 'Erro ao gerar PDF'));
          }
        });
      });

      // Normaliza para data:application/pdf;base64,XXX (ClickSign não aceita filename= no data URI)
      const pdfStr = String(pdf_base64 || '');
      const pdfB64raw = pdfStr.includes(',') ? pdfStr.split(',').slice(1).join(',') : pdfStr;
      const pdfNormalizado = 'data:application/pdf;base64,' + pdfB64raw;
      console.log('[ClickSign] pdf prefix normalizado:', pdfNormalizado.slice(0,50), '| b64 len:', pdfB64raw.length);
      if(pdfB64raw.length < 500) throw new Error(`PDF gerado parece inválido (base64 length=${pdfB64raw.length}). Tente abrir o contrato manualmente antes.`);

      btn.textContent = '⏳ Enviando ao ClickSign...';
      const { data:{ session:cs } } = await supa.auth.getSession();
      const bodyStr = JSON.stringify({ contrato_id: item.id, pdf_base64: pdfNormalizado });
      console.log('[ClickSign] body size KB:', Math.round(bodyStr.length/1024));
      const resp = await fetch(`${SURL}/functions/v1/clicksign-proxy`,{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${cs?.access_token}`},
        body: bodyStr
      });
      const rawText = await resp.text();
      console.log('[ClickSign] status:', resp.status, 'response:', rawText.slice(0,2000));
      let result = {};
      try { result = JSON.parse(rawText); } catch(_){}
      if(!resp.ok) throw new Error(result.erro || result.error || `HTTP ${resp.status}: ${rawText.slice(0,120)}`);
      if(result.document_key){
        await supa.from('contratos').update({ clicksign_key: result.document_key, clicksign_url: result.document_url }).eq('id', item.id);
        item.clicksign_key = result.document_key;
        item.clicksign_url = result.document_url;
      }
      toast('✅ Enviado ao ClickSign! Todos os signatários foram notificados.','success');
      closeModal();
    }catch(e){
      toast('ClickSign: '+e.message,'error');
      btn.disabled = false; btn.textContent = '📝 ClickSign';
    }
  });

  $('#vizContBtn')?.addEventListener('click', ()=> abrirContratoJanela(item, false));
  $('#dlContBtn')?.addEventListener('click',  ()=> abrirContratoJanela(item, true));
  $('#projFinBtn')?.addEventListener('click', ()=> openProjetoFinanceiroModal(item.id, item.nome||item.cliente||''));

  $('#portalLinkBtn')?.addEventListener('click', async ()=>{
    const btn = $('#portalLinkBtn');
    btn.disabled = true; btn.textContent = '⏳ Gerando…';
    let {data: existing} = await supa.from('portal_tokens').select('token').eq('contrato_id', item.id).limit(1).single();
    if(!existing){
      const {data: created} = await supa.from('portal_tokens').insert({contrato_id: item.id}).select('token').single();
      existing = created;
    }
    if(existing?.token){
      const link = 'https://alvarooffice-maker.github.io/ser-portal/portal-ser/portal.html?token=' + existing.token;
      await navigator.clipboard.writeText(link).catch(()=>{});
      btn.textContent = '✅ Link copiado!';
      setTimeout(()=>{ btn.textContent = '🔗 Copiar link do portal'; btn.disabled=false; }, 3000);
    } else {
      btn.textContent = '🔗 Copiar link do portal'; btn.disabled=false;
      toast('Erro ao gerar link','error');
    }
  });

  if(!isNew) attachLinkedDocListeners(linked);

  $('#delContBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir contrato?')) return;
    await supa.from('contratos').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal(); renderPipeline();
  });
}

