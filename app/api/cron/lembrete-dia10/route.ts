// Cron diário (ver vercel.json) — manda o lembrete de "a empresa respondeu?"
// pra quem gerou o plano grátis há 10+ dias, pediu o lembrete (checkbox em
// /enviar), ainda não recebeu e não comprou o Kit Juizado nesse meio tempo.
//
// Protegido pelo header Authorization que o próprio Vercel Cron injeta
// quando CRON_SECRET existe como env var do projeto — nunca aceita chamadas
// sem esse header batendo.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { enviarLembreteDia10 } from "@/lib/lembrete-dia10";

export const runtime = "nodejs";
export const maxDuration = 60;

type LeadPendente = { id: string; email: string; tipo_caso: string | null };

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("cron_lembrete_missing_secret");
    return NextResponse.json({ error: "cron_not_configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cortes = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

  const { data: pendentes, error: queryError } = await supabaseAdmin
    .from("leads")
    .select("id, email, tipo_caso")
    .eq("quer_lembrete", true)
    .is("lembrete_enviado_em", null)
    .is("descadastrado_em", null)
    .lte("criado_em", cortes)
    .not("email", "is", null);

  if (queryError) {
    console.error("cron_lembrete_query_error", { code: queryError.code, message: queryError.message });
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const leads = (pendentes ?? []) as LeadPendente[];
  if (leads.length === 0) {
    return NextResponse.json({ enviados: 0, pulados: 0 });
  }

  // Exclui quem já comprou o Kit Juizado nesse meio tempo — não manda o
  // lembrete "a empresa respondeu?" pra quem já avançou pro Juizado.
  const emails = [...new Set(leads.map((l) => l.email).filter(Boolean))];
  const { data: casosExistentes, error: casosError } = await supabaseAdmin
    .from("user_casos")
    .select("email")
    .in("email", emails);
  if (casosError) {
    console.error("cron_lembrete_casos_query_error", { code: casosError.code, message: casosError.message });
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
  const emailsJaCompraram = new Set((casosExistentes ?? []).map((c) => (c as { email: string }).email));

  let enviados = 0;
  let pulados = 0;
  for (const lead of leads) {
    if (emailsJaCompraram.has(lead.email)) {
      pulados += 1;
      continue;
    }
    try {
      await enviarLembreteDia10(lead.email, lead.tipo_caso, lead.id);
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update({ lembrete_enviado_em: new Date().toISOString() })
        .eq("id", lead.id);
      if (updateError) {
        console.error("cron_lembrete_marcar_enviado_falhou", { leadId: lead.id, code: updateError.code, message: updateError.message });
      }
      enviados += 1;
    } catch (err) {
      console.error("cron_lembrete_envio_falhou", { leadId: lead.id, error: err instanceof Error ? err.message : String(err) });
    }
  }

  console.log("cron_lembrete_concluido", { total: leads.length, enviados, pulados });
  return NextResponse.json({ enviados, pulados });
}
