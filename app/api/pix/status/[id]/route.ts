// Consulta o status atual de uma cobrança Pix na AbacatePay.
// Chamado por polling do client (a cada ~4s) enquanto o usuário aguarda o
// pagamento. Opção A do plano: user_casos só nasce no webhook — polling
// consulta o gateway diretamente pra saber se pagou.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Evita cache do Next entre polls
export const dynamic = "force-dynamic";

const ABACATE_BASE = "https://api.abacatepay.com/v2/transparents";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "pix_not_configured" }, { status: 500 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 });
    }

    const resp = await fetch(`${ABACATE_BASE}/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
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

    // AbacatePay envelopa às vezes em `data`. Normaliza.
    const d = (data as { data?: Record<string, unknown> }).data ?? (data as Record<string, unknown>);
    const status = String(d.status || "PENDING").toUpperCase();
    const expiresAt = d.expiresAt ? String(d.expiresAt) : undefined;

    return NextResponse.json({ id, status, expiresAt });
  } catch (err) {
    console.error("pix_status_error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
