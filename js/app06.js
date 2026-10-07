/* ============================================================
   DESPESAS PADRÃO EM LOTE
   ============================================================ */
async function openDespesasPadraoModal(){
  await Promise.all([
    loadTable('contratos'), loadTable('vistorias'), loadTable('instalacoes'),
    loadTable('homologacoes'), loadTable('financeiro_despesas'), loadTable('logistica')
  ]);

  const despesas    = State.despesas || [];
  const contratos   = (State.contratos || []).filter(c => c.status !== 'cancelado');
  const vistorias   = State.vistorias   || [];
  const instalacoes = State.instalacoes || [];
  const logisticas  = State.logistica   || [];

  // Valor vistoria por resultado
  function valorVistoria(resultado){
    const map = {
      aprovado: 120, aprovado_com_obra: 120,
      aprovado_com_sombreamento: 150,
      aprovado_com_obra_e_sombreamento: 120,
      reprovado: 120
    };
    return map[resultado] || null;
  }

  // Valor instalação por kWp
  function valorInstalacao(kwp){
    const k = Number(kwp) || 0;
    if(!k) return null;
    if(k <= 4.5)  return parseFloat((k * 500).toFixed(2));
    if(k <= 6.5)  return parseFloat((k * 450).toFixed(2));
    if(k <= 10)   return parseFloat((k * 380).toFixed(2));
    if(k <= 15)   return parseFloat((k * 350).toFixed(2));
    return parseFloat((k * 320).toFixed(2));
  }

  // Verifica se já existe despesa com essa descrição no contrato
  function temDesp(contratoId, desc){
    return despesas.some(d =>
      String(d.contrato_id) === String(contratoId) &&
      (d.descricao||'').toLowerCase().includes(desc.toLowerCase())
    );
  }

  // Monta lista de pendências por contrato
  const pendencias = [];
  for(const c of contratos){
    const cid = c.id;
    const vis = vistorias.find(v => String(v.contrato_id) === String(cid) || String(v.proposta_id) === String(c.proposta_id));
    const inst = instalacoes.find(i => String(i.contrato_id) === String(cid));
    const rows = [];

    if(!temDesp(cid, 'taxa trt'))
      rows.push({ descricao:'Taxa TRT', recebedor:'Crea', valor:68.17, categoria:'homologacao' });
    if(!temDesp(cid, 'homologação') && !temDesp(cid, 'homologacao'))
      rows.push({ descricao:'Homologação', recebedor:'Michel Darlan Britto da Silva', valor:300, categoria:'homologacao' });

    if(vis && vis.resultado){
      const vVal = valorVistoria(vis.resultado);
      if(vVal && !temDesp(cid, 'parecer') && !temDesp(cid, 'vistoria'))
        rows.push({ descricao:'Parecer Final da Vistoria', recebedor:'Paulo Adriano - Vistoria', valor:vVal, categoria:'vistoria', _info: vis.resultado });
    }

    const kwp = inst?.kwp || c.kwp;
    if(kwp && !temDesp(cid, 'instalação') && !temDesp(cid, 'instalacao')){
      const iVal = valorInstalacao(kwp);
      if(iVal)
        rows.push({ descricao:'Instalação', recebedor:'Instalação - Paulo Oliveira', valor:iVal, categoria:'instalacao', _info:`${kwp} kWp` });
    }

    // Kit Solar — só aparece se logística tem valor_compra e não há despesa de kit
    const log = logisticas.find(l => String(l.contrato_id) === String(cid));
    if(log?.valor_compra && !temDesp(cid, 'kit')){
      rows.push({ descricao:'Kit Solar', recebedor: log.distribuidora || '', valor: Number(log.valor_compra), categoria:'kit', _info: log.distribuidora||'' });
    }

    if(rows.length) pendencias.push({ contrato: c, rows });
  }

  if(!pendencias.length){
    toast('Todos os contratos já têm as despesas padrão preenchidas ✓','success');
    return;
  }

  const fR = v => 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2});

  openModal(`
    <div class="modal-header">
      <h2>📋 Despesas Padrão em Lote</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body" style="padding:0">
      <p style="padding:12px 20px 8px;font-size:13px;color:#555;margin:0">
        Contratos com despesas padrão faltando. Marque os que deseja preencher e clique em <strong>Aplicar</strong>.
      </p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f5f0fc;text-align:left">
              <th style="padding:8px 12px"><input type="checkbox" id="dpSelectAll" title="Selecionar todos"></th>
              <th style="padding:8px 12px">Cliente</th>
              <th style="padding:8px 12px">Despesas a inserir</th>
              <th style="padding:8px 12px;text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${pendencias.map((p,i) => `
              <tr style="border-top:1px solid #eee;vertical-align:top" data-idx="${i}">
                <td style="padding:8px 12px"><input type="checkbox" class="dp-chk" value="${i}" checked></td>
                <td style="padding:8px 12px;font-weight:600;color:#1a0a2e">${esc(p.contrato.nome||p.contrato.cliente||'—')}</td>
                <td style="padding:8px 12px">
                  ${p.rows.map(r=>`<div style="margin-bottom:3px">
                    <span style="display:inline-block;background:#e9d5ff;color:#4c1d95;border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;margin-right:4px">${r.categoria}</span>
                    ${esc(r.descricao)} — <em>${esc(r.recebedor)}</em> — <strong>${fR(r.valor)}</strong>
                    ${r._info?`<span style="color:#6b7280;font-size:10px"> (${esc(r._info)})</span>`:''}
                  </div>`).join('')}
                </td>
                <td style="padding:8px 12px;text-align:right;font-weight:700;color:#4B0082">
                  ${fR(p.rows.reduce((s,r)=>s+r.valor,0))}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <span id="dpCount" style="font-size:12px;color:#555">${pendencias.length} contrato(s) selecionado(s)</span>
      <button class="btn btn-secondary modal-close">Cancelar</button>
      <button class="btn btn-primary" id="dpAplicarBtn">Aplicar</button>
    </div>
  `, 'lg');

  // Select all toggle
  const selAll = $('#dpSelectAll');
  const updateCount = () => {
    const n = document.querySelectorAll('.dp-chk:checked').length;
    $('#dpCount').textContent = `${n} contrato(s) selecionado(s)`;
  };
  selAll.addEventListener('change', () => {
    document.querySelectorAll('.dp-chk').forEach(c => c.checked = selAll.checked);
    updateCount();
  });
  document.querySelectorAll('.dp-chk').forEach(c => c.addEventListener('change', updateCount));

  $('#dpAplicarBtn').addEventListener('click', async () => {
    const selecionados = [...document.querySelectorAll('.dp-chk:checked')].map(c => pendencias[Number(c.value)]);
    if(!selecionados.length){ toast('Nenhum contrato selecionado','info'); return; }

    const btn = $('#dpAplicarBtn');
    btn.disabled = true;
    btn.textContent = 'Aplicando…';

    const inserts = [];
    for(const p of selecionados){
      for(const r of p.rows){
        inserts.push({
          descricao: r.descricao,
          recebedor: r.recebedor,
          valor: r.valor,
          categoria: r.categoria,
          status: 'pendente',
          contrato_id: p.contrato.id,
          criado_por: State.user?.id
        });
      }
    }

    const { error } = await supa.from('financeiro_despesas').insert(inserts);
    if(error){ toast(error.message,'error'); btn.disabled=false; btn.textContent='Aplicar'; return; }

    closeModal();
    toast(`✓ ${inserts.length} despesa(s) inserida(s) em ${selecionados.length} contrato(s)`, 'success', 5000);
    await renderFinanceiro();
  });
}

/* ============================================================
   AUDITORIA DE RECEITAS
   ============================================================ */
async function openAuditoriaReceitasModal(){
  await Promise.all([
    loadTable('contratos'), loadTable('financeiro_receitas')
  ]);

  const receitas  = State.receitas || [];
  const contratos = (State.contratos || []).filter(c => c.status !== 'cancelado' && Number(c.valor) > 0);

  // Contratos sem nenhuma receita vinculada
  const semReceita = contratos.filter(c =>
    !receitas.some(r => String(r.contrato_id) === String(c.id))
  );

  if(!semReceita.length){
    toast('Todos os contratos já têm receita lançada ✓','success');
    return;
  }

  const fR = v => 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2});

  openModal(`
    <div class="modal-header">
      <h2>🔍 Auditoria de Receitas</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body" style="padding:0">
      <p style="padding:12px 20px 8px;font-size:13px;color:#555;margin:0">
        ${semReceita.length} contrato(s) sem receita lançada. Marque os que deseja registrar e clique em <strong>Aplicar</strong>.
      </p>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f5f0fc;text-align:left">
              <th style="padding:8px 12px"><input type="checkbox" id="arSelectAll" title="Selecionar todos"></th>
              <th style="padding:8px 12px">Cliente</th>
              <th style="padding:8px 12px">Vendedor</th>
              <th style="padding:8px 12px">Data assinatura</th>
              <th style="padding:8px 12px;text-align:right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${semReceita.map((c,i) => `
              <tr style="border-top:1px solid #eee" data-idx="${i}">
                <td style="padding:8px 12px"><input type="checkbox" class="ar-chk" value="${i}" checked></td>
                <td style="padding:8px 12px;font-weight:600;color:#1a0a2e">${esc(c.nome||c.cliente||'—')}</td>
                <td style="padding:8px 12px;color:#555">${esc(c.vendedor||'—')}</td>
                <td style="padding:8px 12px;color:#555">${c.data_assinatura ? new Date(c.data_assinatura+'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                <td style="padding:8px 12px;text-align:right;font-weight:700;color:#064e3b">${fR(c.valor)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="background:#f9f5ff;border-top:2px solid #e9d5ff">
              <td colspan="4" style="padding:8px 12px;font-weight:700;font-size:12px">TOTAL SELECIONADO</td>
              <td id="arTotal" style="padding:8px 12px;text-align:right;font-weight:700;color:#4B0082;font-size:13px">${fR(semReceita.reduce((s,c)=>s+(Number(c.valor)||0),0))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div class="modal-footer">
      <span id="arCount" style="font-size:12px;color:#555">${semReceita.length} contrato(s) selecionado(s)</span>
      <button class="btn btn-secondary modal-close">Cancelar</button>
      <button class="btn btn-primary" id="arAplicarBtn">Aplicar</button>
    </div>
  `, 'lg');

  const updateTotals = () => {
    const checked = [...document.querySelectorAll('.ar-chk:checked')];
    const total = checked.reduce((s,c) => s + (Number(semReceita[Number(c.value)].valor)||0), 0);
    $('#arCount').textContent = `${checked.length} contrato(s) selecionado(s)`;
    $('#arTotal').textContent = fR(total);
  };

  $('#arSelectAll').addEventListener('change', e => {
    document.querySelectorAll('.ar-chk').forEach(c => c.checked = e.target.checked);
    updateTotals();
  });
  document.querySelectorAll('.ar-chk').forEach(c => c.addEventListener('change', updateTotals));

  $('#arAplicarBtn').addEventListener('click', async () => {
    const selecionados = [...document.querySelectorAll('.ar-chk:checked')].map(c => semReceita[Number(c.value)]);
    if(!selecionados.length){ toast('Nenhum contrato selecionado','info'); return; }

    const btn = $('#arAplicarBtn');
    btn.disabled = true;
    btn.textContent = 'Aplicando…';

    const inserts = selecionados.map(c => ({
      descricao: c.nome || c.cliente || 'Projeto Solar',
      valor: Number(c.valor),
      categoria: 'venda',
      status: 'recebido',
      data_recebimento: c.data_assinatura || null,
      contrato_id: c.id,
      criado_por: State.user?.id
    }));

    const { error } = await supa.from('financeiro_receitas').insert(inserts);
    if(error){ toast(error.message,'error'); btn.disabled=false; btn.textContent='Aplicar'; return; }

    closeModal();
    toast(`✓ ${inserts.length} receita(s) lançada(s)`, 'success', 5000);
    await renderFinanceiro();
  });
}

/* ============================================================
   PROJETO FINANCEIRO
   ============================================================ */
async function openProjetoFinanceiroModal(contratoId, nomeCliente){
  if(!canVerFinanceiro()){ toast('Acesso restrito','error'); return; }
  if(!contratoId){ toast('Contrato não encontrado para este projeto','error'); return; }
  await Promise.all([loadTable('financeiro_receitas'), loadTable('financeiro_despesas'), loadTable('comissoes'), loadTable('contratos')]);

  const voltar = ()=> openProjetoFinanceiroModal(contratoId, nomeCliente);
  const fR = v=>'R$ '+(Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const stBadge = s=>{ const m={pendente:'badge-pendente',recebido:'badge-ativo',pago:'badge-ativo',cancelado:'badge-cancelado'}; const l={pendente:'Pendente',recebido:'Recebido',pago:'Pago',cancelado:'Cancelado'}; return `<span class="badge ${m[s]||''}">${l[s]||s}</span>`; };

  const contrato = (State.contratos||[]).find(c=>String(c.id)===String(contratoId));
  const valorContrato = Number(contrato?.valor)||0;

  // Receitas do projeto (contrato_id) + valor do contrato como base
  const rec   = (State.receitas||[]).filter(r=>String(r.contrato_id)===String(contratoId));
  const totalRec = rec.length ? rec.reduce((s,r)=>s+(Number(r.valor)||0),0) : valorContrato;

  // Despesas por categoria
  const despAll = (State.despesas||[]).filter(d=>String(d.contrato_id)===String(contratoId));
  const despPor = cat => despAll.filter(d=>d.categoria===cat);

  // Comissão vinculada pelo nome do cliente
  const comissao = (State.comissoes||[]).find(x=>(x.nome||'').toLowerCase().trim()===(nomeCliente||'').toLowerCase().trim());
  const totalCom = comissao ? Number(comissao.total_saidas)||0 : 0;

  const totalDesp = despAll.reduce((s,d)=>s+(Number(d.valor)||0),0) + totalCom;
  const margem    = totalRec - totalDesp;
  const mColor    = margem>=0?'#16a34a':'#dc2626';

  // % sobre receita
  const pct = v => totalRec > 0 ? `<span style="font-size:11px;color:var(--text-light);margin-left:4px">${((Number(v)||0)/totalRec*100).toFixed(1)}%</span>` : '';

  // Helper: renderiza linha de despesa
  const rowDesp = (d,cat)=>`<tr>
    <td>${esc(d.descricao||'')}</td>
    <td>${esc(d.recebedor||'')}</td>
    <td style="text-align:right;font-weight:600;color:#dc2626;white-space:nowrap">${fR(d.valor)}${pct(d.valor)}</td>
    <td>${stBadge(d.status)}</td>
    <td><button class="btn btn-sm btn-secondary" data-ed="${d.id}" data-cat="${cat}">✏️</button></td>
  </tr>`;

  // Helper: bloco de seção de custo
  const totalSec = itens => itens.reduce((s,d)=>s+(Number(d.valor)||0),0);
  const secDesp = (id, icon, label, cat, itens)=>{
    const tot = totalSec(itens);
    const cabeca = tot>0 ? `<span style="font-size:12px;color:#dc2626;font-weight:600">${fR(tot)}${pct(tot)}</span>` : '';
    return `<div style="margin-bottom:18px" id="sec-${id}">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <h4 style="margin:0;font-size:14px">${icon} ${label} ${cabeca}</h4>
        <button class="btn btn-sm btn-secondary" data-add-cat="${cat}">+ Lançar</button>
      </div>
      ${itens.length
        ? `<div class="table-wrap"><table><thead><tr><th>Descrição</th><th>Recebedor</th><th>Valor / %</th><th>Status</th><th></th></tr></thead><tbody>${itens.map(d=>rowDesp(d,cat)).join('')}</tbody></table></div>`
        : `<p style="color:var(--text-light);font-size:12px;margin:0 0 4px">Nenhum lançamento.</p>`}
    </div>`;
  };

  openModal(`
    <div class="modal-header">
      <h2>💰 ${esc(nomeCliente)}</h2>
      <button class="modal-close">×</button>
    </div>
    <div class="modal-body" style="padding:16px 22px">
      <!-- Resumo -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#166534;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Receita</div>
          <div style="font-size:18px;font-weight:700;color:#16a34a;margin-top:4px">${fR(totalRec)}</div>
        </div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:#991b1b;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Custos</div>
          <div style="font-size:18px;font-weight:700;color:#dc2626;margin-top:4px">${fR(totalDesp)} ${pct(totalDesp)}</div>
        </div>
        <div style="background:${margem>=0?'#f0fdf4':'#fef2f2'};border:1px solid ${margem>=0?'#bbf7d0':'#fecaca'};border-radius:10px;padding:12px;text-align:center">
          <div style="font-size:10px;color:${mColor};font-weight:700;text-transform:uppercase;letter-spacing:.5px">Margem</div>
          <div style="font-size:18px;font-weight:700;color:${mColor};margin-top:4px">${fR(margem)} ${pct(margem)}</div>
        </div>
      </div>
      <!-- Barra de composição dos custos -->
      ${(()=>{
        const segs = [
          { label:'Kit',         val: despPor('kit').reduce((s,d)=>s+(Number(d.valor)||0),0),        cor:'#7c3aed' },
          { label:'Comissões',   val: totalCom,                                                       cor:'#db2777' },
          { label:'Vistoria',    val: despPor('vistoria').reduce((s,d)=>s+(Number(d.valor)||0),0),   cor:'#0891b2' },
          { label:'Instalação',  val: despPor('instalacao').reduce((s,d)=>s+(Number(d.valor)||0),0), cor:'#d97706' },
          { label:'Homologação', val: despPor('homologacao').reduce((s,d)=>s+(Number(d.valor)||0),0),cor:'#059669' },
          { label:'Maquininha',  val: despPor('maquininha').reduce((s,d)=>s+(Number(d.valor)||0),0), cor:'#64748b' },
          { label:'Extras',      val: despPor('extras').reduce((s,d)=>s+(Number(d.valor)||0),0),     cor:'#92400e' },
        ].filter(s=>s.val>0);
        const margemSeg = { label:'Margem', val: Math.max(0,margem), cor:'#16a34a' };
        const allSegs = [...segs, margemSeg].filter(s=>s.val>0);
        const base = totalRec > 0 ? totalRec : 1;
        if(!segs.length) return '';
        return `<div style="margin-bottom:20px">
          <div style="display:flex;border-radius:8px;overflow:hidden;height:24px;gap:1px">
            ${allSegs.map(s=>`<div title="${s.label}: ${fR(s.val)} (${(s.val/base*100).toFixed(1)}%)" style="background:${s.cor};flex:${s.val/base};min-width:2px"></div>`).join('')}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">
            ${allSegs.map(s=>`<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text)">
              <span style="width:10px;height:10px;border-radius:2px;background:${s.cor};flex-shrink:0"></span>
              ${esc(s.label)} <strong>${(s.val/base*100).toFixed(1)}%</strong>
            </span>`).join('')}
          </div>
        </div>`;
      })()}

      <!-- Seções de custo -->
      ${secDesp('kit','📦','Kit / Equipamentos','kit', despPor('kit'))}

      <!-- Comissões -->
      <div style="margin-bottom:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <h4 style="margin:0;font-size:14px">🤝 Comissões</h4>
          <button class="btn btn-sm btn-secondary" id="projComBtn">${comissao?'✏️ Editar':'+ Lançar'}</button>
        </div>
        ${comissao ? (()=>{
          // Recalcula do zero com todos os campos — igual ao recalc() do modal
          const _vc       = Number(comissao.valor_contrato||0);
          const _vv       = Number(comissao.valor_vendido||0) || _vc;
          const _obra     = comissao.obra_ativo ? Number(comissao.obra_val||0) : 0;
          const _pres     = comissao.pres_ativo ? Number(comissao.pres_val||0) : 0;
          const _ind      = comissao.ind_ativo  ? Number(comissao.ind_val||0)  : 0;
          const _vend_base = _vc * (Number(comissao.vend_pct)||0) / 100;
          const _base_maj  = _vv - _vc - _obra - _pres - _ind;
          const _major_val = Math.max(0, _base_maj) * (Number(comissao.vend_major_pct)||0) / 100;
          const linhas = [];
          if(_vend_base) linhas.push([comissao.vend_nome||'Vendedor','Comissão Vendedor',_vend_base]);
          if(_major_val) linhas.push([comissao.vend_nome||'Vendedor','Majorado',_major_val]);
          if(Number(comissao.sup_val))   linhas.push([comissao.sup_nome||'Supervisor','Supervisor',comissao.sup_val]);
          if(comissao.sdr_ativo && Number(comissao.sdr_val))  linhas.push([comissao.sdr_nome||'SDR','SDR',comissao.sdr_val]);
          if(comissao.cap_ativo && Number(comissao.cap_val))  linhas.push([comissao.cap_nome||'Captador','Captador',comissao.cap_val]);
          if(comissao.ind_ativo && Number(comissao.ind_val))  linhas.push([comissao.ind_nome||'Indicador','Indicador',comissao.ind_val]);
          if(comissao.obra_ativo && Number(comissao.obra_val)) linhas.push(['Obra','Obra',comissao.obra_val]);
          if(comissao.pres_ativo && Number(comissao.pres_val)) linhas.push(['Presente','Presente',comissao.pres_val]);
          const totalComLinhas = linhas.reduce((s,[,,v])=>s+(Number(v)||0),0);
          return `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Valor / %</th><th>Status</th></tr></thead><tbody>
            ${linhas.map(([nome,tipo,val])=>`<tr>
              <td>${esc(nome)}</td>
              <td style="color:var(--text-light);font-size:12px">${esc(tipo)}</td>
              <td style="color:#dc2626;font-weight:600;white-space:nowrap">${fR(val)}${pct(val)}</td>
              <td>${stBadge(comissao.status)}</td>
            </tr>`).join('')}
            <tr style="border-top:2px solid var(--border)">
              <td colspan="2" style="font-weight:600;font-size:12px;color:var(--text-light)">Total comissões</td>
              <td style="color:#dc2626;font-weight:700;white-space:nowrap">${fR(totalComLinhas)}${pct(totalComLinhas)}</td>
              <td></td>
            </tr>
          </tbody></table></div>`;
        })() : `<p style="color:var(--text-light);font-size:12px;margin:0 0 4px">Nenhuma comissão lançada.</p>`}
      </div>

      ${secDesp('vist','🔍','Vistoria','vistoria', despPor('vistoria'))}
      ${secDesp('inst','🔧','Instalação','instalacao', despPor('instalacao'))}
      ${secDesp('hom','📋','Homologação','homologacao', despPor('homologacao'))}
      ${secDesp('maq','💳','Maquininha (taxas)','maquininha', despPor('maquininha'))}
      ${secDesp('ext','➕','Extras','extras', despPor('extras'))}
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary modal-close">Fechar</button>
    </div>
  `,'lg');

  // Comissão
  $('#projComBtn')?.addEventListener('click', ()=>{
    if(comissao) openComissaoModal(comissao);
    else openComissaoModal(null, nomeCliente);
  });

  // Botões + Lançar por categoria
  $$('[data-add-cat]').forEach(b=>{
    b.addEventListener('click', ()=> openDespesaModal(null,{ contratoId, categoriaFixa: b.dataset.addCat, onSave: voltar }));
  });

  // Editar despesa existente
  $$('[data-ed]').forEach(b=>{
    const item = despAll.find(d=>String(d.id)===b.dataset.ed);
    b.addEventListener('click', ()=> openDespesaModal(item,{ contratoId, categoriaFixa: b.dataset.cat, onSave: voltar }));
  });
}

/* ============================================================
   CADASTROS
   ============================================================ */
async function renderCadastros(){
  await loadTable('cadastros');
  const items = State.cadastros;
  $('#pageActions').innerHTML = `
    <input type="text" id="searchCad" placeholder="Buscar…" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px"/>
    <button class="btn btn-primary" id="newCadBtn">+ Novo Cadastro</button>
  `;
  $('#newCadBtn').addEventListener('click', ()=> openCadastroModal());
  $('#content').innerHTML = `
    <div class="card"><div class="table-wrap"><table>
      <thead><tr><th>Nome</th><th>Tipo</th><th>Telefone</th><th>Email</th><th>Cidade</th><th></th></tr></thead>
      <tbody id="cadBody">
        ${items.length?items.map(c=>`
          <tr>
            <td>${esc(c.nome||'')}</td>
            <td><span class="badge">${esc(c.tipo||'')}</span></td>
            <td>${esc(c.telefone||'')}</td>
            <td>${esc(c.email||'')}</td>
            <td>${esc(c.cidade||'')}</td>
            <td class="row-actions"><button class="btn btn-sm btn-secondary" data-cad="${c.id}">Editar</button></td>
          </tr>`).join(''):'<tr><td colspan="6" class="empty">Sem cadastros</td></tr>'}
      </tbody>
    </table></div></div>
  `;
  $$('[data-cad]').forEach(b=>b.addEventListener('click', ()=> openCadastroModal(items.find(x=>String(x.id)===b.dataset.cad))));
  $('#searchCad').addEventListener('input', e=>{
    const q = e.target.value.toLowerCase();
    $$('#cadBody tr').forEach(tr => tr.style.display = tr.textContent.toLowerCase().includes(q)?'':'none');
  });
}

function openCadastroModal(item=null){
  const isNew = !item;
  item = item || {};
  const tipoOpts = [['vendedor','Vendedor'],['tecnico','Técnico'],['captador','Captador'],['sdr','SDR'],['supervisor','Supervisor'],['distribuidor','Distribuidor'],['cliente','Cliente'],['outro','Outro']];
  openModal(`
    <div class="modal-header"><h2>${isNew?'Novo Cadastro':'Editar Cadastro'}</h2><button class="modal-close">×</button></div>
    <form id="cadForm"><div class="modal-body"><div class="form-grid">
      ${formField({label:'Nome',name:'nome',value:item.nome,required:true})}
      ${formField({label:'Tipo',name:'tipo',type:'select',value:item.tipo||'cliente',options:tipoOpts})}
      ${formField({label:'Telefone',name:'telefone',value:item.telefone})}
      ${formField({label:'Email',name:'email',type:'email',value:item.email})}
      ${formField({label:'Documento',name:'doc',value:item.doc})}
      ${formField({label:'Nascimento',name:'nascimento',type:'date',value:item.nascimento})}
      ${formField({label:'CEP',name:'cep',value:item.cep})}
      ${formField({label:'Rua',name:'rua',value:item.rua})}
      ${formField({label:'Número',name:'numero',value:item.numero})}
      ${formField({label:'Complemento',name:'complemento',value:item.complemento})}
      ${formField({label:'Cidade',name:'cidade',value:item.cidade})}
      ${formField({label:'Estado',name:'estado',value:item.estado})}
      ${formField({label:'Obs',name:'obs',type:'textarea',value:item.obs,full:true})}
    </div></div>
    <div class="modal-footer">
      ${!isNew?`<button type="button" class="btn btn-danger" id="delCad">Excluir</button>`:''}
      <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
      <button type="submit" class="btn btn-primary">Salvar</button>
    </div></form>
  `);
  const form = $('#cadForm');
  attachCEP(form);
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    if(isNew){ data.criado_por = State.user?.id; await supa.from('cadastros').insert(data); }
    else await supa.from('cadastros').update(data).eq('id',item.id);
    toast('Salvo','success'); closeModal(); renderCadastros();
  });
  $('#delCad')?.addEventListener('click', async ()=>{ if(!await confirmDel('Excluir?')) return; await supa.from('cadastros').delete().eq('id',item.id); closeModal(); renderCadastros(); });
}

/* ============================================================
   USUARIOS (admin/supervisor)
   ============================================================ */
async function downloadBackup(){
  if(!isAdmin()) return toast('Apenas admins podem gerar backup.','error');
  toast('Gerando backup — aguarde...','info',6000);
  const tables=['leads','propostas','vistorias','contratos','logistica','instalacoes',
    'homologacoes','posvenda','remarketing','comissoes','financeiro_receitas',
    'financeiro_despesas','cadastros','perfis','tentativas_contato','metas'];
  const backup={
    gerado_em: new Date().toISOString(),
    gerado_por: State.profile?.email||'?',
    versao:'1.0',
    tabelas:{}
  };
  let allOk=true;
  await Promise.all(tables.map(async t=>{
    try{
      const {data,error}=await supa.from(t).select('*').order('criado_em',{ascending:true});
      if(error){console.warn('backup',t,error.message);allOk=false;}
      backup.tabelas[t]=data||[];
    }catch(e){backup.tabelas[t]=[];allOk=false;}
  }));
  backup.total_registros=Object.values(backup.tabelas).reduce((s,r)=>s+r.length,0);
  const json=JSON.stringify(backup,null,2);
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const dt=new Date().toISOString().slice(0,19).replace('T','_').replace(/:/g,'-');
  a.href=url; a.download=`ser-backup-${dt}.json`; a.click();
  URL.revokeObjectURL(url);
  toast(`Backup concluído${allOk?'':' com alertas'}! ${backup.total_registros} registros exportados.`,allOk?'success':'info');
}

async function renderUsuarios(){
  if(!['admin','supervisor'].includes(userRole())){
    $('#content').innerHTML = '<div class="empty">Sem permissão.</div>'; return;
  }
  await loadTable('perfis');
  const items = State.perfis;
  $('#pageActions').innerHTML = isAdmin()
    ? `<button class="btn btn-secondary" id="backupBtn">⬇️ Backup Manual</button>
       <button class="btn btn-primary" id="newUserBtn">+ Novo Usuário</button>`
    : '';
  $('#newUserBtn')?.addEventListener('click', ()=> openUserModal());
  $('#backupBtn')?.addEventListener('click', downloadBackup);
  const tbody = items.length ? items.map((u,i)=>`
    <tr>
      <td>${esc(u.nome||'')}</td>
      <td>${esc(u.email||'')}</td>
      <td><span class="badge">${esc(u.perfil||'')}</span></td>
      <td>${u.ativo?'<span class="badge badge-ativo">Ativo</span>':'<span class="badge badge-inativo">Inativo</span>'}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-secondary" data-edit="${i}">Editar</button>
        ${isAdmin()?`<button class="btn btn-sm btn-secondary" data-tog="${i}">${u.ativo?'Desativar':'Ativar'}</button>`:''}
        ${isAdmin()?`<button class="btn btn-sm btn-secondary" data-rpwd="${i}">Redefinir senha</button>`:''}
        ${isAdmin()?`<button class="btn btn-sm btn-secondary" data-setpwd="${i}">🔑 Definir senha</button>`:''}
        ${isAdmin()&&u.email!==State.user?.email?`<button class="btn btn-sm btn-danger" data-del="${i}">Excluir</button>`:''}
      </td>
    </tr>`).join('') : '<tr><td colspan="5" class="empty">Sem usuários</td></tr>';
  window._usrItems = items;
  $('#content').innerHTML = `<div class="card"><div class="table-wrap"><table>
    <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th></th></tr></thead>
    <tbody>${tbody}</tbody>
  </table></div></div>`;
  $('#content').addEventListener('click', async e=>{
    const btn = e.target.closest('button[data-edit],button[data-tog],button[data-del],button[data-rpwd],button[data-setpwd]');
    if(!btn) return;
    const ds = btn.dataset;
    if(ds.edit!==undefined){
      const u = window._usrItems[+ds.edit];
      if(!u){ toast('Usuário não encontrado','error'); return; }
      try{ openUserModal(u); } catch(err){ toast('Erro: '+err.message,'error'); }
    } else if(ds.tog!==undefined){
      const u = window._usrItems[+ds.tog]; if(!u) return;
      await supa.from('perfis').update({ ativo:!u.ativo }).eq('email',u.email);
      toast('Status atualizado','success'); renderUsuarios();
    } else if(ds.rpwd!==undefined){
      const u = window._usrItems[+ds.rpwd]; if(!u||!u.email) return;
      const { error } = await supa.auth.resetPasswordForEmail(u.email, { redirectTo: location.origin+location.pathname });
      if(error) toast(error.message,'error');
      else toast(`Reset enviado para ${u.email}`,'success');
    } else if(ds.setpwd!==undefined){
      const u = window._usrItems[+ds.setpwd]; if(!u||!u.email) return;
      const nova = prompt(`Nova senha para ${u.nome||u.email}:\n(mín. 8 caracteres, letras e números, ex: Senha2025)`);
      if(!nova) return;
      if(nova.length < 8){ toast('Senha muito curta — mínimo 8 caracteres.','error'); return; }
      try {
        await adminApi('update_password', { email: u.email, password: nova });
        toast(`Senha de ${u.nome||u.email} atualizada!`,'success');
      } catch(err) { toast(err.message,'error'); }
    } else if(ds.del!==undefined){
      const u = window._usrItems[+ds.del]; if(!u) return;
      if(!await confirmDel(`Excluir "${u.nome||u.email}"?`)) return;
      const { error } = await supa.from('perfis').delete().eq('email',u.email);
      if(error) return toast(error.message,'error');
      toast('Excluído','success'); renderUsuarios();
    }
  });
}

function openUserModal(item=null){
  if(!isAdmin() && item==null){ toast('Apenas admin pode criar usuários.','error'); return; }
  const isNew = !item;
  item = item || {};
  const perfilOpts = [['admin','Admin'],['supervisor','Supervisor'],['vendedor','Vendedor'],['tec_vistoria','Téc. Vistoria'],['tec_instalacao','Téc. Instalação'],['tec_vistoria_instalacao','Téc. Vistoria + Instalação'],['tec_homologacao','Téc. Homologação'],['financeiro','Financeiro']];
  openModal(`
    <div class="modal-header"><h2>${isNew?'Novo Usuário':'Editar Usuário'}</h2><button class="modal-close">×</button></div>
    <form id="userForm"><div class="modal-body"><div class="form-grid">
      ${formField({label:'Nome',name:'nome',value:item.nome,required:true})}
      ${formField({label:'Email',name:'email',type:'email',value:item.email,required:true,readonly:!isNew})}
      ${isNew?formField({label:'Senha (mín. 8 caracteres, letras e números)',name:'password',type:'password',value:'',required:true}):''}
      ${isNew?`<div style="grid-column:1/-1;font-size:11px;color:#888;margin-top:-8px">💡 Ex: <strong>Senha2025</strong> — evite caracteres especiais como @#$%</div>`:''}
      ${formField({label:'Perfil',name:'perfil',type:'select',value:item.perfil||'vendedor',options:perfilOpts})}
      ${formField({label:'CPF',name:'cpf',value:item.cpf||'',placeholder:'000.000.000-00'})}
      ${formField({label:'Data de nascimento',name:'nascimento',type:'date',value:item.nascimento||''})}
      ${formField({label:'Telefone',name:'telefone',value:item.telefone||'',placeholder:'(91) 99999-9999'})}
      ${formField({label:'Endereço',name:'endereco',value:item.endereco||'',placeholder:'Rua, nº, complemento, bairro'})}
      ${formField({label:'CEP',name:'cep',value:item.cep||'',placeholder:'00000-000'})}
      ${formField({label:'Ativo',name:'ativo',type:'toggle',value:item.ativo!==false})}
    </div></div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
      <button type="submit" class="btn btn-primary">${isNew?'Criar':'Salvar'}</button>
    </div></form>
  `,'sm');
  const form = $('#userForm');
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    if(isNew){
      try{
        await adminApi('create_user', {
          email: data.email, password: data.password, nome: data.nome,
          perfilNovo: data.perfil, ativo: data.ativo !== false,
          cpf: data.cpf || null, telefone: data.telefone || null,
          endereco: data.endereco || null, cep: data.cep || null,
        });
        toast('Usuário criado com sucesso!','success');
      }catch(err){ return toast(err.message,'error'); }
    } else {
      try{
        await adminApi('update_perfil', { email: item.email, nome: data.nome, perfilNovo: data.perfil, ativo: data.ativo, cpf: data.cpf||null, telefone: data.telefone||null, endereco: data.endereco||null, cep: data.cep||null });
        toast('Atualizado','success');
      }catch(err){ return toast(err.message,'error'); }
    }
    try{ await supa.from('perfis').update({ nascimento: data.nascimento||null }).eq('email', (isNew?data.email:item.email).toLowerCase()); }catch(_){}
    closeModal(); renderUsuarios();
  });
}

/* ============================================================
   STARTUP
   ============================================================ */
$('#loginForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const btn = $('#loginBtn'); const msg = $('#authMsg');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Entrando…';
  msg.className = 'auth-msg';
  try{
    await doLogin($('#loginEmail').value, $('#loginPassword').value);
    msg.className = 'auth-msg success'; msg.textContent = 'Bem-vindo!';
    setTimeout(showApp, 300);
  }catch(err){
    msg.className = 'auth-msg error'; msg.textContent = err.message || 'Falha no login';
  }finally{
    btn.disabled = false; btn.textContent = 'Entrar';
  }
});

$('#logoutBtn').addEventListener('click', doLogout);

$('#sidebarToggle').addEventListener('click', ()=>{
  $('#sidebar').classList.toggle('collapsed');
});
$('#mobileMenuBtn').addEventListener('click', ()=>{
  $('#sidebar').classList.toggle('open');
});

function updateMobileBtn(){
  $('#mobileMenuBtn').style.display = window.innerWidth<768 ? 'inline-flex' : 'none';
}
window.addEventListener('resize', updateMobileBtn);
updateMobileBtn();

// Service Worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('sw.js').catch(()=>{});
}

/* ============================================================
   DISPARADOR DE MENSAGENS — Caderno de Scripts
   Sequências WhatsApp + roteiros de ligação/presencial
   Placeholders: [Nome] [Seu Nome] [Nome da sua empresa] [Empresa]
   [valor] [cor] [mes] [valor x 20 anos] / [valor da conta x 20 anos]
   [horario] [Rua] [X]  -> sem campo: ficam destacados p/ editar
   ============================================================ */
const DISPARADOR_DATA = [
{ id:"b2c", name:"Residencial (B2C)", kind:"dias", groups:[
  {chip:"S", sub:"Situação", title:"Dia 1 · Situação", opts:[
    {tag:"1A · Reconhecer", m:"Oi [Nome]! Tentei te ligar mais cedo mas imagino que tá corrido por aí, né?\nSou [Seu Nome] da [Nome da sua empresa]."},
    {tag:"1B · Empatia", m:"[Nome], sei que ninguém gosta de atender número desconhecido hoje em dia!\nPor isso vim pelo WhatsApp. Sou da [Nome da sua empresa]."},
    {tag:"1C · Quebra de padrão", m:"Oi [Nome]! Tentei te ligar mas WhatsApp é bem melhor mesmo, né?\nTrabalho com energia solar aqui na região.\nComo tá sua conta de energia ultimamente?"}
  ]},
  {chip:"P", sub:"Problema", title:"Dia 2 · Problema", opts:[
    {tag:"2A · Pressão orçamentária", m:"[Nome], imagino que com esses aumentos constantes deve estar pesando no orçamento, né?"},
    {tag:"2B · Situação regional", m:"Oi [Nome]! Conta de luz passando de R$ [valor] mesmo economizando energia em casa?"},
    {tag:"2C · Economia ineficaz", m:"[Nome], você já reparou que mesmo economizando energia a conta não para de subir?"}
  ]},
  {chip:"I", sub:"Implicação", title:"Dia 3 · Implicação", opts:[
    {tag:"3A · Agravamento", m:"E com bandeira [cor] + aumento de [mes], só vai piorar, né?\nIsso não compromete o orçamento familiar?\nMenos dinheiro pra outras coisas importantes?"},
    {tag:"3B · Projeção futura", m:"Com esses reajustes todo ano, daqui 5 anos você vai estar pagando o dobro!"},
    {tag:"3C · Cenário crítico", m:"Se continuar assim, só subindo, a conta de energia vai ficar impagável..."}
  ]},
  {chip:"N1", sub:"Pessoal", title:"Dia 4 · Necessidade — Tom pessoal", opts:[
    {tag:"4A · Solução direta", m:"[Nome], e se eu te falasse que dá pra reduzir 90% dessa conta usando só o telhado da sua casa?\nNão seria a solução que você precisa?"},
    {tag:"4B · Projeção de economia", m:"Que tal se sua conta de luz fosse sempre uns R$ 100-120 por mês?\nImagina essa economia sobrando pra família! Faria diferença?"},
    {tag:"4C · Merecimento", m:"[Nome], você não merece se livrar dessa preocupação de conta alta todo mês?"}
  ]},
  {chip:"N2", sub:"Persuasão", title:"Dia 5 · Necessidade — Persuasão", opts:[
    {tag:"5A · Sinceridade", m:"[Nome], vou ser sincero: quem não se proteger dos aumentos agora vai se arrepender."},
    {tag:"5B · Empatia financeira", m:"Ver família gastando R$ [valor]/mês de luz quando podia pagar uns R$ 100/mês me deixa triste."},
    {tag:"5C · Libertação", m:"[Nome], quantos anos mais você quer ficar refém da conta de luz?\nEnergia solar acaba com isso PRA SEMPRE!"}
  ]},
  {chip:"N3", sub:"Incisivo", title:"Dia 6 · Necessidade — Incisivo", opts:[
    {tag:"6A · Questionamento", m:"[Nome], por que escolher continuar pagando caro quando tem a solução na sua frente?"},
    {tag:"6B · Prova social", m:"Todo mundo da sua rua já entendeu que energia solar é obrigatória hoje em dia. Por que você não?"},
    {tag:"6C · Confronto", m:"[Nome], você tá escolhendo continuar perdendo dinheiro.\nEnquanto vizinhos economizam, você paga caro. Até quando vai aceitar isso?"}
  ]},
  {chip:"7", sub:"Breakup", title:"Dia 7 · Breakup", opts:[
    {tag:"7A · Respeitoso", m:"[Nome], esse foi meu último contato!\nEntendo que energia solar pode não ser prioridade agora.\nMas se a conta continuar subindo e quiser conversar, me chame!"},
    {tag:"7B · Alerta", m:"Oi [Nome]! Vou parar por aqui.\nMas quem não se proteger dos aumentos vai se arrepender...\nSe mudar de ideia, meu WhatsApp tá sempre aberto!"},
    {tag:"7C · Porta aberta", m:"[Nome], última mensagem mesmo!\nQuando a conta apertar de vez (e vai apertar), lembra da [Nome da sua empresa], tá?"}
  ]}
]},

{ id:"b2b", name:"Empresarial (B2B)", kind:"dias", groups:[
  {chip:"S", sub:"Situação", title:"Dia 1 · Situação", opts:[
    {tag:"1A · Reconhecer", m:"Oi [Nome]! Tentei te ligar mais cedo, mas imagino que deve estar corrido, né?\nSou [Seu Nome] da [Nome da sua empresa]."},
    {tag:"1B · Empatia", m:"[Nome], sei que empresário não gosta de atender número desconhecido!\nPor isso vim pelo WhatsApp. Sou da [Nome da sua empresa]."},
    {tag:"1C · Quebra de padrão", m:"Oi [Nome]! Tentei te ligar mas WhatsApp é mais prático mesmo, né?\nTrabalho com energia solar para empresas aqui na região.\nComo anda o consumo energético da [Empresa]?"}
  ]},
  {chip:"P", sub:"Problema", title:"Dia 2 · Problema", opts:[
    {tag:"2A · Pressão orçamentária", m:"[Nome], imagino que com esses aumentos constantes de energia deve estar pesando no orçamento, né?"},
    {tag:"2B · Competitividade", m:"Oi [Nome]! Conta de energia passando de R$ 5 mil mesmo com economia?"},
    {tag:"2C · Fluxo de caixa", m:"[Nome], você já reparou que mesmo controlando o consumo a conta não para de subir?"}
  ]},
  {chip:"I", sub:"Implicação", title:"Dia 3 · Implicação", opts:[
    {tag:"3A · Impacto operacional", m:"E com bandeira [cor] + aumento de [mes], só vai piorar, né?\nIsso não compromete a margem da empresa?\nMenos capital para investir no crescimento do negócio?"},
    {tag:"3B · Projeção financeira", m:"Com esses reajustes todo ano, daqui 5 anos a [Empresa] vai estar pagando o dobro de energia!"},
    {tag:"3C · Cenário crítico", m:"Se continuar assim, só subindo, o custo energético vai ficar insustentável..."}
  ]},
  {chip:"N1", sub:"Consultivo", title:"Dia 4 · Necessidade — Tom consultivo", opts:[
    {tag:"4A · Solução estratégica", m:"[Nome], e se eu te falasse que dá pra reduzir 90% dessa conta usando apenas o telhado da empresa?\nNão seria exatamente o que a [Empresa] precisa para melhorar a margem?"},
    {tag:"4B · ROI empresarial", m:"Que tal se a conta de energia da [Empresa] fosse sempre uns R$ 500-600 por mês?"},
    {tag:"4C · Alívio operacional", m:"[Nome], a [Empresa] não merece se livrar dessa preocupação de custo energético todo mês?"}
  ]},
  {chip:"N2", sub:"Persuasão", title:"Dia 5 · Necessidade — Persuasão", opts:[
    {tag:"5A · Vantagem competitiva", m:"[Nome], vou ser sincero: empresas que não se protegerem dos aumentos agora vão perder competitividade."},
    {tag:"5B · Impacto financeiro", m:"Ver empresa gastando R$ [valor]/mês de energia quando podia gastar uns R$ 500/mês me deixa triste."},
    {tag:"5C · Visão de futuro", m:"[Nome], quantos anos mais a [Empresa] quer ficar refém dos aumentos de energia?"}
  ]},
  {chip:"N3", sub:"Incisivo", title:"Dia 6 · Necessidade — Incisivo", opts:[
    {tag:"6A · Questionamento direto", m:"[Nome], posso te perguntar uma coisa?\nPor que a [Empresa] escolhe continuar pagando caro quando tem a solução na sua frente?"},
    {tag:"6B · Comparação de mercado", m:"Sinceramente, não entendo...\nEmpresas do seu setor já entenderam que energia solar é obrigatória hoje em dia. Por que a [Empresa] não?"},
    {tag:"6C · Confronto empresarial", m:"[Nome], a [Empresa] está escolhendo continuar perdendo dinheiro todo mês.\nEnquanto concorrentes economizam e investem no crescimento, vocês ficam para trás."}
  ]},
  {chip:"7", sub:"Breakup", title:"Dia 7 · Breakup", opts:[
    {tag:"7A · Profissional", m:"[Nome], esse foi meu último contato!\nEntendo que energia solar pode não ser prioridade da [Empresa] agora."},
    {tag:"7B · Alerta de mercado", m:"Oi [Nome]! Vou parar por aqui.\nMas empresas que não se protegerem dos aumentos vão se arrepender..."},
    {tag:"7C · Despedida estratégica", m:"[Nome], última mensagem mesmo!\nQuando os custos energéticos apertarem de vez (e vão apertar), lembrem da [Nome da sua empresa], tá? Sucesso nos negócios!"}
  ]}
]},

{ id:"sumiu", name:"Demonstrou interesse mas sumiu", kind:"dias", groups:[
  {chip:"1", sub:"Reconectar", title:"Dia 1 · Reconectar sem pressão", opts:[
    {tag:"1A · Reconexão amigável", m:"Oi [Nome]! Como você tá?\nLembro que conversamos sobre energia solar umas semanas atrás.\nComo andam as coisas por aí? Tudo bem com a família?"},
    {tag:"1B · Check-in genuíno", m:"[Nome], oi! Tudo bom? Fiquei pensando na nossa conversa sobre energia solar."},
    {tag:"1C · Abordagem casual", m:"Oi [Nome]! Passando aqui pra dar um oi!\nLembro que você tinha interesse em energia solar. Como está a vida?"}
  ]},
  {chip:"2", sub:"Diagnóstico", title:"Dia 2 · Diagnóstico", opts:[
    {tag:"2A · Investigar mudanças", m:"[Nome], me conta uma coisa: mudou alguma coisa na situação desde nossa última conversa?"},
    {tag:"2B · Entender obstáculos", m:"Oi [Nome]! Ficou alguma dúvida sobre energia solar que posso esclarecer?"},
    {tag:"2C · Abordagem direta", m:"[Nome], você demonstrou interesse em energia solar mas sumiu!\nAconteceu algo que mudou a situação? Posso ajudar com alguma coisa?"}
  ]},
  {chip:"3", sub:"Ajuda", title:"Dia 3 · Solução / Ajuda", opts:[
    {tag:"3A · Oferecer suporte", m:"[Nome], se a questão for dúvida sobre financiamento, posso te explicar melhor!\nTemos parcelamento em até 84x com taxa reduzida pelo nosso parceiro."},
    {tag:"3B · Resolver objeções", m:"Muita gente fica em dúvida se o telhado serve ou se vale a pena mesmo. Posso tirar essa dúvida com você."},
    {tag:"3C · Facilitar decisão", m:"[Nome], se quiser, posso te mandar alguns casos de clientes da sua região que instalaram."}
  ]},
  {chip:"4", sub:"Reativar", title:"Dia 4 · Reativar interesse", opts:[
    {tag:"4A · Novo ângulo", m:"[Nome], você sabia que além de economizar na conta, energia solar valoriza o imóvel em até 15%?"},
    {tag:"4B · Benefício adicional", m:"Lembrei de você quando vi que a energia solar agora dá direito a financiamento com juros especiais!"},
    {tag:"4C · Prova social", m:"[Nome], 3 famílias aqui da região instalaram energia solar este mês!"}
  ]},
  {chip:"5", sub:"Urgência", title:"Dia 5 · Urgência suave", opts:[
    {tag:"5A · Timing de mercado", m:"[Nome], os preços dos equipamentos começaram a subir novamente...\nQuem aproveitar agora ainda pega as condições melhores. Vale pensar!"},
    {tag:"5B · Oportunidade limitada", m:"O nosso parceiro financeiro liberou uma linha especial de crédito para energia solar, mas é por tempo limitado."},
    {tag:"5C · Consequência da inação", m:"[Nome], enquanto a gente conversa, sua conta de luz continua subindo..."}
  ]},
  {chip:"6", sub:"Incisivo", title:"Dia 6 · Incisivo", opts:[
    {tag:"6A · Questionamento direto", m:"[Nome], posso te perguntar uma coisa?\nO que realmente tá te impedindo de economizar R$ 300-500/mês na conta de luz?"},
    {tag:"6B · Confronto amigável", m:"Sinceramente, não entendo... Você demonstrou interesse, viu que funciona, mas não age."},
    {tag:"6C · Realidade dura", m:"[Nome], enquanto você fica pensando, seus vizinhos já estão economizando."}
  ]},
  {chip:"7", sub:"Breakup", title:"Dia 7 · Breakup final", opts:[
    {tag:"7A · Encerramento positivo", m:"[Nome], foi meu último contato sobre energia solar!\nEntendo que pode não ser o momento certo. Se a situação mudar, estarei aqui pra ajudar!"},
    {tag:"7B · Porta aberta", m:"Oi [Nome]! Vou parar por aqui mesmo.\nMas quando a conta de luz apertar de vez e você lembrar da nossa conversa, me chama!"},
    {tag:"7C · Último alerta", m:"[Nome], última mensagem! Quando você ver sua conta de luz aumentar de novo (e vai aumentar), lembra que a solução tava bem aqui."}
  ]}
]},

{ id:"noshow", name:"Follow-up pós-reunião (no-show)", kind:"dias", groups:[
  {chip:"1", sub:"Reconectar", title:"Dia 1 · Reconectar pós-reunião", opts:[
    {tag:"1A · Preocupação genuína", m:"Oi [Nome]! Tudo bem?\nTe esperei hoje às [horario] mas você não apareceu.\nEspero que esteja tudo bem com você e a família! Aconteceu alguma coisa?"},
    {tag:"1B · Reagendamento fácil", m:"[Nome], nossa reunião era hoje às [horario]!\nImagino que deve ter surgido algo importante.\nQuer reagendar? Tenho agenda livre amanhã de [horario]. Funciona pra você?"},
    {tag:"1C · Sem cobrança", m:"Oi [Nome]! Ficamos aqui te esperando hoje, mas tudo bem!\nSei que imprevistos acontecem. Quando puder, me chama que reagendamos!"}
  ]},
  {chip:"2", sub:"Obstáculos", title:"Dia 2 · Investigar obstáculos", opts:[
    {tag:"2A · Investigar", m:"[Nome], me conta: mudou alguma coisa desde que agendamos nossa conversa?"},
    {tag:"2B · Flexibilizar", m:"Se a questão for tempo, posso fazer uma apresentação rápida por aqui mesmo no WhatsApp!"},
    {tag:"2C · Facilitar", m:"[Nome], se ficar difícil nos encontrarmos, posso te mandar a proposta por aqui mesmo."}
  ]},
  {chip:"3", sub:"Soluções", title:"Dia 3 · Oferecer soluções", opts:[
    {tag:"3A · Videoconferência", m:"[Nome], que tal fazermos uma videochamada?\nPosso te mostrar na tela quanto sua família economizaria com energia solar."},
    {tag:"3B · Visita flexível", m:"Se quiser, posso passar aí rapidinho no final do dia, quando você tiver mais livre."},
    {tag:"3C · Análise remota", m:"Manda uma foto da sua conta de luz que faço a simulação completa pra você!"}
  ]},
  {chip:"4", sub:"Momentum", title:"Dia 4 · Criar momentum", opts:[
    {tag:"4A · Prova social", m:"[Nome], seus vizinhos da [Rua] instalaram energia solar esta semana!"},
    {tag:"4B · Urgência de preço", m:"Lembrei de você quando soube que os preços vão subir mês que vem..."},
    {tag:"4C · Custo da espera", m:"[Nome], cada dia que passa sem energia solar é dinheiro jogado fora na conta de luz!"}
  ]},
  {chip:"5", sub:"Direto", title:"Dia 5 · Mais direto", opts:[
    {tag:"5A · Esclarecer interesse", m:"[Nome], me esclarece uma coisa: você realmente tem interesse em economia de energia?"},
    {tag:"5B · Custo da enrolação", m:"Enquanto você fica enrolando, sua conta de luz continua alta todo mês..."},
    {tag:"5C · Comparação", m:"[Nome], seus vizinhos que agiram rápido já estão economizando.\nVocê vai ficar pagando caro enquanto eles poupam? Vamos decidir isso?"}
  ]},
  {chip:"6", sub:"Incisivo", title:"Dia 6 · Incisivo", opts:[
    {tag:"6A · Sinceridade", m:"[Nome], vou ser sincero: você está perdendo tempo e dinheiro.\nAgendou, não veio, fica enrolando... Sua família não merece essa economia?"},
    {tag:"6B · Limite", m:"Olha, não posso ficar correndo atrás indefinidamente.\nOu você tem interesse real em energia solar ou não tem. Se tiver, me avisa!"},
    {tag:"6C · Última tentativa", m:"[Nome], última tentativa mesmo! Você demonstrou interesse, agendou reunião, mas não apareceu..."}
  ]},
  {chip:"7", sub:"Breakup", title:"Dia 7 · Breakup definitivo", opts:[
    {tag:"7A · Respeitoso", m:"[Nome], não vou mais incomodar!\nEntendo que deve ter outras prioridades agora.\nSe no futuro quiser retomar sobre energia solar, é só chamar. Sucesso!"},
    {tag:"7B · Despedida", m:"Essa é realmente minha última mensagem, [Nome].\nQuando você se arrepender e sua conta de luz estiver ainda mais cara, lembra de mim."},
    {tag:"7C · Encerramento seco", m:"[Nome], acabou por aqui mesmo!\nQuem não tem tempo pra economizar R$ 300/mês realmente não precisa."}
  ]}
]},

{ id:"antigo", name:"Reativação de leads antigos (6+ meses)", kind:"dias", groups:[
  {chip:"1", sub:"Reintro", title:"Dia 1 · Fresh start / Reintrodução", opts:[
    {tag:"1A · Reintrodução", m:"Oi [Nome]! Como você tá? Não sei se você lembra de mim...\nSou [Seu Nome] da [Nome da sua empresa]. Conversamos há um tempo sobre energia solar."},
    {tag:"1B · Resgate leve", m:"[Nome], oi! Tudo bem? Faz um tempo que conversamos sobre energia solar, né?"},
    {tag:"1C · Contato antigo", m:"Oi [Nome]! Estava olhando aqui meus contatos antigos e lembrei de você!"}
  ]},
  {chip:"2", sub:"Mudanças", title:"Dia 2 · Investigar mudanças", opts:[
    {tag:"2A · O que mudou", m:"[Nome], me conta: mudou muita coisa desde nossa última conversa?\nA situação da casa, da família... E a conta de luz, como tá?"},
    {tag:"2B · Reconhecer o tempo", m:"Imagino que muita coisa pode ter mudado nesse tempo todo, né [Nome]?"},
    {tag:"2C · Curiosidade", m:"[Nome], só curiosidade: você acabou instalando energia solar com alguém?"}
  ]},
  {chip:"3", sub:"Novo valor", title:"Dia 3 · Reframe / Novo valor", opts:[
    {tag:"3A · Mercado mudou", m:"[Nome], muita coisa mudou no mercado de energia solar desde nossa conversa!"},
    {tag:"3B · Mais vantajoso", m:"Olha só que interessante: hoje em dia energia solar ficou ainda mais vantajosa!"},
    {tag:"3C · Virou obrigatória", m:"[Nome], com os aumentos que tivemos na energia esse tempo todo, energia solar ficou obrigatória!"}
  ]},
  {chip:"4", sub:"Interesse", title:"Dia 4 · Criar interesse renovado", opts:[
    {tag:"4A · Valorização", m:"[Nome], descobri uma coisa que vai te interessar: agora a energia solar valoriza o imóvel oficialmente!"},
    {tag:"4B · Financiamento", m:"Lembrei de você quando soube que liberaram uma linha de financiamento especial para energia solar!"},
    {tag:"4C · Prova social", m:"[Nome], seus vizinhos que instalaram energia solar nesse tempo estão economizando uma fortuna!"}
  ]},
  {chip:"5", sub:"Urgência", title:"Dia 5 · Urgência / Persuasão", opts:[
    {tag:"5A · Custo do tempo", m:"[Nome], vou ser sincero: nesse tempo todo que passou, você já perdeu milhares de reais."},
    {tag:"5B · E se...", m:"Se você tivesse instalado energia solar quando conversamos, já teria economizado bastante."},
    {tag:"5C · Quem age, ganha", m:"[Nome], quem não se decidir logo vai ficar ainda mais para trás!\nOs preços da energia só sobem e quem tem energia solar fica tranquilo."}
  ]},
  {chip:"6", sub:"Incisivo", title:"Dia 6 · Incisivo", opts:[
    {tag:"6A · Pergunta sincera", m:"[Nome], posso te fazer uma pergunta sincera?\nPor que você fica adiando uma decisão que só traz benefícios? É receio de algo?"},
    {tag:"6B · Confronto", m:"Sinceramente, não entendo... Faz meses que você sabe que energia solar é vantajosa, mas continua adiando."},
    {tag:"6C · Escolha consciente", m:"[Nome], você tá escolhendo conscientemente continuar perdendo dinheiro."}
  ]},
  {chip:"7", sub:"Breakup", title:"Dia 7 · Breakup final", opts:[
    {tag:"7A · Respeitoso", m:"[Nome], essa foi minha última tentativa!\nEntendo que talvez energia solar não seja prioridade pra você.\nSe um dia mudar de ideia, é só me procurar. Desejo sucesso!"},
    {tag:"7B · Despedida", m:"[Nome], não vou mais te procurar sobre isso.\nMas quando sua conta de luz estiver R$ 500-600 e você lembrar que podia ter resolvido, me chama."},
    {tag:"7C · Encerramento seco", m:"[Nome], acabou aqui mesmo! Quem tem meses pra decidir uma coisa óbvia dessas não tem pressa de economizar."}
  ]}
]},

{ id:"orcamento", name:"Orçamento enviado mas sem resposta", kind:"dias", groups:[
  {chip:"1", sub:"Check-in", title:"Dia 1 · Check-in sobre o orçamento", opts:[
    {tag:"1A · Conseguiu ver?", m:"Oi [Nome]! Tudo bem? Você conseguiu dar uma olhada no orçamento que mandei?"},
    {tag:"1B · Chegou?", m:"[Nome], você recebeu meu orçamento por email?\nÀs vezes vai pra spam... Se não chegou, posso mandar por aqui no WhatsApp!"},
    {tag:"1C · O que achou?", m:"Oi [Nome]! E aí, o que achou do orçamento? Ficou dentro do que você esperava?"}
  ]},
  {chip:"2", sub:"Objeções", title:"Dia 2 · Investigar objeções", opts:[
    {tag:"2A · Ficou dúvida?", m:"[Nome], imagino que deve ter ficado alguma dúvida sobre o orçamento, né?"},
    {tag:"2B · É o valor?", m:"[Nome], se a questão for o valor, posso te mostrar outras formas de financiamento!"},
    {tag:"2C · Comparou?", m:"[Nome], você mostrou o orçamento pra mais alguém ou pesquisou em outras empresas? Normal fazer isso!"}
  ]},
  {chip:"3", sub:"Valor", title:"Dia 3 · Resolver objeções / Mostrar valor", opts:[
    {tag:"3A · Conta rápida", m:"[Nome], deixa eu te mostrar uma conta rápida: sua economia mensal seria de uns R$ [valor], que em 20 anos vira uma fortuna."},
    {tag:"3B · Compra à vista", m:"[Nome], sei que parece caro no primeiro momento, mas pensa assim:\né como pagar sua conta de luz dos próximos 20 anos à vista e nunca mais se preocupar."},
    {tag:"3C · Custo de 20 anos", m:"[Nome], você vai gastar R$ [valor da conta x 20 anos] nos próximos 20 anos SÓ de conta de luz!"}
  ]},
  {chip:"4", sub:"Momentum", title:"Dia 4 · Reforçar valor / Criar momentum", opts:[
    {tag:"4A · Não é só economia", m:"[Nome], energia solar não é só economia:\nConta de luz quase zero | Valoriza seu imóvel em 15%\nSustentabilidade para a família | Independência energética\nNão é investimento, é necessidade!"},
    {tag:"4B · Prova social", m:"[Nome], esta semana fechei 3 contratos aqui na região!\nAs famílias entenderam que energia solar é obrigatória hoje. Você vai ficar de fora?"},
    {tag:"4C · Aumento de preço", m:"[Nome], os fornecedores avisaram que os preços vão subir mês que vem!"}
  ]},
  {chip:"5", sub:"Persuasão", title:"Dia 5 · Persuasão direta", opts:[
    {tag:"5A · O que impede?", m:"[Nome], posso te perguntar uma coisa? O que exatamente tá te impedindo de aprovar?"},
    {tag:"5B · Custo da demora", m:"[Nome], cada mês que você demora pra decidir são R$ 400-500 jogados fora na conta de luz!"},
    {tag:"5C · Merecimento", m:"[Nome], sua família merece essa economia!\nImagina R$ [valor]/mês sobrando pro lazer, educação dos filhos, viagem..."}
  ]},
  {chip:"6", sub:"Incisivo", title:"Dia 6 · Incisivo", opts:[
    {tag:"6A · Fiz minha parte", m:"[Nome], vou ser sincero: fiz minha parte, calculei tudo, mostrei as vantagens, mandei orçamento detalhado..."},
    {tag:"6B · Limite", m:"Olha [Nome], não posso ficar insistindo indefinidamente.\nOu você aprova hoje ou vou partir pra outros clientes. Energia solar não falta procura."},
    {tag:"6C · Confronto", m:"[Nome], você tá literalmente escolhendo continuar perdendo dinheiro!"}
  ]},
  {chip:"7", sub:"Breakup", title:"Dia 7 · Breakup final", opts:[
    {tag:"7A · Respeitoso", m:"[Nome], foi meu último contato sobre o orçamento!\nEntendo que pode não ser o momento ideal.\nSe mudar de ideia e quiser retomar, é só me chamar. Sucesso!"},
    {tag:"7B · Despedida", m:"[Nome], não vou mais falar sobre energia solar. Mas quando sua conta de luz aumentar de novo, lembra que a proposta tava na sua mão."},
    {tag:"7C · Encerramento seco", m:"[Nome], acabou aqui! Quem demora meses pra analisar um orçamento simples de energia solar não tá pronto pra economizar."}
  ]}
]},

{ id:"objecoes", name:"Tratamento de objeções", kind:"itens", groups:[
  {chip:"“Muito caro”", sub:"", title:"Objeção: “Muito caro”", opts:[
    {tag:"A · Reframe", m:"[Nome], entendo a preocupação com o valor!\nMas você vai gastar R$ [valor da conta x 20 anos] nos próximos 20 anos SÓ de conta de luz."},
    {tag:"B · Parcelamento", m:"[Nome], ‘caro’ é continuar pagando conta de luz alta!\nA energia solar você pode parcelar em até 120 meses. Fica mais barato que sua conta atual!"},
    {tag:"C · Investimento", m:"[Nome], energia solar não é gasto, é investimento!\nÉ como comprar sua conta de luz dos próximos 20 anos com 60% de desconto."}
  ]},
  {chip:"“Sem pressa”", sub:"", title:"Objeção: “Não tenho pressa”", opts:[
    {tag:"A · Custo da espera", m:"[Nome], entendo, mas cada mês que você ‘não tem pressa’ são R$ 400-500 jogados fora!"},
    {tag:"B · Sem sentido", m:"[Nome], ‘não ter pressa’ pra economizar dinheiro é que não faz sentido!"},
    {tag:"C · Provocação", m:"[Nome], quem não tem pressa pra economizar R$ 500/mês realmente não precisa de dinheiro!"}
  ]},
  {chip:"“Pesquisar mais”", sub:"", title:"Objeção: “Preciso pesquisar mais”", opts:[
    {tag:"A · Paralisia de análise", m:"[Nome], entendo querer pesquisar, mas cuidado com a ‘paralisia de análise’!"},
    {tag:"B · Já tem tudo", m:"[Nome], você já tem todas as informações importantes:\nEconomia comprovada | Garantia de 25 anos | Financiamento aprovado | Empresa confiável"},
    {tag:"C · Custo de pesquisar", m:"[Nome], enquanto você ‘pesquisa mais’, seus vizinhos que agiram rápido já estão economizando!"}
  ]},
  {chip:"“Sem sol”", sub:"", title:"Objeção: “Casa não tem sol suficiente”", opts:[
    {tag:"A · É mito", m:"[Nome], isso é mito! Energia solar funciona até em dia nublado!\nO Brasil tem sol excelente o ano todo. Sua região tem [X] horas de sol por dia."},
    {tag:"B · Análise grátis", m:"[Nome], posso fazer uma análise técnica gratuita da sua casa!\nCom tecnologia via satélite, mostro exatamente quanto sol seu telhado recebe."},
    {tag:"C · Casos reais", m:"[Nome], tenho clientes com telhados ‘piores’ que o seu economizando R$ 400-500/mês!"}
  ]},
  {chip:"“Não confio”", sub:"", title:"Objeção: “Não confio na tecnologia”", opts:[
    {tag:"A · 50+ anos", m:"[Nome], energia solar existe há mais de 50 anos! É a tecnologia que mais cresce no mundo."},
    {tag:"B · Garantias", m:"[Nome], entendo a preocupação! Por isso oferecemos:\n25 anos de garantia dos painéis | 10 anos de garantia do inversor | 6 meses de garantia da instalação"},
    {tag:"C · Vizinhos usam", m:"[Nome], seus próprios vizinhos aqui da região já estão usando há anos!"}
  ]},
  {chip:"“Esperar baixar”", sub:"", title:"Objeção: “Vou esperar os preços baixarem”", opts:[
    {tag:"A · Não vão baixar", m:"[Nome], os preços não vão baixar! A demanda mundial só cresce, matérias-primas ficando caras..."},
    {tag:"B · Mesmo que baixe", m:"[Nome], mesmo que os preços baixem 10% no futuro (o que é improvável), você já perdeu muito mais que isso pagando conta de luz."},
    {tag:"C · Analogia aluguel", m:"[Nome], é como esperar preço de casa baixar enquanto paga aluguel caro!"}
  ]},
  {chip:"Encerrar", sub:"", title:"Encerramento consultivo", opts:[
    {tag:"A · Resumo de valor", m:"[Nome], resumi tudo pra você:\nEconomia real de R$ 500/mês | Tecnologia comprovada há décadas\nGarantias sólidas | Financiamento facilitado | Valorização do imóvel"},
    {tag:"B · Papel de consultor", m:"[Nome], como consultor, meu papel é esclarecer todas as suas dúvidas — e consegui!"},
    {tag:"C · Fiz minha parte", m:"[Nome], expliquei tudo que podia sobre energia solar. Mostrei economia, esclareci dúvidas, dei garantias..."}
  ]}
]},

{ id:"sazonal", name:"Sazonais e datas especiais", kind:"itens", groups:[
  {chip:"Fim de ano", sub:"", title:"Fim de ano (nov/dez)", opts:[
    {tag:"Balanço anual", m:"[Nome], chegando o final de ano!\nHora de fazer as contas: quanto você gastou de energia elétrica este ano?"},
    {tag:"Planejamento", m:"[Nome], já fez seus planos pro ano que vem? Uma coisa que pode incluir: economia de energia!"},
    {tag:"13º salário", m:"[Nome], época de 13º salário! Que tal usar uma parte pra se livrar da conta de luz alta PRA SEMPRE?"},
    {tag:"Última chance do ano", m:"[Nome], últimas semanas do ano! Quem instalar energia solar agora ainda pega as condições deste ano."}
  ]},
  {chip:"Início de ano", sub:"", title:"Início de ano (jan/fev)", opts:[
    {tag:"Ano novo, vida nova", m:"[Nome], feliz Ano Novo! Ano novo, vida nova!\nQue tal começar este ano se livrando da conta de luz alta? Energia solar resolve!"},
    {tag:"Metas do ano", m:"[Nome], quais são suas metas para este ano? Deixa eu sugerir uma: economizar R$ 6.000 na conta de luz!"},
    {tag:"Volta às atividades", m:"[Nome], voltando à rotina depois das férias! E junto volta a preocupação com as contas..."},
    {tag:"Planejamento financeiro", m:"[Nome], janeiro é mês de planejar as finanças! Inclui energia solar no seu orçamento deste ano."}
  ]},
  {chip:"Chuvas", sub:"", title:"Período de chuvas (fev/abr)", opts:[
    {tag:"Mito da chuva", m:"[Nome], chovendo muito aí? Muita gente pensa que energia solar não funciona na chuva, mas é mito!"},
    {tag:"Dias nublados", m:"[Nome], você sabia que painéis solares até preferem dias frescos e nublados?"},
    {tag:"Compensação anual", m:"[Nome], nos meses de sol (que são a maioria), os painéis geram energia extra que compensa os dias nublados!"},
    {tag:"Melhor época pra instalar", m:"[Nome], época de chuva é ideal pra instalar! Quando o sol voltar forte (e vai voltar), você já estará economizando."}
  ]},
  {chip:"Verão", sub:"", title:"Verão / Alta temporada", opts:[
    {tag:"Calor e consumo", m:"[Nome], que calor! Ar condicionado ligado o dia todo, né?\nA conta de luz do verão vai vir pesada... Energia solar é a única saída."},
    {tag:"Sol forte = economia", m:"[Nome], sol forte desse jeito é dinheiro no bolso pra quem tem energia solar!"},
    {tag:"Pico de geração", m:"[Nome], verão é época de pico de geração de energia solar!\nÉ quando os painéis trabalham no máximo da capacidade. Imagina sua economia!"},
    {tag:"Próximo verão", m:"[Nome], quem instalar energia solar agora já tá preparado pro próximo verão!"}
  ]},
  {chip:"Bandeira vermelha", sub:"", title:"Bandeira vermelha", opts:[
    {tag:"Alerta", m:"[Nome], bandeira vermelha de novo! Mais uma taxa extra na conta de luz..."},
    {tag:"Impacto financeiro", m:"[Nome], calculou quanto a bandeira vermelha vai custar no final do ano?"},
    {tag:"Independência", m:"[Nome], cansado de ficar refém das bandeiras tarifárias? Energia solar te dá independência!"},
    {tag:"Urgência de proteção", m:"[Nome], as bandeiras tarifárias só vão piorar! O sistema elétrico brasileiro tá frágil..."}
  ]},
  {chip:"Aumentos", sub:"", title:"Aumentos tarifários", opts:[
    {tag:"Aumento anunciado", m:"[Nome], viu que a energia elétrica aumentou de novo? Todo ano a mesma história..."},
    {tag:"Projeção futura", m:"[Nome], se continuar assim, daqui 5 anos sua conta vai estar impagável!"},
    {tag:"Comparação", m:"[Nome], enquanto sua conta só aumenta, quem tem energia solar paga sempre o mesmo: quase ZERO!"},
    {tag:"Ação urgente", m:"[Nome], cada aumento que passa sem você ter energia solar é dinheiro perdido!"}
  ]},
  {chip:"Datas comemorativas", sub:"", title:"Datas comemorativas", opts:[
    {tag:"Dia das Mães", m:"[Nome], Dia das Mães chegando! Que tal dar um presente que dura PRA SEMPRE?"},
    {tag:"Dia dos Pais", m:"[Nome], Dia dos Pais! Todo pai quer proteger a família, né?\nEnergia solar é proteção contra os aumentos! É o presente perfeito."},
    {tag:"Dia das Crianças", m:"[Nome], Dia das Crianças! Que mundo você quer deixar pros seus filhos?"},
    {tag:"Natal", m:"[Nome], Natal chegando! Época de luz, amor e união familiar!\nQue tal começar o ano novo com a luz do sol aquecendo sua casa E seu bolso?"},
    {tag:"Aniversário da cidade", m:"[Nome], aniversário da nossa cidade! Que tal contribuir com o desenvolvimento sustentável?"}
  ]},
  {chip:"Datas comemorativas", sub:"", title:"Datas comemorativas", opts:[
    {tag:"Dia das Mães", m:"[Nome], Dia das Mães chegando! Que tal dar um presente que dura PRA SEMPRE?"},
    {tag:"Dia dos Pais", m:"[Nome], Dia dos Pais! Todo pai quer proteger a família, né?\nEnergia solar é proteção contra os aumentos! É o presente perfeito."},
    {tag:"Dia das Crianças", m:"[Nome], Dia das Crianças! Que mundo você quer deixar pros seus filhos?"},
    {tag:"Natal", m:"[Nome], Natal chegando! Época de luz, amor e união familiar!\nQue tal começar o ano novo com a luz do sol aquecendo sua casa E seu bolso?"},
    {tag:"Aniversário da cidade", m:"[Nome], aniversário da nossa cidade! Que tal contribuir com o desenvolvimento sustentável?"}
  ]}
]},

{ id:"relacionamento", name:"💛 Relacionamento", kind:"itens", groups:[
  {chip:"Aniversário", sub:"", title:"🎂 Aniversário do Cliente", opts:[
    {tag:"🎂 Aniversário do cliente", m:"🎉 Feliz Aniversário, [Nome]! 🎂\nHoje o dia é seu, e a família SER Energia não podia deixar passar em branco!\nQueremos desejar um ano repleto de conquistas, saúde e muita luz (literalmente ☀️) na sua vida.\nObrigado por confiar na SER e fazer parte da nossa história. Que seu novo ciclo venha ainda mais brilhante!\nUm abraço da equipe SER Energia Renovável 💛"}
  ]},
  {chip:"5 dias · Acolhimento", sub:"", title:"⚡ 5 Dias do Sistema Instalado", opts:[
    {tag:"⚡ 5 dias · Acolhimento", m:"Oi [Nome], tudo bem? 😊\nJá faz 5 dias que sua usina solar está instalada e gerando economia pra você — como está sendo essa experiência até aqui?\nQueremos garantir que você esteja aproveitando 100% do seu sistema! Por isso, vamos te apresentar o app de monitoramento da SER, onde você acompanha em tempo real:\n✅ Quanto sua usina está gerando\n✅ Sua economia acumulada\n✅ Performance do sistema, tudo pelo celular\nPosso te enviar o passo a passo pra você baixar agora?\nQualquer dúvida, estamos aqui. Você não comprou só um sistema, você entrou pra família SER! 🌞"}
  ]},
  {chip:"30 dias · Gratidão", sub:"", title:"🙏 30 Dias — 1º Mês com a SER", opts:[
    {tag:"🙏 30 dias · Gratidão + Embaixador", m:"[Nome], hoje é um dia especial pra gente! 🙏\nFaz exatamente 1 mês que sua usina está instalada, e olha só o que isso significa: 1 mês de economia real na sua conta de luz, 1 mês de energia limpa gerada na sua casa, e 1 mês fazendo parte da nossa família SER.\nQueremos genuinamente agradecer pela confiança. Cada cliente como você é o motivo da SER existir. 💛\nE como forma de celebrar essa parceria, temos uma novidade:\n🌟 Programa Embaixador SER 🌟\nA partir de hoje, você pode ganhar até um salário mínimo por cada venda concretizada só indicando pessoas que também querem economizar com energia solar!\nSimples assim: você indica, a pessoa fecha, você recebe.\nQuer saber como funciona? Te explico tudo em 2 minutos aqui no WhatsApp.\nParabéns pelo seu primeiro mês com a SER! Que venham muitos outros 🚀"}
  ]},
  {chip:"90 dias · Embaixador", sub:"", title:"🚀 90 Dias — 3 Meses com a SER", opts:[
    {tag:"🚀 90 dias · Programa Embaixador", m:"[Nome], já são 3 meses de você com a SER Energia! 🎊\nNesse tempo você continua gerando energia limpa todos os dias direto do telhado da sua casa e economizando na conta de luz.\nEstamos muito felizes com essa parceria, e por isso batemos aqui hoje com carinho: você já conhece o Programa Embaixador SER?\nRelembrando: você indica, a pessoa fecha a instalação, e você ganha até um salário mínimo por cada venda concretizada. Sem limite de quantas indicações você pode fazer!\nMuita gente da sua rede também merece parar de pagar caro na conta de luz — e você pode ser a ponte pra isso, ganhando por cada indicação.\nTopa começar a indicar hoje mesmo? Me chama que te explico tudo certinho! 💪🌞"}
  ]},
  {chip:"300 dias · Manutenção", sub:"", title:"🛡️ 300 Dias — Manutenção Preventiva", opts:[
    {tag:"🛡️ 300 dias · Manutenção Preventiva", m:"Oi [Nome], tudo bem? 😊\nAqui é da equipe SER Energia Renovável. Passamos para te dar um aviso importante!\n\nJá se aproxima 1 ano desde a instalação da sua usina solar — parabéns por gerar sua própria energia todo esse tempo! ☀️\n\nComo acontece com qualquer equipamento de qualidade, a manutenção preventiva é fundamental para garantir que o seu sistema continue operando com máxima eficiência e vida útil prolongada.\n\nPor isso, recomendamos agendar agora a sua:\n✅ Limpeza dos módulos fotovoltaicos\n✅ Inspeção das conexões elétricas\n✅ Verificação do desempenho do inversor\n✅ Check geral da estrutura de fixação\n\nEssa revisão preventiva evita perdas de geração e garante que sua garantia permaneça válida.\n\nQuer agendar? É só responder aqui que a gente cuida de tudo! 🔧🌞"}
  ]}
]},

/* ===== ROTEIROS DE LIGAÇÃO / PRESENCIAL — Caderno de Scripts ===== */

{ id:"scriptNetworking", name:"Roteiro · Networking", kind:"roteiro", groups:[
  {chip:"Abertura", sub:"", title:"Networking · Abertura (Rede Quente)", opts:[
    {tag:"Abertura · Pesquisa rápida", m:"Olá [Nome], tudo bem? Amigo(a), estou te ligando rapidinho porque comecei um desafio novo em uma empresa de tecnologia e energia e pensei logo em você para me dar uma força. Você consegue me ajudar com uma pesquisa super rápida? São só 3 perguntas para eu bater minha meta de treinamento aqui."}
  ]},
  {chip:"Pergunta 1", sub:"", title:"Networking · Pergunta 1", opts:[
    {tag:"P1 · Satisfação", m:"Hoje, qual o seu nível de satisfação com a Equatorial: Ruim, Bom ou Excelente?"},
    {tag:"P1 · Se responder Ruim", m:"Pois é, a maioria das pessoas que eu converso diz o mesmo..."}
  ]},
  {chip:"Pergunta 2", sub:"", title:"Networking · Pergunta 2", opts:[
    {tag:"P2 · Valor da conta", m:"E quanto você paga de conta de energia, em média, por mês? Só para eu ter uma base aqui para o meu relatório."}
  ]},
  {chip:"Pergunta 3", sub:"", title:"Networking · Pergunta 3 + Fechamento", opts:[
    {tag:"P3 · Jogando dinheiro fora", m:"Caramba, [Nome], com base nesse valor que você paga, eu vi aqui na tabela que você está jogando muito dinheiro fora! Se eu te mostrasse uma simulação de como reduzir esse valor em 80%, ficaria melhor eu passar aí para te dar um abraço ou você prefere vir aqui no escritório?"}
  ]},
  {chip:"Fechamento", sub:"", title:"Networking · Fechamento (Técnica do OU/OU)", opts:[
    {tag:"OU/OU · Dia", m:"Consigo fazer essa simulação para você hoje ou amanhã. Qual fica melhor?"},
    {tag:"OU/OU · Turno", m:"Na parte da manhã ou da tarde?"}
  ]},
  {chip:"Contornos", sub:"", title:"Networking · Contornos e gatilhos", opts:[
    {tag:"Gatilho · Exclusividade", m:"É só uma simulação de 5 minutos que o sistema gera, não precisa comprar nada agora, é mais para eu concluir meu relatório de treinamento mesmo."},
    {tag:"Poder do 'Por que você?'", m:"Liguei para você porque sei que você é uma pessoa decidida e tem uma conta que compensaria muito reduzir."},
    {tag:"Contorno · 'Não tenho interesse'", m:"Entendo perfeitamente, [Nome]. Na verdade, eu te liguei mais pela ajuda com a pesquisa mesmo. A simulação é só um presente meu pelo seu tempo, sem compromisso nenhum. Podemos fazer?"}
  ]}
]},

{ id:"scriptFrio", name:"Roteiro · Contato Frio", kind:"roteiro", groups:[
  {chip:"Abertura", sub:"", title:"Contato Frio · Abertura com autoridade", opts:[
    {tag:"Abertura · Mapeamento regional", m:"Olá, [Nome]? Tudo bem? Aqui é o [Seu Nome], sou Gestor de Projetos de Energia. Estou entrando em contato com os moradores/empresários aqui da região de [Bairro/Cidade] para um mapeamento de economia devido aos últimos aumentos da conta de luz. Você teria 30 segundos para me responder 3 perguntas rápidas?"}
  ]},
  {chip:"Pergunta 1", sub:"", title:"Contato Frio · Pergunta 1", opts:[
    {tag:"P1 · Custo-benefício", m:"Hoje, como você avalia o custo-benefício da Equatorial na sua conta de luz: Ruim, Bom ou Excelente?"},
    {tag:"P1 · Independente da resposta", m:"Entendo. Geralmente, quem responde 'Bom' ou 'Excelente' ainda não percebeu o quanto poderia estar economizando."}
  ]},
  {chip:"Pergunta 2", sub:"", title:"Contato Frio · Pergunta 2 (Régua de qualificação)", opts:[
    {tag:"P2 · Acima ou abaixo de R$ 400", m:"Hoje o seu consumo mensal fica acima ou abaixo de R$ 400,00?"},
    {tag:"P2 · Se disser acima", m:"Certo, e qual é a média exata que vem na sua fatura?"}
  ]},
  {chip:"Pergunta 3", sub:"", title:"Contato Frio · Pergunta 3 + Fechamento", opts:[
    {tag:"P3 · Estudo técnico 80%", m:"Olha, de acordo com o perfil aqui da região, você está jogando muito dinheiro fora pagando taxas que não precisaria. Eu consigo gerar um estudo técnico que reduz esse custo em 80% pra você. Para eu te apresentar esses números, fica melhor conversarmos hoje ou amanhã?"}
  ]},
  {chip:"Fechamento", sub:"", title:"Contato Frio · Fechamento (Técnica do OU/OU)", opts:[
    {tag:"OU/OU · Turno", m:"Na parte da manhã ou da tarde?"},
    {tag:"OU/OU · Local", m:"Prefere que eu passe aí para te mostrar ou quer dar um pulo aqui no meu escritório?"}
  ]}
]},

{ id:"scriptIndicadores", name:"Roteiro · Indicadores", kind:"roteiro", groups:[
  {chip:"A Ponte", sub:"", title:"Indicadores · A Ponte (mensagem que o indicador envia)", opts:[
    {tag:"Ponte · Prova social", m:"Olá [Nome], tudo bem? Cara, eu conheci o [Seu Nome] da [Nome da sua empresa] e lembrei de você na hora. Ele faz um mapeamento de economia que mostra como reduzir a conta de luz em até 80% e os resultados são absurdos. Passei seu contato para ele e pedi para ele te dar uma atenção especial com uma pesquisa de 30 segundos. Ele vai te mandar um oi por aqui, troca uma ideia com ele que vale a pena! Valeu!"}
  ]},
  {chip:"Abertura", sub:"", title:"Indicadores · Abordagem (como você liga para o indicado)", opts:[
    {tag:"Abertura · Transferência de confiança", m:"Olá [Nome], tudo bem? Aqui é o [Seu Nome], da [Nome da sua empresa]. Eu sou amigo do [Nome de quem indicou], ele me falou muito bem de você e disse que eu precisava te mostrar o que estamos fazendo aqui na região."}
  ]},
  {chip:"Pergunta 1", sub:"", title:"Indicadores · Pergunta 1", opts:[
    {tag:"P1 · Serviço da Equatorial", m:"Como eu te falei, eu faço um mapeamento de custos. Hoje, para você, a Equatorial presta um serviço: Ruim, Bom ou Excelente?"}
  ]},
  {chip:"Pergunta 2", sub:"", title:"Indicadores · Pergunta 2", opts:[
    {tag:"P2 · Faixa de consumo", m:"Certo. E hoje, o seu consumo médio mensal está na faixa de quanto, aproximadamente? Só para eu saber se você se enquadra no grupo de alta economia."}
  ]},
  {chip:"Pergunta 3", sub:"", title:"Indicadores · Pergunta 3 + Fechamento", opts:[
    {tag:"P3 · O indicador tinha razão", m:"Entendi, [Nome]. Com base nesse valor, o [Nome de quem indicou] tinha razão: você está jogando muito dinheiro fora. Eu já tenho aqui uma projeção de como reduzir isso em 80%. Para eu te apresentar esses números sem compromisso, fica melhor hoje ou amanhã?"}
  ]},
  {chip:"Fechamento", sub:"", title:"Indicadores · Fechamento (Técnica do OU/OU)", opts:[
    {tag:"OU/OU · Turno", m:"Na parte da manhã ou da tarde?"}
  ]}
]},

{ id:"scriptInvestidor", name:"Roteiro · Investidor", kind:"roteiro", groups:[
  {chip:"Abertura", sub:"", title:"Investidor · Abertura 60 segundos (Perfil Investidor)", opts:[
    {tag:"Abertura · Posicionamento de elite", m:"Boa tarde, [Nome], tudo bem? Eu me chamo [Seu Nome], sou Assessor de Investimentos da [Nome da sua empresa], a maior empresa da região no segmento de usinas de investimento. Estou te ligando pois estamos realizando um mapeamento com os principais investidores da região e identificamos o senhor como um potencial parceiro para nossos novos ativos. Faz sentido para o senhor me ouvir por apenas 60 segundos agora?"}
  ]},
  {chip:"Pergunta 1", sub:"", title:"Investidor · Pergunta 1", opts:[
    {tag:"P1 · Retorno dos investimentos", m:"Hoje, como você avalia o retorno dos seus investimentos atuais (como CDI, Imóveis ou Renda Fixa) frente à inflação: Ruim, Bom ou Excelente?"}
  ]},
  {chip:"Pergunta 2", sub:"", title:"Investidor · Pergunta 2", opts:[
    {tag:"P2 · Valor da conta/indústria", m:"Atualmente, qual o valor da sua conta de energia (ou da sua indústria)? Pergunto isso para calcularmos se é mais vantajoso para o senhor uma usina para autoconsumo ou uma para comercialização pura."}
  ]},
  {chip:"Pergunta 3", sub:"", title:"Investidor · Pergunta 3", opts:[
    {tag:"P3 · 2% ao mês em contrato", m:"Olha, com base no seu perfil, eu identifiquei que o senhor está deixando de lucrar. Nós temos hoje um modelo de usina que garante, em contrato, um retorno mensal de 2% ao mês."}
  ]},
  {chip:"Qualificação", sub:"", title:"Investidor · Qualificação avançada", opts:[
    {tag:"Prioridade (0 a 10)", m:"De 0 a 10, qual é a sua prioridade hoje em diversificar seu capital para um ativo que é isento de impostos e com rentabilidade garantida?"},
    {tag:"Decisores", m:"Em relação às pessoas que influenciam suas decisões de negócios (sócios ou familiares), elas estariam presentes para analisarmos esses números juntos?"}
  ]},
  {chip:"Fechamento", sub:"", title:"Investidor · Fechamento corporativo (OU/OU)", opts:[
    {tag:"Fechamento · Reunião de negócios", m:"Perfeito. Como somos o maior case em usinas de grande porte, eu quero te apresentar os números reais desse projeto. Fica melhor eu ir até você ou o senhor vir ao nosso escritório para essa reunião de negócios?"},
    {tag:"OU/OU · Dia", m:"Hoje ou amanhã?"},
    {tag:"OU/OU · Turno", m:"De manhã ou de tarde?"},
    {tag:"OU/OU · Hora", m:"Às [Hora 1] ou às [Hora 2]?"}
  ]},
  {chip:"Google Agenda", sub:"", title:"Investidor · Formalização com Google Agenda", opts:[
    {tag:"Formalização do compromisso", m:"Combinado, [Nome]. Para deixarmos tudo registrado e o senhor receber o lembrete automático no seu celular, qual é o seu melhor e-mail? Vou te enviar agora mesmo o convite pelo Google Agenda. Além disso, já te mando a nossa localização e o meu contato pessoal pelo WhatsApp para facilitarmos. Até logo!"}
  ]}
]},

{ id:"scriptPap", name:"Roteiro · PAP", kind:"roteiro", groups:[
  {chip:"Abertura", sub:"", title:"PAP · Abertura (mapeamento de rua)", opts:[
    {tag:"Abertura · Mapeamento técnico", m:"Bom dia / Boa tarde! Tudo bem? Eu me chamo [Seu Nome], sou consultor da [Nome da sua empresa]. Nós estamos realizando um mapeamento técnico aqui na rua [Rua] para identificar as residências que possuem o maior potencial de economia de energia após os últimos reajustes da Equatorial. Você teria 30 segundos para me ajudar com 3 perguntas rápidas da nossa pesquisa?"}
  ]},
  {chip:"Pergunta 1", sub:"", title:"PAP · Pergunta 1", opts:[
    {tag:"P1 · Valor e serviço", m:"Hoje, em relação ao valor que você paga e ao serviço da Equatorial, você diria que está: Ruim, Bom ou Excelente?"},
    {tag:"P1 · Se disser Ruim", m:"Pois é, seus vizinhos aqui da frente também comentaram a mesma coisa..."}
  ]},
  {chip:"Pergunta 2", sub:"", title:"PAP · Pergunta 2", opts:[
    {tag:"P2 · Acima ou abaixo de R$ 300", m:"Para eu entender o seu perfil de consumo, hoje a sua conta de luz fica em média acima ou abaixo de R$ 300,00?"},
    {tag:"P2 · Se disser acima", m:"Certo, e qual o valor aproximado da última fatura?"}
  ]},
  {chip:"Pergunta 3", sub:"", title:"PAP · Pergunta 3", opts:[
    {tag:"P3 · Incidência de sol no telhado", m:"Olha, com base nesse valor e na incidência de sol que eu já mapeei aqui no seu telhado, você está jogando muito dinheiro fora! Eu consigo gerar um estudo aqui agora que mostra como reduzir esse custo em 80%."}
  ]},
  {chip:"Fechamento", sub:"", title:"PAP · Fechamento (Técnica do OU/OU)", opts:[
    {tag:"Fechamento · Agora ou mais tarde", m:"Como eu já estou com o sistema de mapeamento aberto aqui, fica melhor para você eu te apresentar esses números agora ou você prefere que eu volte no final da tarde, quando estiverem todos em casa?"},
    {tag:"OU/OU · Hoje ou amanhã", m:"Hoje às [Hora 1] ou amanhã às [Hora 2]?"}
  ]},
  {chip:"Encerramento", sub:"", title:"PAP · Encerramento (compromisso via WhatsApp)", opts:[
    {tag:"Encerramento · Pegar o WhatsApp", m:"Perfeito! Vou deixar agendado aqui no meu sistema. Qual é o seu WhatsApp para eu te enviar agora mesmo a confirmação do nosso encontro? Assim você já fica com o meu contato salvo para qualquer dúvida e eu te mando um 'Oi' com a nossa localização. Pode ser?"}
  ]},
  {chip:"Dica de ouro", sub:"", title:"PAP · Pergunta de ouro (cliente ocupado)", opts:[
    {tag:"Cliente ocupado", m:"Eu não vim aqui para te vender nada agora, vim apenas validar se a sua casa se enquadra no programa de redução de 80%. Posso validar isso em 30 segundos?"}
  ]}
]}
];

function renderDisparador(){
  $('#pageActions').innerHTML = '';
  const MESES_DISP=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  let dpCatIdx=0, dpSubIdx=0;
  const g = id => document.getElementById(id);

  function loadCfg(){try{return JSON.parse(localStorage.getItem('ser_disparador_cfg')||'{}')}catch(e){return {}}}
  function saveCfg(){try{localStorage.setItem('ser_disparador_cfg',JSON.stringify({
    vendedor:g('dpVendedor').value, empresa:g('dpEmpresa').value, telefone:g('dpTelefone').value
  }))}catch(e){}}

  function parseValorDp(v){const n=parseFloat(String(v).replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3})/g,'').replace(',','.'));return isNaN(n)?null:n}
  function fmtBRLDp(n){return 'R$ '+n.toLocaleString('pt-BR',{maximumFractionDigits:0})}
  function fmtNumDp(n){return n.toLocaleString('pt-BR',{maximumFractionDigits:0})}

  function tokens(){
    const v=parseValorDp(g('dpValor').value);
    const v20=v!=null?fmtBRLDp(v*240):null;
    return [
      ['[Nome da sua empresa]', g('dpEmpresa').value.trim()],
      ['[Seu Nome]', g('dpVendedor').value.trim()],
      ['[valor da conta x 20 anos]', v20],
      ['[valor x 20 anos]', v20],
      ['[Empresa]', g('dpClienteEmpresa').value.trim()],
      ['[Nome]', g('dpCliente').value.trim()],
      ['[valor]', v!=null?fmtNumDp(v):''],
      ['[cor]', g('dpBandeira').value],
      ['[mes]', g('dpMes').value]
    ];
  }

  function fillDisplay(msg){
    let s=esc(msg);
    for(const [k,val] of tokens()){
      if(val){ s=s.split(k).join('<mark class="disp-hl">'+esc(val)+'</mark>'); }
    }
    s=s.replace(/\[[^\]]+\]/g,m=>'<mark class="disp-hl-empty">'+m+'</mark>');
    return s.replace(/\n/g,'<br>');
  }
  function fillCopy(msg){
    let s=msg;
    for(const [k,val] of tokens()){ if(val) s=s.split(k).join(val); }
    return s;
  }

  function renderCats(){
    g('dpCatChips').innerHTML=DISPARADOR_DATA.map((c,i)=>
      `<button type="button" class="disp-chip${i===dpCatIdx?' active':''}" data-dpcat="${i}">${esc(c.name)}</button>`).join('');
  }
  function renderSub(){
    const cat=DISPARADOR_DATA[dpCatIdx];
    g('dpSubLabel').textContent = cat.kind==='dias' ? 'Dia da tentativa' : (cat.id==='objecoes'?'Objeção':(cat.kind==='roteiro'?'Etapa do roteiro':'Momento'));
    g('dpSubChips').innerHTML=cat.groups.map((sgrp,i)=>{
      if(cat.kind==='dias'){
        return `<button type="button" class="disp-chip disp-chip-day${i===dpSubIdx?' active':''}" data-dpsub="${i}"><span class="d">${esc(sgrp.chip)}</span><span class="s">${esc(sgrp.sub)}</span></button>`;
      }
      return `<button type="button" class="disp-chip${i===dpSubIdx?' active':''}" data-dpsub="${i}">${esc(sgrp.chip)}</button>`;
    }).join('');
  }
  function renderResults(){
    const cat=DISPARADOR_DATA[dpCatIdx], grp=cat.groups[dpSubIdx];
    g('dpResTitle').textContent=grp.title;
    g('dpResCount').textContent=grp.opts.length+' opções';
    g('dpResults').innerHTML=grp.opts.map((o,i)=>`
      <div class="disp-card">
        <div class="disp-card-top"><span class="disp-tag">${esc(o.tag)}</span></div>
        <div class="disp-msg" id="dpMsg${i}">${fillDisplay(o.m)}</div>
        <div class="disp-actions">
          <button type="button" class="btn btn-secondary disp-copy-btn" data-dpcopy="${i}">📋 Copiar</button>
          <button type="button" class="btn disp-wa-btn" data-dpwa="${i}">💬 WhatsApp</button>
        </div>
      </div>`).join('');
  }
  function renderCtxBar(){
    const cli=g('dpCliente').value.trim(), v=parseValorDp(g('dpValor').value);
    const cor=g('dpBandeira').value, parts=[];
    parts.push(`<span class="disp-pill">Cliente: <b>${cli?esc(cli):'<span class="disp-warn">defina</span>'}</b></span>`);
    if(v!=null) parts.push(`<span class="disp-sep"></span><span class="disp-pill">Conta: <b>${fmtBRLDp(v)}</b></span>`);
    parts.push(`<span class="disp-sep"></span><span class="disp-pill">Bandeira: <b style="text-transform:capitalize">${esc(cor)}</b></span>`);
    g('dpCtxBar').innerHTML=parts.join('');
  }
  function refreshDynamic(){
    renderCtxBar();
    $$('#dpResults .disp-msg').forEach((el,i)=>{
      const grp=DISPARADOR_DATA[dpCatIdx].groups[dpSubIdx];
      if(grp.opts[i]) el.innerHTML=fillDisplay(grp.opts[i].m);
    });
    const cores = {verde:'var(--success)',amarela:'#f4c20d',vermelha:'var(--danger)'};
    g('dpFlagdot').style.background = cores[g('dpBandeira').value] || cores.vermelha;
  }

  async function copyTextDp(t){
    try{ await navigator.clipboard.writeText(t); return true; }
    catch(e){
      const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';
      document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}
      document.body.removeChild(ta);return ok;
    }
  }
  function waLinkDp(t){
    const tel=g('dpTelefone').value.replace(/\D/g,'');
    const base=tel?('https://wa.me/'+(tel.length<=11?'55'+tel:tel)):'https://wa.me/';
    return base+'?text='+encodeURIComponent(t);
  }

  $('#content').innerHTML = `
    <style>
      .disp-page .disp-chips{display:flex;flex-wrap:wrap;gap:8px}
      .disp-page .disp-chips.scroll{flex-wrap:nowrap;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch}
      .disp-page .disp-chip{font-family:inherit;font-size:13px;font-weight:500;white-space:nowrap;color:var(--text-light);background:#f5f4f0;border:1px solid var(--border);border-radius:999px;padding:9px 14px;cursor:pointer;transition:all .14s;flex-shrink:0}
      .disp-page .disp-chip:hover{border-color:var(--primary-light);color:var(--text)}
      .disp-page .disp-chip.active{background:var(--primary);border-color:var(--primary);color:#fff;font-weight:600}
      .disp-page .disp-chip-day{min-width:48px;text-align:center;padding:9px 4px;width:48px}
      .disp-page .disp-chip-day .d{font-size:14px;line-height:1;display:block;font-weight:700}
      .disp-page .disp-chip-day .s{display:block;font-size:8px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;margin-top:2px;opacity:.75}
      .disp-page .disp-label{font-size:12px;font-weight:500;color:var(--text-light);text-transform:uppercase;letter-spacing:.3px;margin-bottom:9px;display:block}
      .disp-page .disp-divider{height:1px;background:var(--border);margin:14px 0}
      .disp-page .disp-ctxbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:12.5px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;margin-bottom:14px;box-shadow:var(--shadow)}
      .disp-page .disp-pill{display:inline-flex;align-items:center;gap:6px;color:var(--text-light)}
      .disp-page .disp-pill b{color:var(--text);font-weight:600}
      .disp-page .disp-sep{width:1px;height:14px;background:var(--border)}
      .disp-page .disp-warn{color:var(--warning);font-weight:600}
      .disp-page .disp-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:15px;margin-bottom:12px;position:relative;overflow:hidden;box-shadow:var(--shadow)}
      .disp-page .disp-card::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient(var(--primary),var(--primary-dark))}
      .disp-page .disp-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}
      .disp-page .disp-tag{font-size:10.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--primary);background:#f5f0fc;border:1px solid #e4d4f7;border-radius:6px;padding:4px 8px}
      .disp-page .disp-msg{font-size:14px;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:var(--text);padding-left:2px}
      .disp-page .disp-hl{background:#f5f0fc;color:var(--primary);font-weight:600;border-radius:4px;padding:0 3px}
      .disp-page .disp-hl-empty{background:#fde8e6;color:var(--danger);font-weight:600;border-radius:4px;padding:0 4px;border:1px dashed #f0b8b1;font-size:12.5px}
      .disp-page .disp-actions{display:flex;gap:9px;margin-top:13px}
      .disp-page .disp-actions .btn{flex:1;justify-content:center}
      .disp-page .disp-copy-btn.done{background:var(--success);border-color:var(--success);color:#fff}
      .disp-page .disp-wa-btn{background:#25d366;border-color:#25d366;color:#fff}
      .disp-page .disp-wa-btn:hover{filter:brightness(1.05)}
      .disp-page .disp-results-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:12px}
      .disp-page .disp-results-head h3{font-size:15px;font-weight:600}
      .disp-page .disp-results-head .count{font-size:12px;color:var(--text-light)}
    </style>
    <div class="disp-page">
      <div class="card">
        <div class="card-header"><h3>💬 Disparador de Mensagens — Caderno de Scripts</h3></div>
        <p style="font-size:13px;color:var(--text-light);margin-bottom:14px;max-width:64ch">Preencha os dados uma vez, escolha a categoria e o dia/etapa. As mensagens e roteiros do caderno saem prontos — só copiar e usar.</p>
        <div class="form-grid">
          <div class="form-group"><label>Seu nome</label><input id="dpVendedor" placeholder="Ex: Diego" autocomplete="off"></div>
          <div class="form-group"><label>Sua empresa</label><input id="dpEmpresa" placeholder="SER Energia Renovável" autocomplete="off"></div>
          <div class="form-group full">
            <label>WhatsApp do cliente <span style="text-transform:none;letter-spacing:0">— opcional, p/ abrir direto na conversa</span></label>
            <input id="dpTelefone" inputmode="tel" placeholder="Ex: 91 98888-7777" autocomplete="off">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Cliente e contexto</h3></div>
        <div class="form-grid">
          <div class="form-group"><label>Nome do cliente</label><input id="dpCliente" placeholder="Ex: Dona Maria" autocomplete="off"></div>
          <div class="form-group"><label>Empresa do cliente — B2B</label><input id="dpClienteEmpresa" placeholder="Ex: Padaria do Zé" autocomplete="off"></div>
          <div class="form-group"><label>Valor da conta (R$/mês)</label><input id="dpValor" inputmode="decimal" placeholder="Ex: 380" autocomplete="off"></div>
          <div class="form-group">
            <label>Bandeira tarifária</label>
            <div style="display:flex;align-items:center;gap:8px">
              <span id="dpFlagdot" style="width:13px;height:13px;border-radius:4px;flex-shrink:0;display:inline-block"></span>
              <select id="dpBandeira" style="flex:1">
                <option value="verde">Verde</option>
                <option value="amarela">Amarela</option>
                <option value="vermelha" selected>Vermelha</option>
              </select>
            </div>
          </div>
          <div class="form-group full"><label>Mês atual</label><select id="dpMes"></select></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3>Escolha a mensagem</h3></div>
        <span class="disp-label">Categoria</span>
        <div class="disp-chips scroll" id="dpCatChips"></div>
        <div class="disp-divider"></div>
        <span class="disp-label" id="dpSubLabel">Dia da tentativa</span>
        <div class="disp-chips" id="dpSubChips"></div>
      </div>

      <div class="disp-ctxbar" id="dpCtxBar"></div>

      <div class="card">
        <div class="disp-results-head">
          <h3 id="dpResTitle">Mensagens</h3>
          <span class="count" id="dpResCount"></span>
        </div>
        <div id="dpResults"></div>
      </div>
    </div>
  `;

  // init
  g('dpMes').innerHTML = MESES_DISP.map(m=>`<option value="${m}">${m.charAt(0).toUpperCase()+m.slice(1)}</option>`).join('');
  g('dpMes').value = MESES_DISP[new Date().getMonth()];
  const cfg = loadCfg();
  g('dpVendedor').value = cfg.vendedor || State.user?.nome || '';
  g('dpEmpresa').value = cfg.empresa || 'SER Energia Renovável';
  g('dpTelefone').value = cfg.telefone || '';

  renderCats(); renderSub(); renderResults(); refreshDynamic();

  // eventos dos campos
  ['dpVendedor','dpEmpresa','dpTelefone','dpCliente','dpClienteEmpresa','dpValor','dpBandeira','dpMes'].forEach(id=>{
    g(id).addEventListener('input',()=>{ saveCfg(); refreshDynamic(); });
    g(id).addEventListener('change',()=>{ saveCfg(); refreshDynamic(); });
  });

  // eventos de chips/botões (escopados ao container desta tela)
  $('.disp-page').addEventListener('click', e=>{
    const t=e.target.closest('[data-dpcat],[data-dpsub],[data-dpcopy],[data-dpwa]');
    if(!t) return;
    if(t.dataset.dpcat!==undefined){ dpCatIdx=+t.dataset.dpcat; dpSubIdx=0; renderCats(); renderSub(); renderResults(); refreshDynamic(); return; }
    if(t.dataset.dpsub!==undefined){ dpSubIdx=+t.dataset.dpsub; renderSub(); renderResults(); refreshDynamic(); return; }
    if(t.dataset.dpcopy!==undefined){
      const grp=DISPARADOR_DATA[dpCatIdx].groups[dpSubIdx];
      copyTextDp(fillCopy(grp.opts[+t.dataset.dpcopy].m)).then(ok=>{
        if(ok){
          const orig=t.innerHTML;
          t.classList.add('done'); t.innerHTML='✓ Copiado';
          setTimeout(()=>{ t.classList.remove('done'); t.innerHTML=orig; },1400);
        }
      });
      return;
    }
    if(t.dataset.dpwa!==undefined){
      const grp=DISPARADOR_DATA[dpCatIdx].groups[dpSubIdx];
      window.open(waLinkDp(fillCopy(grp.opts[+t.dataset.dpwa].m)),'_blank');
      return;
    }
  });
}

/* ============================================================
   CLIENTES
   ============================================================ */
async function renderClientes(){
  await loadAll();

  const uid   = State.user?.id;
  const uNome = (State.profile?.nome||'').toLowerCase().trim();
  const role  = userRole();
  const isPriv = ['admin','supervisor'].includes(role);

  // Pipeline do mais avançado ao menos avançado
  const PIPELINE = [
    { key:'posvenda',     label:'Pós Venda',    icon:'⭐', cls:'cs-posvenda',    arr:()=>State.posvenda,     modal:'posvenda'    },
    { key:'homologacao',  label:'Homologação',  icon:'📋', cls:'cs-homologacao', arr:()=>State.homologacoes, modal:'homologacao'  },
    { key:'instalacao',   label:'Instalação',   icon:'🔧', cls:'cs-instalacao',  arr:()=>State.instalacoes,  modal:'instalacao'   },
    { key:'logistica',    label:'Logística',    icon:'📦', cls:'cs-logistica',   arr:()=>State.logistica,    modal:'logistica'    },
    { key:'contrato',     label:'Contrato',     icon:'✍️', cls:'cs-contrato',    arr:()=>State.contratos,    modal:'contrato'     },
    { key:'vistoria',     label:'Vistoria',     icon:'🔍', cls:'cs-vistoria',    arr:()=>State.vistorias,    modal:'vistoria'     },
    { key:'proposta',     label:'Proposta',     icon:'📄', cls:'cs-proposta',    arr:()=>State.propostas,    modal:'proposta'     },
    { key:'lead',         label:'Lead',         icon:'🎯', cls:'cs-lead',        arr:()=>State.leads,        modal:'lead'         },
  ];

  // Coleta clientes únicos pela etapa mais avançada
  const seen = new Map(); // normalizedName → client entry

  function userCanSee(it){
    if(isPriv) return true;
    if(it.criado_por && it.criado_por === uid) return true;
    const vend = (it.vendedor||'').toLowerCase().trim();
    const tec  = (it.tecnico||'').toLowerCase().trim();
    const resp = (it.responsavel||'').toLowerCase().trim();
    return vend === uNome || tec === uNome || resp === uNome;
  }

  PIPELINE.forEach(stage=>{
    (stage.arr()||[]).forEach(it=>{
      if(!it.nome) return;
      if(!userCanSee(it)) return;
      const key = it.nome.toLowerCase().trim();
      if(!seen.has(key)){
        seen.set(key, { ...it, _stage: stage });
      }
    });
  });

  const clients = [...seen.values()].sort((a,b)=>(a.nome||'').localeCompare(b.nome||'', 'pt'));

  function initials(nome){ return nome.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase(); }

  function renderList(list){
    if(!list.length) return `<div class="cli-empty">Nenhum cliente encontrado.</div>`;
    return list.map(c=>{
      const st = c._stage;
      const tel = c.telefone || '—';
      const cidade = c.cidade || '';
      const vend   = c.vendedor || c.responsavel || '';
      const status = c.status || c.etapa || c.resultado || '';
      return `
        <div class="cli-card" data-cli-modal="${st.modal}" data-cli-id="${c.id}">
          <div class="cli-avatar">${esc(initials(c.nome))}</div>
          <div class="cli-info">
            <div class="cli-name">${esc(c.nome)}</div>
            <div class="cli-sub">
              ${tel !== '—' ? `<span>📞 ${esc(tel)}</span>` : ''}
              ${cidade ? `<span>📍 ${esc(cidade)}</span>` : ''}
              ${vend   ? `<span>👤 ${esc(vend)}</span>`   : ''}
            </div>
          </div>
          <div class="cli-right">
            <span class="cli-stage ${st.cls}">${st.icon} ${st.label}</span>
            ${status ? `<span class="badge badge-${esc(status)}">${esc(status.replace(/_/g,' '))}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  $('#content').innerHTML = `
    <div class="cli-search-wrap">
      <input type="text" id="cliSearch" placeholder="Buscar por nome, telefone ou cidade..." autocomplete="off">
    </div>
    <div class="cli-count" id="cliCount">${clients.length} cliente${clients.length!==1?'s':''}</div>
    <div class="cli-list" id="cliList">${renderList(clients)}</div>
  `;

  // Search
  $('#cliSearch').addEventListener('input', e=>{
    const term = e.target.value.toLowerCase().trim();
    const filtered = term
      ? clients.filter(c =>
          (c.nome||'').toLowerCase().includes(term) ||
          (c.telefone||'').includes(term) ||
          (c.cidade||'').toLowerCase().includes(term) ||
          (c.vendedor||'').toLowerCase().includes(term)
        )
      : clients;
    $('#cliList').innerHTML  = renderList(filtered);
    $('#cliCount').textContent = `${filtered.length} cliente${filtered.length!==1?'s':''}${term?' encontrado'+( filtered.length!==1?'s':''):''}`;
    attachCliClick();
  });

  function attachCliClick(){
    $$('.cli-card').forEach(card=>{
      card.addEventListener('click', ()=>{
        const modal = card.dataset.cliModal;
        const id    = card.dataset.cliId;
        const find  = arr => (arr||[]).find(x=>String(x.id)===String(id));
        if(modal==='lead')        openLeadModal(find(State.leads));
        else if(modal==='proposta')    openPropostaModal(find(State.propostas));
        else if(modal==='vistoria')    openVistoriaModal(find(State.vistorias));
        else if(modal==='contrato')    openContratoModal(find(State.contratos));
        else if(modal==='logistica')   openLogisticaModal(find(State.logistica));
        else if(modal==='instalacao')  openInstalacaoModal(find(State.instalacoes));
        else if(modal==='homologacao') openHomologacaoModal(find(State.homologacoes));
        else if(modal==='posvenda')    openPosvendaModal(find(State.posvenda));
      });
    });
  }
  attachCliClick();
}

function openClientModalByNome(nome){
  if(!nome) return;
  const key = nome.toLowerCase().trim();
  const find = (arr, nomeFn) => (arr||[]).find(x=>(nomeFn(x)||'').toLowerCase().trim()===key);
  const n = x=>x.nome;
  // Pipeline do mais avançado ao menos avançado
  const pv  = find(State.posvenda,    n); if(pv)  return openPosvendaModal(pv);
  const hom = find(State.homologacoes,n); if(hom) return openHomologacaoModal(hom);
  const ins = find(State.instalacoes, n); if(ins) return openInstalacaoModal(ins);
  const log = find(State.logistica,   n); if(log) return openLogisticaModal(log);
  const con = find(State.contratos,   n); if(con) return openContratoModal(con);
  const vis = find(State.vistorias,   n); if(vis) return openVistoriaModal(vis);
  const pro = find(State.propostas,   n); if(pro) return openPropostaModal(pro);
  const lea = find(State.leads,       n); if(lea) return openLeadModal(lea);
}

