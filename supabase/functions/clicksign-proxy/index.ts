// Supabase Edge Function — ClickSign Proxy
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Verifica JWT — rejeita chamadas sem autenticação válida
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ erro: "Não autenticado" }), { status: 401, headers: CORS });
  }
  const supaUser = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authErr } = await supaUser.auth.getUser();
  if (authErr || !user) {
    return new Response(JSON.stringify({ erro: "Token inválido" }), { status: 401, headers: CORS });
  }

  try {
    const token = Deno.env.get("CLICKSIGN_TOKEN");
    if (!token) throw new Error("CLICKSIGN_TOKEN não configurado nos secrets da função.");

    const env  = Deno.env.get("CLICKSIGN_ENV") || "production";
    const BASE = env === "sandbox"
      ? "https://sandbox.clicksign.com"
      : "https://app.clicksign.com";

    const { action, payload } = await req.json();

    if (action === "enviar_contrato") {
      const { nomeArquivo, conteudoBase64, nome, email, cpf, telefone } = payload;

      // 1. Upload do documento
      const docRes = await fetch(`${BASE}/api/v1/documents?access_token=${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: {
            path:             `/contratos/${nomeArquivo}`,
            content_base64:   `data:application/pdf;base64,${conteudoBase64}`,
            deadline_at:      null,
            auto_close:       true,
            locale:           "pt-BR",
            sequence_enabled: false,
          },
        }),
      });
      const docData = await docRes.json();
      if (!docRes.ok || !docData.document?.key) {
        throw new Error("Erro ao criar documento: " + JSON.stringify(docData));
      }
      const documentKey = docData.document.key;

      // 2. Criar signatário
      const signerRes = await fetch(`${BASE}/api/v1/signers?access_token=${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer: {
            email,
            auths:             ["email"],
            name:              nome,
            has_documentation: !!cpf,
            ...(cpf      ? { documentation: cpf.replace(/\D/g, "") } : {}),
            ...(telefone ? { phone_number: telefone }                : {}),
          },
        }),
      });
      const signerData = await signerRes.json();
      if (!signerRes.ok || !signerData.signer?.key) {
        throw new Error("Erro ao criar signatário: " + JSON.stringify(signerData));
      }
      const signerKey = signerData.signer.key;

      // 3. Vincular signatário ao documento
      const listRes = await fetch(`${BASE}/api/v1/lists?access_token=${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          list: {
            document_key: documentKey,
            signer_key:   signerKey,
            sign_as:      "party",
            refusable:    false,
            message:      `Olá ${nome}, por favor assine seu contrato da SER Energia Renovável.`,
          },
        }),
      });
      const listData = await listRes.json();
      if (!listRes.ok) {
        throw new Error("Erro ao vincular signatário: " + JSON.stringify(listData));
      }
      const listKey = listData.list?.key;

      // 4. Notificar por e-mail
      const notifyRes = await fetch(`${BASE}/api/v1/notify_by_email?access_token=${token}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notify: { key: listKey } }),
      });
      if (!notifyRes.ok) {
        const nd = await notifyRes.json();
        throw new Error("Erro ao notificar: " + JSON.stringify(nd));
      }

      return new Response(
        JSON.stringify({ envelope_id: documentKey, list_key: listKey }),
        { headers: { ...CORS, "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Ação desconhecida: ${action}`);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ erro: msg }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
