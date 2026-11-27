// Grava o lead do plano grátis (chamado por lib/supabase.ts:salvarLead) via
// service role no servidor. A tabela leads tem RLS ligado e só tem policy
// de INSERT pra anon, sem SELECT — de propósito, pra não expor e-mail de
// ninguém. Um insert feito direto no browser com .select() (RETURNING)
// batia nessa falta de policy de SELECT e falhava com 401 — por isso a
// tabela nunca gravava nada antes desta rota existir.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ORIGENS_VALIDAS = ["caso", "contrato", "jec"];
const MAX_CAMPO = 100;

function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function campoOpcional(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  return v.trim().slice(0, MAX_CAMPO);
}

export async function POST(req: Request) {
  if (!checkRateLimit(`leads:${clientIp(req)}`, 20, 10 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase().slice(0, 200);
  const origem = String(body.origem || "");
  const tipoCaso = campoOpcional(body.tipo_caso);
  const querLembrete = body.querLembrete === true;
  const utm = body.utm && typeof body.utm === "object" ? body.utm as Record<string, unknown> : {};

  if (!email || !emailValido(email)) {
    return NextResponse.json({ error: "email_invalido" }, { status: 400 });
  }
  if (!ORIGENS_VALIDAS.includes(origem)) {
    return NextResponse.json({ error: "origem_invalida" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("leads").insert([{
    email,
    origem,
    tipo_caso: tipoCaso,
    utm_source: campoOpcional(utm.utm_source),
    utm_medium: campoOpcional(utm.utm_medium),
    utm_campaign: campoOpcional(utm.utm_campaign),
    quer_lembrete: querLembrete,
    converteu: false,
  }]);

  if (error) {
    console.error("leads_insert_error", { email, origem, code: error.code, message: error.message });
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
