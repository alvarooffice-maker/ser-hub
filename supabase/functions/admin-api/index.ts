import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY      = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // 1. Verifica JWT do usuário chamador
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado' }, 401);

  const supaUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authErr } = await supaUser.auth.getUser();
  if (authErr || !user) return json({ error: 'Token inválido' }, 401);

  // 2. Verifica perfil no banco
  const supaAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: perfil } = await supaAdmin
    .from('perfis')
    .select('perfil')
    .eq('id', user.id)
    .single();

  const role = perfil?.perfil;
  const isAdmin = role === 'admin';
  const isSupervisorOrAdmin = ['admin', 'supervisor'].includes(role);

  // 3. Roteia a ação
  const { action, ...params } = await req.json().catch(() => ({}));

  switch (action) {

    case 'create_user': {
      if (!isAdmin) return json({ error: 'Apenas admin pode criar usuários' }, 403);
      const { email, password, nome, perfilNovo, ativo, cpf } = params;
      if (!email || !password || !nome) return json({ error: 'Campos obrigatórios ausentes' }, 400);

      let userId: string;
      const { data: authData, error: createErr } = await supaAdmin.auth.admin.createUser({
        email, password, email_confirm: true,
      });

      if (createErr) {
        if (!createErr.message?.toLowerCase().includes('already')) {
          return json({ error: createErr.message }, 400);
        }
        // já existe — busca pelo email
        const { data: lista } = await supaAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existente = lista?.users?.find((u: any) => u.email === email);
        if (!existente) return json({ error: 'Email já registrado mas ID não encontrado' }, 400);
        userId = existente.id;
      } else {
        userId = authData.user!.id;
      }

      const { error: perfErr } = await supaAdmin.from('perfis').upsert(
        { id: userId, nome, email, perfil: perfilNovo || 'vendedor', ativo: ativo !== false, cpf: cpf || null },
        { onConflict: 'id' }
      );
      if (perfErr) return json({ error: perfErr.message }, 500);
      return json({ ok: true, userId });
    }

    case 'update_password': {
      if (!isAdmin) return json({ error: 'Apenas admin pode alterar senhas' }, 403);
      const { email: targetEmail, password: newPassword } = params;
      if (!targetEmail || !newPassword) return json({ error: 'email e password obrigatórios' }, 400);
      if (newPassword.length < 8) return json({ error: 'Senha muito curta' }, 400);

      const { data: lista } = await supaAdmin.auth.admin.listUsers({ perPage: 1000 });
      const authUser = lista?.users?.find((u: any) => u.email === targetEmail);
      if (!authUser) return json({ error: 'Usuário não encontrado' }, 404);

      const { error } = await supaAdmin.auth.admin.updateUserById(authUser.id, { password: newPassword });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    case 'backup': {
      if (!isSupervisorOrAdmin) return json({ error: 'Sem permissão para backup' }, 403);
      const tables = [
        'leads','propostas','vistorias','contratos','logistica','instalacoes',
        'homologacoes','posvenda','atendimentos','app_manutencao','remarketing',
        'financeiro_receitas','financeiro_despesas','cadastros','perfis',
        'tentativas_contato','metas',
      ];
      const tabelas: Record<string, any[]> = {};
      await Promise.all(tables.map(async (t) => {
        const { data } = await supaAdmin.from(t).select('*').order('criado_em', { ascending: true });
        tabelas[t] = data || [];
      }));
      return json({
        gerado_em: new Date().toISOString(),
        gerado_por: user.email,
        versao: '1.0',
        tabelas,
        total_registros: Object.values(tabelas).reduce((s, r) => s + r.length, 0),
      });
    }

    case 'update_perfil': {
      if (!isAdmin) return json({ error: 'Apenas admin pode editar perfis' }, 403);
      const { email: targetEmail, nome, perfilNovo, ativo, cpf } = params;
      const { data, error } = await supaAdmin
        .from('perfis')
        .update({ nome, perfil: perfilNovo, ativo, cpf: cpf || null })
        .eq('email', targetEmail)
        .select();
      if (error) return json({ error: error.message }, 500);
      if (!data?.length) return json({ error: 'Registro não encontrado' }, 404);
      return json({ ok: true });
    }

    default:
      return json({ error: 'Ação desconhecida' }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
