// Endpoint admin one-off pra processar manualmente pagamentos Pix cujo
// webhook AbacatePay não chegou (workaround enquanto suporte AbacatePay
// não resolve a raiz).
//
// Autenticação: header X-Admin-Secret contra env ADMIN_FULFILL_SECRET.
// Body: { id, email, produto, metadata? }
// Sempre confirma o PAID direto na AbacatePay antes de rodar fulfill —
// evita alguém com o secret disparar fulfill de charge não pago.
// Idempotente via fulfillCheckout (não duplica user_casos nem reenvia email).

import { NextResponse } from "next/server";
import { fulfillCheckout, type Produto } from "@/lib/checkout-fulfillment";

export const runtime = "nodejs";

const ABACATE_CHECK = "https://api.abacatepay.com/v2/transparents/check";

export async function POST(req: Request) {
  const adminSecret = process.env.ADMIN_FULFILL_SECRET;
  const apiKey = process.env.ABACATEPAY_API_KEY;

  if (!adminSecret) {
    console.error("fulfill_manual_no_secret_configured");
    return NextResponse.json({ error: "admin_secret_not_configured" }, { status: 500 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "pix_not_configured" }, { status: 500 });
  }

  const providedSecret = req.headers.get("x-admin-secret") || "";
  if (!providedSecret || providedSecret !== adminSecret) {
    console.warn("fulfill_manual_unauthorized");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const produtoRaw = String(body.produto || "").trim();
  const produto: Produto =
    produtoRaw === "pacote" || produtoRaw === "analise" ? produtoRaw : "desconhecido";

  const metadata: Record<string, string> = {};
  if (body.metadata && typeof body.metadata === "object") {
    for (const [k, v] of Object.entries(body.metadata as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      metadata[k] = typeof v === "string" ? v : JSON.stringify(v);
    }
  }

  if (!id || !email || produto === "desconhecido") {
    return NextResponse.json({ error: "missing_or_invalid_fields", need: ["id", "email", "produto in [pacote, analise]"] }, { status: 400 });
  }

  // Confirma direto na AbacatePay que essa cobrança está paga.
  // Evita fulfill de charges não pagas mesmo com o admin secret na mão.
  const resp = await fetch(`${ABACATE_CHECK}?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  const rawStatus = await resp.text();
  let statusData: unknown;
  try { statusData = JSON.parse(rawStatus); } catch { statusData = null; }

  if (!resp.ok || !statusData) {
    return NextResponse.json({ error: "gateway_check_failed", detail: statusData }, { status: 502 });
  }
  const d = (statusData as { data?: Record<string, unknown> }).data ?? (statusData as Record<string, unknown>);
  const abacateStatus = String(d.status || "").toUpperCase();
  if (abacateStatus !== "PAID") {
    return NextResponse.json({ error: "charge_not_paid", abacateStatus, detail: d }, { status: 409 });
  }

  console.log("fulfill_manual_start", { id, email, produto });

  const result = await fulfillCheckout({
    email,
    produto,
    provider: "pix",
    providerId: id,
    metadata,
  });

  console.log("fulfill_manual_end", { id, result: result.status });

  return NextResponse.json({ ok: true, result: result.status });
}
