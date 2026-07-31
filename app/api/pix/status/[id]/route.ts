// Consulta o status atual de uma cobrança Pix na AbacatePay.
// Chamado por polling do client (a cada ~4s) enquanto o usuário aguarda o
// pagamento.
//
// Workaround do webhook AbacatePay que não dispara (Opção B, discutida com Roberta):
// quando o polling detectar status=PAID pela primeira vez, executa fulfillCheckout
// server-side usando email + produto + metadata passados na query string. Idempotente:
// a guarda interna de fulfillCheckout evita duplicar user_casos ou reenviar email.
//
// Endpoint AbacatePay: GET /v2/transparents/check?id=<id>. Retorna apenas
// id/status/expiresAt — sem metadata. Por isso o client precisa passar os
// dados originais na URL.

import { NextResponse } from "next/server";
import { fulfillCheckout, type Produto } from "@/lib/checkout-fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ABACATE_CHECK = "https://api.abacatepay.com/v2/transparents/check";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "pix_not_configured" }, { status: 500 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const resp = await fetch(`${ABACATE_CHECK}?id=${encodeURIComponent(id)}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    const raw = await resp.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "gateway_invalid_response" }, { status: 502 });
    }

    if (!resp.ok) {
      console.error("pix_status_gateway_error", { id, status: resp.status });
      return NextResponse.json({ error: "gateway_error", detail: data }, { status: 502 });
    }

    const d = (data as { data?: Record<string, unknown> }).data ?? (data as Record<string, unknown>);
    const status = String(d.status || "PENDING").toUpperCase();
    const expiresAt = d.expiresAt ? String(d.expiresAt) : undefined;

    // ─── Fulfill on PAID (workaround do webhook AbacatePay) ───────────────
    // Extrai metadata da query string. Se todos os campos obrigatórios existirem,
    // roda fulfillCheckout. Sem query params, apenas retorna o status (comportamento
    // legado). fulfillCheckout é idempotente — pode ser chamado 100 vezes seguidas
    // que o pipeline (provisionar user, salvar caso, mandar email) roda 1 vez só.
    if (status === "PAID") {
      const url = new URL(req.url);
      const email = (url.searchParams.get("email") || "").trim().toLowerCase();
      const produtoRaw = (url.searchParams.get("produto") || "").trim();
      const produto: Produto =
        produtoRaw === "pacote" || produtoRaw === "analise" ? produtoRaw : "desconhecido";

      if (email && produto !== "desconhecido") {
        // Coleta metadata adicional da query (fora de email/produto)
        const metadata: Record<string, string> = {};
        url.searchParams.forEach((v, k) => {
          if (k !== "email" && k !== "produto") metadata[k] = v;
        });
        try {
          const r = await fulfillCheckout({
            email,
            produto,
            provider: "pix",
            providerId: id,
            metadata,
          });
          console.log("pix_status_fulfill", { id, result: r.status });
        } catch (err) {
          console.error("pix_status_fulfill_error", { id, error: err instanceof Error ? err.message : "unknown" });
        }
      } else {
        console.log("pix_status_paid_no_fulfill_query", { id, hasEmail: !!email, produto });
      }
    }

    return NextResponse.json({ id, status, expiresAt });
  } catch (err) {
    console.error("pix_status_error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
