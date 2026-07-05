require('dotenv').config();
const fetch = require('node-fetch');

// ─── Templates de mensagem ────────────────────────────────────────────────────
const MENSAGENS = {
  aniversario: (nome) =>
`🎉 Feliz Aniversário, ${nome}! 🎂
Hoje o dia é seu, e a família SER Energia não podia deixar passar em branco!
Queremos desejar um ano repleto de conquistas, saúde e muita luz (literalmente ☀️) na sua vida.
Obrigado por confiar na SER e fazer parte da nossa história. Que seu novo ciclo venha ainda mais brilhante!
Um abraço da equipe SER Energia Renovável 💛`,

  dias5: (nome) =>
`Oi ${nome}, tudo bem? 😊
Já faz 5 dias que sua usina solar está instalada e gerando economia pra você — como está sendo essa experiência até aqui?
Queremos garantir que você esteja aproveitando 100% do seu sistema! Por isso, vamos te apresentar o app de monitoramento da SER, onde você acompanha em tempo real:
✅ Quanto sua usina está gerando
✅ Sua economia acumulada
✅ Performance do sistema, tudo pelo celular
Posso te enviar o passo a passo pra você baixar agora?
Qualquer dúvida, estamos aqui. Você não comprou só um sistema, você entrou pra família SER! 🌞`,

  dias30: (nome) =>
`${nome}, hoje é um dia especial pra gente! 🙏
Faz exatamente 1 mês que sua usina está instalada, e olha só o que isso significa: 1 mês de economia real na sua conta de luz, 1 mês de energia limpa gerada na sua casa, e 1 mês fazendo parte da nossa família SER.
Queremos genuinamente agradecer pela confiança. Cada cliente como você é o motivo da SER existir. 💛
E como forma de celebrar essa parceria, temos uma novidade:
🌟 Programa Embaixador SER 🌟
A partir de hoje, você pode ganhar até um salário mínimo por cada venda concretizada só indicando pessoas que também querem economizar com energia solar!
Simples assim: você indica, a pessoa fecha, você recebe.
Quer saber como funciona? Te explico tudo em 2 minutos aqui no WhatsApp.
Parabéns pelo seu primeiro mês com a SER! Que venham muitos outros 🚀`,

  dias90: (nome) =>
`${nome}, já são 3 meses de você com a SER Energia! 🎊
Nesse tempo você continua gerando energia limpa todos os dias direto do telhado da sua casa e economizando na conta de luz.
Estamos muito felizes com essa parceria, e por isso batemos aqui hoje com carinho: você já conhece o Programa Embaixador SER?
Relembrando: você indica, a pessoa fecha a instalação, e você ganha até um salário mínimo por cada venda concretizada. Sem limite de quantas indicações você pode fazer!
Muita gente da sua rede também merece parar de pagar caro na conta de luz — e você pode ser a ponte pra isso, ganhando por cada indicação.
Topa começar a indicar hoje mesmo? Me chama que te explico tudo certinho! 💪🌞`,
};

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL     = process.env.SUPABASE_URL;
const SUPABASE_KEY     = process.env.SUPABASE_SERVICE_KEY;
const ZAPI_INSTANCE    = process.env.ZAPI_INSTANCE;
const ZAPI_TOKEN       = process.env.ZAPI_TOKEN;
const DRY_RUN          = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const LOG_LEVEL        = process.env.LOG_LEVEL || 'info';

function log(level, ...args) {
  if (level === 'debug' && LOG_LEVEL !== 'debug') return;
  const prefix = DRY_RUN ? '[DRY-RUN]' : '[PROD]';
  console.log(`${new Date().toISOString()} ${prefix} [${level.toUpperCase()}]`, ...args);
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────
async function supaFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase ${path}: ${res.status} ${body}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function supaSelect(table, query = '') {
  return supaFetch(`${table}?${query}`, { method: 'GET', headers: { Prefer: 'return=representation' } });
}

async function supaUpdate(table, match, data) {
  const params = Object.entries(match).map(([k, v]) => `${k}=eq.${encodeURIComponent(v)}`).join('&');
  return supaFetch(`${table}?${params}`, { method: 'PATCH', body: JSON.stringify(data) });
}

// ─── Telefone ─────────────────────────────────────────────────────────────────
function normalizarTelefone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  // Já tem 55 na frente
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) return digits;
  // 10 ou 11 dígitos (DDD + número)
  if (digits.length === 10 || digits.length === 11) return '55' + digits;
  return null;
}

