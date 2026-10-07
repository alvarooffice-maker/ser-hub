/* ============================================================
   SISTEMA SER - CRM SOLAR COMPLETO
   ============================================================ */

const SURL = 'https://aickvgjrieeirybtqemh.supabase.co';
const SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpY2t2Z2pyaWVlaXJ5YnRxZW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDQ1NjUsImV4cCI6MjA5MzIyMDU2NX0.FS1K-oI3iAYgmqjH9LH3DKFVdEOiIPfUD1KnbU78uuE';
const supa = supabase.createClient(SURL, SKEY, { auth:{ persistSession:true, autoRefreshToken:true } });

// Chama a Edge Function admin-api com verificação de perfil no servidor
async function adminApi(action, params = {}) {
  const { data:{ session } } = await supa.auth.getSession();
  const res = await fetch(`${SURL}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ action, ...params }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Erro na operação');
  return json;
}

const State = {
  user:null, profile:null, route:'dashboard',
  leads:[], propostas:[], vistorias:[], contratos:[], logistica:[], instalacoes:[], homologacoes:[], posvenda:[], atendimentos:[], appman:[],
  remarketing:[], comissoes:[], receitas:[], despesas:[], cadastros:[], perfis:[],
  tentativas_contato:[], metas:[], metas_vendedores:[],
  charts:{}
};

const $ = (sel,root=document)=>root.querySelector(sel);
const $$ = (sel,root=document)=>Array.from(root.querySelectorAll(sel));
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const fmtBRL = v => (Number(v)||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
// Normaliza nome para agrupamento: remove acentos, minúsculo, espaços extras
const normName = s => (s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
// Chave de ranking: ignora partículas (da/de/do/dos) e usa primeiro + último nome
// "Rogerio da Costa Barbosa" → "rogerio barbosa" (igual a "Rogerio Barbosa")
const _PARTICLES = new Set(['da','de','do','das','dos','e','van','von','di','del']);
const normNameRank = s => {
  const parts = normName(s).split(' ').filter(Boolean);
  const sig = parts.filter(p => !_PARTICLES.has(p));
  if(sig.length <= 1) return sig.join(' ');
  return sig[0] + ' ' + sig[sig.length-1];
};
// Agrupa array de objetos por campo normalizado, retorna [{key, display, items}]
function groupByNorm(arr, field){
  const map = new Map(); // normKey → { display: string, items: [] }
  arr.forEach(obj=>{
    const raw = obj[field] || '—';
    const key = normName(raw);
    if(!map.has(key)) map.set(key, { display: raw, count: 0, items: [] });
    const entry = map.get(key);
    entry.items.push(obj);
    entry.count++;
    // Prefer the version that appears most often (just keep first for now; refine if needed)
  });
  return [...map.entries()].map(([key,{display,items}])=>({ key, display, items }));
}
const fmtNum = (v,d=2) => (Number(v)||0).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d});
// Converte "1.500,50" → 1500.5 (aceita digitação brasileira com vírgula)
const parseBR = v => { if(v==null||v==='') return null; const s=String(v).replace(/[^\d,.\-]/g,'').replace(/\./g,'').replace(',','.'); const n=parseFloat(s); return isNaN(n)?null:n; };
// Formata número para exibir em input (ex: 1500.5 → "1500,5")
const fmtInputNum = v => { if(v==null||v===''||v===undefined) return ''; const n=parseFloat(v); if(isNaN(n)||n===0) return ''; return String(n).replace('.',','); };
const fmtDate = d => d ? new Date(d+ (String(d).length===10?'T00:00:00':'')).toLocaleDateString('pt-BR') : '';
const fmtDateTime = d => d ? new Date(d).toLocaleString('pt-BR') : '';
const today = ()=>{ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

/* ── Listas pré-estabelecidas para evitar erros de digitação ── */
const DL_MARCA_MODULO  = ['Canadian Solar','JA Solar','LONGi','BYD','DAH Solar','Risen Energy','Jinko Solar','Trina Solar','Tsun','Astronergy','Tongwei Solar','Leapton','Pulling Energy','Osda','Ronma','Hanersun','Maxeon','Renepv','Aiko','Gokin','Dmegc','Era Solar','Haitai','Sine Energy','N Plus','S.SPACE','Toptec','ZNSHINE'];
const DL_MARCA_INVERSOR= ['Auxsol','Chint Power','Deye','Fox ESS','Fronius','GoodWe','Growatt','Huawei','Híbrido Deye','Híbrido Goodwe','Híbrido Growatt','Híbrido Huawei','Híbrido Solis','Híbrido Solplanet','Micro Deye','Micro Goodwe','Micro Saj','Micro Tsuness','SAJ','SOFAR','Solis','Solplanet','Sungrow','Tsuness'];
const DL_MARCA_BATERIA = ['BYD','Pylontech','Dyness','Alpha-ESS','Fox ESS','Growatt','Deye','Solplanet','GoodWe','Huawei'];
const DL_POT_MODULO    = ['400','410','420','430','440','450','460','470','480','490','500','510','520','530','540','550','560','570','580','585','590','600','610','620','630','640','650','660','670','680','690','700','710'];
const DL_POT_INVERSOR  = ['1,5','2','3','3,3','3,5','3,6','4','5','6','7','8','10','12','15','17','20','25','30','33','36','40','50','60','75'];
const DL_POT_BATERIA   = ['2,56','5','5,12','7,1','10','10,24','14,2','20'];
const DL_BANCO         = ['BV Financeira','Santander Financiamentos','Sicoob','Sicredi','Portocred','PortoBank','Solfácil','Sol Agora','Creditas','BNB','Caixa Econômica','Bradesco','Banco do Brasil','77Sol','BTG','BanPará'];
const DL_DISTRIBUIDORA = ['Aldo Solar','Greener','Canal Solar','Renovigi','WEG','Intelbras','EcoSolys','DFV Solar','BlueSol','Solar Premium','FortLev','SouEnergy','Fotus','Solfácil','77Sol','BelSol','Soollar','JNG'];
let DL_TECNICO         = ['CMD','3L Soluções','Paulo Adriano','Michel Darlan']; // atualizado dinamicamente em loadAll()
const uid = ()=> 'id_'+Math.random().toString(36).slice(2,11);

function toast(msg,type='info',ms=3200){
  const stack = $('#toastStack');
  const t = document.createElement('div');
  t.className = 'toast '+type;
  t.textContent = msg;
  stack.appendChild(t);
  setTimeout(()=>{ t.style.transition='opacity .25s,transform .25s'; t.style.opacity='0'; t.style.transform='translateX(40px)'; setTimeout(()=>t.remove(),250); }, ms);
}

/* ============================================================
   FILA OFFLINE — permite salvar formulários sem internet
   (técnicos em campo) e sincronizar automaticamente ao reconectar
   ============================================================ */
const OFFLINE_QUEUE_KEY = 'ser_offline_queue';
function getOfflineQueue(){ try{ return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)||'[]'); }catch(e){ return []; } }
function setOfflineQueue(q){
  try{ localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q)); }catch(e){}
  updateOfflineBadge();
}
function updateOfflineBadge(){
  const n = getOfflineQueue().length;
  const el = document.getElementById('offlineBadge');
  if(!el) return;
  if(n>0){ el.style.display=''; el.textContent = `📡 ${n} registro${n>1?'s':''} pendente${n>1?'s':''} de sincronização`; }
  else el.style.display='none';
}
function isNetworkError(e){
  const m = (e && e.message || '').toLowerCase();
  return !navigator.onLine || m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed');
}
// Salva um UPDATE com resiliência a offline: se não houver conexão, enfileira e sincroniza depois.
async function salvarComOffline(table, recordId, data, label, onSyncedExtra){
  if(!navigator.onLine){
    const q = getOfflineQueue();
    q.push({ id: uid(), table, recordId, data, label: label||table, ts: Date.now() });
    setOfflineQueue(q);
    return { queued:true, error:null };
  }
  try{
    const usados = [];
    const dadosFinais = await resolverArquivosPendentes(data, usados);
    const { error } = await supa.from(table).update(dadosFinais).eq('id', recordId);
    if(error) throw error;
    for(const id of usados) await _idbOp('readwrite', s=>s.delete(id)).catch(()=>{});
    return { queued:false, error:null };
  }catch(e){
    if(isNetworkError(e)){
      const q = getOfflineQueue();
      q.push({ id: uid(), table, recordId, data, label: label||table, ts: Date.now() });
      setOfflineQueue(q);
      return { queued:true, error:null };
    }
    return { queued:false, error:e };
  }
}
let _sincronizandoFila = false;
async function sincronizarFilaOffline(){
  if(_sincronizandoFila) return;
  const q = getOfflineQueue();
  if(!q.length || !navigator.onLine) return;
  _sincronizandoFila = true;
  let sincronizados = 0;
  const restantes = [];
  for(const it of q){
    try{
      const usados = [];
      const dadosFinais = await resolverArquivosPendentes(it.data, usados);
      it.data = dadosFinais; // se o update falhar, a fila já guarda as URLs definitivas
      const { error } = await supa.from(it.table).update(dadosFinais).eq('id', it.recordId);
      if(error) throw error;
      for(const id of usados) await _idbOp('readwrite', s=>s.delete(id)).catch(()=>{});
      sincronizados++;
      // Pós-processamento específico de vistoria (cascata aprovado→contrato / reprovado→remarketing)
      if(it.table==='vistorias'){ await posSyncVistoria(it.recordId, it.data).catch(()=>{}); }
      if(it.table==='instalacoes'){ await posSyncInstalacao(it.recordId, it.data).catch(()=>{}); }
    }catch(e){
      restantes.push(it);
    }
  }
  setOfflineQueue(restantes);
  _sincronizandoFila = false;
  if(sincronizados>0){
    toast(`✅ ${sincronizados} registro${sincronizados>1?'s':''} sincronizado${sincronizados>1?'s':''} (offline → online)`,'success',4000);
    await loadAll();
  }
}
window.addEventListener('online', sincronizarFilaOffline);
window.addEventListener('load', ()=>{ updateOfflineBadge(); carregarPreviewsPendentes().catch(()=>{}); setTimeout(sincronizarFilaOffline, 2000); });
setInterval(()=>{ if(navigator.onLine) sincronizarFilaOffline(); }, 30000);
document.addEventListener('click', e=>{ if(e.target.closest('#offlineBadge')) sincronizarFilaOffline(); });

function badge(value){
  if(value==null||value==='') return '';
  const v = String(value).toLowerCase().replace(/\s+/g,'_');
  return `<span class="badge badge-${v}">${esc(String(value).replace(/_/g,' '))}</span>`;
}

async function confirmDel(msg='Confirma exclusão?'){ return confirm(msg); }

function isAdmin(){ return State.profile?.perfil === 'admin'; }
function isVend(){ return State.profile?.perfil === 'vendedor'; }
function userRole(){ return State.profile?.perfil; }
function canVerFinanceiro(){ return ['admin','supervisor','financeiro'].includes(State.profile?.perfil); }
function isGestor(){ return ['alvaro.office@gmail.com','wellem.office@gmail.com'].includes(State.user?.email); }

function filterByVendor(arr, key='vendedor'){
  if(!isVend()) return arr;
  const name = (State.profile?.nome||'').toLowerCase();
  return arr.filter(r => (r[key]||'').toLowerCase() === name);
}

/* ============================================================
   AUTH
   ============================================================ */
async function checkSession(){
  const { data:{ session } } = await supa.auth.getSession();
  if(session){
    State.user = session.user;
    await loadProfile();
    showApp();
  } else {
    showLogin();
  }
}

async function loadProfile(){
  if(!State.user) return;
  const { data } = await supa.from('perfis').select('*').eq('email', State.user.email).maybeSingle();
  if(!data){
    const newP = { id: State.user.id, email: State.user.email, nome: State.user.email.split('@')[0], perfil:'vendedor', ativo:true };
    const { data:created } = await supa.from('perfis').insert(newP).select().maybeSingle();
    State.profile = created || newP;
  } else {
    State.profile = data;
  }
}

async function doLogin(email,password){
  const { data, error } = await supa.auth.signInWithPassword({ email, password });
  if(error) throw error;
  State.user = data.user;
  await loadProfile();
  if(State.profile && State.profile.ativo === false){
    await supa.auth.signOut();
    throw new Error('Usuário inativo. Contate o administrador.');
  }
  return true;
}

async function doLogout(){
  await supa.auth.signOut();
  State.user = null; State.profile = null;
  location.reload();
}

function showLogin(){
  $('#authScreen').style.display='flex';
  $('#app').classList.remove('active');
}

function showApp(){
  $('#authScreen').style.display='none';
  $('#app').classList.add('active');
  renderUser();
  renderNav();
  const roleRouteMap = { tec_vistoria:'vistoriador', tec_instalacao:'instalador', tec_vistoria_instalacao:'vistoriador', tec_homologacao:'homologador', vendedor:'home_vendedor', supervisor:'home_vendedor', admin:'home_vendedor' };
  const startRoute = roleRouteMap[userRole()] || 'dashboard';
  // Verifica cadastro completo antes de liberar o app
  if(perfilIncompleto(State.profile)){
    showCompletarCadastroModal(() => navigate(startRoute));
  } else {
    navigate(startRoute);
  }
}

function perfilIncompleto(p){
  if(!p) return false;
  if(p.perfil === 'admin') return false;
  return !p.telefone || !p.cpf || !p.endereco || !p.cep;
}

function showCompletarCadastroModal(onComplete){
  const p = State.profile || {};
  const root = $('#modalRoot');
  root.innerHTML = `
    <div class="modal" style="max-width:480px">
      <div class="modal-header" style="background:linear-gradient(135deg,#1A3A5C,#2E6B9E);color:#fff;border-radius:12px 12px 0 0">
        <h2 style="color:#fff;margin:0">📋 Complete seu cadastro</h2>
      </div>
      <form id="completarForm">
        <div class="modal-body">
          <div style="background:#fff8e1;border:1.5px solid #ffc107;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#795548">
            <strong>⚠️ Atenção:</strong> Para continuar usando o sistema, preencha todos os seus dados de cadastro abaixo.
          </div>
          <div class="form-grid">
            ${formField({label:'Nome completo',name:'nome',value:p.nome,required:true,readonly:true})}
            ${formField({label:'Email',name:'_email',value:p.email,readonly:true})}
            ${formField({label:'Telefone',name:'telefone',value:p.telefone,required:true,placeholder:'(91) 98407-7376'})}
            ${formField({label:'CPF',name:'cpf',value:p.cpf,required:true,placeholder:'000.000.000-00'})}
            ${formField({label:'Endereço completo',name:'endereco',value:p.endereco,required:true,full:true,placeholder:'Rua, nº, Complemento, Bairro, Cidade'})}
            ${formField({label:'CEP',name:'cep',value:p.cep,required:true,placeholder:'00000-000'})}
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary" style="width:100%">Salvar e continuar →</button>
        </div>
      </form>
    </div>`;
  root.classList.add('active');
  // Impede fechar clicando fora
  root.addEventListener('click', e => { if(e.target === root) e.stopPropagation(); }, true);

  root.querySelector('#completarForm').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = readForm(root.querySelector('#completarForm'));
    if(!fd.telefone || !fd.cpf || !fd.endereco || !fd.cep){
      toast('Preencha todos os campos obrigatórios.','error'); return;
    }
    const { error } = await supa.from('perfis').update({
      telefone: fd.telefone,
      cpf:      fd.cpf,
      endereco: fd.endereco,
      cep:      fd.cep,
    }).eq('email', State.user.email);
    if(error){
      alert('Erro ao salvar cadastro: ' + error.message + '\n\nContate o administrador.');
      return;
    }
    State.profile.telefone = fd.telefone;
    State.profile.cpf      = fd.cpf;
    State.profile.endereco = fd.endereco;
    State.profile.cep      = fd.cep;
    root.classList.remove('active');
    root.innerHTML = '';
    toast('Cadastro completo! Bem-vindo(a) 🎉','success');
    onComplete();
  });
}

function renderUser(){
  const p = State.profile;
  if(!p) return;
  $('#userName').textContent = p.nome || p.email;
  $('#userRole').textContent = (p.perfil||'').replace('_',' ');
  $('#userAvatar').textContent = (p.nome||p.email||'U').substring(0,1).toUpperCase();
}

/* ============================================================
   NAVIGATION
   ============================================================ */
const ROUTES = [
  { id:'home_vendedor', label:'Home Vendedor', icon:'🌟' },
  { id:'dashboard', label:'Dashboard', icon:'📊' },
  { id:'calendario', label:'Calendário', icon:'📅' },
  { id:'clientes', label:'Clientes', icon:'👤' },
  { id:'pipeline', label:'Pipeline', icon:'🏠' },
  { id:'vistoriador', label:'Minhas Vistorias', icon:'🔍' },
  { id:'instalador', label:'Minhas Instalações', icon:'🔧' },
  { id:'homologador', label:'Minhas Homologações', icon:'📋' },
  { id:'reservico', label:'Re-Serviço', icon:'🛠️' },
  { id:'appmanutencao', label:'App/Manutenção', icon:'📱' },
  { id:'remarketing', label:'Remarketing', icon:'🔁' },
  { id:'baterias', label:'Calculadora de Baterias', icon:'🔋' },
  { id:'disparador', label:'Disparador de Mensagens', icon:'💬' },
  { id:'posvenda_rel', label:'Relatório Pós-Venda', icon:'📬', section:'RELATÓRIOS' },
  { id:'custo_projeto', label:'Custo por Projeto', icon:'💰', section:'GESTÃO' },
  { id:'financeiro', label:'Financeiro', icon:'📈', section:'GESTÃO' },
  { id:'cadastros', label:'Cadastros', icon:'👥', section:'GESTÃO' },
  { id:'usuarios', label:'Usuários', icon:'🔐', section:'GESTÃO', adminOnly:true },
  { id:'gestao_custos', label:'Gestão de Custos', icon:'📊', section:'GESTÃO' },
  { id:'monitoramento', label:'Monitoramento Solar', icon:'⚡', section:'GESTÃO', adminOnly:true }
];

function visibleRoutes(){
  const role = userRole();
  return ROUTES.filter(r=>{
    if(r.adminOnly && !['admin','supervisor'].includes(role)) return false;
    if(r.id==='gestao_custos') return isGestor();
    if(role==='financeiro') return ['dashboard','calendario','clientes','custo_projeto','financeiro'].includes(r.id);
    if(role==='vendedor') return ['home_vendedor','dashboard','calendario','clientes','pipeline','reservico','appmanutencao','remarketing','baterias','disparador','posvenda_rel'].includes(r.id);
    if(role==='tec_vistoria') return ['dashboard','calendario','clientes','vistoriador','reservico','appmanutencao'].includes(r.id);
    if(role==='tec_instalacao') return ['dashboard','calendario','clientes','instalador','reservico','appmanutencao'].includes(r.id);
    if(role==='tec_homologacao') return ['dashboard','calendario','clientes','homologador'].includes(r.id);
    if(role==='tec_vistoria_instalacao') return ['dashboard','calendario','clientes','vistoriador','instalador','reservico','appmanutencao'].includes(r.id);
    if(['vistoriador','instalador','homologador'].includes(r.id)) return false; // oculto para outros perfis
    return true;
  });
}

function calcLeadsParados(dias=3){
  const corte = new Date(Date.now()-dias*24*60*60*1000);
  const meuLeads = filterByVendor(State.leads||[]);
  return meuLeads.filter(l=>l.status==='em_contato' && new Date(l.atualizado_em||l.criado_em) < corte);
}

function renderNav(){
  const nav = $('#nav');
  const items = visibleRoutes();
  const parados = calcLeadsParados(3).length;
  let html=''; let lastSec='__';
  items.forEach(r=>{
    if(r.section && r.section!==lastSec){
      html += `<div class="nav-section">${r.section}</div>`;
      lastSec = r.section;
    }
    const badgeHtml = (r.id==='pipeline' && parados>0)
      ? `<span style="margin-left:auto;background:#e53e3e;color:#fff;border-radius:10px;font-size:10px;font-weight:700;padding:1px 6px;min-width:18px;text-align:center">${parados}</span>`
      : '';
    html += `<div class="nav-item" data-route="${r.id}"><span class="icon">${r.icon}</span><span class="label">${r.label}</span>${badgeHtml}</div>`;
  });
  nav.innerHTML = html;
  $$('.nav-item', nav).forEach(el => el.addEventListener('click', ()=> navigate(el.dataset.route)));
}

function navigate(route){
  State.route = route;
  $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.route === route));
  const r = ROUTES.find(x=>x.id===route);
  $('#pageTitle').textContent = r?.label || route;
  $('#pageActions').innerHTML = '';
  $('#content').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  // Pipeline: bloqueia scroll do .content para que cada coluna role individualmente
  document.querySelector('.content').style.overflow = ['pipeline','vistoriador','instalador','homologador','reservico','appmanutencao'].includes(route) ? 'hidden' : '';
  switch(route){
    case 'home_vendedor': renderHomeVendedor(); break;
    case 'dashboard': renderDashboard(); break;
    case 'calendario': renderCalendario(); break;
    case 'clientes': renderClientes(); break;
    case 'pipeline': renderPipeline(); break;
    case 'vistoriador': renderVistoriadorKanban(); break;
    case 'instalador': renderInstaladorKanban(); break;
    case 'homologador': renderHomologadorKanban(); break;
    case 'reservico': renderReservicoKanban(); break;
    case 'appmanutencao': renderAppManKanban(); break;
    case 'remarketing': renderRemarketing(); break;
    case 'baterias': renderBaterias(); break;
    case 'disparador': renderDisparador(); break;
    case 'custo_projeto': renderCustoPorProjeto(); break;
    case 'financeiro': renderFinanceiro(); break;
    case 'cadastros': renderCadastros(); break;
    case 'usuarios': renderUsuarios(); break;
    case 'posvenda_rel': renderRelatorioPosvenda(); break;
    case 'gestao_custos': renderGestaoCustos(); break;
    case 'monitoramento': renderMonitoramento(); break;
  }
}

/* ============================================================
   DATA LOADERS
   ============================================================ */
// Perfis: gestão lê tudo; demais perfis recebem só dados básicos (sem CPF/endereço/CEP/nascimento de terceiros)
async function selectPerfis(){
  if(['admin','supervisor','financeiro'].includes(State.profile?.perfil)) return supa.from('perfis').select('*').order('criado_em',{ascending:false});
  return supa.rpc('perfis_basico');
}
async function loadAll(){
  const tables = ['leads','propostas','vistorias','contratos','logistica','instalacoes','homologacoes','posvenda','atendimentos','app_manutencao','remarketing','comissoes','financeiro_receitas','financeiro_despesas','cadastros','perfis','tentativas_contato','metas','metas_vendedores','contratos_termos_aditivos','custos_fixos','relacionamento_agenda'];
  const stateMap = { financeiro_receitas:'receitas', financeiro_despesas:'despesas', app_manutencao:'appman', contratos_termos_aditivos:'termos_aditivos' };
  await Promise.all(tables.map(async t => {
    try{
      const { data, error } = t==='perfis' ? await selectPerfis() : await supa.from(t).select('*').order('criado_em',{ascending:false});
      if(error){ console.warn(t,error.message); return; }
      State[stateMap[t] || t] = data || [];
    }catch(e){ console.warn(t,e); }
  }));

  // Atualiza DL_TECNICO com os técnicos cadastrados no sistema
  const tecRoles = ['tec_vistoria','tec_instalacao','tec_homologacao','tec_vistoria_instalacao'];
  const tecsDoPerfil = (State.perfis||[])
    .filter(p => tecRoles.includes(p.perfil) && p.ativo !== false && p.nome)
    .map(p => p.nome);
  // Mantém nomes legados que não estejam no perfis
  const legado = ['CMD','3L Soluções','Paulo Adriano','Michel Darlan'];
  DL_TECNICO = [...new Set([...tecsDoPerfil, ...legado])];
}

async function loadTable(table){
  const stateMap = { financeiro_receitas:'receitas', financeiro_despesas:'despesas' };
  const { data, error } = table==='perfis' ? await selectPerfis() : await supa.from(table).select('*').order('criado_em',{ascending:false});
  if(error){ toast(error.message,'error'); return []; }
  State[stateMap[table] || table] = data || [];
  return State[stateMap[table] || table];
}

/* ============================================================
   DASHBOARD
   ============================================================ */
function getPeriodRange(period){
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  const toStr = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const end = toStr(now);
  switch(period){
    case 'dia': return [toStr(now), end];
    case 'mes': return [toStr(new Date(now.getFullYear(),now.getMonth(),1)), end];
    case 'trimestre': { const q=Math.floor(now.getMonth()/3); return [toStr(new Date(now.getFullYear(),q*3,1)),end]; }
    case 'semestre': { const h=Math.floor(now.getMonth()/6); return [toStr(new Date(now.getFullYear(),h*6,1)),end]; }
    case 'ano': return [toStr(new Date(now.getFullYear(),0,1)), end];
    default: return [null, null];
  }
}

async function renderHomeVendedor(){
  await Promise.all([loadTable('instalacoes'), loadTable('homologacoes'), loadTable('contratos')]);

  // Recorde instalação
  const instalEntries = (State.instalacoes||[])
    .filter(i=>i.status==='concluida'&&i.data_instalacao&&i.contrato_id)
    .map(i=>{
      const c=(State.contratos||[]).find(x=>String(x.id)===String(i.contrato_id));
      if(!c?.data_assinatura) return null;
      const d=Math.floor((new Date(i.data_instalacao)-new Date(c.data_assinatura))/86400000);
      return d>0?{d,nome:c.nome||'—'}:null;
    }).filter(Boolean);
  const recInstal = instalEntries.length ? instalEntries.reduce((a,b)=>a.d<=b.d?a:b) : null;

  // Recorde homologação
  const homolEntries = (State.homologacoes||[])
    .filter(h=>h.etapa==='aprovada'&&(h.data_ativacao||h.data_aprovacao)&&h.contrato_id)
    .map(h=>{
      const c=(State.contratos||[]).find(x=>String(x.id)===String(h.contrato_id));
      if(!c?.data_assinatura) return null;
      const dataRef = h.data_ativacao || h.data_aprovacao;
      const d=Math.floor((new Date(dataRef)-new Date(c.data_assinatura))/86400000);
      return d>0?{d,nome:c.nome||'—'}:null;
    }).filter(Boolean);
  const recHomol = homolEntries.length ? homolEntries.reduce((a,b)=>a.d<=b.d?a:b) : null;

  $('#pageActions').innerHTML = '';
  $('#content').innerHTML = `
    <style>
      @keyframes hvPulse { 0%,100%{opacity:.18;transform:scale(1)} 50%{opacity:.32;transform:scale(1.08)} }
      @keyframes hvFadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
      @keyframes hvCount { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
      .hv-wrap{
        position:relative;min-height:calc(100vh - 120px);display:flex;flex-direction:column;
        align-items:center;justify-content:center;gap:0;overflow:hidden;
        background:linear-gradient(160deg,#0d0618 0%,#1a0a2e 40%,#0d0618 100%);
        border-radius:16px;padding:48px 24px;
      }
      .hv-glow{
        position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none;
      }
      .hv-brand{animation:hvFadeUp .7s ease both}
      .hv-brand-label{font-size:11px;font-weight:800;letter-spacing:4px;color:#f59e0b;text-transform:uppercase;margin-bottom:10px}
      .hv-brand-title{font-size:clamp(22px,4vw,36px);font-weight:900;color:#fff;line-height:1.2}
      .hv-brand-sub{font-size:14px;color:#94a3b8;margin-top:6px;font-style:italic}
      .hv-cards{display:flex;gap:24px;flex-wrap:wrap;justify-content:center;margin:40px 0 36px;animation:hvFadeUp .8s .2s ease both}
      .hv-card{
        background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.10);
        border-radius:24px;padding:36px 44px;min-width:220px;text-align:center;
        backdrop-filter:blur(12px);position:relative;overflow:hidden;
        transition:transform .25s,box-shadow .25s;cursor:default;
      }
      .hv-card:hover{transform:translateY(-6px);box-shadow:0 24px 60px rgba(0,0,0,.4)}
      .hv-card-accent{position:absolute;top:0;left:0;right:0;height:3px;border-radius:24px 24px 0 0}
      .hv-card-icon{font-size:28px;margin-bottom:12px}
      .hv-card-label{font-size:11px;font-weight:800;letter-spacing:2px;color:#94a3b8;text-transform:uppercase;margin-bottom:16px}
      .hv-card-num{font-size:clamp(72px,10vw,96px);font-weight:900;line-height:1;animation:hvCount .6s .4s ease both}
      .hv-card-unit{font-size:16px;font-weight:700;margin-top:4px;opacity:.7}
      .hv-card-client{font-size:12px;color:#64748b;margin-top:10px;font-weight:500}
      .hv-btns{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;animation:hvFadeUp .8s .45s ease both}
      .hv-btn{
        font-size:15px;font-weight:800;padding:16px 40px;border-radius:14px;border:none;cursor:pointer;
        letter-spacing:.5px;transition:transform .2s,box-shadow .2s;
      }
      .hv-btn:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.35)}
      .hv-btn-primary{background:linear-gradient(135deg,#6B21A8,#9333ea);color:#fff}
      .hv-btn-secondary{background:rgba(255,255,255,.08);color:#e2e8f0;border:1px solid rgba(255,255,255,.15)}
    </style>
    <div class="hv-wrap">
      <div class="hv-glow" style="width:500px;height:500px;background:#6B21A8;top:-200px;left:-150px;animation:hvPulse 6s ease-in-out infinite"></div>
      <div class="hv-glow" style="width:400px;height:400px;background:#9333ea;bottom:-180px;right:-100px;animation:hvPulse 7s 1s ease-in-out infinite"></div>

      <div class="hv-brand" style="text-align:center;margin-bottom:0">
        <div class="hv-brand-label" style="color:#c084fc">SER Energia Renovável</div>
        <div class="hv-brand-title">Mais do que falar é preciso SER.</div>
        <div class="hv-brand-sub">Agilidade que você pode comprovar</div>
      </div>

      <div class="hv-cards">
        <div class="hv-card">
          <div class="hv-card-accent" style="background:linear-gradient(90deg,#6B21A8,#9333ea)"></div>
          <div class="hv-card-icon">⚡</div>
          <div class="hv-card-label">Recorde de Instalação</div>
          <div class="hv-card-num" style="color:#c084fc">${recInstal ? recInstal.d : '—'}</div>
          <div class="hv-card-unit" style="color:#c084fc">dias</div>
          ${recInstal ? `<div class="hv-card-client">${esc(recInstal.nome)}</div>` : ''}
        </div>
        <div class="hv-card">
          <div class="hv-card-accent" style="background:linear-gradient(90deg,#4c1680,#6B21A8)"></div>
          <div class="hv-card-icon">🏆</div>
          <div class="hv-card-label">Recorde de Homologação</div>
          <div class="hv-card-num" style="color:#e879f9">${recHomol ? recHomol.d : '—'}</div>
          <div class="hv-card-unit" style="color:#e879f9">dias</div>
          ${recHomol ? `<div class="hv-card-client">${esc(recHomol.nome)}</div>` : ''}
        </div>
      </div>

      <div class="hv-btns">
        <button id="hvNovoLead" class="hv-btn hv-btn-primary">➕ Novo Lead</button>
        <button id="hvAppMan" class="hv-btn hv-btn-secondary">📱 App / Manutenção</button>
      </div>
    </div>
  `;
  $('#hvNovoLead').addEventListener('click', ()=> openLeadModal());
  $('#hvAppMan').addEventListener('click', ()=> navigate('appmanutencao'));
}

async function renderDashboard(){
  await loadAll();
  // Dashboard sempre mostra dados completos da empresa (visão geral para todos)
  const leads = State.leads || [];
  const props = State.propostas || [];
  const contratos = State.contratos || [];
  const instal = State.instalacoes || [];
  const totalKwp = instal.reduce((s,i)=>s+(Number(i.kwp)||0),0);
  const propsAbertas = props.filter(p=> !['aceita','recusada'].includes(p.status)).length;
  const contratosAssin = contratos.filter(c=>c.status==='assinado').length;
  const td = today();
  const mesAtual = td.slice(0,7); // YYYY-MM

  // Meta do mês — sempre usa todos os contratos da empresa (ignorar filtro de vendedor)
  const metaRec = (State.metas||[]).find(m=>m.mes===mesAtual);
  const metaValor = Number(metaRec?.valor||0);
  const [mesStart] = getPeriodRange('mes');
  const valorMes = (State.contratos||[]).filter(c=>
    c.status==='assinado' &&
    (c.data_assinatura>=mesStart && c.data_assinatura<=td)
  ).reduce((s,c)=>s+(Number(c.valor)||0),0);
  const pctMeta = metaValor > 0 ? Math.min(1, valorMes/metaValor) : 0;
  const circum = 339.3; // 2*π*54
  const dashOffset = circum * (1 - pctMeta);

  const fn = {
    Lead: leads.length, Proposta: props.length,
    Vistoria: (State.vistorias||[]).length, Contrato: contratos.length,
    Logística: (State.logistica||[]).length, Instalação: instal.length,
    Homologação: (State.homologacoes||[]).length, 'Pós Venda': (State.posvenda||[]).length
  };
  const maxFn = Math.max(1,...Object.values(fn));

  const threeDaysAgo = new Date(Date.now()-3*24*60*60*1000);
  const leadsSemContato = leads.filter(l => new Date(l.atualizado_em||l.criado_em) < threeDaysAgo && l.status==='em_contato').length;
  const vistHoje = (State.vistorias||[]).filter(v=>v.data_agendamento===td).length;
  const instHoje = instal.filter(i=>i.data_instalacao===td).length;

  // Régua de relacionamento — disparos pendentes SOMENTE hoje (não envia atrasados)
  const agendaHoje = (State.relacionamento_agenda||[]).filter(a=>a.status==='pendente' && a.data_disparo===td);
  const tipoLabel = {
    '5dias':'⚡ Acolhimento (5 dias)', '30dias':'🙏 Gratidão (30 dias)',
    '90dias':'🚀 Embaixador (90 dias)', '180dias':'📊 Relatório de Economia (6 meses)',
    '300dias':'🛡️ Manutenção (300 dias)', 'aniversario':'🎂 Aniversário'
  };
  const tipoMsgMap = {
    '5dias': 'Oi [Nome], tudo bem? 😊\nJá faz 5 dias que sua usina solar está instalada e gerando economia pra você — como está sendo essa experiência até aqui?\nQueremos garantir que você esteja aproveitando 100% do seu sistema! Por isso, vamos te apresentar o app de monitoramento da SER, onde você acompanha em tempo real:\n✅ Quanto sua usina está gerando\n✅ Sua economia acumulada\n✅ Performance do sistema, tudo pelo celular\nPosso te enviar o passo a passo pra você baixar agora?\nQualquer dúvida, estamos aqui. Você não comprou só um sistema, você entrou pra família SER! 🌞',
    '30dias': '[Nome], hoje é um dia especial pra gente! 🙏\nFaz exatamente 1 mês que sua usina está instalada, e olha só o que isso significa: 1 mês de economia real na sua conta de luz, 1 mês de energia limpa gerada na sua casa, e 1 mês fazendo parte da nossa família SER.\nQueremos genuinamente agradecer pela confiança. Cada cliente como você é o motivo da SER existir. 💛\nE como forma de celebrar essa parceria, temos uma novidade:\n🌟 Programa Embaixador SER 🌟\nA partir de hoje, você pode ganhar até um salário mínimo por cada venda concretizada só indicando pessoas que também querem economizar com energia solar!\nSimples assim: você indica, a pessoa fecha, você recebe.\nBasta encaminhar este link pra quem você indicar, que a conversa já cai direto comigo:\n[LinkIndicacao]\nParabéns pelo seu primeiro mês com a SER! Que venham muitos outros 🚀',
    '90dias': '[Nome], já são 3 meses de você com a SER Energia! 🎊\nNesse tempo você continua gerando energia limpa todos os dias direto do telhado da sua casa e economizando na conta de luz.\nEstamos muito felizes com essa parceria, e por isso batemos aqui hoje com carinho: você já conhece o Programa Embaixador SER?\nRelembrando: você indica, a pessoa fecha a instalação, e você ganha até um salário mínimo por cada venda concretizada. Sem limite de quantas indicações você pode fazer!\nÉ só encaminhar este link pra pessoa indicada — a conversa cai direto comigo:\n[LinkIndicacao]\nTopa começar a indicar hoje mesmo? 💪🌞',
    '180dias': '[Nome], seu sistema solar já completou 6 meses de vida! 📊☀️\nOlha só o que você já conquistou nesse período:\n💰 Economia acumulada estimada: [Economia6m]\n📉 Economia mensal média: [EconomiaMes]\nEsses são valores reais saindo direto do seu bolso de volta pro seu bolso — dinheiro que ficou com você em vez de ir pra conta de luz.\nSe quiser ver a geração em tempo real da sua usina, é só acessar o app de monitoramento. Qualquer dúvida sobre o desempenho do sistema, estamos aqui! 💛\nObrigado por fazer parte da família SER 🌞',
    '300dias': 'Oi [Nome], tudo bem? 😊\nAqui é da equipe SER Energia Renovável. Passamos para te dar um aviso importante!\n\nJá se aproxima 1 ano desde a instalação da sua usina solar — parabéns por gerar sua própria energia todo esse tempo! ☀️\n\nComo acontece com qualquer equipamento de qualidade, a manutenção preventiva é fundamental para garantir que o seu sistema continue operando com máxima eficiência e vida útil prolongada.\n\nPor isso, recomendamos agendar agora a sua:\n✅ Limpeza dos módulos fotovoltaicos\n✅ Inspeção das conexões elétricas\n✅ Verificação do desempenho do inversor\n✅ Check geral da estrutura de fixação\n\nEssa revisão preventiva evita perdas de geração e garante que sua garantia permaneça válida.\n\nQuer agendar? É só responder aqui que a gente cuida de tudo! 🔧🌞',
    'aniversario': '🎉 Feliz Aniversário, [Nome]! 🎂\nHoje o dia é seu, e a família SER Energia não podia deixar passar em branco!\nQueremos desejar um ano repleto de conquistas, saúde e muita luz (literalmente ☀️) na sua vida.\nObrigado por confiar na SER e fazer parte da nossa história. Que seu novo ciclo venha ainda mais brilhante!\nUm abraço da equipe SER Energia Renovável 💛'
  };
  // Resolve dados de contexto do contrato/proposta/vendedor para preencher placeholders dinâmicos da mensagem
  function agendaContexto(a){
    const cont = (State.contratos||[]).find(c=>String(c.id)===String(a.contrato_id));
    const prop = cont?.proposta_id ? (State.propostas||[]).find(p=>String(p.id)===String(cont.proposta_id)) : null;
    const economiaMes = Number(prop?.economia_mensal)||0;
    const vendTel = (cont?.vend_telefone || (State.perfis||[]).find(p=>normName(p.nome||'')===normName(cont?.vendedor||''))?.telefone || '').replace(/\D/g,'');
    const linkIndicacao = vendTel
      ? 'https://wa.me/'+(vendTel.length<=11?'55'+vendTel:vendTel)+'?text='+encodeURIComponent('Oi! Um cliente da SER Energia me indicou e quero saber mais sobre energia solar 🌞')
      : 'https://www.serenergiarenovavel.com.br';
    return { economiaMes, linkIndicacao };
  }
  function agendaWaLink(a){
    const tel = (a.cliente_telefone||'').replace(/\D/g,'');
    const base = tel ? ('https://wa.me/'+(tel.length<=11?'55'+tel:tel)) : 'https://wa.me/';
    const { economiaMes, linkIndicacao } = agendaContexto(a);
    const msg = (tipoMsgMap[a.tipo]||'')
      .replace(/\[Nome\]/g, a.cliente_nome||'')
      .replace(/\[LinkIndicacao\]/g, linkIndicacao)
      .replace(/\[Economia6m\]/g, economiaMes ? fmtBRL(economiaMes*6) : 'consulte seu consultor')
      .replace(/\[EconomiaMes\]/g, economiaMes ? fmtBRL(economiaMes) : 'consulte seu consultor');
    return base+'?text='+encodeURIComponent(msg);
  }

  // Anos disponíveis para o seletor (a partir dos dados existentes + ano atual)
  const anoAtual = new Date().getFullYear();
  const anosSet = new Set([anoAtual]);
  [...contratos, ...leads, ...(State.posvenda||[])].forEach(r=>{
    const d = r.data_assinatura || r.criado_em || r.data_ativacao;
    if(d){ const y = parseInt(String(d).slice(0,4)); if(!isNaN(y) && y>2000 && y<2100) anosSet.add(y); }
  });
  const anosDisponiveis = [...anosSet].sort((a,b)=>b-a);
  const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  $('#content').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <span style="font-size:13px;color:var(--text-light);font-weight:500">Filtrar rankings por período:</span>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div class="period-filter" id="periodFilter">
          <div class="period-btn" data-p="dia">Hoje</div>
          <div class="period-btn active" data-p="mes">Mês</div>
          <div class="period-btn" data-p="trimestre">Trimestre</div>
          <div class="period-btn" data-p="semestre">Semestre</div>
          <div class="period-btn" data-p="ano">Ano</div>
        </div>
        <select id="dashMesSel" style="display:none;padding:6px 10px;border-radius:8px;border:1px solid #ddd;font-size:13px;font-family:inherit">
          ${mesesNomes.map((m,i)=>`<option value="${i}">${m}</option>`).join('')}
        </select>
        <select id="dashTriSel" style="display:none;padding:6px 10px;border-radius:8px;border:1px solid #ddd;font-size:13px;font-family:inherit">
          <option value="0">1º Trimestre</option>
          <option value="1">2º Trimestre</option>
          <option value="2">3º Trimestre</option>
          <option value="3">4º Trimestre</option>
        </select>
        <select id="dashSemSel" style="display:none;padding:6px 10px;border-radius:8px;border:1px solid #ddd;font-size:13px;font-family:inherit">
          <option value="0">1º Semestre</option>
          <option value="1">2º Semestre</option>
        </select>
        <select id="dashAnoSel" style="display:none;padding:6px 10px;border-radius:8px;border:1px solid #ddd;font-size:13px;font-family:inherit">
          ${anosDisponiveis.map(a=>`<option value="${a}">${a}</option>`).join('')}
        </select>
        ${!isVend() ? `<select id="dashVendSel" style="padding:6px 10px;border-radius:8px;border:1px solid var(--primary);font-size:13px;font-family:inherit;color:var(--primary);font-weight:500">
          <option value="">👤 Todos vendedores</option>
          ${(State.perfis||[]).filter(p=>p.ativo!==false&&['vendedor','supervisor','admin'].includes(p.perfil)&&p.nome).sort((a,b)=>a.nome.localeCompare(b.nome)).map(p=>`<option value="${esc(p.nome)}">${esc(p.nome)}</option>`).join('')}
        </select>` : ''}
      </div>
    </div>

    <div class="metrics" style="margin-bottom:16px">
      <div class="metric"><div class="metric-label">Total Leads</div><div class="metric-value">${isVend() ? filterByVendor(leads).length : leads.length}</div></div>
      <div class="metric"><div class="metric-label">Propostas Abertas</div><div class="metric-value">${isVend() ? filterByVendor(props).filter(p=>!['aceita','recusada'].includes(p.status)).length : propsAbertas}</div></div>
      <div class="metric"><div class="metric-label">Contratos Assinados</div><div class="metric-value">${isVend() ? filterByVendor(contratos).filter(c=>c.status==='assinado').length : contratosAssin}</div></div>
      <div class="metric"><div class="metric-label">kWp Instalado</div><div class="metric-value">${fmtNum(isVend() ? filterByVendor(instal).reduce((s,i)=>s+(Number(i.kwp)||0),0) : totalKwp,2)}</div></div>
      <div class="metric"><div class="metric-label">Vendido no Mês</div><div class="metric-value" style="font-size:15px">${fmtBRL(valorMes)}</div></div>
      <div class="metric"><div class="metric-label">Ticket Médio</div><div class="metric-value" style="font-size:15px">${(()=>{ const cc=contratos.filter(c=>c.status==='assinado'&&(isVend()?c.vendedor===State.profile?.nome:true)); return cc.length ? fmtBRL(cc.reduce((s,c)=>s+(Number(c.valor)||0),0)/cc.length) : '—'; })()}</div></div>
      <div class="metric"><div class="metric-label">Taxa Conversão</div><div class="metric-value">${(()=>{ const l=isVend()?filterByVendor(leads).length:leads.length; const c=isVend()?filterByVendor(contratos).filter(x=>x.status==='assinado').length:contratosAssin; return l>0?Math.round(c/l*100)+'%':'—'; })()}</div></div>
      <div class="metric"><div class="metric-label">⏱️ Time Lead</div><div class="metric-value" id="kpiTimeLead">—</div><div class="metric-sub" style="font-size:10px;color:var(--text-light);text-align:center">dias lead→contrato</div></div>
      <div class="metric"><div class="metric-label">🏆 Rec. Homologação</div><div class="metric-value" id="kpiHomolRec">—</div><div class="metric-value" style="font-size:13px;color:var(--text-light)" id="kpiHomolAvg">—</div><div class="metric-sub" style="font-size:10px;color:var(--text-light);text-align:center">recorde · média (dias contrato→homol)</div></div>
      <div class="metric"><div class="metric-label">⚡ Rec. Instalação</div><div class="metric-value" id="kpiInstalRec">—</div><div class="metric-value" style="font-size:13px;color:var(--text-light)" id="kpiInstalAvg">—</div><div class="metric-sub" style="font-size:10px;color:var(--text-light);text-align:center">recorde · média (dias contrato→instal)</div></div>
    </div>

    <div style="display:grid;grid-template-columns:180px 1fr 220px;gap:16px;margin-bottom:16px">
      <!-- Meta do mês -->
      <div class="card" style="padding:16px;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:12px;font-weight:700;color:var(--text-light);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">Meta do Mês</div>
        ${(()=>{
          const _p=pctMeta, _cx=90,_cy=82,_R=64,_tW=13;
          const _clamp=Math.min(1.02,_p);
          const _angDeg=-180+_clamp*180, _angRad=_angDeg*Math.PI/180;
          const _nx=_cx+_R*0.68*Math.cos(_angRad), _ny=_cy+_R*0.68*Math.sin(_angRad);
          const _gaugeCol=(_pv)=>{const s=[[239,68,68],[249,115,22],[234,179,8],[34,197,94]],sc=Math.min(_pv,1)*3,i=Math.min(2,Math.floor(sc)),t=sc-i,[r1,g1,b1]=s[i],[r2,g2,b2]=s[i+1];return'rgb('+Math.round(r1+(r2-r1)*t)+','+Math.round(g1+(g2-g1)*t)+','+Math.round(b1+(b2-b1)*t)+')';};
          const _col=_gaugeCol(_p);
          const _arc=(r,a1,a2)=>{const s=a1*Math.PI/180,e=a2*Math.PI/180;return 'M '+(_cx+r*Math.cos(s))+' '+(_cy+r*Math.sin(s))+' A '+r+' '+r+' 0 0 1 '+(_cx+r*Math.cos(e))+' '+(_cy+r*Math.sin(e));};
          const _fillEnd=Math.min(0,_angDeg);
          const _tick=(pm,c)=>{const a=(-180+pm*180)*Math.PI/180;return '<line x1="'+(_cx+(_R+5)*Math.cos(a))+'" y1="'+(_cy+(_R+5)*Math.sin(a))+'" x2="'+(_cx+(_R+13)*Math.cos(a))+'" y2="'+(_cy+(_R+13)*Math.sin(a))+'" stroke="'+c+'" stroke-width="3" stroke-linecap="round"/>';};
          const _pctLbl=Math.round(Math.min(1,_p)*100)+'%';
          return '<svg width="180" height="100" viewBox="0 0 180 100" style="overflow:visible">'
            +'<path d="'+_arc(_R,-180,0)+'" fill="none" stroke="#e5e7eb" stroke-width="'+_tW+'" stroke-linecap="round"/>'
            +(_p>0?'<path d="'+_arc(_R,-180,_fillEnd)+'" fill="none" stroke="'+_col+'" stroke-width="'+_tW+'" stroke-linecap="round" opacity="0.9"/>':'')
            +_tick(.4,'#ea580c')+_tick(.7,'#ca8a04')+_tick(1,'#16a34a')
            +'<line x1="'+_cx+'" y1="'+_cy+'" x2="'+_nx+'" y2="'+_ny+'" stroke="'+_col+'" stroke-width="4.5" stroke-linecap="round"/>'
            +'<circle cx="'+_cx+'" cy="'+_cy+'" r="7" fill="'+_col+'"/>'
            +'<text x="'+_cx+'" y="'+(_cy+22)+'" text-anchor="middle" font-size="22" font-weight="800" fill="'+_col+'" font-family="inherit">'+_pctLbl+'</text>'
            +'</svg>';
        })()}
        <div style="font-size:14px;font-weight:700;color:var(--text)">${fmtBRL(valorMes)}</div>
        <div style="font-size:11px;color:var(--text-light)">de ${metaValor?fmtBRL(metaValor):'sem meta'}</div>
        ${isAdmin()?`<button class="btn btn-sm btn-secondary" id="editMetaBtn" style="margin-top:6px;font-size:11px">✏️ Definir meta</button>`:''}
      </div>

      <!-- Funil -->
      <div class="card">
        <div class="card-header"><h3>Funil do Pipeline <span style="font-size:11px;color:var(--text-light);font-weight:400" id="funnelPeriodLabel">(Total)</span></h3></div>
        <div class="funnel" id="funnelBody">
          ${Object.entries(fn).map(([k,v])=>`
            <div class="funnel-row">
              <div class="funnel-label">${k}</div>
              <div class="funnel-bar"><div class="funnel-fill" style="width:${Math.max(8,(v/maxFn)*100)}%">${v}</div></div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Alertas -->
      <div class="card">
        <div class="card-header"><h3>🔔 Alertas</h3></div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div id="alertaLeadsParados" style="padding:12px;background:${leadsSemContato>0?'#fee2e2':'#f0fdf4'};border-radius:8px;font-size:13px;cursor:${leadsSemContato>0?'pointer':'default'};border:1px solid ${leadsSemContato>0?'#fca5a5':'#bbf7d0'}">
            ${leadsSemContato>0?'🔴':'🟢'} <strong>${leadsSemContato}</strong> lead${leadsSemContato!==1?'s':''} sem contato há +3 dias
            ${leadsSemContato>0?'<span style="float:right;color:#e53e3e;font-size:11px">Ver →</span>':''}
          </div>
          <div style="padding:12px;background:${vistHoje>0?'#eff6ff':'#f0fdf4'};border-radius:8px;font-size:13px;border:1px solid ${vistHoje>0?'#bfdbfe':'#bbf7d0'}">
            ${vistHoje>0?'🔵':'🟢'} <strong>${vistHoje}</strong> vistoria${vistHoje!==1?'s':''} para hoje
          </div>
          <div style="padding:12px;background:${instHoje>0?'#eff6ff':'#f0fdf4'};border-radius:8px;font-size:13px;border:1px solid ${instHoje>0?'#bfdbfe':'#bbf7d0'}">
            ${instHoje>0?'🔵':'🟢'} <strong>${instHoje}</strong> instalação${instHoje!==1?'ões':''} para hoje
          </div>
        </div>
      </div>
    </div>

    <!-- Régua de Relacionamento — disparos de hoje -->
    ${agendaHoje.length > 0 ? `
    <div class="card" data-agenda-card style="margin-bottom:16px">
      <div class="card-header"><h3>💛 Régua de Relacionamento <span style="font-size:11px;font-weight:400;color:var(--text-light)">${agendaHoje.length} mensagem${agendaHoje.length!==1?'s':''} para hoje</span></h3></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${agendaHoje.map(a=>`
        <div id="agenda-row-${esc(a.id)}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-secondary);border-radius:8px;flex-wrap:wrap">
          <div style="flex:1;min-width:160px">
            <div style="font-weight:600;font-size:13px">${esc(a.cliente_nome||'—')}</div>
            <div style="font-size:11px;color:var(--text-light);margin-top:2px">${esc(tipoLabel[a.tipo]||a.tipo)}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <a href="${agendaWaLink(a)}" target="_blank" rel="noopener"
               style="display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:#25d366;color:#fff;border-radius:6px;font-size:12px;font-weight:600;text-decoration:none">
              📲 Enviar WhatsApp
            </a>
            <button onclick="agendaMarcar('${esc(a.id)}','enviado')" style="padding:6px 10px;background:var(--primary);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer">✔ Enviado</button>
            <button onclick="agendaMarcar('${esc(a.id)}','ignorado')" style="padding:6px 10px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;font-size:12px;cursor:pointer">✗ Ignorar</button>
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- Gráfico de desempenho -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-header" style="margin-bottom:0">
        <h3>Desempenho de Vendas <span style="font-size:11px;color:var(--text-light);font-weight:400" id="chartPeriodLabel">(Mês atual)</span></h3>
      </div>
      <div style="position:relative;height:220px;padding:12px 4px 4px">
        <canvas id="salesChart"></canvas>
      </div>
    </div>

    <!-- Dashboard Preditivo de Receita -->
    <div id="preditivoSection" style="margin-bottom:16px"></div>

    <!-- Tempo médio por etapa -->
    <div id="tempoMedioSection" style="margin-bottom:0"></div>

    <!-- Metas por vendedor -->
    <div id="metasVendSection" style="margin-bottom:0"></div>

    <!-- Rankings -->
    <div class="card" id="rankingsCard">
      <div class="card-header" style="margin-bottom:0"><h3>Rankings <span style="font-size:11px;color:var(--text-light);font-weight:400" id="rankPeriodLabel">(Mês atual)</span></h3></div>
      <div class="rank-tabs" style="margin-top:12px">
        <div class="rank-tab active" data-rank="vendedores">🏆 Vendedores</div>
        <div class="rank-tab" data-rank="contexto">🎯 Contexto</div>
        <div class="rank-tab" data-rank="bancos">🏦 Bancos</div>
        <div class="rank-tab" data-rank="forma_pgto">💳 Forma Pgto</div>
        <div class="rank-tab" data-rank="distribuidores">📦 Distribuidores</div>
      </div>
      <div id="rankBody"></div>
    </div>
  `;

  // Estado interno do dashboard
  let dashPeriod = 'mes';
  let dashRankTab = 'vendedores';
  let salesChartInst = null;
  let dashAno = anoAtual;
  let dashMes = new Date().getMonth(); // 0-indexed
  let dashTri = Math.floor(new Date().getMonth()/3); // 0-3
  let dashSem = Math.floor(new Date().getMonth()/6); // 0-1
  let dashVendedor = ''; // '' = todos

  const pad2 = n => String(n).padStart(2,'0');
  const lastDayOfMonth = (y,m) => new Date(y, m+1, 0).getDate();

  // Calcula o range de datas considerando os seletores de mês/trimestre/semestre/ano
  function getDashRange(){
    if(dashPeriod==='mes'){
      const y=dashAno, m=dashMes;
      return [`${y}-${pad2(m+1)}-01`, `${y}-${pad2(m+1)}-${pad2(lastDayOfMonth(y,m))}`];
    }
    if(dashPeriod==='trimestre'){
      const y=dashAno, sM=dashTri*3, eM=dashTri*3+2;
      return [`${y}-${pad2(sM+1)}-01`, `${y}-${pad2(eM+1)}-${pad2(lastDayOfMonth(y,eM))}`];
    }
    if(dashPeriod==='semestre'){
      const y=dashAno, sM=dashSem*6, eM=dashSem*6+5;
      return [`${y}-${pad2(sM+1)}-01`, `${y}-${pad2(eM+1)}-${pad2(lastDayOfMonth(y,eM))}`];
    }
    if(dashPeriod==='ano'){
      return [`${dashAno}-01-01`, `${dashAno}-12-31`];
    }
    return getPeriodRange(dashPeriod); // dia → relativo a hoje
  }

  // Mostra/esconde os seletores de mês/trimestre/semestre/ano conforme o período
  function syncDashSelects(){
    $('#dashMesSel').style.display = dashPeriod==='mes' ? 'inline-block' : 'none';
    $('#dashTriSel').style.display = dashPeriod==='trimestre' ? 'inline-block' : 'none';
    $('#dashSemSel').style.display = dashPeriod==='semestre' ? 'inline-block' : 'none';
    $('#dashAnoSel').style.display = (dashPeriod==='mes'||dashPeriod==='trimestre'||dashPeriod==='semestre'||dashPeriod==='ano') ? 'inline-block' : 'none';
    $('#dashMesSel').value = String(dashMes);
    $('#dashTriSel').value = String(dashTri);
    $('#dashSemSel').value = String(dashSem);
    $('#dashAnoSel').value = String(dashAno);
  }

  function renderChart(){
    const periodLabels = {
      dia:'Últimos 7 dias',
      mes:`${mesesNomes[dashMes]} de ${dashAno}`,
      trimestre:`${dashTri+1}º Trimestre de ${dashAno}`,
      semestre:`${dashSem+1}º Semestre de ${dashAno}`,
      ano:`Ano de ${dashAno}`
    };
    $('#chartPeriodLabel').textContent = `(${periodLabels[dashPeriod]||''})`;

    const now = new Date();
    const labels = [], values = [];
    const allContratos = State.contratos || [];

    if(dashPeriod === 'dia'){
      // Últimos 7 dias
      for(let i=6;i>=0;i--){
        const d = new Date(now); d.setDate(d.getDate()-i);
        const key = d.toISOString().slice(0,10);
        labels.push(d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}));
        values.push(allContratos.filter(c=>c.status==='assinado'&&c.data_assinatura===key).reduce((s,c)=>s+(Number(c.valor)||0),0));
      }
    } else if(dashPeriod === 'mes'){
      // Dias do mês selecionado
      const days = lastDayOfMonth(dashAno, dashMes);
      for(let d=1; d<=days; d++){
        const key = `${dashAno}-${pad2(dashMes+1)}-${pad2(d)}`;
        labels.push(String(d));
        values.push(allContratos.filter(c=>c.status==='assinado'&&c.data_assinatura===key).reduce((s,c)=>s+(Number(c.valor)||0),0));
      }
    } else if(dashPeriod === 'trimestre'){
      // 3 meses do trimestre selecionado
      for(let i=0;i<3;i++){
        const m = dashTri*3+i;
        const d = new Date(dashAno, m, 1);
        const key = `${dashAno}-${pad2(m+1)}`;
        labels.push(d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}));
        values.push(allContratos.filter(c=>c.status==='assinado'&&(c.data_assinatura||'').startsWith(key)).reduce((s,c)=>s+(Number(c.valor)||0),0));
      }
    } else if(dashPeriod === 'ano'){
      // 12 meses do ano selecionado
      for(let m=0;m<12;m++){
        const d = new Date(dashAno, m, 1);
        const key = `${dashAno}-${pad2(m+1)}`;
        labels.push(d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}));
        values.push(allContratos.filter(c=>c.status==='assinado'&&(c.data_assinatura||'').startsWith(key)).reduce((s,c)=>s+(Number(c.valor)||0),0));
      }
    } else if(dashPeriod === 'semestre'){
      // 6 meses do semestre selecionado
      for(let i=0;i<6;i++){
        const m = dashSem*6+i;
        const d = new Date(dashAno, m, 1);
        const key = `${dashAno}-${pad2(m+1)}`;
        labels.push(d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}));
        values.push(allContratos.filter(c=>c.status==='assinado'&&(c.data_assinatura||'').startsWith(key)).reduce((s,c)=>s+(Number(c.valor)||0),0));
      }
    } else {
      // fallback: últimos 6 meses
      for(let i=5;i>=0;i--){
        const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
        const key = `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
        labels.push(d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}));
        values.push(allContratos.filter(c=>c.status==='assinado'&&(c.data_assinatura||'').startsWith(key)).reduce((s,c)=>s+(Number(c.valor)||0),0));
      }
    }

    const ctx = $('#salesChart')?.getContext('2d');
    if(!ctx) return;
    if(salesChartInst) salesChartInst.destroy();
    salesChartInst = new Chart(ctx,{
      type:'bar',
      data:{
        labels,
        datasets:[{
          label:'Vendas (R$)',
          data: values,
          backgroundColor: values.map((v,i)=>i===values.length-1?'rgba(107,33,168,0.85)':'rgba(107,33,168,0.35)'),
          borderColor:'rgba(107,33,168,0.9)',
          borderWidth:1.5,
          borderRadius:6,
          borderSkipped:false
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{display:false},
          tooltip:{callbacks:{label:c=>' '+fmtBRL(c.raw)}}
        },
        scales:{
          x:{grid:{display:false}, ticks:{font:{size:11}}},
          y:{
            grid:{color:'rgba(0,0,0,.05)'},
            ticks:{font:{size:11}, callback:v=>v>=1000?'R$'+(v/1000).toFixed(0)+'k':'R$'+v}
          }
        }
      }
    });
  }

  function renderRankings(){
    const [startD, endD] = getDashRange();
    const s0 = startD+'T00:00:00', e9 = endD+'T23:59:59';
    // Filtro por vendedor (admin/supervisor podem selecionar; vendedor sempre vê só o seu)
    const fvNorm = isVend() ? normName(State.profile?.nome||'') : (dashVendedor ? normName(dashVendedor) : '');
    const byVend = arr => fvNorm ? arr.filter(x => normName(x.vendedor||'')===fvNorm) : arr;
    const periodLabels = {
      dia:'Hoje',
      mes:`${mesesNomes[dashMes]} de ${dashAno}`,
      trimestre:`${dashTri+1}º Trimestre de ${dashAno}`,
      semestre:`${dashSem+1}º Semestre de ${dashAno}`,
      ano:`Ano de ${dashAno}`
    };
    const pLabel = periodLabels[dashPeriod]||dashPeriod;
    $('#rankPeriodLabel').textContent = `(${pLabel})`;

    // ── Funil filtrado por período ──────────────────────────────────────────
    const inPeriod = (d) => d && d >= s0 && d <= e9;

    // Para etapas sem campo vendedor, rastreia pelo contrato de origem
    const contVendIds = new Set(byVend(contratos).map(c=>String(c.id)));
    const propVendIds = new Set(byVend(props).map(p=>String(p.id)));
    // vistorias → via proposta_id
    const vistByVend = fvNorm
      ? (State.vistorias||[]).filter(v=>propVendIds.has(String(v.proposta_id)))
      : (State.vistorias||[]);
    // logistica/instalacao/homologacao/posvenda → via contrato_id
    const logByVend  = fvNorm ? (State.logistica||[]).filter(l=>contVendIds.has(String(l.contrato_id)))  : (State.logistica||[]);
    const instByVend = fvNorm ? (State.instalacoes||[]).filter(i=>contVendIds.has(String(i.contrato_id||i.logistica_id))) : (State.instalacoes||[]);
    const homByVend  = fvNorm ? (State.homologacoes||[]).filter(h=>contVendIds.has(String(h.contrato_id))) : (State.homologacoes||[]);
    const pvByVend   = fvNorm ? (State.posvenda||[]).filter(p=>contVendIds.has(String(p.contrato_id)))   : (State.posvenda||[]);

    const fnData = {
      Lead:       byVend(leads).filter(l=>inPeriod(l.criado_em)).length,
      Proposta:   byVend(props).filter(p=>inPeriod(p.criado_em)).length,
      Vistoria:   vistByVend.filter(v=>inPeriod(v.criado_em)).length,
      Contrato:   byVend(contratos).filter(c=>inPeriod(c.data_assinatura||c.criado_em)).length,
      Logística:  logByVend.filter(l=>inPeriod(l.criado_em)).length,
      Instalação: instByVend.filter(i=>inPeriod(i.data_instalacao||i.criado_em)).length,
      Homologação:homByVend.filter(h=>inPeriod(h.criado_em)).length,
      'Pós Venda':pvByVend.filter(p=>inPeriod(p.criado_em)).length,
    };
    const maxFnD = Math.max(1,...Object.values(fnData));
    const funnelEl = $('#funnelBody');
    if(funnelEl) funnelEl.innerHTML = Object.entries(fnData).map(([k,v])=>`
      <div class="funnel-row">
        <div class="funnel-label">${k}</div>
        <div class="funnel-bar"><div class="funnel-fill" style="width:${Math.max(8,(v/maxFnD)*100)}%">${v}</div></div>
      </div>`).join('');
    const funnelLabel = $('#funnelPeriodLabel');
    if(funnelLabel) funnelLabel.textContent = `(${pLabel})`;

    // ── Time Lead: dias médios de lead → contrato assinado ─────────────────
    const contAssinPeriodo = contratos.filter(c=>c.status==='assinado' && c.data_assinatura>=startD && c.data_assinatura<=endD);
    const contKpiTL = isVend() ? contAssinPeriodo.filter(c=>normName(c.vendedor)===normName(State.profile?.nome)) : contAssinPeriodo;
    const diasTL = contKpiTL.map(c=>{
      // Tenta resolver o lead de origem via lead_id propagado
      const lead = c.lead_id ? (State.leads||[]).find(l=>String(l.id)===String(c.lead_id)) : null;
      if(lead?.criado_em && c.data_assinatura){
        return Math.floor((new Date(c.data_assinatura).getTime() - new Date(lead.criado_em).getTime()) / 86400000);
      }
      // Fallback: proposta → lead pelo nome
      const prop = (State.propostas||[]).find(p=>normName(p.nome)===normName(c.nome));
      const leadFb = prop?.lead_id ? (State.leads||[]).find(l=>String(l.id)===String(prop.lead_id)) : null;
      if(leadFb?.criado_em && c.data_assinatura){
        return Math.floor((new Date(c.data_assinatura).getTime() - new Date(leadFb.criado_em).getTime()) / 86400000);
      }
      return null;
    }).filter(d=>d!=null && d>=0);
    const avgTL = diasTL.length ? Math.round(diasTL.reduce((a,b)=>a+b,0)/diasTL.length) : null;
    const tlEl = $('#kpiTimeLead');
    if(tlEl) tlEl.textContent = avgTL!=null ? avgTL+'d' : '—';

    // ── Recorde Homologação: dias contrato assinado → homologação aprovada ──
    const homolEntries = (State.homologacoes||[])
      .filter(h => h.etapa==='aprovada' && h.contrato_id && (h.data_ativacao || h.data_aprovacao))
      .map(h => {
        const cont = (State.contratos||[]).find(c=>String(c.id)===String(h.contrato_id));
        if(!cont?.data_assinatura) return null;
        const dataRef = h.data_ativacao || h.data_aprovacao;
        const dias = Math.floor((new Date(dataRef).getTime() - new Date(cont.data_assinatura).getTime()) / 86400000);
        return dias > 0 ? { dias, nome: cont.nome||'—' } : null;
      })
      .filter(d => d != null);
    const recEntry = homolEntries.length ? homolEntries.reduce((a,b)=>a.dias<=b.dias?a:b) : null;
    const avgHomol = homolEntries.length ? Math.round(homolEntries.reduce((s,d)=>s+d.dias,0)/homolEntries.length) : null;
    const hrEl = $('#kpiHomolRec');
    const haEl = $('#kpiHomolAvg');
    if(hrEl) hrEl.textContent = recEntry ? '🏅 '+recEntry.dias+'d' : '—';
    if(haEl) haEl.textContent = avgHomol!=null ? 'Média: '+avgHomol+' dias' : '—';
    const hSubEl = hrEl?.closest('.metric')?.querySelector('.metric-sub');
    if(hSubEl) hSubEl.textContent = recEntry ? recEntry.nome : 'recorde · média (dias contrato→homol)';

    // ── Recorde Instalação: dias contrato assinado → data instalação ──
    const instalEntries = (State.instalacoes||[])
      .filter(i => i.status==='concluida' && i.data_instalacao && i.contrato_id)
      .map(i => {
        const cont = (State.contratos||[]).find(c=>String(c.id)===String(i.contrato_id));
        if(!cont?.data_assinatura) return null;
        const dias = Math.floor((new Date(i.data_instalacao).getTime() - new Date(cont.data_assinatura).getTime()) / 86400000);
        return dias > 0 ? { dias, nome: cont.nome||'—' } : null;
      })
      .filter(d => d != null);
    const recInstal = instalEntries.length ? instalEntries.reduce((a,b)=>a.dias<=b.dias?a:b) : null;
    const avgInstal = instalEntries.length ? Math.round(instalEntries.reduce((s,d)=>s+d.dias,0)/instalEntries.length) : null;
    const irEl = $('#kpiInstalRec'), iaEl = $('#kpiInstalAvg');
    if(irEl) irEl.textContent = recInstal ? '⚡ '+recInstal.dias+'d' : '—';
    if(iaEl) iaEl.textContent = avgInstal!=null ? 'Média: '+avgInstal+' dias' : '—';
    const iSubEl = irEl?.closest('.metric')?.querySelector('.metric-sub');
    if(iSubEl) iSubEl.textContent = recInstal ? recInstal.nome : 'recorde · média (dias contrato→instal)';

    // ── Contratos filtrados por período ────────────────────────────────────
    const contFiltrados = byVend(contratos).filter(c=>c.status==='assinado' && c.data_assinatura >= startD && c.data_assinatura <= endD);
    const contKpi = contFiltrados;
    const totalPeriodo = contKpi.reduce((s,c)=>s+(Number(c.valor)||0),0);
    const ticketMedio = contKpi.length ? totalPeriodo/contKpi.length : 0;

    const leadsP = byVend(leads).filter(l=>l.criado_em>=s0&&l.criado_em<=e9);
    const taxaConv = leadsP.length > 0 ? Math.round(contKpi.length/leadsP.length*100)+'%' : '—';
    const propAb = byVend(props).filter(p=>!['aceita','recusada'].includes(p.status)&&p.criado_em>=s0&&p.criado_em<=e9).length;
    const kwpP = byVend(State.instalacoes||[])
      .filter(i=>{ const d=i.data_instalacao||i.criado_em; return d>=s0&&d<=e9; })
      .reduce((s,i)=>s+(Number(i.kwp)||0),0);

    // ── Atualiza cards de KPI ──────────────────────────────────────────────
    document.querySelectorAll('.metric').forEach(m=>{
      const lblEl = m.querySelector('.metric-label');
      const val   = m.querySelector('.metric-value');
      if(!lblEl||!val) return;
      const lbl = lblEl.textContent.trim();
      if(lbl==='Vendido no Mês'||lbl==='Vendido no Período'){ lblEl.textContent='Vendido no Período'; val.textContent=fmtBRL(totalPeriodo); }
      if(lbl==='Ticket Médio')        val.textContent = ticketMedio ? fmtBRL(ticketMedio) : '—';
      if(lbl==='Taxa Conversão')      val.textContent = taxaConv;
      if(lbl==='Propostas Abertas')   val.textContent = String(propAb);
      if(lbl==='Contratos Assinados') val.textContent = String(contKpi.length);
      if(lbl==='Total Leads')         val.textContent = String(leadsP.length);
      if(lbl==='kWp Instalado')       val.textContent = fmtNum(kwpP,2);
    });

    // ── Rankings ───────────────────────────────────────────────────────────
    // Helper: agrupa com normalização inteligente (ignora partículas de nome)
    function grpNorm(arr, field, valFn){
      const map = new Map();
      arr.forEach(item=>{
        const raw = item[field]||'—';
        const key = normNameRank(raw);
        if(!map.has(key)) map.set(key,{display:raw, val:0, count:0});
        const e = map.get(key);
        e.val += valFn(item);
        e.count++;
        // Prefere o nome mais longo como display (mais completo)
        if(raw.length > e.display.length) e.display = raw;
      });
      return [...map.values()].sort((a,b)=>b.val-a.val);
    }

    // Medalhas para os 3 primeiros
    const medals = ['🥇','🥈','🥉'];

    // Renderiza lista visual de ranking (barra de progresso proporcional)
    function rankCards(rows, {label, valFmt, subFmt, emptyMsg, accent='var(--primary)'}){
      if(!rows.length) return `<div class="empty" style="padding:24px">${emptyMsg}</div>`;
      const maxVal = rows[0].val || 1;
      return `<div style="display:flex;flex-direction:column;gap:8px;padding:12px 0">
        ${rows.map(({display,val,count},i)=>{
          const pct = Math.max(4, Math.round((val/maxVal)*100));
          const medal = i<3 ? medals[i] : `<span style="font-size:11px;color:var(--text-light);font-weight:700;min-width:18px;text-align:center">${i+1}</span>`;
          const sub = subFmt ? subFmt({val,count}) : '';
          return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:var(--bg);border:1px solid var(--border);transition:box-shadow .15s" onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,.08)'" onmouseout="this.style.boxShadow=''">
            <span style="font-size:${i<3?'20px':'13px'};line-height:1;width:24px;text-align:center;flex-shrink:0">${medal}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px">
                <span style="font-weight:600;font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:55%">${esc(display)}</span>
                <span style="font-weight:700;font-size:13px;color:${accent};white-space:nowrap">${valFmt({val,count})}</span>
              </div>
              <div style="height:5px;border-radius:3px;background:var(--border);overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${i===0?accent:(i===1?accent+'cc':accent+'88')};border-radius:3px;transition:width .4s ease"></div>
              </div>
              ${sub?`<div style="font-size:11px;color:var(--text-light);margin-top:3px">${sub}</div>`:''}
            </div>
          </div>`;
        }).join('')}
      </div>`;
    }

    if(dashRankTab === 'vendedores'){
      const rows = grpNorm(contFiltrados,'vendedor',c=>Number(c.valor)||0);
      const totalVend = rows.reduce((s,r)=>s+r.val,0);
      $('#rankBody').innerHTML = rankCards(rows,{
        label:'Vendedor',
        accent:'#7c3aed',
        valFmt:({val})=>fmtBRL(val),
        subFmt:({val,count})=>`${count} contrato${count!==1?'s':''} · ${totalVend?Math.round(val/totalVend*100):0}% do total`,
        emptyMsg:'Nenhum dado no período.'
      });
    }
    else if(dashRankTab === 'contexto'){
      // Ranking com contexto: não só volume, mas ticket médio, ciclo de venda e taxa de conversão por vendedor
      const resolveDiasCiclo = c => {
        const lead = c.lead_id ? (State.leads||[]).find(l=>String(l.id)===String(c.lead_id)) : null;
        if(lead?.criado_em && c.data_assinatura) return Math.floor((new Date(c.data_assinatura).getTime()-new Date(lead.criado_em).getTime())/86400000);
        const prop = (State.propostas||[]).find(p=>normName(p.nome)===normName(c.nome));
        const leadFb = prop?.lead_id ? (State.leads||[]).find(l=>String(l.id)===String(prop.lead_id)) : null;
        if(leadFb?.criado_em && c.data_assinatura) return Math.floor((new Date(c.data_assinatura).getTime()-new Date(leadFb.criado_em).getTime())/86400000);
        return null;
      };
      const porVend = new Map();
      contFiltrados.forEach(c=>{
        const raw = c.vendedor||'—';
        const key = normNameRank(raw);
        if(!porVend.has(key)) porVend.set(key,{display:raw, valor:0, count:0, ciclos:[]});
        const e = porVend.get(key);
        e.valor += Number(c.valor)||0; e.count++;
        if(raw.length > e.display.length) e.display = raw;
        const dias = resolveDiasCiclo(c);
        if(dias!=null && dias>=0) e.ciclos.push(dias);
      });
      const leadsFiltrados = (isVend()?filterByVendor(leads):leads).filter(l=>inPeriod(l.criado_em));
      const leadsPorVend = new Map();
      leadsFiltrados.forEach(l=>{ const k=normNameRank(l.vendedor||'—'); leadsPorVend.set(k,(leadsPorVend.get(k)||0)+1); });

      const rows = [...porVend.values()].map(e=>{
        const ticketMedio = e.count ? e.valor/e.count : 0;
        const cicloMedio = e.ciclos.length ? Math.round(e.ciclos.reduce((a,b)=>a+b,0)/e.ciclos.length) : null;
        const leadsCount = leadsPorVend.get(normNameRank(e.display))||0;
        const taxaConv = leadsCount>0 ? Math.round(e.count/leadsCount*100) : null;
        return { ...e, ticketMedio, cicloMedio, taxaConv };
      }).sort((a,b)=>b.valor-a.valor);

      $('#rankBody').innerHTML = rows.length ? `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12.5px">
        <thead><tr style="border-bottom:2px solid var(--border)">
          <th style="text-align:left;padding:8px 10px;font-size:11px;color:var(--text-light);text-transform:uppercase">Vendedor</th>
          <th style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text-light);text-transform:uppercase">Volume</th>
          <th style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text-light);text-transform:uppercase">Contratos</th>
          <th style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text-light);text-transform:uppercase">Ticket Médio</th>
          <th style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text-light);text-transform:uppercase">Ciclo Médio</th>
          <th style="text-align:right;padding:8px 10px;font-size:11px;color:var(--text-light);text-transform:uppercase">Conversão</th>
        </tr></thead>
        <tbody>${rows.map((r,i)=>`<tr style="border-bottom:1px solid rgba(0,0,0,.04)">
          <td style="padding:9px 10px;font-weight:600">${i<3?medals[i]+' ':''}${esc(r.display)}</td>
          <td style="padding:9px 10px;text-align:right;font-weight:700;color:#7c3aed">${fmtBRL(r.valor)}</td>
          <td style="padding:9px 10px;text-align:right">${r.count}</td>
          <td style="padding:9px 10px;text-align:right">${fmtBRL(r.ticketMedio)}</td>
          <td style="padding:9px 10px;text-align:right">${r.cicloMedio!=null?r.cicloMedio+'d':'—'}</td>
          <td style="padding:9px 10px;text-align:right">${r.taxaConv!=null?r.taxaConv+'%':'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="font-size:11px;color:var(--text-light);margin-top:10px">Ciclo médio = dias entre criação do lead e assinatura do contrato. Conversão = contratos assinados ÷ leads criados no período.</div>`
      : `<div class="empty" style="padding:24px">Nenhum dado no período.</div>`;
    }
    else if(dashRankTab === 'bancos'){
      const src = contFiltrados.filter(c=>c.banco);
      const rows = grpNorm(src,'banco',c=>Number(c.valor)||0);
      $('#rankBody').innerHTML = rankCards(rows,{
        label:'Banco',
        accent:'#0369a1',
        valFmt:({val})=>fmtBRL(val),
        subFmt:({count})=>`${count} financiamento${count!==1?'s':''}`,
        emptyMsg:'Nenhum financiamento no período.'
      });
    }
    else if(dashRankTab === 'forma_pgto'){
      const rows = grpNorm(contFiltrados,'forma_pgto',()=>1);
      const total = contFiltrados.length;
      $('#rankBody').innerHTML = rankCards(rows,{
        label:'Forma Pgto',
        accent:'#059669',
        valFmt:({val})=>`${Math.round(val/Math.max(1,total)*100)}%`,
        subFmt:({val})=>`${val} contrato${val!==1?'s':''}`,
        emptyMsg:'Nenhum dado no período.'
      });
    }
    else if(dashRankTab === 'distribuidores'){
      const logFiltrados = (isVend()?filterByVendor(State.logistica||[]):State.logistica||[])
        .filter(l=>l.criado_em>=s0&&l.criado_em<=e9&&l.distribuidora);
      const rows = grpNorm(logFiltrados,'distribuidora',()=>1);
      $('#rankBody').innerHTML = rankCards(rows,{
        label:'Distribuidora',
        accent:'#d97706',
        valFmt:({val})=>`${val} pedido${val!==1?'s':''}`,
        subFmt:null,
        emptyMsg:'Nenhum dado no período.'
      });
    }
  }

  syncDashSelects();
  renderChart();
  renderRankings();

  $('#dashVendSel')?.addEventListener('change', e=>{ dashVendedor = e.target.value; renderRankings(); });

  // Dashboard preditivo de receita
  const pvEl = $('#preditivoSection');
  if(pvEl) pvEl.innerHTML = buildPreditivoSection();

  // Tempo médio por etapa
  const tmEl = $('#tempoMedioSection');
  if(tmEl) tmEl.innerHTML = buildTempoMedioSection();

  // Metas por vendedor
  const mvEl = $('#metasVendSection');
  if(mvEl) renderMetasVendedor().then(html=>{ if(mvEl) mvEl.innerHTML = html; $('#editMetasVendBtn')?.addEventListener('click', openMetasVendedoresModal); });


  // Filtro de período
  $$('.period-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      $$('.period-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      dashPeriod = btn.dataset.p;
      syncDashSelects();
      renderChart();
      renderRankings();
    });
  });

  // Seletores de mês / trimestre / semestre / ano
  $('#dashMesSel').addEventListener('change', e=>{
    dashMes = Number(e.target.value);
    renderChart(); renderRankings();
  });
  $('#dashTriSel').addEventListener('change', e=>{
    dashTri = Number(e.target.value);
    renderChart(); renderRankings();
  });
  $('#dashSemSel').addEventListener('change', e=>{
    dashSem = Number(e.target.value);
    renderChart(); renderRankings();
  });
  $('#dashAnoSel').addEventListener('change', e=>{
    dashAno = Number(e.target.value);
    renderChart(); renderRankings();
  });

  // Tabs de ranking
  $$('.rank-tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('.rank-tab').forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      dashRankTab = tab.dataset.rank;
      renderRankings();
    });
  });

  // Editar meta
  $('#editMetaBtn')?.addEventListener('click',()=>{
    const metaAtual = metaValor||'';
    openModal(`
      <div class="modal-header"><h2>Meta do Mês — ${mesAtual}</h2><button class="modal-close">×</button></div>
      <form id="metaForm"><div class="modal-body">
        <div class="form-grid">
          ${formField({label:`Meta para ${mesAtual}`,name:'valor',type:'number',value:metaAtual,required:true,placeholder:'0'})}
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close">Cancelar</button>
        <button type="submit" class="btn btn-primary">Salvar meta</button>
      </div></form>
    `,'sm');
    $('#metaForm').addEventListener('submit', async e=>{
      e.preventDefault();
      const d = readForm($('#metaForm'));
      const val = parseBR(d.valor)||0;
      if(metaRec){
        await supa.from('metas').update({valor:val,atualizado_em:new Date().toISOString()}).eq('id',metaRec.id);
      } else {
        await supa.from('metas').insert({mes:mesAtual,valor:val});
      }
      toast('Meta salva!','success'); closeModal(); renderDashboard();
    });
  });

  // Alerta leads parados → ir para pipeline destacando os parados
  $('#alertaLeadsParados')?.addEventListener('click', ()=>{
    const parados = calcLeadsParados(3);
    if(!parados.length) return;
    State.highlightParados = new Set(parados.map(l=>l.id));
    navigate('pipeline');
  });
}

