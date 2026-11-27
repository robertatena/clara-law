// Link de descadastro do lembrete de 10 dias, assinado por token (sem
// precisar de login). Chamado direto pelo link no e-mail de lembrete.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyLeadUnsubToken } from "@/lib/lead-unsub-token";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";

  let payload: ReturnType<typeof verifyLeadUnsubToken>;
  try {
    payload = verifyLeadUnsubToken(token);
  } catch (err) {
    console.error("leads_descadastrar_sem_secret", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "servico_indisponivel" }, { status: 500 });
  }
  if (!payload) {
    return NextResponse.json({ error: "token_invalido" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ descadastrado_em: new Date().toISOString() })
    .eq("id", payload.leadId);

  if (error) {
    console.error("leads_descadastrar_update_error", { leadId: payload.leadId, code: error.code, message: error.message });
    return NextResponse.json({ error: "servico_indisponivel" }, { status: 500 });
  }

  return new NextResponse(
    `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8" /><title>Descadastro confirmado</title></head>
    <body style="font-family:Arial,sans-serif;background:#F8F7F4;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
      <div style="text-align:center;max-width:420px;padding:24px;">
        <h1 style="color:#1a2340;font-size:20px;">Descadastro confirmado</h1>
        <p style="color:#374151;font-size:14px;line-height:1.6;">Você não vai mais receber o lembrete de 10 dias.</p>
      </div>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
