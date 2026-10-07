/* ============================================================
   LAUDO DE VISTORIA TÉCNICA HTML/PDF
   ============================================================ */
function abrirVistoriaJanela(v, imprimir=false){
  const _e = s => String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const txt = x => _e(x)||'—';
  const num = (x,d=0) => x!=null?Number(x).toFixed(d):'—';
  const dt  = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—';
  const bool= b => b?'Sim':'Não';
  const fmtMulti = (v,map) => { const arr=Array.isArray(v)?v:(v?[v]:[]); return arr.length?arr.map(x=>map[x]||x).join(', '):'—'; };
  const dp  = v.dados_padrao||{};
  const di  = v.dados_inversor||{};
  const de  = v.dados_estrutura||{};
  const win = window.open('','_blank');
  if(!win){ alert('Popup bloqueado. Permita popups para este site.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Laudo Vistoria — ${v.nome||''}</title>
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
/* resultado badge */
.result-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-weight:700;font-size:12px;letter-spacing:.04em}
.result-badge.aprovada{background:#d1e7dd;color:#0f5132}
.result-badge.reprovada{background:#f8d7da;color:#842029}
.result-badge.obra{background:#fde68a;color:#78350f}
/* ID box */
.id-box{background:#f5f0fc;border-left:4px solid #6B21A8;border-radius:6px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 16px;font-size:11.5px}
.id-box .lbl{font-weight:600;color:#4B0082;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
.id-box .val{color:#1a0a2e;margin-top:1px}
/* Sections */
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#4B0082;padding:5px 0 4px;border-bottom:1px solid #c4b5fd;margin:20px 0 10px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:10px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 16px;margin-bottom:10px}
.grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px 12px;margin-bottom:10px}
.item .lbl{font-size:9.5px;font-weight:600;color:#6b5f7a;text-transform:uppercase;letter-spacing:.04em}
.item .val{font-size:12px;color:#1a0a2e;margin-top:2px}
.item .val strong{color:#4B0082}
/* Kit table */
table.kit{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:11px}
table.kit th{background:#4B0082;color:#fff;padding:6px 8px;text-align:left;font-size:10px;letter-spacing:.04em;font-weight:700}
table.kit td{padding:6px 8px;border-bottom:1px solid #e9e2f5}
table.kit tr:nth-child(even) td{background:#faf7ff}
table.kit .hl{color:#4B0082;font-weight:700}
/* Resultado + parecer */
.result-row{display:flex;align-items:center;gap:12px;margin:10px 0}
.parecer-box{background:#f5f0fc;border-radius:6px;padding:12px 16px;font-size:12px;line-height:1.7;margin-top:8px;white-space:pre-wrap}
/* Alert box */
.alert{background:#fffbeb;border:1px solid #f59e0b;border-radius:6px;padding:10px 14px;margin:14px 0;font-size:11px;font-weight:600}
/* Galeria de fotos */
.foto-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px}
.foto-item{break-inside:avoid;page-break-inside:avoid}
.foto-item img{width:100%;height:150px;object-fit:cover;border-radius:6px;border:1px solid #ddd;display:block}
.foto-item .foto-lbl{font-size:9px;text-align:center;color:#6b5f7a;margin-top:4px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff;padding:0}.wrap{box-shadow:none;padding:24px 32px}.print-bar{display:none!important}.foto-grid{grid-template-columns:repeat(3,1fr);gap:8px}.foto-item img{height:120px}}
</style></head><body>
<div class="print-bar">
  <span>SER Energia — Laudo de Vistoria Técnica</span>
  <button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</div>
<div class="wrap">

<div class="doc-header">
  <img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/>
  <h1>Laudo de Vistoria Técnica</h1>
  <div class="sub">SER Energia Renovável · CNPJ 58.656.750/0001-04</div>
</div>
<hr class="rule"/>

<div class="id-box">
  <div><div class="lbl">Cliente</div><div class="val"><strong>${txt(v.nome)}</strong></div></div>
  <div><div class="lbl">Telefone</div><div class="val">${txt(v.telefone)}</div></div>
  <div><div class="lbl">Email</div><div class="val">${txt(v.email)}</div></div>
  <div><div class="lbl">Data Agendamento</div><div class="val">${dt(v.data_agendamento)}</div></div>
  <div><div class="lbl">Técnico</div><div class="val">${txt(v.tecnico)}</div></div>
  <div><div class="lbl">Vendedor</div><div class="val">${txt(v.vendedor)}</div></div>
  <div><div class="lbl">CEP</div><div class="val">${txt(v.cep)}</div></div>
  <div style="grid-column:span 2"><div class="lbl">Endereço</div><div class="val">${[v.rua,v.numero?'nº '+v.numero:'',v.complemento,v.bairro,v.cidade,v.estado].filter(Boolean).join(', ')||'—'}</div></div>
  ${v.gmap?`<div style="grid-column:span 3"><div class="lbl">Google Maps</div><div class="val"><a href="${v.gmap}" target="_blank" style="color:#4B0082">${v.gmap}</a></div></div>`:''}
</div>

<div class="result-row">
  <div class="item"><div class="lbl">Parecer Final</div></div>
  <span class="result-badge ${(()=>{const r=v.resultado||'';if(r.includes('obra')||r.includes('sombreamento'))return 'obra';if(r.startsWith('aprovad'))return 'aprovada';return 'reprovada';})()}">
    ${{aprovado:'✅ Aprovado',reprovado:'❌ Reprovado',aprovado_com_obra:'⚠️ Aprovado c/ Obra',aprovado_com_sombreamento:'⚠️ Aprovado c/ Sombreamento',aprovado_com_obra_e_sombreamento:'⚠️ Aprovado c/ Obra e Sombreamento',aprovada:'✅ Aprovada',reprovada:'❌ Reprovada',aprovada_com_obra:'⚠️ Aprovada c/ Obra',aprovada_com_sombreamento:'⚠️ Aprovada c/ Sombreamento',aprovada_com_obra_e_sombreamento:'⚠️ Aprovada c/ Obra e Sombreamento'}[v.resultado]||txt(v.resultado)}
  </span>
  <span style="font-size:11px;color:#555">Status: <strong>${txt(v.status)}</strong></span>
  <span style="font-size:11px;color:#555">Cliente presente: <strong>${bool(v.cliente_presente)}</strong></span>
</div>

<h2>📦 Kit Confirmado</h2>
<table class="kit">
  <thead><tr><th>ITEM</th><th>QTD.</th><th>MARCA</th><th>POTÊNCIA</th><th>kWp TOTAL</th></tr></thead>
  <tbody>
    <tr><td>Módulos Solares</td><td class="hl">${v.qtd_modulos||'—'} un.</td><td class="hl">${v.marca_modulo||'—'}</td><td>${v.pot_modulo||'—'} W</td><td rowspan="2" style="text-align:center;font-size:18px;font-weight:800;color:#4B0082;vertical-align:middle">${v.kwp||'—'}<br><span style="font-size:10px;font-weight:400">kWp</span></td></tr>
    <tr><td>Inversor</td><td class="hl">${v.qtd_inversores||'—'} un.</td><td class="hl">${v.marca_inversor||'—'}</td><td>${v.pot_inversor||'—'} kW</td></tr>
    ${v.qtd_baterias?`<tr><td>Baterias</td><td class="hl">${v.qtd_baterias} un.</td><td class="hl">${v.marca_bateria||'—'}</td><td>${v.pot_bateria||'—'} kWh</td><td>—</td></tr>`:''}
  </tbody>
</table>

<h2>⚡ 1. Dados do Padrão</h2>
<div class="grid3">
  <div class="item"><div class="lbl">Rede Atual</div><div class="val">${txt(dp.rede_atual)}</div></div>
  <div class="item"><div class="lbl">Aumento de Carga</div><div class="val">${bool(dp.aumento_carga)}</div></div>
  <div class="item"><div class="lbl">Cabo Linha</div><div class="val">${txt(dp.cabo_linha)}</div></div>
  <div class="item"><div class="lbl">Cabo Carga</div><div class="val">${txt(dp.cabo_carga)}</div></div>
  <div class="item"><div class="lbl">Dist. Padrão–Ancoragem</div><div class="val"><strong>${txt(dp.dist_padrao_ancoragem)}</strong></div></div>
  <div class="item"><div class="lbl">Dist. Ancoragem–Ramal</div><div class="val"><strong>${txt(dp.dist_ancoragem_ramal)}</strong></div></div>
  <div class="item"><div class="lbl">Localização do Padrão</div><div class="val">${txt(dp.localizacao_padrao)}</div></div>
  <div class="item"><div class="lbl">Caixa do Padrão</div><div class="val">${txt(dp.tipo_caixa)}</div></div>
  <div class="item"><div class="lbl">Disjuntor do Padrão</div><div class="val">${txt(dp.disjuntor)}</div></div>
  <div class="item"><div class="lbl">Eletroduto Carga (qtd)</div><div class="val">${txt(dp.qtd_eletroduto_carga)}</div></div>
  <div class="item"><div class="lbl">Curvas Carga (qtd)</div><div class="val">${txt(dp.qtd_curvas_carga)}</div></div>
  <div class="item"><div class="lbl">Eletroduto Linha (qtd)</div><div class="val">${txt(dp.qtd_eletroduto_linha)}</div></div>
  <div class="item"><div class="lbl">Curvas Linha (qtd)</div><div class="val">${txt(dp.qtd_curvas_linha)}</div></div>
  <div class="item"><div class="lbl">Poste Auxiliar</div><div class="val">${bool(dp.poste_auxiliar)}</div></div>
  ${dp.obs_padrao?`<div class="item" style="grid-column:span 3"><div class="lbl">Obs. Padrão</div><div class="val">${dp.obs_padrao}</div></div>`:''}
</div>

<h2>🔌 2. Dados do Inversor</h2>
<div class="grid3">
  <div class="item" style="grid-column:span 3"><div class="lbl">Local de Instalação do Inversor</div><div class="val"><strong>${txt(di.local_inversor)}</strong></div></div>
  ${di.local_cabo_cc?`<div class="item" style="grid-column:span 3"><div class="lbl">Local de Passagem do Cabo CC</div><div class="val">${di.local_cabo_cc}</div></div>`:''}
  <div class="item"><div class="lbl">CC — Eletroduto</div><div class="val"><strong>${txt(di.qtd_eletroduto_cc)}</strong></div></div>
  <div class="item"><div class="lbl">CC — Curvas</div><div class="val">${txt(di.qtd_curvas_cc)}</div></div>
  <div class="item"><div class="lbl">CC — Conduletes</div><div class="val">${txt(di.qtd_conduletes_cc)}</div></div>
  <div class="item"><div class="lbl">CA — Eletroduto</div><div class="val"><strong>${txt(di.qtd_eletroduto_ca)}</strong></div></div>
  <div class="item"><div class="lbl">CA — Curvas</div><div class="val">${txt(di.qtd_curvas_ca)}</div></div>
  <div class="item"><div class="lbl">AT — Eletroduto</div><div class="val"><strong>${txt(di.qtd_eletroduto_at)}</strong></div></div>
  <div class="item"><div class="lbl">AT — Curvas</div><div class="val">${txt(di.qtd_curvas_at)}</div></div>
  <div class="item"><div class="lbl">AT — Caixas Conduletes</div><div class="val">${txt(di.qtd_caixas_at)}</div></div>
  <div class="item"><div class="lbl">Flex. CC (m)</div><div class="val">${txt(di.metro_flex_cc)}</div></div>
  <div class="item"><div class="lbl">Cabo CC Mód→Inv (m)</div><div class="val">${txt(di.metro_cabo_cc)}</div></div>
  <div class="item"><div class="lbl">AT Mód→Inv (m)</div><div class="val">${txt(di.metro_at_mod_inv)}</div></div>
  <div class="item"><div class="lbl">AT Inv→Haste (m)</div><div class="val">${txt(di.metro_at_inv_haste)}</div></div>
  <div class="item" style="grid-column:span 3"><div class="lbl">Local do Aterramento</div><div class="val">${txt(di.local_aterramento)}</div></div>
  <div class="item"><div class="lbl">Flex. CA (m)</div><div class="val">${txt(di.metro_flex_ca)}</div></div>
  <div class="item"><div class="lbl">Cabo CA Inv→Conexão (m)</div><div class="val">${txt(di.metro_cabo_ca)}</div></div>
</div>

<h2>🏠 3. Dados da Estrutura</h2>
<div class="grid3">
  <div class="item"><div class="lbl">Tipo de Estrutura</div><div class="val"><strong>${fmtMulti(de.tipo_estrutura,{madeira:'Madeira',metalica:'Metálica',laje:'Laje',solo:'Solo'})}</strong></div></div>
  <div class="item"><div class="lbl">Tipo de Telha</div><div class="val"><strong>${fmtMulti(de.tipo_telha,{ceramica:'Cerâmica / Colonial',americana:'Americana',metalica:'Metálica / Trapezoidal',fibrocimento:'Fibrocimento',amianto:'Amianto',aluzinco:'Aluzinco',laje:'Laje',platibanda:'Platibanda',outro:'Outro'})}</strong></div></div>
  <div class="item"><div class="lbl">Módulos que Comporta</div><div class="val"><strong style="font-size:16px;color:#4B0082">${txt(de.modulos_comporta)}</strong></div></div>
  <div class="item"><div class="lbl">Estruturas Aptas</div><div class="val">${fmtMulti(de.estruturas_aptas,{nenhuma:'Nenhuma das águas',agua_01:'Água 01',agua_02:'Água 02',agua_03:'Água 03',agua_04:'Água 04',agua_05:'Água 05',agua_06:'Água 06',todas:'Todas as águas'})}</div></div>
  <div class="item"><div class="lbl">Estruturas c/ Obra</div><div class="val">${fmtMulti(de.estruturas_obra,{nao_ha:'Não há necessidade',agua_01:'Água 01',agua_02:'Água 02',agua_03:'Água 03',agua_04:'Água 04',agua_05:'Água 05',agua_06:'Água 06',todas:'Todas as águas'})}</div></div>
  <div class="item"><div class="lbl">Trocar Inv. (inclinação)</div><div class="val">${bool(de.trocar_inversor_inclinacao)}</div></div>
  <div class="item"><div class="lbl">Risco de Sombreamento</div><div class="val">${bool(de.risco_sombreamento)}</div></div>
  ${de.desc_obra?`<div class="item" style="grid-column:span 3"><div class="lbl">Descrição da Obra Necessária</div><div class="val" style="background:#fffbeb;padding:8px;border-radius:4px;border:1px solid #fbbf24"><strong>${de.desc_obra}</strong></div></div>`:''}
  ${de.obs_estrutura?`<div class="item" style="grid-column:span 3"><div class="lbl">Obs. Estrutura</div><div class="val">${de.obs_estrutura}</div></div>`:''}
</div>

${(()=>{const r=v.resultado||'';return (r.includes('obra')||r.includes('sombreamento'))?`
<div class="alert">⚠️ ATENÇÃO: Esta vistoria foi aprovada com ressalvas. Verifique a descrição de obras antes de iniciar a instalação.</div>`:''})()}
${['reprovado','reprovada'].includes(v.resultado||'')?`<div class="alert" style="background:#fee2e2;border-color:#ef4444">❌ VISTORIA REPROVADA — Instalação não autorizada. Verifique as pendências com a equipe técnica.</div>`:''}

${(()=>{
  const fotos = v.fotos || {};
  const entries = Object.entries(fotos).flatMap(([cat, files])=>
    (Array.isArray(files)?files:[]).filter(f=>f&&f.url&&/\.(jpe?g|png|gif|webp|bmp)(\?|$)/i.test(f.url))
      .map(f=>({cat: cat.replace(/_/g,' '), url: f.url, name: f.name||''}))
  );
  if(!entries.length) return '';
  return `<h2>📸 Registro Fotográfico</h2>
<div class="foto-grid">${entries.map(f=>`
  <div class="foto-item">
    <img src="${f.url}" alt="" />
    <div class="foto-lbl">${f.cat}</div>
  </div>`).join('')}
</div>`;
})()}

<div style="text-align:center;margin-top:28px;font-size:10px;color:#888;border-top:1px solid #ddd;padding-top:12px">
  SER Energia Renovável · CNPJ 58.656.750/0001-04 · Laudo gerado em ${new Date().toLocaleDateString('pt-BR')}
</div>
</div></body></html>`);
  win.document.close();
  if(imprimir) setTimeout(()=>{ win.focus(); win.print(); }, 600);
}

/* ============================================================
   GERADOR DE PROPOSTA HTML/PDF
   ============================================================ */
function abrirPropostaJanela(p, imprimir=false){
  const fR  = v => 'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2});
  const fRk = v => { const n=Number(v||0); return n>=1000?'R$ '+Math.round(n/1000)+'k':fR(n); };
  const _e = s => String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const txt = v => _e(v)||'—';
  const hoje    = new Date().toLocaleDateString('pt-BR');
  const valStr  = p.validade ? (() => {
    const d = new Date(p.validade+'T12:00:00');
    const diff = Math.round((d-new Date())/(1000*60*60*24));
    return diff > 0 ? `${diff} dias (até ${d.toLocaleDateString('pt-BR')})` : d.toLocaleDateString('pt-BR');
  })() : '7 dias';

  // economia projetada
  const eco   = Number(p.economia_mensal||0);
  const proj25= eco*300;
  const pct   = p.conta_sem_solar ? Math.round(eco/Number(p.conta_sem_solar)*100) : 85;
  const pctCom= 100 - pct;

  // retorno table
  const retornos = [
    ['1 ano',  eco*12],
    ['2 anos', eco*24],
    ['5 anos', eco*60],
    ['10 anos',eco*120],
    ['25 anos',eco*300],
  ];

  // barras mensais de geração (padrão sazonal Belém/PA)
  const base = Number(p.kwh||400);
  const fatores = [0.85,0.87,0.90,0.93,0.97,1.00,1.00,0.98,0.95,0.92,0.88,0.85];
  const meses   = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const geracoes = fatores.map(f=>Math.round(base*f));
  const maxG    = Math.max(...geracoes);

  // consultor inicial
  const inicial = (p.vendedor||'S').trim().charAt(0).toUpperCase();

  const win = window.open('','_blank');
  if(!win){ alert('Popup bloqueado. Permita popups para este site.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Proposta SER — ${p.nome||''}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f0eaf8;color:#111}
.print-bar{position:fixed;top:0;left:0;right:0;z-index:1000;background:#1a0a2e;padding:10px 24px;display:flex;justify-content:space-between;align-items:center}
.print-bar span{font-size:13px;color:#c4b5fd;font-weight:600}
.print-bar button{background:#6B21A8;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700}

/* ── PAGE BASE ── */
.page{max-width:794px;margin:0 auto 24px;background:#fff;position:relative;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.15)}

/* ── PAGE 1: CAPA ── */
.capa{background:linear-gradient(160deg,#0f0720 0%,#1a0a2e 40%,#2d1550 70%,#4B0082 100%);color:#fff;display:flex;flex-direction:column;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.capa-top{padding:20px 44px 0;display:flex;justify-content:space-between;align-items:flex-start}
.capa-logo img{height:56px}
.capa-badge{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:6px 16px;font-size:11px;color:#c4b5fd;letter-spacing:.06em}
.capa-hero{flex:1;display:flex;flex-direction:column;justify-content:flex-start;padding:14px 44px}
.capa-tag{font-size:11px;font-weight:700;letter-spacing:.18em;color:#a78bfa;text-transform:uppercase;margin-bottom:8px}
.capa-title{font-size:34px;font-weight:900;line-height:1.1;margin-bottom:4px}
.capa-title span{color:#c4b5fd}
.capa-kwp{font-size:60px;font-weight:900;color:#fff;line-height:1;margin:12px 0 6px}
.capa-kwp sup{font-size:24px;font-weight:700;color:#a78bfa;vertical-align:super}
.capa-para{font-size:12px;letter-spacing:.1em;color:#a78bfa;text-transform:uppercase;margin-bottom:6px}
.capa-client{font-size:28px;font-weight:800;color:#fff}
.capa-meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;border-top:1px solid rgba(255,255,255,.12);margin:8px 44px 0}
.capa-meta-item{padding:16px 20px;border-right:1px solid rgba(255,255,255,.12)}
.capa-meta-item:last-child{border-right:none}
.capa-meta-label{font-size:9px;font-weight:700;letter-spacing:.12em;color:#a78bfa;text-transform:uppercase;margin-bottom:4px}
.capa-meta-val{font-size:13px;font-weight:700;color:#fff}
.capa-eco{background:rgba(255,255,255,.06);border-top:1px solid rgba(255,255,255,.1);padding:14px 44px;display:flex;justify-content:space-between;align-items:center}
.capa-eco-label{font-size:10px;font-weight:700;letter-spacing:.12em;color:#a78bfa;text-transform:uppercase}
.capa-eco-val{font-size:30px;font-weight:900;color:#fff;line-height:1}
.capa-eco-sub{font-size:12px;color:#c4b5fd;margin-top:4px}
.capa-eco-proj{text-align:right}
.capa-eco-proj .big{font-size:22px;font-weight:800;color:#a78bfa}
.capa-footer{padding:10px 44px;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-between;align-items:center}
.capa-footer-left{font-size:10px;color:#a78bfa;line-height:1.6}
.capa-footer-right{font-size:10px;color:#a78bfa;text-align:right;line-height:1.6}

/* ── PAGE 2: RESUMO ── */
.page-inner{padding:20px 40px}
.sec-tag{font-size:9px;font-weight:700;letter-spacing:.15em;color:#6B21A8;text-transform:uppercase;margin-bottom:4px}
.sec-title{font-size:20px;font-weight:900;color:#1a0a2e;margin-bottom:10px}
.metric-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px}
.metric-card{border:1px solid #e9e2f5;border-radius:12px;padding:14px;text-align:center}
.metric-icon{font-size:28px;margin-bottom:8px}
.metric-val{font-size:32px;font-weight:900;color:#4B0082}
.metric-unit{font-size:13px;font-weight:600;color:#6b5f7a;margin-left:2px}
.metric-label{font-size:9px;font-weight:700;letter-spacing:.1em;color:#9ca3af;text-transform:uppercase;margin-top:4px}
.comp-title{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#1a0a2e;margin-bottom:14px}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
.comp-card{border-radius:12px;padding:14px}
.comp-card.red{background:#fef2f2;border:1px solid #fecaca}
.comp-card.green{background:#f0fdf4;border:1px solid #bbf7d0}
.comp-card-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.comp-card.red .comp-card-label{color:#b91c1c}
.comp-card.green .comp-card-label{color:#15803d}
.comp-val{font-size:28px;font-weight:900}
.comp-card.red .comp-val{color:#dc2626}
.comp-card.green .comp-val{color:#16a34a}
.comp-sub{font-size:11px;color:#6b7280;margin-top:4px}
.eco-highlight{background:linear-gradient(135deg,#4B0082,#6B21A8);border-radius:12px;padding:14px 20px;color:#fff;display:flex;justify-content:space-between;align-items:center}
.eco-hl-left .label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#c4b5fd;margin-bottom:6px}
.eco-hl-left .val{font-size:36px;font-weight:900}
.eco-hl-right{text-align:right}
.eco-hl-right .pct{font-size:40px;font-weight:900;color:#a78bfa}
.eco-hl-right .sub{font-size:11px;color:#c4b5fd;margin-top:2px}

/* ── PAGE 3: PROJEÇÃO ── */
.chart-wrap{margin-bottom:28px}
.chart-bars{display:grid;grid-template-columns:repeat(12,1fr);gap:6px;height:110px;align-items:flex-end;margin-bottom:6px}
.bar-col{display:flex;flex-direction:column;align-items:center;gap:4px}
.bar-fill{background:linear-gradient(180deg,#6B21A8,#4B0082);border-radius:4px 4px 0 0;width:100%;transition:height .3s}
.bar-val{font-size:8px;color:#6b5f7a;font-weight:600}
.bar-label{font-size:9px;color:#9ca3af;font-weight:600}
.retorno-table{width:100%;border-collapse:collapse}
.retorno-table th{background:#1a0a2e;color:#fff;padding:10px 16px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;text-align:left}
.retorno-table td{padding:8px 16px;font-size:13px;border-bottom:1px solid #f0eaf8}
.retorno-table tr:last-child td{border:none;font-weight:700;color:#4B0082;font-size:15px}
.retorno-table .periodo{color:#6b5f7a;font-size:12px}
.retorno-table .eco{font-weight:700;color:#16a34a}
.nota{font-size:9.5px;color:#9ca3af;margin-top:10px;line-height:1.6;font-style:italic}

/* ── PAGE 4: EQUIPAMENTOS ── */
.kit-header{font-size:13px;font-weight:700;color:#1a0a2e;margin-bottom:16px}
.kit-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
${p.qtd_baterias?'.kit-cards{grid-template-columns:1fr 1fr 1fr}':''}
.kit-card{border:2px solid #e9e2f5;border-radius:14px;padding:16px;text-align:center;position:relative}
.kit-card.inv{border-color:#4B0082}
.kit-card-icon{font-size:36px;margin-bottom:10px}
.kit-card-qtd{position:absolute;top:12px;right:12px;background:#4B0082;color:#fff;font-size:11px;font-weight:700;border-radius:20px;padding:2px 10px}
.kit-card-brand{font-size:14px;font-weight:800;color:#1a0a2e;margin-bottom:2px}
.kit-card-type{font-size:11px;color:#6b5f7a;margin-bottom:8px}
.kit-card-pot{font-size:24px;font-weight:900;color:#4B0082}
.kit-card-pot span{font-size:13px;font-weight:600;color:#9ca3af}
.kit-card-opt{font-size:10px;color:#f59e0b;font-weight:700;margin-top:6px}
.disclaimer{background:#f9f5ff;border-left:3px solid #6B21A8;border-radius:0 8px 8px 0;padding:14px 16px;font-size:10.5px;color:#6b5f7a;line-height:1.7;font-style:italic;margin-top:8px}

/* ── PAGE 5: INVESTIMENTO ── */
.invest-wrap{display:flex;flex-direction:column;align-items:center;padding:0}
.invest-label{font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#6B21A8;margin-bottom:12px}
.invest-val{font-size:52px;font-weight:900;color:#1a0a2e;line-height:1}
.invest-sub{font-size:12px;color:#9ca3af;margin-top:10px;text-align:center;max-width:380px;line-height:1.6}

/* ── PAGE 6: SOBRE ── */
.missao-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
.missao-card{background:#f9f5ff;border-radius:12px;padding:14px}
.missao-card h4{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6B21A8;margin-bottom:8px}
.missao-card p{font-size:12px;color:#374151;line-height:1.7}
.ser-title{font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#1a0a2e;margin-bottom:16px}
.ser-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.ser-card{border-top:4px solid #6B21A8;padding:14px 12px}
.ser-letter{font-size:48px;font-weight:900;color:#4B0082;line-height:1;margin-bottom:6px}
.ser-word{font-size:14px;font-weight:800;color:#1a0a2e;margin-bottom:8px}
.ser-text{font-size:11px;color:#6b7280;line-height:1.6}

/* ── PAGE 7: CONTATO ── */
.contact-wrap{display:flex;flex-direction:column;align-items:center;padding:0;text-align:center}
.contact-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#4B0082,#6B21A8);color:#fff;font-size:34px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
.contact-name{font-size:24px;font-weight:900;color:#1a0a2e;margin-bottom:4px}
.contact-role{font-size:12px;color:#6B21A8;font-weight:600;margin-bottom:12px}
.contact-site{font-size:13px;color:#4B0082;margin-bottom:24px}
.contact-divider{width:60px;height:3px;background:#6B21A8;margin:0 auto 12px;border-radius:2px}
.contact-company{font-size:11px;color:#6b7280;line-height:1.8}
.contact-validity{margin-top:12px;background:#f9f5ff;border-radius:8px;padding:10px 20px;font-size:11px;color:#6B21A8;font-weight:600}

/* ── PAGE HEADER ── */
.pg-header{background:#1a0a2e;padding:14px 44px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg-header img{height:36px}
.pg-header-right{font-size:10px;color:#a78bfa;text-align:right;line-height:1.5}

@page{size:A4 portrait;margin:0}
@media print{
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  html,body{margin:0;padding:0;background:#fff}
  .print-bar{display:none!important}

  /* ── BASE: páginas em fluxo normal ── */
  .page{
    width:210mm;
    height:auto;
    max-width:210mm;
    margin:0;
    box-shadow:none;
    overflow:visible;
    display:block;
    page-break-after:always;
    break-after:page;
    position:static
  }
  .page:last-child{page-break-after:auto;break-after:auto}

  /* ── PÁGINA 1 — CAPA: gradiente preenche 297mm completos ── */
  body>.page:nth-child(2){
    height:297mm;
    min-height:297mm;
    max-height:297mm;
    position:relative;
    overflow:hidden;
    page-break-inside:avoid;
    break-inside:avoid;
    page-break-after:always;
    break-after:page
  }
  body>.page:nth-child(2) .capa{
    position:absolute;
    top:0;left:0;right:0;bottom:0;
    height:297mm;
    min-height:297mm;
    width:100%;
    overflow:hidden;
    page-break-inside:avoid;
    break-inside:avoid;
    display:flex;
    flex-direction:column
  }
  body>.page:nth-child(2) .capa-hero{
    flex:1;
    min-height:0;
    display:flex;
    flex-direction:column;
    justify-content:center;
    padding:20px 44px
  }

  /* ── FUSÃO: Resumo + Projeção → 45%+52%=97% → 1 folha ── */
  body>.page:nth-child(3){page-break-after:auto!important;break-after:auto!important}
  body>.page:nth-child(4)>.pg-header{display:none!important}

  /* ── FUSÃO: Equipamentos + Investimento → 37%+58%=95% → 1 folha ── */
  body>.page:nth-child(5){page-break-after:auto!important;break-after:auto!important}
  body>.page:nth-child(6)>.pg-header{display:none!important}

  /* ── Investimento (sem header, flui após Equipamentos) ── */
  .invest-wrap{
    position:static!important;
    height:auto!important;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:flex-start;
    text-align:center;
    padding:32px 40px
  }
  .invest-label{font-size:12px;margin-bottom:14px}
  .invest-val{font-size:56px}

  /* ── FUSÃO: Sobre + Contato → 1 folha ── */
  body>.page:nth-child(7){page-break-after:auto!important;break-after:auto!important}
  body>.page:nth-child(8)>.pg-header{display:none!important}

  /* Trajetória oculta: espaço cedido ao contato */
  body>.page:nth-child(7) .trajetoria-block{display:none!important}

  /* ── Sobre compacto para dividir folha com contato ── */
  body>.page:nth-child(7) .page-inner{padding:14px 44px 8px}
  body>.page:nth-child(7) .sec-title{font-size:20px;margin-bottom:10px}
  body>.page:nth-child(7) .missao-grid{gap:10px;margin-bottom:12px}
  body>.page:nth-child(7) .missao-card{padding:12px 14px}
  body>.page:nth-child(7) .missao-card p{font-size:11.5px;line-height:1.6}
  body>.page:nth-child(7) .ser-title{margin-bottom:10px}
  body>.page:nth-child(7) .ser-grid{gap:10px;margin-top:0}
  body>.page:nth-child(7) .ser-card{padding:12px 10px;border-top-width:4px}
  body>.page:nth-child(7) .ser-letter{font-size:52px;margin-bottom:4px}
  body>.page:nth-child(7) .ser-word{font-size:13px;margin-bottom:4px}
  body>.page:nth-child(7) .ser-text{font-size:10.5px;line-height:1.55}

  /* ── Contato compacto: dados do vendedor abaixo do quem somos ── */
  .contact-wrap{
    position:static!important;
    height:auto!important;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:flex-start;
    text-align:center;
    padding:10px 40px 14px
  }
  .contact-avatar{width:60px!important;height:60px!important;font-size:22px!important;margin-bottom:8px!important}
  .contact-name{font-size:18px!important;margin-bottom:3px!important}
  .contact-role{font-size:11px!important;margin-bottom:8px!important}
  .contact-site{font-size:12px!important;margin-bottom:12px!important}
  .contact-divider{margin:6px auto!important}
  .contact-company{font-size:10px!important;line-height:1.6!important}
  .contact-validity{margin-top:8px!important;padding:8px 16px!important;font-size:10px!important}
}
</style></head><body>
<div class="print-bar">
  <span>SER Energia Renovável — Proposta Comercial</span>
  <button id="btnPDF" onclick="gerarPDF()">🖨️ Baixar PDF</button>
</div>

<!-- ══════════════════ PÁGINA 1: CAPA ══════════════════ -->
<div class="page">
<div class="capa">
  <div class="capa-top">
    <div class="capa-logo"><img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/></div>
    <div class="capa-badge">PROPOSTA COMERCIAL · SISTEMA FOTOVOLTAICO</div>
  </div>
  <div class="capa-hero">
    <div class="capa-tag">ENERGIA SOLAR</div>
    <div class="capa-title">SISTEMA<br><span>FOTOVOLTAICO</span></div>
    <div class="capa-kwp">${p.kwp||'—'}<sup>kWp</sup></div>
    <div style="font-size:13px;color:#a78bfa;margin-bottom:2px">de potência instalada</div>
    <div style="height:1px;background:rgba(255,255,255,.1);margin:10px 0"></div>
    <div class="capa-para">PROPOSTA PARA</div>
    <div class="capa-client">${txt(p.nome).toUpperCase()}</div>
  </div>
  <div class="capa-meta">
    <div class="capa-meta-item"><div class="capa-meta-label">DATA</div><div class="capa-meta-val">${hoje}</div></div>
    <div class="capa-meta-item"><div class="capa-meta-label">VALIDADE</div><div class="capa-meta-val">${valStr}</div></div>
    <div class="capa-meta-item"><div class="capa-meta-label">CONSUMO</div><div class="capa-meta-val">${p.kwh||'—'} kWh/mês</div></div>
  </div>
  <div class="capa-eco">
    <div>
      <div class="capa-eco-label">ECONOMIA ESTIMADA</div>
      <div class="capa-eco-val">${fR(p.economia_mensal)}</div>
      <div class="capa-eco-sub">/mês · SER Energia Renovável</div>
    </div>
    <div class="capa-eco-proj">
      <div class="big">${fRk(proj25)} projetados em 25 anos</div>
      <div style="font-size:10px;color:#a78bfa;margin-top:4px">Belém · Pará · Brasil</div>
    </div>
  </div>
  <div class="capa-footer">
    <div class="capa-footer-left">CNPJ 58.656.750/0001-04<br>Travessa Antônio Baena, 300 · Marco · Belém/PA</div>
    <div class="capa-footer-right">${txt(p.vendedor)}<br>${p.vend_telefone||''}</div>
  </div>
</div>
</div>

<!-- ══════════════════ PÁGINA 2: RESUMO ══════════════════ -->
<div class="page">
<div class="pg-header"><img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/><div class="pg-header-right">PROPOSTA COMERCIAL<br>${txt(p.nome)}</div></div>
<div class="page-inner">
  <div class="sec-tag">RESUMO DO PROJETO</div>
  <div class="sec-title">Seus números em destaque</div>
  <div class="metric-row">
    <div class="metric-card"><div class="metric-icon">⚡</div><div><span class="metric-val">${p.kwp||'—'}</span><span class="metric-unit">kWp</span></div><div class="metric-label">POTÊNCIA INSTALADA</div></div>
    <div class="metric-card"><div class="metric-icon">☀️</div><div><span class="metric-val">${p.kwh||'—'}</span><span class="metric-unit">kWh/mês</span></div><div class="metric-label">GERAÇÃO ESTIMADA</div></div>
    <div class="metric-card"><div class="metric-icon">📐</div><div><span class="metric-val">${p.area_minima||'—'}</span><span class="metric-unit">m²</span></div><div class="metric-label">ÁREA MÍNIMA</div></div>
  </div>
  ${(p.conta_sem_solar||p.conta_com_solar||p.economia_mensal)?`
  <div class="comp-title">COMPARATIVO DE CUSTOS</div>
  <div class="comp-grid">
    <div class="comp-card red">
      <div class="comp-card-label">SEM ENERGIA SOLAR</div>
      <div class="comp-val">${fR(p.conta_sem_solar)}</div>
      <div class="comp-sub">por mês na conta de luz</div>
    </div>
    <div class="comp-card green">
      <div class="comp-card-label">COM ENERGIA SOLAR</div>
      <div class="comp-val">${fR(p.conta_com_solar)}</div>
      <div class="comp-sub">apenas ${pctCom}% da conta atual</div>
    </div>
  </div>
  <div class="eco-highlight">
    <div class="eco-hl-left">
      <div class="label">SUA ECONOMIA MENSAL SERÁ DE</div>
      <div class="val">${fR(p.economia_mensal)}</div>
      <div style="font-size:11px;color:#c4b5fd;margin-top:6px">${pct}% a menos na conta de energia · Todo mês · Por 25+ anos</div>
    </div>
    <div class="eco-hl-right">
      <div class="pct">${pct}%</div>
      <div class="sub">de economia</div>
    </div>
  </div>`:''}
</div>
</div>

<!-- ══════════════════ PÁGINA 3: PROJEÇÃO ══════════════════ -->
<div class="page">
<div class="pg-header"><img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/><div class="pg-header-right">PROJEÇÃO DE GERAÇÃO<br>${txt(p.nome)}</div></div>
<div class="page-inner">
  <div class="sec-tag">PROJEÇÃO DE GERAÇÃO</div>
  <div class="sec-title">Geração estimada ao longo do ano</div>
  <div class="chart-wrap">
    <div style="font-size:10px;font-weight:700;color:#6b5f7a;letter-spacing:.08em;text-transform:uppercase;margin-bottom:12px">ENERGIA GERADA MENSALMENTE (kWh)</div>
    <div class="chart-bars">
      ${geracoes.map((g,i)=>`<div class="bar-col"><div class="bar-val">${g}</div><div class="bar-fill" style="height:${Math.round(g/maxG*120)}px"></div><div class="bar-label">${meses[i]}</div></div>`).join('')}
    </div>
    <p class="nota">* Estimativa baseada no consumo informado. Valores podem variar conforme inclinação, orientação do telhado e condições climáticas locais.</p>
  </div>
  ${eco>0?`
  <div class="sec-tag" style="margin-top:8px">RETORNO DO INVESTIMENTO</div>
  <div class="sec-title">Quanto você vai economizar?</div>
  <table class="retorno-table">
    <thead><tr><th>PERÍODO</th><th>ECONOMIA ACUMULADA</th></tr></thead>
    <tbody>
      ${retornos.map(([per,val],i)=>`<tr><td class="periodo">${per}</td><td class="eco">${fR(val)}</td></tr>`).join('')}
    </tbody>
  </table>
  <p class="nota">* Projeção baseada em economia mensal de ${fR(eco)} com correção linear. Valores reais podem variar.</p>`:''}
</div>
</div>

<!-- ══════════════════ PÁGINA 4: EQUIPAMENTOS ══════════════════ -->
<div class="page">
<div class="pg-header"><img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/><div class="pg-header-right">EQUIPAMENTOS<br>${txt(p.nome)}</div></div>
<div class="page-inner">
  <div class="sec-tag">EQUIPAMENTOS</div>
  <div class="sec-title">Descrição detalhada do kit</div>
  <div class="kit-header">01 Kit Fotovoltaico de potência ${p.kwp||'—'} kWp</div>
  <div class="kit-cards">
    <div class="kit-card inv">
      <div class="kit-card-qtd">${p.qtd_inversores||'1'}x</div>
      <div class="kit-card-icon">⚡</div>
      <div class="kit-card-brand">${p.marca_inversor||'—'}</div>
      <div class="kit-card-type">Inversor · ${p.pot_inversor||'—'} kW${p.fase?' · '+p.fase:''}${p.tensao?' · '+p.tensao+'V':''}</div>
      <div class="kit-card-pot">${p.pot_inversor||'—'}<span> kW</span></div>
    </div>
    <div class="kit-card">
      <div class="kit-card-qtd">${p.qtd_modulos||'—'}x</div>
      <div class="kit-card-icon">🔆</div>
      <div class="kit-card-brand">${p.marca_modulo||'—'}</div>
      <div class="kit-card-type">Módulos · ${p.pot_modulo||'—'} W cada</div>
      <div class="kit-card-pot">${p.pot_modulo||'—'}<span> W</span></div>
    </div>
    ${p.qtd_baterias?`<div class="kit-card">
      <div class="kit-card-qtd">${p.qtd_baterias}x</div>
      <div class="kit-card-icon">🔋</div>
      <div class="kit-card-brand">${p.marca_bateria||'—'}</div>
      <div class="kit-card-type">Bateria · ${p.pot_bateria||'—'} kWh</div>
      <div class="kit-card-pot">${p.pot_bateria||'—'}<span> kWh</span></div>
    </div>`:''}
  </div>
  <div class="disclaimer">"Para o correto dimensionamento e precificação do seu projeto é fundamental a nossa visita técnica. Uma vez que a face e a inclinação do telhado podem alterar a geração de energia do sistema fotovoltaico. Na visita avaliaremos também as condições da estrutura física e elétrica. É possível que sejam necessárias adequações para a sua segurança e acarrete homologação do sistema junto à concessionária de Energia."</div>
</div>
</div>

<!-- ══════════════════ PÁGINA 5: INVESTIMENTO ══════════════════ -->
<div class="page">
<div class="pg-header"><img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/><div class="pg-header-right">INVESTIMENTO<br>${txt(p.nome)}</div></div>
<div class="page-inner invest-wrap">
  <div class="invest-label">INVESTIMENTO TOTAL</div>
  <div class="invest-val">${fR(p.valor)}</div>
  <div class="invest-sub">Simulação sujeita a análise de crédito conforme a instituição financeira escolhida</div>
  ${(p.forma_pgto||p.pgto_desc||p.banco)?`
  <div style="margin-top:20px;background:#f9f5ff;border-radius:12px;padding:14px 28px;text-align:center;max-width:400px">
    <div style="font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#6B21A8;margin-bottom:6px">FORMA DE PAGAMENTO</div>
    <div style="font-size:15px;font-weight:700;color:#1a0a2e">${p.forma_pgto||''}</div>
    ${p.banco?`<div style="font-size:12px;color:#6b7280;margin-top:4px">${p.banco}</div>`:''}
    ${p.pgto_desc?`<div style="font-size:12px;color:#6b7280;margin-top:4px">${p.pgto_desc}</div>`:''}
  </div>`:''}

  <div style="margin-top:24px;width:100%;max-width:500px">
    <div style="font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#6B21A8;margin-bottom:14px;text-align:center">O QUE ESTÁ INCLUÍDO</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 28px;text-align:left">
      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#374151">
        <span style="color:#6B21A8;font-weight:900;font-size:15px;line-height:1.1;flex-shrink:0">✓</span>
        <span><strong style="color:#1a0a2e;display:block;margin-bottom:1px">Projeto e homologação</strong>junto à concessionária</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#374151">
        <span style="color:#6B21A8;font-weight:900;font-size:15px;line-height:1.1;flex-shrink:0">✓</span>
        <span><strong style="color:#1a0a2e;display:block;margin-bottom:1px">Instalação completa</strong>por equipe certificada</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#374151">
        <span style="color:#6B21A8;font-weight:900;font-size:15px;line-height:1.1;flex-shrink:0">✓</span>
        <span><strong style="color:#1a0a2e;display:block;margin-bottom:1px">Equipamentos premium</strong>com nota fiscal</span>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:#374151">
        <span style="color:#6B21A8;font-weight:900;font-size:15px;line-height:1.1;flex-shrink:0">✓</span>
        <span><strong style="color:#1a0a2e;display:block;margin-bottom:1px">ART e documentação</strong>técnica completa</span>
      </div>
    </div>
  </div>

  <div style="margin-top:20px;display:flex;gap:12px;justify-content:center;width:100%;max-width:500px">
    <div style="border:2px solid #e9e2f5;border-radius:12px;padding:12px 16px;text-align:center;flex:1">
      <div style="font-size:20px;margin-bottom:4px">⚡</div>
      <div style="font-size:11px;font-weight:800;color:#4B0082">ÁGIL</div>
      <div style="font-size:9px;color:#6b7280;margin-top:2px">Homologação rápida</div>
    </div>
    <div style="border:2px solid #e9e2f5;border-radius:12px;padding:12px 16px;text-align:center;flex:1">
      <div style="font-size:20px;margin-bottom:4px">⚡</div>
      <div style="font-size:11px;font-weight:800;color:#4B0082">25 ANOS</div>
      <div style="font-size:9px;color:#6b7280;margin-top:2px">Vida útil estimada</div>
    </div>
    <div style="border:2px solid #e9e2f5;border-radius:12px;padding:12px 16px;text-align:center;flex:1">
      <div style="font-size:20px;margin-bottom:4px">📋</div>
      <div style="font-size:11px;font-weight:800;color:#4B0082">ART</div>
      <div style="font-size:9px;color:#6b7280;margin-top:2px">Responsabilidade técnica</div>
    </div>
  </div>
</div>
</div>

<!-- ══════════════════ PÁGINA 6: SOBRE A EMPRESA ══════════════════ -->
<div class="page">
<div class="pg-header"><img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/><div class="pg-header-right">SOBRE A EMPRESA<br>Quem somos</div></div>
<div class="page-inner">
  <div class="sec-tag">SOBRE A EMPRESA</div>
  <div class="sec-title">Quem somos</div>
  <div class="missao-grid">
    <div class="missao-card">
      <h4>🎯 Missão</h4>
      <p>Tornar a energia limpa e renovável um direito, e não um privilégio.</p>
    </div>
    <div class="missao-card">
      <h4>🔭 Visão</h4>
      <p>Ser o principal ecossistema de soluções em energia renovável do Pará, impulsionando a transição energética no Brasil.</p>
    </div>
  </div>
  <div class="ser-title">VALORES S.E.R.</div>
  <div class="ser-grid">
    <div class="ser-card">
      <div class="ser-letter">S</div>
      <div class="ser-word">SEGURANÇA</div>
      <div class="ser-text">Atuamos com responsabilidade, excelência técnica e total transparência, garantindo tranquilidade em cada etapa — do projeto à geração de energia.</div>
    </div>
    <div class="ser-card">
      <div class="ser-letter">E</div>
      <div class="ser-word">ECONOMIA</div>
      <div class="ser-text">Geramos valor real. Oferecemos soluções acessíveis, eficientes e duradouras, promovendo economia imediata e ganhos contínuos ao longo dos anos.</div>
    </div>
    <div class="ser-card">
      <div class="ser-letter">R</div>
      <div class="ser-word">RAPIDEZ</div>
      <div class="ser-text">Somos ágeis, precisos e comprometidos com a melhor experiência. Entregamos, homologamos e resolvemos com velocidade, sem perder qualidade.</div>
    </div>
  </div>

  <!-- NOSSA TRAJETÓRIA -->
  <div class="trajetoria-block" style="margin-top:24px;border-top:1px solid #e9e2f5;padding-top:22px">
    <div style="font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#1a0a2e;margin-bottom:14px">NOSSA TRAJETÓRIA</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px">
      <div style="text-align:center;background:linear-gradient(135deg,#f9f5ff,#f0eaf8);border-radius:12px;padding:16px 10px;border:1px solid #e9e2f5">
        <div style="font-size:28px;font-weight:900;color:#4B0082;line-height:1">+500</div>
        <div style="font-size:9px;font-weight:600;color:#6b7280;margin-top:6px;text-transform:uppercase;letter-spacing:.06em">Clientes atendidos</div>
      </div>
      <div style="text-align:center;background:linear-gradient(135deg,#f9f5ff,#f0eaf8);border-radius:12px;padding:16px 10px;border:1px solid #e9e2f5">
        <div style="font-size:28px;font-weight:900;color:#4B0082;line-height:1">+5 MW</div>
        <div style="font-size:9px;font-weight:600;color:#6b7280;margin-top:6px;text-transform:uppercase;letter-spacing:.06em">Potência instalada</div>
      </div>
      <div style="text-align:center;background:linear-gradient(135deg,#f9f5ff,#f0eaf8);border-radius:12px;padding:16px 10px;border:1px solid #e9e2f5">
        <div style="font-size:28px;font-weight:900;color:#4B0082;line-height:1">15</div>
        <div style="font-size:9px;font-weight:600;color:#6b7280;margin-top:6px;text-transform:uppercase;letter-spacing:.06em">Dias até instalar</div>
      </div>
      <div style="text-align:center;background:linear-gradient(135deg,#f9f5ff,#f0eaf8);border-radius:12px;padding:16px 10px;border:1px solid #e9e2f5">
        <div style="font-size:28px;font-weight:900;color:#4B0082;line-height:1">98%</div>
        <div style="font-size:9px;font-weight:600;color:#6b7280;margin-top:6px;text-transform:uppercase;letter-spacing:.06em">Satisfação dos clientes</div>
      </div>
    </div>
  </div>
</div>
</div>

<!-- ══════════════════ PÁGINA 7: CONTATO ══════════════════ -->
<div class="page">
<div class="pg-header"><img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/><div class="pg-header-right">CONTATO<br>Seu consultor de energia</div></div>
<div class="page-inner contact-wrap">
  <div class="contact-avatar">${inicial}</div>
  <div class="contact-name">${txt(p.vendedor).toUpperCase()}</div>
  <div class="contact-role">Consultor de Energia Renovável · SER Energia Renovável</div>
  ${p.vend_telefone?`<div style="font-size:13px;color:#4B0082;margin-bottom:8px">📱 ${p.vend_telefone}</div>`:''}
  ${p.vend_email?`<div style="font-size:13px;color:#4B0082;margin-bottom:8px">📧 ${p.vend_email}</div>`:''}
  <div class="contact-site">🌐 www.serenergiarenovavel.com.br</div>
  <div class="contact-divider"></div>
  <div class="contact-company">
    SOLUÇÕES EM ENERGIA RENOVÁVEL MATRIZ LTDA · CNPJ 58.656.750/0001-04<br>
    Travessa Antônio Baena, 300 · Bairro Marco · CEP 66.093-635 · Belém/PA
  </div>
  <div class="contact-validity">Esta proposta é válida por ${valStr} a partir da data de emissão e está sujeita a visita técnica.</div>
  <div style="margin-top:28px;width:100%;max-width:520px">
    <div style="font-size:9px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#6B21A8;margin-bottom:16px;text-align:center">PRÓXIMOS PASSOS</div>
    <div style="display:flex;gap:12px;justify-content:center">
      <div style="text-align:center;flex:1">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4B0082,#6B21A8);color:#fff;font-size:20px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">1</div>
        <div style="font-size:11px;font-weight:800;color:#1a0a2e;margin-bottom:4px">Visita Técnica</div>
        <div style="font-size:10px;color:#6b7280;line-height:1.5">Agendamos a vistoria para validar o projeto</div>
      </div>
      <div style="text-align:center;flex:1">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4B0082,#6B21A8);color:#fff;font-size:20px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">2</div>
        <div style="font-size:11px;font-weight:800;color:#1a0a2e;margin-bottom:4px">Contrato</div>
        <div style="font-size:10px;color:#6b7280;line-height:1.5">Assinatura e aprovação do projeto</div>
      </div>
      <div style="text-align:center;flex:1">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4B0082,#6B21A8);color:#fff;font-size:20px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">3</div>
        <div style="font-size:11px;font-weight:800;color:#1a0a2e;margin-bottom:4px">Instalação</div>
        <div style="font-size:10px;color:#6b7280;line-height:1.5">Equipe instala em até 30 dias úteis</div>
      </div>
      <div style="text-align:center;flex:1">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#4B0082,#6B21A8);color:#fff;font-size:20px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px">4</div>
        <div style="font-size:11px;font-weight:800;color:#1a0a2e;margin-bottom:4px">Homologação</div>
        <div style="font-size:10px;color:#6b7280;line-height:1.5">Aprovação na concessionária e ativação</div>
      </div>
    </div>
  </div>
</div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<script>
async function gerarPDF(){
  const btn = document.getElementById('btnPDF');
  btn.disabled = true; btn.textContent = '⏳ Aguarde...';

  /* ── 1. Injetar CSS (mesma lógica de fusão do @media print, mas ativa p/ html2canvas) ── */
  const s = document.createElement('style');
  s.id = '__pdfcap';
  s.textContent = \`
    .print-bar{display:none!important}
    body{width:794px!important;overflow:visible!important;background:#fff!important}
    .page{
      width:794px!important;max-width:794px!important;min-width:794px!important;
      height:auto!important;margin:0!important;box-shadow:none!important;
      overflow:visible!important;position:static!important;display:block!important;
    }
    .__pdf-capa{height:1123px!important;min-height:1123px!important;max-height:1123px!important;overflow:hidden!important;position:relative!important}
    .__pdf-capa .capa{
      position:absolute!important;top:0;left:0;right:0;bottom:0;
      height:1123px!important;width:100%!important;overflow:hidden!important;
      display:flex!important;flex-direction:column!important;
    }
    .__pdf-capa .capa-hero{
      flex:1!important;min-height:0!important;display:flex!important;
      flex-direction:column!important;justify-content:center!important;padding:20px 44px!important;
    }
    .invest-wrap{position:static!important;height:auto!important;display:flex!important;
      flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;
      text-align:center!important;padding:32px 40px!important}
    .__pdf-hide-header .pg-header{display:none!important}
    .__pdf-compact-sobre .trajetoria-block{display:none!important}
    .__pdf-compact-sobre .page-inner{padding:14px 44px 8px!important}
    .__pdf-compact-sobre .sec-title{font-size:20px!important;margin-bottom:10px!important}
    .__pdf-compact-sobre .missao-grid{gap:10px!important;margin-bottom:12px!important}
    .__pdf-compact-sobre .missao-card{padding:12px 14px!important}
    .__pdf-compact-sobre .missao-card p{font-size:11.5px!important;line-height:1.6!important}
    .__pdf-compact-sobre .ser-title{margin-bottom:10px!important}
    .__pdf-compact-sobre .ser-grid{gap:10px!important;margin-top:0!important}
    .__pdf-compact-sobre .ser-card{padding:12px 10px!important;border-top-width:4px!important}
    .__pdf-compact-sobre .ser-letter{font-size:52px!important;margin-bottom:4px!important}
    .__pdf-compact-sobre .ser-word{font-size:13px!important;margin-bottom:4px!important}
    .__pdf-compact-sobre .ser-text{font-size:10.5px!important;line-height:1.55!important}
    .__pdf-compact-contato .contact-wrap{padding:10px 40px 14px!important}
    .__pdf-compact-contato .contact-avatar{width:60px!important;height:60px!important;font-size:22px!important;margin-bottom:8px!important}
    .__pdf-compact-contato .contact-name{font-size:18px!important;margin-bottom:3px!important}
    .__pdf-compact-contato .contact-role{font-size:11px!important;margin-bottom:8px!important}
    .__pdf-compact-contato .contact-site{font-size:12px!important;margin-bottom:12px!important}
    .__pdf-compact-contato .contact-divider{margin:6px auto!important}
    .__pdf-compact-contato .contact-company{font-size:10px!important;line-height:1.6!important}
    .__pdf-compact-contato .contact-validity{margin-top:8px!important;padding:8px 16px!important;font-size:10px!important}
  \`;
  document.head.appendChild(s);
  await new Promise(r => setTimeout(r, 500));

  /* ── 2. Capturar seções fundidas (mesmo agrupamento do @media print) e montar PDF A4 ── */
  try {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({orientation:'portrait', unit:'mm', format:'a4'});
    const pages = [...document.querySelectorAll('.page')];
    const scale = 2, PAGE_W = 794, PAGE_H = 1123;

    async function capturar(el, extra){
      return html2canvas(el, Object.assign({
        scale, useCORS: true, logging: false, backgroundColor: '#ffffff',
        width: PAGE_W, windowWidth: PAGE_W,
      }, extra||{}));
    }
    function agrupar(lista){
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:794px;background:#fff';
      lista[0].parentNode.insertBefore(wrapper, lista[0]);
      lista.forEach(p => wrapper.appendChild(p));
      return wrapper;
    }
    function desagrupar(wrapper){
      const parent = wrapper.parentNode;
      while(wrapper.firstChild) parent.insertBefore(wrapper.firstChild, wrapper);
      wrapper.remove();
    }
    let primeira = true;
    function adicionar(canvas, alturaMaxMM){
      if(!primeira) pdf.addPage();
      primeira = false;
      const alturaMM = Math.min(alturaMaxMM, (canvas.height/scale)/PAGE_W*210);
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 210, alturaMM);
    }

    // 1. Capa — página cheia
    pages[0].classList.add('__pdf-capa');
    const capaCanvas = await capturar(pages[0], { height: PAGE_H });
    pages[0].classList.remove('__pdf-capa');
    adicionar(capaCanvas, 297);

    // 2. Resumo + Projeção — fundidas em 1 folha
    pages[2].classList.add('__pdf-hide-header');
    const g1 = agrupar([pages[1], pages[2]]);
    const g1Canvas = await capturar(g1);
    desagrupar(g1);
    pages[2].classList.remove('__pdf-hide-header');
    adicionar(g1Canvas, 297);

    // 3. Equipamentos + Investimento — fundidas em 1 folha
    pages[4].classList.add('__pdf-hide-header');
    const g2 = agrupar([pages[3], pages[4]]);
    const g2Canvas = await capturar(g2);
    desagrupar(g2);
    pages[4].classList.remove('__pdf-hide-header');
    adicionar(g2Canvas, 297);

    // 4. Sobre + Contato — fundidas em 1 folha (compactadas)
    pages[5].classList.add('__pdf-compact-sobre');
    pages[6].classList.add('__pdf-hide-header', '__pdf-compact-contato');
    const g3 = agrupar([pages[5], pages[6]]);
    const g3Canvas = await capturar(g3);
    desagrupar(g3);
    pages[5].classList.remove('__pdf-compact-sobre');
    pages[6].classList.remove('__pdf-hide-header', '__pdf-compact-contato');
    adicionar(g3Canvas, 297);

    const nomeCliente = (document.title.replace(/^Proposta SER\s*[—-]\s*/,'').trim()||'').replace(/[^a-zA-Z0-9À-ú ]/g,'').trim();
    const filename = nomeCliente ? \`Proposta SER — \${nomeCliente}.pdf\` : 'Proposta_SER.pdf';
    pdf.save(filename);
  } catch(e) {
    alert('Erro ao gerar PDF: ' + e.message);
  } finally {
    document.getElementById('__pdfcap')?.remove();
    btn.disabled = false; btn.textContent = '🖨️ Baixar PDF';
  }
}
<\/script>
</body></html>`);
  win.document.close();
  if(imprimir){
    // Espera jsPDF e html2canvas carregarem, com fallback de timeout
    const t0 = Date.now();
    const tryRun = () => {
      if(win.closed) return;
      if(win.jspdf && win.html2canvas && win.gerarPDF){
        try{ win.gerarPDF(); } catch(e){ console.error('gerarPDF erro:', e); }
      } else if(Date.now()-t0 < 15000){
        setTimeout(tryRun, 300);
      } else {
        console.error('gerarPDF timeout: bibliotecas nao carregaram');
      }
    };
    setTimeout(tryRun, 800);
  }
}


function abrirContratoJanela(c, imprimir=false, winName='_blank'){
  const fR = v => 'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  const _e = s => String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const txt = v => _e(v)||'_______________';
  const dt  = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');
  const end = [c.rua, c.numero?'nº '+c.numero:'', c.complemento, c.bairro, c.cidade, c.estado||'', c.cep?'CEP '+c.cep:''].filter(Boolean).join(', ');
  function extenso(n){
    n=Math.round(Number(n||0));
    if(!n) return 'zero reais';
    const un=['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'];
    const dz=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'];
    const ct=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];
    function g(x){if(!x)return'';if(x===100)return'cem';let r='';if(x>=100){r+=ct[Math.floor(x/100)];x%=100;if(x)r+=' e ';}if(x>=20){r+=dz[Math.floor(x/10)];x%=10;if(x)r+=' e '+un[x];}else if(x)r+=un[x];return r;}
    let r='',mi=Math.floor(n/1000000),mil=Math.floor((n%1000000)/1000),hum=n%1000;
    if(mi){r+=g(mi)+(mi===1?' milhão':' milhões');}
    if(mil){if(r)r+=' e ';r+=mil===1?'mil':g(mil)+' mil';}
    if(hum){if(r)r+=' e ';r+=g(hum);}
    return r+(n===1?' real':' reais');
  }
  const win = window.open('',winName);
  if(!win){ alert('Popup bloqueado. Permita popups para este site.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8">
<title>Contrato — ${c.nome||'SER Energia'}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Times New Roman',Times,serif;font-size:12pt;line-height:1.7;color:#111;background:#f0eaf8;padding:24px}
.print-bar{position:sticky;top:0;z-index:100;background:#fff;padding:10px 24px;border-bottom:2px solid #4B0082;display:flex;justify-content:space-between;align-items:center}
.print-bar span{font-size:13px;color:#4B0082;font-weight:700}
.print-bar button{background:#4B0082;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600}
.wrap{max-width:820px;margin:0 auto;background:#fff;padding:52px 58px;box-shadow:0 2px 20px rgba(0,0,0,.1)}
.doc-header{text-align:center;margin-bottom:24px}
.doc-header img{height:72px;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto}
.doc-header h1{font-size:14pt;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#1a0a2e;margin-bottom:6px}
.doc-header .sub{font-size:9.5pt;color:#555;letter-spacing:.08em;text-transform:uppercase}
hr.title-rule{border:none;border-top:2px solid #6B21A8;margin:16px 0 24px}
.id-box{background:#f5f0fc;border-left:4px solid #6B21A8;border-radius:6px;padding:16px 20px;margin-bottom:24px;font-size:11pt;line-height:1.9}
.id-box p{margin:0 0 10px}
.id-box p:last-child{margin:0}
h2{font-size:10.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#4B0082;margin:28px 0 8px;padding-bottom:4px;border-bottom:1px solid #c4b5fd}
p{margin-bottom:8px;text-align:justify;font-size:11.5pt}
.pi{margin-left:24px;margin-bottom:6px;text-align:justify;font-size:11.5pt}
table.kit{width:100%;border-collapse:collapse;margin:14px 0 18px;font-size:11pt}
table.kit th{background:#4B0082;color:#fff;font-weight:700;padding:8px 10px;text-align:left;font-size:10pt;letter-spacing:.04em}
table.kit td{padding:7px 10px;border-bottom:1px solid #e9e2f5}
table.kit tr:nth-child(even) td{background:#faf7ff}
table.kit .hl{color:#4B0082;font-weight:700}
.cdc-box{background:#fffbeb;border:1px solid #f59e0b;border-radius:6px;padding:14px 18px;margin:18px 0;font-size:10.5pt;font-weight:700;line-height:1.6}
.sign-section{margin-top:52px}
.sign-date{text-align:center;font-style:italic;margin-bottom:36px;font-size:11pt}
.sign-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px 48px}
.sign-cell{text-align:center;padding-top:56px;position:relative}
.sign-cell::before{content:'';position:absolute;top:0;left:8%;right:8%;border-top:1px solid #333}
.sign-name{font-weight:700;font-size:10.5pt;color:#1a0a2e}
.sign-detail{font-size:9.5pt;color:#555;margin-top:2px}
.sign-label{font-size:8.5pt;letter-spacing:.07em;text-transform:uppercase;color:#4B0082;margin-top:5px;font-weight:700}
.resumo{margin-top:52px;border:1px solid #ddd6fe;border-radius:8px;padding:24px 28px;background:#faf7ff}
.resumo h3{font-size:12pt;color:#4B0082;margin-bottom:14px}
.resumo h4{font-size:10.5pt;font-weight:700;color:#1a0a2e;margin:14px 0 4px}
.resumo p{font-size:10.5pt;margin-bottom:6px;text-align:left}
.mat-box{margin-top:20px;border:1px solid #ddd;border-radius:6px;padding:16px 20px;background:#fff;font-size:11pt}
.mat-title{font-weight:700;color:#4B0082;margin-bottom:10px}
@media print{*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{background:#fff;padding:0}.wrap{box-shadow:none;padding:30px 40px}.print-bar{display:none!important}h2{page-break-after:avoid}}
</style></head><body>
<div class="print-bar"><span>SER Energia Renovável</span><button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button></div>
<div class="wrap">

<div class="doc-header">
  <img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/>
  <h1>Instrumento Particular de Contrato de<br>Projeto e Instalação Fotovoltaico</h1>
  <div class="sub">SOLUÇÕES EM ENERGIA RENOVÁVEL MATRIZ LTDA — CNPJ 58.656.750/0001-04</div>
</div>
<hr class="title-rule"/>

<div class="id-box">
  <p><strong>CONTRATANTE:</strong> <strong>${txt(c.nome)}</strong>, ${c.estado_civil||'brasileiro(a)'}, portador(a) do CPF sob o n. <strong>${txt(c.cpf)}</strong> e da Carteira de Identidade nº <strong>${txt(c.rg)}${c.rg_orgao?' / '+c.rg_orgao:''}</strong>, residente e domiciliado(a) na <strong>${end||'_______________'}</strong>, neste ato denominado(a) <strong>CONTRATANTE</strong>; e do outro lado,</p>
  <p><strong>CONTRATADA:</strong> SOLUÇÕES EM ENERGIA RENOVÁVEL MATRIZ LTDA, denominada <strong>SER ENERGIA RENOVÁVEL</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o n. 58.656.750/0001-04, com endereço profissional em Travessa Antônio Baena, n 300, Bairro Marco, CEP 66.093-635, Belém/PA, neste ato representada por seu administrador legal Wellem Monteiro Macedo, brasileira, portadora do CPF/MF sob nº 008.253.962-63 e RG nº 6300850, residente e domiciliado à cidade de Belém/PA.</p>
</div>

<h2>Do Objeto do Contrato</h2>
<p><strong>1. O(A) CONTRATANTE confia à CONTRATADA e aceita, a execução de todas as atividades necessárias para a realização, teste e conexão do projeto fotovoltaico que compreende:</strong></p>
<p class="pi">a. Fornecimento e instalação de materiais elétricos estritamente necessários à execução do serviço e instalação do projeto (quadro de string DC, quadro de paralelo AC);</p>
<p class="pi">b. Fornecimento e instalação de estrutura metálica para suporte de módulos fotovoltaicos;</p>
<p class="pi">c. Conexão elétrica entre módulos, quadros DC, inversor e quadro baixa tensão;</p>
<p class="pi">d. Teste de funcionalidade e entrega de conformidade da usina;</p>
<p class="pi">f. Avaliação do projeto de ajuste, caso seja necessário;</p>
<p class="pi">g. Tratamento do processo de HOMOLOGAÇÃO do sistema junto a Concessionária de Energia Elétrica${c.concessionaria?' ('+c.concessionaria+')':''} e solicitação de aumento de carga (monofásico para bifásico).</p>
<p><strong>1.1. Os componentes a serem fornecidos estritamente adequados ao projeto contratado, objeto deste contrato, são:</strong></p>
${c.qtd_modulos?`<p class="pi">g) <strong>${txt(c.qtd_modulos)}</strong> Módulos Solares <strong>${txt(c.marca_modulo)} ${c.pot_modulo||'___'} W</strong>;</p>`:''}
${c.qtd_inversores?`<p class="pi">h) <strong>${c.qtd_inversores}</strong> INVERSOR <strong>${txt(c.marca_inversor)} ${c.pot_inversor||'___'} KW ${c.fase?c.fase.toUpperCase():''} ${c.tensao?c.tensao+' V':''}</strong>.</p>`:''}
${c.qtd_baterias?'<p class="pi">i) <strong>'+c.qtd_baterias+'</strong> Bateria(s) <strong>'+txt(c.marca_bateria)+' '+(c.pot_bateria||'___')+' kWh</strong>.</p>':''}

<table class="kit">
  <thead><tr><th>ITEM</th><th>QTD.</th><th>FABRICANTE</th><th>POTÊNCIA</th><th>CONFIGURAÇÃO</th></tr></thead>
  <tbody>
    ${c.qtd_modulos?`<tr><td>Módulos Solares</td><td class="hl">${c.qtd_modulos} un.</td><td class="hl">${c.marca_modulo||'—'}</td><td>${c.pot_modulo||'—'} W</td><td>—</td></tr>`:''}
    ${c.qtd_inversores?`<tr><td>Inversor</td><td class="hl">${c.qtd_inversores} un.</td><td class="hl">${c.marca_inversor||'—'}</td><td>${c.pot_inversor||'—'} kW</td><td class="hl">${c.fase?c.fase.toUpperCase():''} ${c.tensao?c.tensao+' V':''}</td></tr>`:''}
    ${c.qtd_baterias?'<tr><td>Baterias</td><td class="hl">'+c.qtd_baterias+' un.</td><td class="hl">'+(c.marca_bateria||'—')+'</td><td>'+(c.pot_bateria||'—')+' kWh</td><td>—</td></tr>':''}
  </tbody>
</table>

<h2>Das Exclusões do Contrato</h2>
<p><strong>2. São exclusos do presente contrato os seguintes:</strong></p>
<p class="pi">a. Obras civis: estrutura de edifícios, fundações, terraplenagem, armação, drenagem, ampliação, inovação ou restauração no imóvel;</p>
<p class="pi">b. Fornecimento de telha, exceto quando no momento da instalação alguma telha for danificada;</p>
<p class="pi">c. Obras de transmissão de energia em linha aérea: cabeamento que liga a residência até a rede da concessionária;</p>
<p class="pi">d. Estrutura mecânica de reforço do telhado (onde previsto no laudo de vistoria);</p>
<p class="pi">e. Implantação e custeio de poste auxiliar, quando necessário e indicado na vistoria;</p>
<p class="pi">f. Cálculo estrutural do telhado (quando não previsto no item 2.1).</p>
<p><strong>2.3. O presente contrato visa a prestação de serviços especializados para instalação de sistemas de geração de energia fotovoltaica com uma capacidade de potência de <span style="color:#4B0082">${c.kwp||'___'} kWp</span>, em endereço definido no contrato.</strong></p>
<p><strong>2.4. A capacidade de energia estabelecida no item 2.3 será alcançada apenas em condições ideais, podendo sofrer alterações por fatores naturais ou não naturais, tais como, chuva, neblina, sombreamento e sujeira nos painéis solares.</strong></p>

<h2>Dos Valores e Forma de Pagamento</h2>
<p><strong>3. O valor que deverá ser pago pelo(a) CONTRATANTE à CONTRATADA SER ENERGIA RENOVÁVEL para a realização do serviço de todas as obrigações descritas neste contrato corresponde ao total de <span style="color:#4B0082">${fR(c.valor)}</span> (${extenso(c.valor)}).</strong></p>
<p><strong>Forma de pagamento: <span style="color:#4B0082">${txt(c.forma_pgto)}</span></strong></p>
${(c.pgto_desc||c.banco)?'<p><strong>3.1. O Pagamento ocorrerá: <span style="color:#4B0082">'+(c.banco?c.banco+' — ':'')+txt(c.pgto_desc)+'</span>.</strong></p>':''}
<p><strong>3.2. Verificado o descumprimento da obrigação prevista no item 3 e 3.1, estará a CONTRATADA autorizada a proceder com os métodos de cobrança extrajudiciais e judiciais, tais como negativação do CPF do devedor nos órgãos de crédito, envio da dívida para protesto em cartórios, além do ajuizamento das medidas judiciais cabíveis e interrupção imediata da prestação do serviço até a regularização.</strong></p>
<p><strong>3.3. Havendo mais de um contratante, estes possuem responsabilidade solidária em todas as obrigações do presente contrato.</strong></p>

<h2>Reajuste e Revisão de Valores</h2>
<p>4. O valor que será pago pelo CONTRATANTE abarca os serviços e equipamentos necessários para finalizar o projeto contratado. Caso o CONTRATANTE faça solicitação de alteração do projeto, ou ocorra desequilíbrio contratual em função de fatos supervenientes ao início da execução do serviço, as condições contratuais poderão ser reanalisadas.</p>
<p>4.1. Os valores estabelecidos neste contrato poderão ser revisados em caso de variações significativas nos custos de materiais, desde que comprovados documentalmente.</p>
<p>4.2. Alterações no escopo do projeto, solicitadas pelo(a) CONTRATANTE, que impactem os custos previamente acordados, deverão ser formalizadas por meio de aditivo contratual.</p>

<h2>Das Obrigações da Contratada</h2>
<p>5. A CONTRATADA se compromete a fornecer os equipamentos e executar a instalação dos itens contidos na Cláusula 1 deste contrato, observando as normas técnicas aplicáveis e garantindo a segurança de todos os envolvidos.</p>
<p>5.1. A CONTRATADA se compromete a utilizar equipamentos adequados e pessoal qualificado, assumindo plena e exclusiva responsabilidade por sua contratação, eximindo o(a) CONTRATANTE de qualquer responsabilidade.</p>
<p>5.2. A CONTRATADA declara e garante dispor de toda experiência e competências técnicas necessárias, executando as obras dentro das normas NR-10 (Segurança em Instalações e Serviços em Eletricidade) e NR-35 (Trabalho em Altura).</p>
<p>5.5. A CONTRATADA realizará uma vistoria técnica no local de instalação antes da execução dos serviços. Em caso de aprovação com ressalvas ou reprovação, o CONTRATANTE deverá corrigir as pendências identificadas.</p>

<h2>Das Obrigações da Contratante</h2>
<p>6. Deverá a CONTRATANTE cumprir com os pagamentos à CONTRATADA, na forma descrita no item 3.</p>
<p>6.1. Compromete-se a CONTRATANTE a liberar a entrada dos profissionais para a execução dos serviços de instalação nas dependências do imóvel.</p>
<p>6.4. As obras deverão ser realizadas no prazo máximo de 90 (noventa) dias, período em que os prazos do item 7 estarão suspensos.</p>
<p>6.6. Deverá o CONTRATANTE receber e armazenar os equipamentos entregues pela FABRICANTE de forma segura durante a etapa de instalação, respondendo por eventuais perdas e danos.</p>
<p>6.7. O(A) CONTRATANTE declara e garante haver a plena disponibilidade jurídica do local e se dispõe a manter pela inteira duração do presente contrato a disponibilidade do local.</p>

<h2>Dos Prazos</h2>
<p>7. O cumprimento deste contrato iniciará quando verificado o pagamento do valor descrito no item 3, na forma pactuada, além da entrega de toda a documentação pela CONTRATANTE. As várias fases relativas à realização das obras deverão ser completadas no prazo máximo de <strong>90 (noventa) dias</strong>.</p>
<p>7.1. O prazo passará a contar a partir do cumprimento de duas condições, cumulativas: realização do pagamento e entrega dos documentos solicitados para homologação e desenvolvimento do projeto.</p>
<p>7.2. Caso o inversor adquirido seja de potência 30kW ou superior, automaticamente o prazo de entrega da obra passará a ser de <strong>180 (cento e oitenta) dias</strong>.</p>
<p>7.3. Caso a CONTRATADA não cumpra com o prazo previsto no item 7, compromete-se a arcar com o pagamento das parcelas do financiamento bancário contratado pela CONTRATANTE, ou, não sendo o caso, a realizar o reembolso referente ao valor pago das faturas de energia de forma proporcional aos dias que excederem o estabelecido.</p>

<h2>Das Variações de Projeto</h2>
<p>8.1. As Partes contratantes concordam que as variações relativas à majorações de obras ordenadas pelo(a) CONTRATANTE, serão realizadas, após averiguação de possibilidade de realização da parte CONTRATADA, no tempo que ela determinar.</p>
<p>8.2. A CONTRATADA terá direito à compensação, relativa à variação prevista no item 8.1, que será correspondida ao final da realização dela, após apresentação da Nota Fiscal.</p>

<h2>Da Rescisão do Contrato</h2>
<p>9. O presente contrato poderá ser rescindido no caso de inadimplemento de quaisquer obrigações ora estabelecidas pelas partes contratadas, desde que a parte inadimplente não sane a pendência em 30 (trinta) dias, contados do recebimento da notificação por escrito da outra parte. A parte infratora ficará obrigada a pagar a multa equivalente a <strong>20% (vinte por cento)</strong> do valor total do contrato à outra parte.</p>
<p>9.2. Eventual rescisão unilateral pelo(a) CONTRATANTE deverá ser feita mediante aviso prévio de no mínimo 15 (quinze) dias, arcando com o pagamento de multa de <strong>20%</strong> do valor do contrato.</p>
<p>9.3. Caso a instalação já tenha sido iniciada ou concluída, a multa mencionada anteriormente será majorada para <strong>35%</strong> do valor total do projeto.</p>
<p>9.7/9.8. Nos casos em que a execução dos serviços for viabilizada por meio de financiamento, uma vez que o contrato de financiamento seja formalizado e assinado, a solicitação de rescisão sujeitará o CONTRATANTE ao pagamento de multa de <strong>55%</strong> sobre o valor total do serviço financiado.</p>
<div class="cdc-box">⚠️ DESTAQUE LEGAL (ART. 54, § 4º, CDC): O CONTRATANTE DECLARA TER TOTAL E INEQUÍVOCA CIÊNCIA DE QUE A RESCISÃO DO CONTRATO APÓS A ASSINATURA DO FINANCIAMENTO IMPLICARÁ EM MULTA DE 55% SOBRE O VALOR TOTAL FINANCIADO, A QUAL SERÁ REPASSADA À INSTITUIÇÃO FINANCEIRA.</div>

<h2>Das Garantias</h2>
<p>10. A CONTRATADA garante ao(à) CONTRATANTE que os equipamentos a serem fornecidos atendem ao descrito nas especificações técnicas quando operados dentro dos limites técnicos para os quais foram projetados.</p>
<p><strong>10.1. Prazos de garantia contados a partir do término da instalação:</strong></p>
<p class="pi">a. Prazo de garantia para problemas com o inversor: <strong>12 meses</strong>.</p>
<p class="pi">b. Prazo de garantia para limpeza dos painéis, reaperto das conexões e verificação de condições de telhado: <strong>03 meses</strong>.</p>
<p>10.2. Passado o prazo referido na cláusula 10.1, fica estabelecido como garantia os prazos oferecidos pelas FABRICANTES: <strong>25 (vinte e cinco) anos</strong> de garantia de performance e <strong>10 (dez) anos</strong> contra defeitos de fabricação para os módulos e <strong>10 (dez) anos</strong> para os inversores e estrutura.</p>
<p>10.5. A presente garantia não cobre defeitos ou falhas decorrentes do desgaste natural dos materiais, erros operacionais, manuseio inadequado, ou danos causados por erosão, corrosão, intempéries, fatores climáticos etc.</p>

<h2>Disposições Finais</h2>
<p>11.1. A CONTRATADA executará seus projetos de acordo com padrões e normas técnicas aplicáveis.</p>
<p>11.3. (X) Autorizo o uso de minha imagem constante na filmagem da entrega do projeto solar Sucesso do Cliente, sem qualquer ônus para a empresa e em caráter definitivo.</p>
<p>11.4. Este documento poderá ser assinado eletronicamente mediante utilização de processo de certificação disponibilizado pela Infraestrutura de Chaves Pública Brasileira — ICP-Brasil, ou de qualquer outro meio de comprovação da autoria e integridade de documentos em forma eletrônica (Docusign, Adobesign etc.).</p>
<p>11.5. Fica estabelecido o foro da cidade de <strong>Belém/PA</strong>, para dirimir quaisquer dúvidas oriundas do presente instrumento.</p>

<div class="sign-section">
  <div class="sign-date">Belém/PA, ${dt(c.data_assinatura)}.</div>
  <div class="sign-grid">
    <div class="sign-cell">
      <div class="sign-name">${txt(c.nome)}</div>
      <div class="sign-detail">CPF: ${txt(c.cpf)}</div>
      <div class="sign-detail">RG: ${txt(c.rg)}${c.rg_orgao?' / '+c.rg_orgao:''}</div>
      <div class="sign-label">CONTRATANTE</div>
    </div>
    <div class="sign-cell">
      <div class="sign-name">CONTRATADA</div>
      <div class="sign-detail">SER ENERGIA RENOVÁVEL</div>
      <div class="sign-detail">CNPJ 58.656.750/0001-04</div>
      <div class="sign-label">CONTRATADA</div>
    </div>
    <div class="sign-cell">
      <div class="sign-name">TESTEMUNHA 1</div>
      <div class="sign-detail">Nome: ${c.vendedor||'_______________'}</div>
      <div class="sign-detail">CPF: ${c.vend_cpf||'___________'}</div>
      <div class="sign-label">TESTEMUNHA 1 — VENDEDOR</div>
    </div>
    <div class="sign-cell">
      <div class="sign-name">TESTEMUNHA 2</div>
      <div class="sign-detail">Nome: ${c.supervisor_nome||'_______________'}</div>
      <div class="sign-detail">CPF: ${c.supervisor_cpf||'___________'}</div>
      <div class="sign-label">TESTEMUNHA 2 — SUPERVISOR</div>
    </div>
  </div>
</div>

<div class="resumo">
  <h3>📋 Resumo do Contrato</h3>
  <p>Aqui na SER ENERGIA RENOVÁVEL, trabalhamos com boa-fé e transparência. Este tópico explica os principais pontos do contrato de maneira clara e acessível.</p>
  <h4>1. DO OBJETO</h4>
  <p>No objeto do contrato estão contidos os serviços que você está contratando. Fique atento ao item 2 do contrato, que lista os serviços que não entram na responsabilidade da empresa.</p>
  <h4>2. DAS OBRIGAÇÕES DA CONTRATADA</h4>
  <p>A empresa se compromete a realizar um serviço de qualidade, inspecionando o local previamente, assumindo os custos de quaisquer danos causados no imóvel e prestando todas as informações necessárias.</p>
  <h4>3. DAS OBRIGAÇÕES DO CONTRATANTE</h4>
  <p>Em caso de necessidade de ajustes no imóvel, o cliente deverá contratar profissional competente. O prazo de 90 dias fica suspenso durante as obras de adequação.</p>
  <h4>4. DOS PRAZOS</h4>
  <p>O prazo é de 90 (noventa) dias e conta a partir do pagamento e entrega dos documentos. Pode ser estendido durante obras e nas hipóteses descritas no contrato.</p>
  <h4>5. DA RESCISÃO</h4>
  <p>Multa de 20% do valor do contrato em caso de inadimplência. Havendo instalação realizada: 35%. Com contrato de financiamento assinado: 55%.</p>
  <h4>6. DA GARANTIA</h4>
  <p>03 meses para serviços de manutenção pela SER. As fabricantes oferecem 25 anos de garantia de performance e 10 anos contra defeitos de fabricação para os módulos.</p>
  <div class="mat-box">
    <div class="mat-title">📦 Lista de Materiais do Projeto</div>
    <p>Sistema <strong>${c.kwp||'—'} kWp</strong>${c.qtd_modulos?` · <strong>${c.qtd_modulos} módulo(s) ${c.marca_modulo||''} ${c.pot_modulo?c.pot_modulo+'W':''}</strong>`:''}${c.qtd_inversores?` · <strong>${c.qtd_inversores} inversor(es) ${c.marca_inversor||''} ${c.pot_inversor?c.pot_inversor+'kW':''}</strong>${c.fase?' — '+c.fase.toUpperCase():''}${c.tensao?' '+c.tensao+'V':''}`:''}</p>
    <p style="margin-top:8px"><strong style="color:#4B0082">💰 Valor total: ${fR(c.valor)} (${extenso(c.valor)})</strong></p>
    <p style="margin-top:4px"><strong>💳 Forma de pagamento: ${txt(c.forma_pgto)}</strong></p>
  </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"><\/script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"><\/script>
<script>
async function gerarPDFBase64() {
  const el = document.querySelector('.wrap');
  const canvas = await html2canvas(el, { scale: 1, useCORS: true, logging: false });
  const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
  const pageW = 210, pageH = 297;
  const ratio = pageW / canvas.width;
  const totalH = canvas.height * ratio;
  let y = 0;
  while (y < totalH) {
    if (y > 0) pdf.addPage();
    const srcY = Math.round(y / ratio);
    const srcH = Math.min(Math.round(pageH / ratio), canvas.height - srcY);
    if (srcH <= 0) break;
    const sl = document.createElement('canvas');
    sl.width = canvas.width; sl.height = srcH;
    sl.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
    pdf.addImage(sl.toDataURL('image/jpeg', 0.75), 'JPEG', 0, 0, pageW, srcH * ratio);
    y += pageH;
  }
  return pdf.output('datauristring');
}
if (window.name === 'clicksign-capture') {
  window.addEventListener('load', async () => {
    await new Promise(r => setTimeout(r, 1200));
    try {
      const base64 = await gerarPDFBase64();
      window.opener?.postMessage({ type: 'CONTRACT_PDF', base64 }, '*');
    } catch(e) {
      window.opener?.postMessage({ type: 'CONTRACT_PDF_ERROR', error: e.message }, '*');
    }
    window.close();
  });
}
<\/script>
</div></body></html>`);
  win.document.close();
  if(imprimir) setTimeout(()=>{ win.focus(); win.print(); }, 600);
}


/* ============================================================
   LOGISTICA MODAL
   ============================================================ */
function openLogisticaModal(item=null){
  item = mergeChain(item || {});
  const linked = getLinkedDocs(item);
  const statusOpts = [['aguardando','Aguardando'],['comprado','Comprado'],['enviado','Enviado'],['entregue','Entregue']];

  openModal(`
    <div class="modal-header"><h2>Logística — ${esc(item.nome||'')}</h2><button class="modal-close">×</button></div>
    <form id="logForm">
      <div class="modal-body">
        <div class="form-grid">
          ${formField({label:'Cliente',name:'_nome',value:item.nome,readonly:true})}
          ${formField({label:'kWp',name:'_kwp',value:item.kwp,readonly:true})}
          ${formField({label:'Vendedor',name:'_vendedor',value:item.vendedor,readonly:true})}
          ${formField({label:'Valor (R$)',name:'valor',type:'number',value:item.valor})}
          ${formField({label:'Valor da Nota (R$)',name:'valor_nota',type:'number',value:item.valor_nota})}
          ${formField({label:'Valor da Compra (R$)',name:'valor_compra',type:'number',value:item.valor_compra})}
          ${formField({label:'Valor de Repasse (R$)',name:'valor_repasse',type:'number',value:item.valor_repasse,readonly:true})}
          ${formField({label:'Distribuidora',name:'distribuidora',value:item.distribuidora,datalist:DL_DISTRIBUIDORA})}
          ${formField({label:'Nº Pedido',name:'num_pedido',value:item.num_pedido})}
          ${formField({label:'Nº NF',name:'num_nf',value:item.num_nf})}
          ${formField({label:'Data Prevista Entrega',name:'data_prevista_entrega',type:'date',value:item.data_prevista_entrega})}
          ${formField({label:'Status',name:'status',type:'select',value:item.status||'aguardando',options:statusOpts})}
          ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
        </div>
        <div style="margin-top:10px;padding:10px;background:#fffbeb;border-radius:8px;font-size:12px;color:#856404">
          💡 Ao marcar como <strong>Comprado</strong> e salvar, o card será automaticamente movido para <strong>Instalação</strong>.
        </div>
        ${renderLinkedDocBtns(linked)}
        ${histSection()}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-danger" id="delLogBtn">Excluir</button>
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>
  `);
  const form = $('#logForm');
  attachLinkedDocListeners(linked);
  carregarHistorico($('#histList'), 'logistica', item.id);

  // Auto-cálculo: valor_repasse = valor_nota − valor_compra (mínimo 0)
  const recalcRepasse = ()=>{
    const nota    = parseBR(form.elements['valor_nota'].value)  || 0;
    const compra  = parseBR(form.elements['valor_compra'].value)|| 0;
    form.elements['valor_repasse'].value = fmtInputNum(Math.max(0, nota - compra));
  };
  form.elements['valor_nota'].addEventListener('input', recalcRepasse);
  form.elements['valor_compra'].addEventListener('input', recalcRepasse);
  const statusLogMap = {aguardando:'Aguardando', comprado:'Comprado', enviado:'Enviado', entregue:'Entregue'};
  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    Object.keys(data).filter(k=>k.startsWith('_')).forEach(k=>delete data[k]);
    // Garante que valores sejam número
    ['valor','valor_nota','valor_compra','valor_repasse'].forEach(k=>{ if(data[k]!=null) data[k]=Number(data[k])||null; });
    const { error } = await supa.from('logistica').update(data).eq('id',item.id);
    if(error) return toast('Erro ao salvar: '+error.message,'error');
    const mud = detectMudancas(item, data, [
      ['status','Status', v=>statusLogMap[v]||v],
      ['distribuidora','Distribuidora',null], ['num_pedido','Nº Pedido',null],
    ]);
    const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
    await registrarHistorico('logistica', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');

    // Sincroniza repasse com Financeiro > Receitas
    await sincronizarReceitaRepasse(item.id, data);

    // Auto-avanço para Instalação quando marcado como comprado
    if(data.status === 'comprado'){
      const { data: instExist } = await supa.from('instalacoes').select('id').eq('logistica_id', item.id).maybeSingle();
      if(!instExist){
        const logAtual = {...item, ...data};
        const instPayload = buildTransitionPayload(logAtual, 'logistica', 'instalacao');
        instPayload.criado_por = State.user?.id;
        const { error: instErr } = await supa.from('instalacoes').insert(instPayload);
        if(instErr) toast('Logística salva. Erro ao criar instalação: '+instErr.message,'error');
        else toast('Comprado ✓ → Instalação criada automaticamente!','success');
        await loadAll(); closeModal(); renderPipeline();
        return;
      }
    }
    // Sincroniza despesa de Kit com Financeiro
    if(data.valor_compra && item.contrato_id){
      const { data: kitExist } = await supa.from('financeiro_despesas')
        .select('id').eq('contrato_id', item.contrato_id).eq('categoria','kit').maybeSingle();
      const kitPayload = {
        descricao: 'Kit Solar',
        valor: Number(data.valor_compra),
        recebedor: data.distribuidora || item.distribuidora || '',
        categoria: 'kit',
        status: 'pendente',
        contrato_id: item.contrato_id,
      };
      if(kitExist){
        await supa.from('financeiro_despesas').update(kitPayload).eq('id', kitExist.id);
      } else {
        kitPayload.criado_por = State.user?.id;
        await supa.from('financeiro_despesas').insert(kitPayload);
      }
    }

    toast('Salvo','success'); await loadAll(); closeModal(); renderPipeline();
  });
  $('#delLogBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir?')) return;
    await supa.from('logistica').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal(); renderPipeline();
  });
}

/* ============================================================
   INSTALACAO MODAL
   ============================================================ */
function openInstalacaoModal(item=null){
  item = mergeChain(item || {});
  const linked = getLinkedDocs(item);
  const statusOpts = [['aguardando_agendamento','Aguardando Agendamento'],['agendada','Agendada'],['em_andamento','Em andamento'],['concluida','Concluída'],['cancelada','Cancelada']];
  const fotos = item.fotos || {};

  // Busca endereço do contrato para pré-preencher
  const logistica = (State.logistica||[]).find(l=>String(l.id)===String(item.logistica_id));
  const contrato = (State.contratos||[]).find(c=>String(c.id)===String(item.contrato_id||logistica?.contrato_id));
  const endContrato = contrato ? [contrato.rua, contrato.numero?`nº ${contrato.numero}`:'', contrato.complemento, contrato.bairro, contrato.cidade, contrato.estado].filter(Boolean).join(', ') : '';
  const enderecoFinal = item.endereco || endContrato || '';
  const vistoria = (State.vistorias||[]).find(v=>String(v.id)===String(item.vistoria_id||logistica?.vistoria_id||contrato?.vistoria_id));
  const gmapFinal = item.gmap || vistoria?.gmap || contrato?.gmap || '';
  const homologacao = (State.homologacoes||[]).find(h=>String(h.contrato_id)===String(item.contrato_id||logistica?.contrato_id));
  const homDocs = homologacao?.docs || {};
  const cepFinal = item.cep || contrato?.cep || '';

  openModal(`
    <div class="modal-header">
      <h2>Instalação — ${esc(item.nome||'')}</h2>
      <span id="autosaveIndInst" style="font-size:11px;color:#6B21A8;margin-left:8px;flex:1"></span>
      <button class="modal-close">×</button>
    </div>
    <form id="instForm">
      <div class="modal-body">
        <div id="draftBannerInst" style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:10px;display:none;align-items:center;justify-content:space-between;gap:12px;font-size:12px">
          <span>💾 <strong>Rascunho encontrado.</strong> Deseja restaurar o que foi preenchido?</span>
          <div style="display:flex;gap:8px;flex-shrink:0">
            <button type="button" id="draftRestoreBtnInst" class="btn btn-sm btn-primary">Restaurar</button>
            <button type="button" id="draftDiscardBtnInst" class="btn btn-sm btn-secondary">Descartar</button>
          </div>
        </div>
        <div class="form-grid">
          ${formField({label:'Cliente',name:'_nome',value:item.nome,readonly:true})}
          ${formField({label:'kWp',name:'_kwp',value:item.kwp,readonly:true})}
          ${formField({label:'Vendedor',name:'_vendedor',value:item.vendedor,readonly:true})}
          ${formField({label:'Técnico',name:'tecnico',value:item.tecnico,required:true,datalist:DL_TECNICO})}
          ${formField({label:'Data Instalação',name:'data_instalacao',type:'date',value:item.data_instalacao})}
          ${formField({label:'Hora',name:'hora_instalacao',type:'time',value:item.hora_instalacao})}
          ${formField({label:'Status',name:'status',type:'select',value:item.status||'aguardando_agendamento',options:statusOpts})}
        </div>
        <div class="section" style="margin-top:14px"><div class="section-header"><h4>📍 Endereço da Instalação</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'CEP',name:'cep',value:cepFinal})}
            ${formField({label:'Endereço completo',name:'endereco',value:enderecoFinal,full:true})}
            ${formField({label:'Google Maps',name:'gmap',value:gmapFinal,full:true})}
          </div></div>
        </div>
        <div class="section collapsed" style="margin-top:10px"><div class="section-header"><h4>💰 Valores Extras</h4><span class="section-toggle">▼</span></div>
          <div class="section-body"><div class="form-grid">
            ${formField({label:'Tem Poste',name:'tem_poste',type:'toggle',value:item.tem_poste})}
            ${formField({label:'Valor Poste',name:'val_poste',type:'number',value:item.val_poste})}
            ${formField({label:'Tem Troca Padrão',name:'tem_troca_padrao',type:'toggle',value:item.tem_troca_padrao})}
            ${formField({label:'Valor Troca Padrão',name:'val_troca_padrao',type:'number',value:item.val_troca_padrao})}
            ${formField({label:'Estimado',name:'estimado',type:'number',value:item.estimado})}
            ${formField({label:'Pago',name:'pago',type:'number',value:item.pago})}
          </div></div>
        </div>
        ${formField({label:'Observações',name:'obs',type:'textarea',value:item.obs,full:true})}
        <div class="section" style="margin-top:14px">
          <div class="section-header"><h4>📷 Fotos da Instalação</h4><span class="section-toggle">▼</span></div>
          <div class="section-body">
            ${fileUploadBlock('Fotos gerais da instalação','geral','instalacoes',fotos.geral||[],true)}
          </div>
        </div>
        ${(()=>{
          const docsMeta = [
            { key:'projeto_unifilar', label:'📐 Projeto Unifilar' },
            { key:'memorial_tecnico', label:'📋 Memorial Técnico' },
          ];
          const itens = docsMeta.map(d => {
            const _f = (homDocs[d.key]||[])[0]; const url = _f?.url || _f;
            return url
              ? `<a href="${url}" target="_blank" style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f9f5ff;border:1px solid #e9d5ff;border-radius:8px;color:#4B0082;font-size:13px;font-weight:600;text-decoration:none">${d.label}<span style="margin-left:auto;font-size:11px;color:#6b7280">Abrir ↗</span></a>`
              : `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f8f9fa;border:1px dashed #dee2e6;border-radius:8px;color:#adb5bd;font-size:13px">${d.label}<span style="margin-left:auto;font-size:11px">Não enviado ainda</span></div>`;
          }).join('');
          return `<div class="section" style="margin-top:14px"><div class="section-header"><h4>📄 Documentos Técnicos</h4><span class="section-toggle">▼</span></div><div class="section-body"><div style="display:flex;flex-direction:column;gap:8px">${itens}</div></div></div>`;
        })()}
        ${renderLinkedDocBtns(linked)}
        ${histSection()}
      </div>
      <div class="modal-footer">
        ${isAdmin()?`<button type="button" class="btn btn-danger" id="delInstBtn">Excluir</button>`:''}
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="button" class="btn btn-secondary" id="btnLaudoInst" style="background:linear-gradient(135deg,#6B21A8,#9333ea);color:#fff;border:none">📋 Laudo de Campo</button>
        <button type="submit" class="btn btn-primary">Salvar</button>
      </div>
    </form>
  `,'lg');
  const form = $('#instForm');
  attachLinkedDocListeners(linked);
  carregarHistorico($('#histList'), 'instalacoes', item.id);
  const filesStore = { geral: (fotos.geral||[]).slice() };
  attachFileUploads(form, filesStore, {offline:true});

  // ── Auto-save: persiste o rascunho no localStorage ───────
  const _draftKeyInst = `instalacao_rascunho_${item.id||'nova'}`;
  const _saveDraftInst = ()=>{
    try{
      localStorage.setItem(_draftKeyInst, JSON.stringify({
        ts: Date.now(),
        fields: readForm(form),
        files: JSON.parse(JSON.stringify(filesStore))
      }));
      const ind = document.getElementById('autosaveIndInst');
      if(ind){ const t=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); ind.textContent=`💾 salvo às ${t}`; }
    }catch(e){}
  };
  let _draftTimerInst = null;
  form.addEventListener('input',  ()=>{ clearTimeout(_draftTimerInst); _draftTimerInst=setTimeout(_saveDraftInst,1500); });
  form.addEventListener('change', ()=>{ clearTimeout(_draftTimerInst); _draftTimerInst=setTimeout(_saveDraftInst,1500); });

  // Verificar se existe rascunho e oferecer restauração
  try{
    const saved = localStorage.getItem(_draftKeyInst);
    if(saved){
      const draft = JSON.parse(saved);
      const mins = Math.round((Date.now()-draft.ts)/60000);
      if(mins < 1440){
        const banner = document.getElementById('draftBannerInst');
        if(banner){
          banner.style.display='flex';
          banner.querySelector('span').innerHTML=`💾 <strong>Rascunho encontrado</strong> — salvo há ${mins<1?'menos de 1':mins} min. Deseja restaurar o que foi preenchido?`;
          document.getElementById('draftRestoreBtnInst')?.addEventListener('click',()=>{
            Object.entries(draft.fields||{}).forEach(([k,v])=>{
              const el = form.elements[k];
              if(!el) return;
              if(el.type==='checkbox') el.checked=!!v;
              else el.value=v;
            });
            Object.entries(draft.files||{}).forEach(([k,arr])=>{
              filesStore[k]=arr;
              const wrap=form.querySelector(`[data-thumbs="${k}"]`);
              if(wrap) wrap.innerHTML=arr.map((f,i)=>thumbHtml(f,k,i)).join('');
            });
            banner.style.display='none';
            toast('Rascunho restaurado!','success');
            _saveDraftInst();
          });
          document.getElementById('draftDiscardBtnInst')?.addEventListener('click',()=>{
            localStorage.removeItem(_draftKeyInst);
            banner.style.display='none';
          });
        }
      }
    }
  }catch(e){}
  // ─────────────────────────────────────────────────────────

  const statusInstMap = {aguardando_agendamento:'Aguardando Agendamento', agendada:'Agendada', em_andamento:'Em andamento', concluida:'Concluída', cancelada:'Cancelada'};

  form.addEventListener('submit', async e=>{
    e.preventDefault();
    const data = readForm(form);
    ['val_poste','val_troca_padrao','estimado','pago'].forEach(k=>{ data[k] = data[k]!=null ? Number(data[k]) : null; });
    Object.keys(data).filter(k=>k.startsWith('_')).forEach(k=>delete data[k]);
    data.fotos = { ...(item.fotos||{}), ...filesStore };
    const { queued, error } = await salvarComOffline('instalacoes', item.id, data, `Instalação de ${item.nome||''}`);
    if(error) return toast('Erro ao salvar: '+error.message,'error');
    if(queued){
      toast('📡 Sem internet — instalação salva localmente. Será enviada automaticamente ao reconectar.','info',5000);
      localStorage.removeItem(_draftKeyInst);
      closeModal();
      return;
    }

    // Auto-agenda régua de relacionamento quando data_instalacao é preenchida
    if(data.data_instalacao && !item.data_instalacao){
      const contrato = (State.contratos||[]).find(c=>String(c.id)===String(item.contrato_id));
      const nome = contrato?.nome || item.nome || '';
      const tel  = contrato?.telefone || item.telefone || '';
      const base = new Date(data.data_instalacao+'T12:00:00');
      const addD = (d) => { const dt=new Date(base); dt.setDate(dt.getDate()+d); return dt.toISOString().slice(0,10); };
      const tiposDias = [['5dias',5],['30dias',30],['90dias',90],['180dias',180],['300dias',300]];
      const agendaRows = tiposDias.map(([tipo,dias])=>({
        contrato_id: item.contrato_id, instalacao_id: item.id,
        cliente_nome: nome, cliente_telefone: tel,
        tipo, data_disparo: addD(dias), status:'pendente'
      }));
      await supa.from('relacionamento_agenda').insert(agendaRows);
    }

    const mud = detectMudancas(item, data, [
      ['status','Status', v=>statusInstMap[v]||v],
      ['tecnico','Técnico',null], ['data_instalacao','Data Instalação',null],
    ]);
    const acao = mud.some(m=>m.startsWith('Status')) ? 'status' : 'atualizado';
    await registrarHistorico('instalacoes', item.id, acao, mud.length ? mud.join(' | ') : 'Dados atualizados');
    localStorage.removeItem(_draftKeyInst);
    toast('Salvo','success'); await loadAll(); closeModal(); renderPipeline();
  });
  $('#btnLaudoInst')?.addEventListener('click', ()=> openLaudoCampoModal(item));
  $('#delInstBtn')?.addEventListener('click', async ()=>{
    if(!await confirmDel('Excluir?')) return;
    await supa.from('instalacoes').delete().eq('id',item.id);
    toast('Excluído','success'); await loadAll(); closeModal(); renderPipeline();
  });
}

/* ============================================================
   LAUDO DE CAMPO — Wizard passo a passo
   ============================================================ */
function openLaudoCampoModal(item){
  const fotos = item.fotos || {};
  const ds = fotos._dados || {};

  // Pré-inicializa todas as categorias de foto possíveis
  const photoKeys = [
    'kit_placas','kit_inversores','kit_estrutura','kit_etiq_inv','kit_etiq_dl','kit_cabos',
    'agua_01','agua_02','agua_03','agua_04','agua_05','agua_06',
    'ater_inv','inv_instalado',
    'str_01','str_02','str_03','str_04','str_05','str_06',
    'str_07','str_08','str_09','str_10','str_11','str_12',
    'ti_f1','ti_f2','ti_f3','ti_tot','quadro_inv','ater_pad',
    'pad_inst','tp_f1','tp_f2','tp_f3','tp_tot','quadro_pad',
    'config_planta','geral_inst','video_inst','acabamento','placas_seg',
  ];
  const PHOTO_LABELS = {
    kit_placas:'Kit — Placas/Módulos', kit_inversores:'Kit — Inversores', kit_estrutura:'Kit — Estrutura',
    kit_etiq_inv:'Kit — Etiquetas Inversores', kit_etiq_dl:'Kit — Etiquetas Dataloggers', kit_cabos:'Kit — Cabos',
    agua_01:'Módulos — 1ª Água', agua_02:'Módulos — 2ª Água', agua_03:'Módulos — 3ª Água',
    agua_04:'Módulos — 4ª Água', agua_05:'Módulos — 5ª Água', agua_06:'Módulos — 6ª Água',
    ater_inv:'Aterramento do Inversor', inv_instalado:'Inversores Instalados',
    str_01:'String 01', str_02:'String 02', str_03:'String 03', str_04:'String 04',
    str_05:'String 05', str_06:'String 06', str_07:'String 07', str_08:'String 08',
    str_09:'String 09', str_10:'String 10', str_11:'String 11', str_12:'String 12',
    ti_f1:'Tensão Inv. — Fase 1', ti_f2:'Tensão Inv. — Fase 2', ti_f3:'Tensão Inv. — Fase 3', ti_tot:'Tensão Inv. — Total',
    quadro_inv:'Quadro do Inversor', ater_pad:'Aterramento do Padrão',
    pad_inst:'Instalação do Padrão', tp_f1:'Tensão Pad. — Fase 1', tp_f2:'Tensão Pad. — Fase 2',
    tp_f3:'Tensão Pad. — Fase 3', tp_tot:'Tensão Pad. — Total', quadro_pad:'Quadro do Padrão',
    config_planta:'Configuração da Planta', geral_inst:'Foto Geral', video_inst:'Vídeo Geral',
    acabamento:'Acabamento Tubular', placas_seg:'Placas de Segurança e Marketing',
  };
  const fs = {};
  photoKeys.forEach(k => fs[k] = (fotos[k]||[]).slice());

  // Coleta fotos de keys antigos/desconhecidos para reclassificação
  const ignoredKeys = new Set(['_dados', ...photoKeys]);
  const poolFotos = []; // [{url, fromKey}]
  Object.keys(fotos).forEach(k => {
    if(ignoredKeys.has(k)) return;
    const arr = Array.isArray(fotos[k]) ? fotos[k] : [];
    arr.forEach(item => {
      const obj = typeof item === 'string' ? {url:item, name:item.split('/').pop(), path:''} : item;
      if(obj?.url) poolFotos.push({obj, fromKey:k});
    });
  });

  let numAguas   = ds.num_aguas   || 1;
  let numStrings = ds.num_strings || 1;
  let step = 0;
  const STEPS = ['Identificação','Kit — Antes','Módulos','Elétrica','Padrão','Finalização'];

  // ── Rascunho do wizard (fotos, contadores, respostas, assinatura) ──
  const _draftKeyLaudo = `laudo_rascunho_${item.id}`;
  let _draftLaudoPendente = null;
  try{
    const saved = localStorage.getItem(_draftKeyLaudo);
    if(saved){
      const draft = JSON.parse(saved);
      const mins = Math.round((Date.now()-draft.ts)/60000);
      if(mins < 1440) _draftLaudoPendente = draft;
      else localStorage.removeItem(_draftKeyLaudo);
    }
  }catch(e){}

  const up = (label, key, arr) => fileUploadBlock(label, key, 'instalacoes', arr, true);
  const pad2 = n => String(n).padStart(2,'0');

  const aguaBlocks = () => [1,2,3,4,5,6].map(n =>
    `<div class="wz-agua" data-agua="${n}" style="${n<=numAguas?'':'display:none'}">
       ${up(`Módulos — ${pad2(n)}ª Água`, `agua_0${n}`, fs[`agua_0${n}`])}
     </div>`).join('');

  const strBlocks = () => [...Array(12)].map((_,i) => {
    const n=i+1; const key=`str_${pad2(n)}`;
    return `<div class="wz-str" data-str="${n}" style="${n<=numStrings?'':'display:none'}">
      ${up(`String ${pad2(n)} — Medição`, key, fs[key])}
    </div>`;
  }).join('');

  openModal(`
    <style>
    .wz-bar{display:flex;align-items:center;flex-wrap:wrap;gap:0;padding:10px 16px;background:var(--bg-alt);border-bottom:1px solid var(--border)}
    .wz-stp{display:flex;align-items:center;gap:5px;font-size:11px;white-space:nowrap;color:var(--text-muted)}
    .wz-stp.active{color:#6B21A8;font-weight:700}
    .wz-stp.done{color:#059669}
    .wz-num{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;background:var(--border);color:var(--text-muted);flex-shrink:0}
    .wz-stp.active .wz-num{background:#6B21A8;color:#fff}
    .wz-stp.done .wz-num{background:#059669;color:#fff}
    .wz-arr{color:var(--border);margin:0 3px;font-size:11px}
    .wz-panel{display:none}.wz-panel.active{display:block}
    .wz-title{font-size:15px;font-weight:700;color:#6B21A8;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e9d5ff}
    .wz-hint{font-size:12px;color:var(--text-muted);margin-bottom:14px;background:var(--bg-alt);padding:8px 12px;border-radius:6px;border-left:3px solid #6B21A8}
    .wz-sub{font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.07em;margin:18px 0 10px;padding-bottom:4px;border-bottom:1px dashed var(--border)}
    .wz-q{font-weight:600;font-size:13px;margin-bottom:8px;color:var(--text)}
    .wz-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .wz-pill{padding:6px 18px;border-radius:20px;font-size:13px;font-weight:600;cursor:pointer;border:2px solid var(--border);background:var(--bg);color:var(--text);transition:.15s}
    .wz-pill.sel{border-color:#6B21A8;background:#6B21A8;color:#fff}
    .wz-add{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:2px dashed #c4b5fd;background:transparent;color:#6B21A8;margin-bottom:10px}
    .wz-add:disabled{opacity:.4;cursor:default}
    .wz-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .sig-wrap{margin-bottom:18px}
    .sig-canvas{border:2px solid #c4b5fd;border-radius:8px;background:#fff;touch-action:none;cursor:crosshair;width:100%;max-width:700px;height:180px;display:block}
    </style>
    <div class="modal-header">
      <h2>📋 Laudo de Campo — ${esc(item.nome||'')}</h2>
      <button class="modal-close">×</button>
    </div>
    <form id="laudoFrm">
    <div class="wz-bar" id="wzBar"></div>
    <div id="draftBannerLaudo" style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin:10px 16px 0;display:${_draftLaudoPendente?'flex':'none'};align-items:center;justify-content:space-between;gap:12px;font-size:12px">
      <span>💾 <strong>Rascunho do laudo encontrado</strong>${_draftLaudoPendente?` — salvo há ${Math.max(1,Math.round((Date.now()-_draftLaudoPendente.ts)/60000))} min`:''}. Deseja continuar de onde parou?</span>
      <div style="display:flex;gap:8px;flex-shrink:0">
        <button type="button" id="draftRestoreBtnLaudo" class="btn btn-sm btn-primary">Continuar</button>
        <button type="button" id="draftDiscardBtnLaudo" class="btn btn-sm btn-secondary">Descartar</button>
      </div>
    </div>
    <div class="modal-body">

      <!-- Passo 0: Identificação -->
      <div class="wz-panel active" data-step="0">
        <div class="wz-title">👤 Identificação</div>
        <div class="form-grid">
          ${formField({label:'Instalador',name:'ld_inst',value:ds.instalador||item.tecnico||'',required:true,datalist:DL_TECNICO})}
          ${formField({label:'Data da Instalação',name:'ld_data',type:'date',value:ds.data||item.data_instalacao||''})}
          ${formField({label:'Hora Início',name:'ld_h_ini',type:'time',value:ds.hora_ini||''})}
          ${formField({label:'Hora Fim',name:'ld_h_fim',type:'time',value:ds.hora_fim||''})}
        </div>
        ${formField({label:'O titular do projeto está presente no local?',name:'ld_titular',type:'toggle',value:ds.titular_presente??true})}
        <div id="wzAcompDiv" style="${ds.titular_presente===false?'':'display:none'}">
          <div class="form-grid" style="margin-top:10px">
            ${formField({label:'Nome do Responsável Adulto',name:'ld_acomp_nome',value:ds.acomp_nome||'',placeholder:'Nome completo'})}
            ${formField({label:'CPF do Responsável',name:'ld_acomp_cpf',value:ds.acomp_cpf||'',placeholder:'000.000.000-00'})}
          </div>
        </div>

        ${poolFotos.length ? `
        <div class="wz-sub" style="margin-top:20px">📂 Fotos a Classificar (${poolFotos.length})</div>
        <div class="wz-hint">Clique na categoria de cada foto para organizá-la no laudo.</div>
        <div id="wzPool" style="display:flex;flex-wrap:wrap;gap:12px;margin-top:10px">
          ${poolFotos.map((p,i)=>`
            <div class="wz-pool-item" data-idx="${i}" style="display:flex;flex-direction:column;gap:6px;width:140px">
              <img src="${p.obj.url}" style="width:140px;height:100px;object-fit:cover;border-radius:6px;border:2px solid var(--border-color,#ddd)" onerror="this.style.opacity=0.3">
              <div style="font-size:11px;color:var(--text-muted,#888);text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${p.obj.name||''}">${p.obj.name||'sem nome'}</div>
              <select class="form-control wz-pool-sel" data-idx="${i}" style="font-size:12px">
                <option value="">— sem categoria —</option>
                ${Object.entries(PHOTO_LABELS).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>

      <!-- Passo 1: Kit (Antes) -->
      <div class="wz-panel" data-step="1">
        <div class="wz-title">📦 Kit — Antes da Instalação</div>
        <div class="wz-hint">Fotografe o kit antes de iniciar. Registre quantidade e condições dos materiais.</div>
        ${up('Placas / Módulos','kit_placas',fs.kit_placas)}
        ${up('Inversores','kit_inversores',fs.kit_inversores)}
        ${up('Estrutura','kit_estrutura',fs.kit_estrutura)}
        ${up('Etiquetas dos Inversores','kit_etiq_inv',fs.kit_etiq_inv)}
        ${up('Etiquetas dos Dataloggers','kit_etiq_dl',fs.kit_etiq_dl)}
        ${up('Cabos','kit_cabos',fs.kit_cabos)}
      </div>

      <!-- Passo 2: Módulos -->
      <div class="wz-panel" data-step="2">
        <div class="wz-title">☀️ Módulos Instalados</div>
        <div class="wz-q">Quantas águas (orientações do telhado) foram utilizadas?</div>
        <div class="wz-pills" id="wzAguaPills">
          ${[1,2,3,4,5,6].map(n=>`<button type="button" class="wz-pill${numAguas===n?' sel':''}" data-n="${n}">${n}</button>`).join('')}
        </div>
        <div id="wzAguaBlocks">${aguaBlocks()}</div>
      </div>

      <!-- Passo 3: Elétrica -->
      <div class="wz-panel" data-step="3">
        <div class="wz-title">⚡ Elétrica e Inversores</div>
        ${up('Aterramento do Inversor','ater_inv',fs.ater_inv)}
        ${up('Inversores Instalados — Ligados e Funcionando','inv_instalado',fs.inv_instalado)}

        <div class="wz-sub">Teste por String</div>
        <div id="wzStrBlocks">${strBlocks()}</div>
        <button type="button" class="wz-add" id="wzAddStr" ${numStrings>=12?'disabled':''}>+ Adicionar String</button>

        <div class="wz-sub">Tensão no Disjuntor do Inversor</div>
        <div class="wz-g2">
          ${up('Fase 1','ti_f1',fs.ti_f1)}
          ${up('Fase 2','ti_f2',fs.ti_f2)}
          ${up('Fase 3 (quando houver)','ti_f3',fs.ti_f3)}
          ${up('Total','ti_tot',fs.ti_tot)}
        </div>
        ${up('Quadro de Distribuição do Inversor (Disjuntor e DPS)','quadro_inv',fs.quadro_inv)}
        ${up('Aterramento do Padrão','ater_pad',fs.ater_pad)}
      </div>

      <!-- Passo 4: Padrão -->
      <div class="wz-panel" data-step="4">
        <div class="wz-title">🔌 Padrão de Entrada</div>
        ${formField({label:'Houve mudança do padrão?',name:'ld_mud_pad',type:'toggle',value:ds.mudanca_padrao||false})}
        <div id="wzPadArea" style="${ds.mudanca_padrao?'':'display:none'}">
          ${up('Instalação do Padrão','pad_inst',fs.pad_inst)}
          <div class="wz-sub">Tensão no Disjuntor do Padrão</div>
          <div class="wz-g2">
            ${up('Fase 1','tp_f1',fs.tp_f1)}
            ${up('Fase 2','tp_f2',fs.tp_f2)}
            ${up('Fase 3 (quando houver)','tp_f3',fs.tp_f3)}
            ${up('Total','tp_tot',fs.tp_tot)}
          </div>
          ${up('Quadro de Distribuição do Padrão (Disjuntor e DPS)','quadro_pad',fs.quadro_pad)}
        </div>
      </div>

      <!-- Passo 5: Finalização -->
      <div class="wz-panel" data-step="5">
        <div class="wz-title">✅ Configuração e Registros Finais</div>
        ${formField({label:'O inversor foi configurado?',name:'ld_inv_cfg',type:'toggle',value:ds.inv_configurado||false})}
        <div id="wzCfgArea" style="${ds.inv_configurado?'':'display:none'}">
          ${up('Print da Configuração da Planta','config_planta',fs.config_planta)}
        </div>
        ${up('Foto Geral da Instalação','geral_inst',fs.geral_inst)}
        ${up('Vídeo Geral da Instalação','video_inst',fs.video_inst)}
        ${up('Acabamento Tubular','acabamento',fs.acabamento)}
        ${up('Placas de Segurança e Marketing','placas_seg',fs.placas_seg)}

        <div class="wz-sub">✍️ Assinatura do Técnico Responsável <span style="color:#dc2626">*obrigatória</span></div>
        <div class="sig-wrap">
          <canvas id="sigTecnico" width="700" height="180" class="sig-canvas"></canvas>
          <button type="button" class="btn btn-sm btn-secondary" id="sigTecnicoClear" style="margin-top:6px">🧹 Limpar assinatura</button>
        </div>

        <div class="wz-sub">✍️ Assinatura do Cliente/Responsável <span style="color:#6b7280">(quando presente)</span></div>
        <div class="sig-wrap">
          <canvas id="sigCliente" width="700" height="180" class="sig-canvas"></canvas>
          <button type="button" class="btn btn-sm btn-secondary" id="sigClienteClear" style="margin-top:6px">🧹 Limpar assinatura</button>
        </div>
      </div>

    </div>
    <div class="modal-footer" style="justify-content:space-between">
      <button type="button" id="wzPrev" class="btn btn-secondary" style="display:none">← Anterior</button>
      <div style="display:flex;gap:8px">
        <button type="button" id="wzPDF" class="btn btn-secondary" style="display:none;background:linear-gradient(135deg,#6B21A8,#9333ea);color:#fff;border:none">📄 Gerar PDF</button>
        <button type="button" id="wzNext" class="btn btn-primary">Próximo →</button>
        <button type="button" id="wzSave" class="btn btn-primary" style="display:none">💾 Salvar Laudo</button>
      </div>
    </div>
    </form>
  `,'lg');

  const form = $('#laudoFrm');
  attachFileUploads(form, fs, {offline:true});

  // ── Assinatura digital (canvas touch/mouse) ──────────────
  function setupSignaturePad(canvasId, existingDataUrl){
    const canvas = document.getElementById(canvasId);
    if(!canvas) return null;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1a0a2e'; ctx.lineWidth = 2.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    let drawing = false, hasDrawn = false;
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      return { x: cx * canvas.width / r.width, y: cy * canvas.height / r.height };
    };
    const start = e => { drawing = true; hasDrawn = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const move  = e => { if(!drawing) return; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const end   = () => { drawing = false; };
    canvas.addEventListener('pointerdown', start);
    canvas.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    if(existingDataUrl){
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); hasDrawn = true; };
      img.src = existingDataUrl;
    }
    return {
      clear(){ ctx.clearRect(0, 0, canvas.width, canvas.height); hasDrawn = false; },
      isEmpty(){ return !hasDrawn; },
      toDataURL(){ return hasDrawn ? canvas.toDataURL('image/png') : null; },
    };
  }
  const sigTecnico = setupSignaturePad('sigTecnico', ds.assinatura_tecnico);
  const sigCliente = setupSignaturePad('sigCliente', ds.assinatura_cliente);
  $('#sigTecnicoClear')?.addEventListener('click', ()=> sigTecnico?.clear());
  $('#sigClienteClear')?.addEventListener('click', ()=> sigCliente?.clear());

  const renderBar = () => {
    $('#wzBar').innerHTML = STEPS.map((s,i)=>
      `<div class="wz-stp ${i<step?'done':i===step?'active':''}">
        <div class="wz-num">${i<step?'✓':i+1}</div><span>${s}</span>
       </div>${i<STEPS.length-1?'<span class="wz-arr">›</span>':''}`
    ).join('');
  };

  const showStep = n => {
    step = n;
    document.querySelectorAll('.wz-panel').forEach(p=>p.classList.toggle('active', Number(p.dataset.step)===n));
    $('#wzPrev').style.display = n>0?'':'none';
    $('#wzNext').style.display = n<STEPS.length-1?'':'none';
    $('#wzSave').style.display = n===STEPS.length-1?'':'none';
    $('#wzPDF').style.display  = n===STEPS.length-1?'':'none';
    renderBar();
    document.querySelector('#modalRoot .modal-body')?.scrollTo(0,0);
  };

  renderBar();

  // Água pills
  $('#wzAguaPills')?.addEventListener('click', e=>{
    const btn = e.target.closest('.wz-pill[data-n]');
    if(!btn) return;
    numAguas = Number(btn.dataset.n);
    document.querySelectorAll('.wz-pill[data-n]').forEach(b=>b.classList.toggle('sel', Number(b.dataset.n)===numAguas));
    document.querySelectorAll('.wz-agua[data-agua]').forEach(d=>d.style.display=Number(d.dataset.agua)<=numAguas?'':'none');
  });

  // Adicionar string
  $('#wzAddStr')?.addEventListener('click', ()=>{
    if(numStrings>=12) return;
    numStrings++;
    const blk = document.querySelector(`.wz-str[data-str="${numStrings}"]`);
    if(blk) blk.style.display='';
    if(numStrings>=12) { const b=$('#wzAddStr'); if(b) b.disabled=true; }
  });

  // Toggle titular
  form.querySelector('[name="ld_titular"]')?.addEventListener('change', e=>{
    $('#wzAcompDiv').style.display = e.target.checked ? 'none' : '';
  });

  // Toggle padrão
  form.querySelector('[name="ld_mud_pad"]')?.addEventListener('change', e=>{
    $('#wzPadArea').style.display = e.target.checked ? '' : 'none';
  });

  // Toggle configuração
  form.querySelector('[name="ld_inv_cfg"]')?.addEventListener('change', e=>{
    $('#wzCfgArea').style.display = e.target.checked ? '' : 'none';
  });

  // ── Fotos obrigatórias por etapa (itens críticos) ──────────
  const faltantesFoto = n => {
    const falt = [];
    if(n===1){
      if(!fs.kit_placas?.length) falt.push('Kit — Placas/Módulos');
      if(!fs.kit_inversores?.length) falt.push('Kit — Inversores');
    }
    if(n===2){
      for(let i=1;i<=numAguas;i++){ const k=`agua_0${i}`; if(!fs[k]?.length) falt.push(PHOTO_LABELS[k]); }
    }
    if(n===3){
      if(!fs.ater_inv?.length) falt.push('Aterramento do Inversor');
      if(!fs.inv_instalado?.length) falt.push('Inversores Instalados');
      for(let i=1;i<=numStrings;i++){ const k=`str_${pad2(i)}`; if(!fs[k]?.length) falt.push(PHOTO_LABELS[k]); }
    }
    if(n===4){
      if(form.querySelector('[name="ld_mud_pad"]')?.checked && !fs.pad_inst?.length) falt.push('Instalação do Padrão');
    }
    if(n===5){
      if(!fs.geral_inst?.length) falt.push('Foto Geral da Instalação');
    }
    return falt;
  };

  $('#wzNext')?.addEventListener('click', ()=>{
    const falt = faltantesFoto(step);
    if(falt.length){ toast('📷 Foto obrigatória faltando: '+falt.join(', '),'error',5000); return; }
    if(step<STEPS.length-1) showStep(step+1);
  });
  $('#wzPrev')?.addEventListener('click', ()=>{ if(step>0) showStep(step-1); });

  const buildDados = () => {
    const d = readForm(form);
    return {
      instalador: d.ld_inst, data: d.ld_data, hora_ini: d.ld_h_ini, hora_fim: d.ld_h_fim,
      titular_presente: d.ld_titular ?? true, acomp_nome: d.ld_acomp_nome||null, acomp_cpf: d.ld_acomp_cpf||null,
      num_aguas: numAguas, num_strings: numStrings,
      mudanca_padrao: d.ld_mud_pad||false, inv_configurado: d.ld_inv_cfg||false,
      assinatura_tecnico: sigTecnico?.toDataURL() || ds.assinatura_tecnico || null,
      assinatura_cliente: sigCliente?.toDataURL() || ds.assinatura_cliente || null,
    };
  };

  // ── Autosave do wizard: fotos, contadores de água/string, respostas e assinatura ──
  const _saveDraftLaudo = () => {
    try{
      localStorage.setItem(_draftKeyLaudo, JSON.stringify({
        ts: Date.now(),
        fs: JSON.parse(JSON.stringify(fs)),
        ld: buildDados(),
      }));
    }catch(e){ console.error('[_saveDraftLaudo erro]', e); }
  };
  let _draftTimerLaudo = null;
  const _agendaSaveDraftLaudo = () => { clearTimeout(_draftTimerLaudo); _draftTimerLaudo = setTimeout(_saveDraftLaudo, 1500); };
  form.addEventListener('input', _agendaSaveDraftLaudo);
  form.addEventListener('change', _agendaSaveDraftLaudo);
  const _draftIntervalLaudo = setInterval(_saveDraftLaudo, 8000); // cobre fotos/assinatura, que não disparam input/change do form
  document.querySelectorAll('#modalRoot .modal-close').forEach(btn=>btn.addEventListener('click', ()=>clearInterval(_draftIntervalLaudo)));

  document.getElementById('draftRestoreBtnLaudo')?.addEventListener('click', ()=>{
    if(!_draftLaudoPendente) return;
    clearInterval(_draftIntervalLaudo);
    const fotosMerged = { ...(item.fotos||{}), ...(_draftLaudoPendente.fs||{}), _dados: { ...ds, ...(_draftLaudoPendente.ld||{}) } };
    closeModal();
    openLaudoCampoModal({ ...item, fotos: fotosMerged });
  });
  document.getElementById('draftDiscardBtnLaudo')?.addEventListener('click', ()=>{
    localStorage.removeItem(_draftKeyLaudo);
    _draftLaudoPendente = null;
    const b = document.getElementById('draftBannerLaudo'); if(b) b.style.display='none';
  });

  const validarFinalizacao = () => {
    const falt = faltantesFoto(5);
    if(falt.length){ toast('📷 Foto obrigatória faltando: '+falt.join(', '),'error',5000); return false; }
    if(sigTecnico?.isEmpty() && !ds.assinatura_tecnico){ toast('✍️ Assinatura do técnico é obrigatória para concluir o laudo.','error',5000); return false; }
    return true;
  };

  // Reclassificação de fotos do pool
  $('#wzPool')?.addEventListener('change', e => {
    const sel = e.target.closest('.wz-pool-sel');
    if(!sel) return;
    const idx = Number(sel.dataset.idx);
    const key = sel.value;
    if(!key) return;
    const poolItem = poolFotos[idx];
    if(!poolItem) return;
    if(!fs[key]) fs[key] = [];
    const alreadyIn = fs[key].some(f => (f.url||f) === poolItem.obj.url);
    if(!alreadyIn) fs[key].push(poolItem.obj);
    // Marca o item do pool como classificado
    sel.closest('.wz-pool-item').style.opacity = '0.35';
    sel.disabled = true;
    // Atualiza thumbs do bloco destino se visível no DOM
    const destThumbs = form.querySelector(`[data-thumbs="${key}"]`);
    if(destThumbs) destThumbs.innerHTML = fs[key].map((f,i)=>thumbHtml(f,key,i)).join('');
  });

  $('#wzSave')?.addEventListener('click', async ()=>{
    if(!validarFinalizacao()) return;
    const laudoDados = buildDados();
    const fotosData = { ...item.fotos, ...fs, _dados: laudoDados };
    const { queued, error } = await salvarComOffline('instalacoes', item.id, { fotos: fotosData }, `Laudo de ${item.nome||''}`);
    if(error) return toast('Erro ao salvar: '+error.message,'error');
    clearInterval(_draftIntervalLaudo);
    localStorage.removeItem(_draftKeyLaudo);
    if(queued){
      toast('📡 Sem internet — laudo salvo localmente. Será enviado automaticamente ao reconectar.','info',5000);
      closeModal();
      return;
    }
    await registrarHistorico('instalacoes', item.id, 'atualizado', 'Laudo de campo atualizado');
    toast('Laudo salvo!','success');
    await loadAll(); closeModal();
  });

  $('#wzPDF')?.addEventListener('click', ()=>{
    if(!validarFinalizacao()) return;
    abrirInstalacaoLaudo({ ...item }, buildDados(), fs);
  });
}

/* ============================================================
   LAUDO DE INSTALAÇÃO — PDF
   ============================================================ */
function abrirInstalacaoLaudo(item, ld, fs){
  const _e = s => String(s==null?'':s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const txt = x => _e(x)||'—';
  const dt  = d => d ? new Date(d+'T12:00:00').toLocaleDateString('pt-BR') : '—';
  const bool= b => b ? 'Sim' : 'Não';
  const pad2= n => String(n).padStart(2,'0');

  const fotoSection = (title, pairs) => {
    const toUrl = u => typeof u === 'string' ? u : u?.url || '';
    const imgs = pairs.flatMap(([arr,lbl])=>(arr||[]).map(u=>
      `<div class="fi"><img src="${toUrl(u)}" onerror="this.style.display='none'"><div class="fl">${lbl}</div></div>`
    )).join('');
    if(!imgs) return '';
    return `<div class="fsub">${title}</div><div class="fg">${imgs}</div>`;
  };

  const win = window.open('','_blank');
  if(!win){ alert('Popup bloqueado. Permita popups para este site.'); return; }
  win.document.write(`<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8">
<title>Laudo de Instalação — ${esc(item.nome||'')}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;background:#f0eaf8;color:#111;padding:20px}
.pbar{position:sticky;top:0;z-index:100;background:#fff;padding:10px 20px;border-bottom:2px solid #4B0082;display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.pbar span{font-size:13px;color:#4B0082;font-weight:700}
.pbar button{background:#4B0082;color:#fff;border:none;padding:7px 18px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600}
.wrap{max-width:820px;margin:0 auto;background:#fff;padding:36px 44px;box-shadow:0 2px 16px rgba(0,0,0,.1)}
.dh{text-align:center;margin-bottom:20px}
.dh img{height:56px;display:block;margin:0 auto 10px}
.dh h1{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#1a0a2e}
.dh .sub{font-size:10px;color:#666;margin-top:4px;letter-spacing:.06em;text-transform:uppercase}
hr{border:none;border-top:2px solid #6B21A8;margin:14px 0 20px}
.id{background:#f5f0fc;border-left:4px solid #6B21A8;border-radius:6px;padding:14px 18px;margin-bottom:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 16px;font-size:11.5px}
.id .lb{font-weight:600;color:#4B0082;font-size:10px;text-transform:uppercase;letter-spacing:.05em}
.id .vl{color:#1a0a2e;margin-top:1px}
h2{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#4B0082;padding:5px 0 4px;border-bottom:1px solid #c4b5fd;margin:20px 0 10px}
.fg{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.fi{break-inside:avoid;page-break-inside:avoid}
.fi img{width:100%;height:130px;object-fit:cover;border-radius:6px;border:1px solid #ddd;display:block}
.fl{font-size:9px;text-align:center;color:#6b5f7a;margin-top:3px;text-transform:uppercase;letter-spacing:.05em;font-weight:600}
.fsub{font-weight:700;font-size:10px;color:#4B0082;text-transform:uppercase;letter-spacing:.06em;margin:14px 0 8px;border-bottom:1px dashed #c4b5fd;padding-bottom:4px}
.obs{background:#f5f0fc;border-radius:6px;padding:12px 16px;font-size:12px;line-height:1.7;white-space:pre-wrap;margin-top:8px}
@media print{body{background:#fff;padding:0}.wrap{box-shadow:none;padding:24px 32px}.pbar{display:none!important}.fg{gap:6px}.fi img{height:100px}}
</style></head><body>
<div class="pbar">
  <span>SER Energia — Laudo de Instalação Técnica</span>
  <button onclick="window.print()">🖨️ Imprimir / Salvar PDF</button>
</div>
<div class="wrap">
<div class="dh">
  <img src="https://crm.serenergiarenovavel.com.br/logo.png" alt="SER"/>
  <h1>Laudo de Instalação Técnica</h1>
  <div class="sub">SER Energia Renovável · CNPJ 58.656.750/0001-04</div>
</div>
<hr/>
<div class="id">
  <div><div class="lb">Cliente</div><div class="vl"><strong>${txt(item.nome)}</strong></div></div>
  <div><div class="lb">Data Instalação</div><div class="vl">${dt(ld.data||item.data_instalacao)}</div></div>
  <div><div class="lb">Instalador</div><div class="vl">${txt(ld.instalador||item.tecnico)}</div></div>
  <div><div class="lb">Hora Início</div><div class="vl">${txt(ld.hora_ini)}</div></div>
  <div><div class="lb">Hora Fim</div><div class="vl">${txt(ld.hora_fim)}</div></div>
  <div><div class="lb">kWp</div><div class="vl">${txt(item.kwp)}</div></div>
  <div><div class="lb">Titular Presente</div><div class="vl">${bool(ld.titular_presente)}</div></div>
  <div style="grid-column:span 2"><div class="lb">Acompanhante</div><div class="vl">${txt(ld.acomp_nome)}${ld.acomp_cpf?' — CPF: '+ld.acomp_cpf:''}</div></div>
  ${item.endereco?`<div style="grid-column:span 3"><div class="lb">Endereço</div><div class="vl">${txt(item.endereco)}</div></div>`:''}
</div>

${(()=>{
  const kitAntes = [
    [fs.kit_placas,'Placas/Módulos'],[fs.kit_inversores,'Inversores'],
    [fs.kit_estrutura,'Estrutura'],[fs.kit_etiq_inv,'Etiquetas Inversores'],
    [fs.kit_etiq_dl,'Etiquetas Dataloggers'],[fs.kit_cabos,'Cabos'],
  ].filter(([a])=>a?.length);
  return kitAntes.length ? `<h2>📦 Kit — Antes da Instalação</h2>${fotoSection('',kitAntes)}` : '';
})()}

${(()=>{
  const aguaSecs = [...Array(ld.num_aguas||1)].map((_,i)=>{
    const n=i+1; const arr=fs[`agua_0${n}`];
    return arr?.length ? [[arr,`${pad2(n)}ª Água`]] : [];
  }).flat();
  return aguaSecs.length ? `<h2>☀️ Módulos — Por Água</h2>${aguaSecs.map(([a,l])=>fotoSection(l,[[a,'']])).join('')}` : '';
})()}

${(()=>{
  let html = '';
  if(fs.ater_inv?.length) html += fotoSection('Aterramento do Inversor',[[fs.ater_inv,'']]);
  if(fs.inv_instalado?.length) html += fotoSection('Inversores Instalados',[[fs.inv_instalado,'']]);
  const strs = [...Array(ld.num_strings||1)].map((_,i)=>{
    const n=i+1; const arr=fs[`str_${pad2(n)}`];
    return arr?.length ? [[arr,`String ${pad2(n)}`]] : [];
  }).flat();
  if(strs.length) html += fotoSection('Strings — Medição',strs);
  const tensInv = [[fs.ti_f1,'Fase 1'],[fs.ti_f2,'Fase 2'],[fs.ti_f3,'Fase 3'],[fs.ti_tot,'Total']].filter(([a])=>a?.length);
  if(tensInv.length) html += fotoSection('Tensão — Disjuntor Inversor',tensInv);
  if(fs.quadro_inv?.length) html += fotoSection('Quadro do Inversor',[[fs.quadro_inv,'']]);
  if(fs.ater_pad?.length) html += fotoSection('Aterramento do Padrão',[[fs.ater_pad,'']]);
  return html ? `<h2>⚡ Elétrica e Inversores</h2>${html}` : '';
})()}

${ld.mudanca_padrao?(()=>{
  let html = '';
  if(fs.pad_inst?.length) html += fotoSection('Instalação do Padrão',[[fs.pad_inst,'']]);
  const tensPad = [[fs.tp_f1,'Fase 1'],[fs.tp_f2,'Fase 2'],[fs.tp_f3,'Fase 3'],[fs.tp_tot,'Total']].filter(([a])=>a?.length);
  if(tensPad.length) html += fotoSection('Tensão — Disjuntor Padrão',tensPad);
  if(fs.quadro_pad?.length) html += fotoSection('Quadro do Padrão',[[fs.quadro_pad,'']]);
  return html ? `<h2>🔌 Padrão de Entrada</h2>${html}` : '';
})():''}

${(()=>{
  let html = '';
  if(ld.inv_configurado && fs.config_planta?.length) html += fotoSection('Configuração da Planta',[[fs.config_planta,'']]);
  if(fs.geral_inst?.length) html += fotoSection('Foto Geral',[[fs.geral_inst,'']]);
  if(fs.video_inst?.length) html += fotoSection('Vídeo Geral',[[fs.video_inst,'']]);
  if(fs.acabamento?.length) html += fotoSection('Acabamento Tubular',[[fs.acabamento,'']]);
  if(fs.placas_seg?.length) html += fotoSection('Placas de Segurança e Marketing',[[fs.placas_seg,'']]);
  // Fotos antigas (fotos.geral) — inclui sempre, são as fotos da instalação
  const geralAntigo = item.fotos?.geral||[];
  if(geralAntigo.length) html += fotoSection('Fotos da Instalação', [[geralAntigo,'']]);
  return html ? `<h2>✅ Registros Finais</h2>${html}` : '';
})()}

${item.obs?`<h2>📝 Observações</h2><div class="obs">${esc(item.obs)}</div>`:''}

${(ld.assinatura_tecnico||ld.assinatura_cliente)?`<h2>✍️ Assinaturas</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:6px">
  ${ld.assinatura_tecnico?`<div><img src="${ld.assinatura_tecnico}" style="width:100%;max-width:320px;border-bottom:2px solid #4B0082;padding-bottom:4px"><div style="font-size:10px;text-align:center;color:#6b5f7a;margin-top:4px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Técnico Responsável — ${txt(ld.instalador)}</div></div>`:''}
  ${ld.assinatura_cliente?`<div><img src="${ld.assinatura_cliente}" style="width:100%;max-width:320px;border-bottom:2px solid #4B0082;padding-bottom:4px"><div style="font-size:10px;text-align:center;color:#6b5f7a;margin-top:4px;text-transform:uppercase;letter-spacing:.05em;font-weight:600">Cliente/Responsável no Local</div></div>`:''}
</div>`:''}

</div></body></html>`);
  win.document.close();
}