/* ============================================================
   PIPELINE - KANBAN
   ============================================================ */
const STAGES = [
  { id:'lead', label:'Lead', icon:'🎯', table:'leads', dataKey:'leads' },
  { id:'proposta', label:'Proposta', icon:'📄', table:'propostas', dataKey:'propostas' },
  { id:'vistoria', label:'Vistoria', icon:'🔍', table:'vistorias', dataKey:'vistorias' },
  { id:'contrato', label:'Contrato', icon:'✍️', table:'contratos', dataKey:'contratos' },
  { id:'logistica', label:'Logística', icon:'📦', table:'logistica', dataKey:'logistica' },
  { id:'instalacao', label:'Instalação', icon:'🔧', table:'instalacoes', dataKey:'instalacoes' },
  { id:'homologacao', label:'Homologação', icon:'📋', table:'homologacoes', dataKey:'homologacoes' },
  { id:'posvenda',     label:'Pós Venda',    icon:'⭐', table:'posvenda',     dataKey:'posvenda' }
];

async function agendaMarcar(id, status){
  const row = document.getElementById('agenda-row-'+id);
  if(row) row.style.opacity='0.4';
  const {error} = await supa.from('relacionamento_agenda').update({status}).eq('id', id);
  if(error){ if(row) row.style.opacity='1'; alert('Erro: '+error.message); return; }
  if(row) row.remove();
  // Remove card se ficou vazio
  const card = document.querySelector('[data-agenda-card]');
  if(card && !card.querySelector('[id^="agenda-row-"]')) card.remove();
  // Atualiza State
  const item = (State.relacionamento_agenda||[]).find(a=>String(a.id)===String(id));
  if(item) item.status = status;
}

