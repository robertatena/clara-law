// Polling público (mas limitado) usado por /sucesso pra saber quando a
// petição já tem pelo menos uma versão pronta (completa ou parcial) depois
// do pagamento. Aceita os dois formatos de redirect: Stripe manda
// ?session_id=..., o fluxo Pix manda ?src=pix&id=<transactionId>.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { signCasoToken } from "@/lib/caso-acesso-token";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!checkRateLimit(`caso-status:${clientIp(req)}`, 60, 10 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const pixId = url.searchParams.get("src") === "pix" ? url.searchParams.get("id") : null;

  if (!sessionId && !pixId) {
    return NextResponse.json({ pronto: false });
  }

  const col = sessionId ? "stripe_session_id" : "abacate_transaction_id";
  const valor = sessionId || pixId || "";

  const { data: row, error } = await supabaseAdmin
    .from("user_casos")
    .select("id, peticao_status")
    .eq(col, valor)
    .maybeSingle();

  // Erro de banco/schema não é "ainda não ficou pronto" — loga separado pra
  // não escondido atrás do polling normal (que é silencioso de propósito).
  if (error) {
    console.error("caso_status_query_error", { col, valor, code: error.code, message: error.message });
    return NextResponse.json({ pronto: false, error: "servico_indisponivel" }, { status: 500 });
  }
  if (!row || (row.peticao_status !== "parcial" && row.peticao_status !== "completo")) {
    return NextResponse.json({ pronto: false });
  }

  let downloadToken: string;
  try {
    downloadToken = signCasoToken(row.id);
  } catch (err) {
    console.error("caso_status_sem_secret", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ pronto: false });
  }

  return NextResponse.json({ pronto: true, casoId: row.id, downloadToken });
}