// ─── Envio Evolution API ──────────────────────────────────────────────────────
async function enviarWhatsApp(telefone, mensagem) {
  if (DRY_RUN) {
    log('info', `  → [DRY] Enviaria para ${telefone}:\n${mensagem.slice(0, 80)}...`);
    return true;
  }
  const url = `https://api.z-api.io/instances/${ZAPI_INSTANCE}/token/${ZAPI_TOKEN}/send-text`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: telefone, message: mensagem }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Z-API: ${res.status} ${body}`);
  }
  return true;
}

// ─── Merge de linhas duplicadas por telefone ──────────────────────────────────
function mergeByTelefone(rows) {
  const map = new Map();
  for (const row of rows) {
    const tel = normalizarTelefone(row.telefone);
    if (!tel) continue;
    if (!map.has(tel)) {
      map.set(tel, { ...row, _ids: [row.id], _tel: tel });
    } else {
      const existing = map.get(tel);
      existing._ids.push(row.id);
      // Mescla contrato_id e data_ativacao se um dos registros tiver e o outro não
      if (!existing.contrato_id && row.contrato_id) existing.contrato_id = row.contrato_id;
      if (!existing.data_ativacao && row.data_ativacao) existing.data_ativacao = row.data_ativacao;
      // Mantém o controle de envio mais antigo (já enviado vence)
      if (!existing.msg_5d_enviada_em && row.msg_5d_enviada_em) existing.msg_5d_enviada_em = row.msg_5d_enviada_em;
      if (!existing.msg_30d_enviada_em && row.msg_30d_enviada_em) existing.msg_30d_enviada_em = row.msg_30d_enviada_em;
      if (!existing.msg_90d_enviada_em && row.msg_90d_enviada_em) existing.msg_90d_enviada_em = row.msg_90d_enviada_em;
      if (!existing.msg_aniversario_ultimo_ano && row.msg_aniversario_ultimo_ano)
        existing.msg_aniversario_ultimo_ano = row.msg_aniversario_ultimo_ano;
    }
  }
  return [...map.values()];
}

// ─── Gravar controle em todas as linhas do grupo ──────────────────────────────
async function gravarControle(ids, campo, valor) {
  for (const id of ids) {
    await supaUpdate('posvenda', { id }, { [campo]: valor });
  }
}

// ─── Lógica de datas ──────────────────────────────────────────────────────────
function diasDesde(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function isAniversarioHoje(nascimento) {
  if (!nascimento) return false;
  const hoje = new Date();
  const nasc = new Date(nascimento);
  return nasc.getDate() === hoje.getDate() && nasc.getMonth() === hoje.getMonth();
}

// ─── Principal ────────────────────────────────────────────────────────────────
async function main() {
  log('info', `Iniciando robô de disparo. DRY_RUN=${DRY_RUN}`);

  // Busca todos os registros ativos com join em contratos para nascimento
  const rows = await supaSelect(
    'posvenda',
    'select=id,nome,telefone,contrato_id,data_ativacao,msg_5d_enviada_em,msg_30d_enviada_em,msg_90d_enviada_em,msg_aniversario_ultimo_ano,contratos(nascimento)&status=eq.ativo'
  );

  if (!rows?.length) { log('info', 'Nenhum registro ativo encontrado.'); return; }
  log('info', `${rows.length} registros carregados. Mesclando duplicatas por telefone...`);

  // Normaliza o nascimento que vem do join
  const rowsNorm = rows.map(r => ({
    ...r,
    nascimento: r.contratos?.nascimento || null,
  }));

  const clientes = mergeByTelefone(rowsNorm);
  log('info', `${clientes.length} clientes únicos após merge.`);

  const anoAtual = new Date().getFullYear();
  let enviados = 0, pulados = 0, erros = 0;

  for (const c of clientes) {
    const nome = (c.nome || '').split(' ')[0]; // Primeiro nome
    const tel  = c._tel;

    log('debug', `Processando: ${c.nome} (${tel})`);

    // ── Aniversário ──────────────────────────────────────────────────────────
    if (isAniversarioHoje(c.nascimento)) {
      if (c.msg_aniversario_ultimo_ano === anoAtual) {
        log('debug', `  Aniversário já enviado em ${anoAtual}: ${c.nome}`);
        pulados++;
      } else {
        try {
          await enviarWhatsApp(tel, MENSAGENS.aniversario(nome));
          if (!DRY_RUN) await gravarControle(c._ids, 'msg_aniversario_ultimo_ano', anoAtual);
          log('info', `  ✓ Aniversário → ${c.nome}`);
          enviados++;
        } catch (e) {
          log('info', `  ✗ Erro aniversário ${c.nome}: ${e.message}`);
          erros++;
        }
      }
    }

    if (!c.data_ativacao) {
      log('debug', `  Sem data_ativacao, pulando marcos 5/30/90d: ${c.nome}`);
      continue;
    }

    const dias = diasDesde(c.data_ativacao);
    const agora = new Date().toISOString();

    // ── 5 dias ───────────────────────────────────────────────────────────────
    if (dias >= 5 && !c.msg_5d_enviada_em) {
      try {
        await enviarWhatsApp(tel, MENSAGENS.dias5(nome));
        if (!DRY_RUN) await gravarControle(c._ids, 'msg_5d_enviada_em', agora);
        log('info', `  ✓ 5 dias → ${c.nome} (${dias}d)`);
        enviados++;
      } catch (e) {
        log('info', `  ✗ Erro 5d ${c.nome}: ${e.message}`);
        erros++;
      }
    }

    // ── 30 dias ──────────────────────────────────────────────────────────────
    if (dias >= 30 && !c.msg_30d_enviada_em) {
      try {
        await enviarWhatsApp(tel, MENSAGENS.dias30(nome));
        if (!DRY_RUN) await gravarControle(c._ids, 'msg_30d_enviada_em', agora);
        log('info', `  ✓ 30 dias → ${c.nome} (${dias}d)`);
        enviados++;
      } catch (e) {
        log('info', `  ✗ Erro 30d ${c.nome}: ${e.message}`);
        erros++;
      }
    }

    // ── 90 dias ──────────────────────────────────────────────────────────────
    if (dias >= 90 && !c.msg_90d_enviada_em) {
      try {
        await enviarWhatsApp(tel, MENSAGENS.dias90(nome));
        if (!DRY_RUN) await gravarControle(c._ids, 'msg_90d_enviada_em', agora);
        log('info', `  ✓ 90 dias → ${c.nome} (${dias}d)`);
        enviados++;
      } catch (e) {
        log('info', `  ✗ Erro 90d ${c.nome}: ${e.message}`);
        erros++;
      }
    }
  }

  log('info', `Concluído. Enviados: ${enviados} | Pulados: ${pulados} | Erros: ${erros}`);
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