async function renderPipeline(){
  await loadAll();
  const role = userRole();
  let stages = STAGES;
  // Cada técnico vê apenas a coluna do seu modal
  if(role === 'tec_vistoria')              stages = STAGES.filter(s=>s.id==='vistoria');
  else if(role === 'tec_instalacao')       stages = STAGES.filter(s=>s.id==='instalacao');
  else if(role === 'tec_homologacao')      stages = STAGES.filter(s=>s.id==='homologacao');
  else if(role === 'tec_vistoria_instalacao') stages = STAGES.filter(s=>['vistoria','instalacao'].includes(s.id));

  const isTec = ['tec_vistoria','tec_instalacao','tec_homologacao','tec_vistoria_instalacao'].includes(role);
  $('#pageActions').innerHTML = isTec ? '' : `<button class="btn btn-primary" id="newLeadBtn">+ Novo Lead</button>`;
  $('#newLeadBtn')?.addEventListener('click', ()=> openLeadModal());

  const paradoIds = State.highlightParados;
  State.highlightParados = null;

  const paradoBanner = paradoIds?.size ? `
    <div id="paradoBanner" style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;display:flex;align-items:center;gap:8px">
      🔴 <strong>${paradoIds.size} lead${paradoIds.size!==1?'s':''} sem contato há +3 dias estão destacados abaixo.</strong>
      <button onclick="document.getElementById('paradoBanner').remove();document.querySelectorAll('.kanban-card.parado-highlight').forEach(c=>c.classList.remove('parado-highlight'))" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:16px;color:#9b2c2c">×</button>
    </div>` : '';

  $('#content').innerHTML = `${paradoBanner}<div class="kanban" id="kanban">${stages.map(s=>renderStageCol(s)).join('')}</div>`;
  attachKanbanDnD();
  attachKanbanSearch();

  // Highlight parado cards
  if(paradoIds?.size){
    document.querySelectorAll('.kanban-card').forEach(card=>{
      if(paradoIds.has(card.dataset.id) || paradoIds.has(Number(card.dataset.id))){
        card.classList.add('parado-highlight');
        card.style.outline='2px solid #e53e3e';
        card.style.outlineOffset='2px';
      }
    });
    // Scroll to first highlighted card
    const first = document.querySelector('.parado-highlight');
    if(first) setTimeout(()=>first.scrollIntoView({behavior:'smooth',block:'center'}),200);
  }
}

/* ============================================================
   KANBAN DO VISTORIADOR
   Visão dedicada para tec_vistoria: 4 colunas baseadas no
   status da vistoria, filtradas pelo técnico logado.
   ============================================================ */
async function renderVistoriadorKanban(){
  await loadAll();
  const tecNome = (State.profile?.nome||'').toLowerCase().trim();

  const VIST_COLS = [
    { id:'aguardando', label:'Aguardando Agendamento', icon:'⏳',
      filter: v => !v.data_agendamento && v.status !== 'cancelada' && v.status !== 'realizada' },
    { id:'agendada',   label:'Agendada',               icon:'📅',
      filter: v => v.status === 'agendada' },
    { id:'realizada',  label:'Realizada',              icon:'✅',
      filter: v => v.status === 'realizada' },
    { id:'cancelada',  label:'Cancelada',              icon:'❌',
      filter: v => v.status === 'cancelada' }
  ];

  // Vistorias atribuídas ao técnico logado
  const minhas = (State.vistorias||[]).filter(v =>
    (v.tecnico||'').toLowerCase().trim() === tecNome
  );

  function buildCol(col){
    const items = minhas.filter(col.filter);
    const cards = items.map(v => {
      const data = v.data_agendamento
        ? `${fmtDate(v.data_agendamento)}${v.hora_agendamento ? ' às '+v.hora_agendamento : ''}`
        : '<span style="color:#888;font-style:italic">Sem data</span>';
      const end = [v.rua, v.numero, v.bairro, v.cidade].filter(Boolean).join(', ');
      return `
        <div class="kanban-card" data-id="${v.id}" data-col="${col.id}"
             data-search="${esc(v.nome||'').toLowerCase()}"
             style="cursor:pointer">
          <div class="kanban-card-inner">
            <div class="name">🔍 ${esc(v.nome||'—')}</div>
            ${v.telefone ? `<div class="meta">📞 ${esc(v.telefone)}</div>` : ''}
            ${end ? `<div class="meta">📍 ${esc(end)}</div>` : ''}
            <div class="meta">📅 ${data}</div>
            ${v.kwp ? `<div class="meta">${fmtNum(v.kwp,2)} kWp</div>` : ''}
            <div class="footer">${badge(v.status||'agendada')}</div>
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
  $('#content').innerHTML = `<div class="kanban" id="kanban">${VIST_COLS.map(buildCol).join('')}${renderExtraCols()}</div>`;

  // Clique abre modal de vistoria
  $$('.kanban-card[data-col]').forEach(card => {
    card.addEventListener('click', () => openStageModal('vistoria', card.dataset.id));
  });
  attachExtraKanbanCols();
}

