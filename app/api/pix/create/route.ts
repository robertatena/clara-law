// Cria uma cobrança Pix via checkout transparente da AbacatePay.
// Devolve brCode (copia-e-cola) e brCodeBase64 (PNG do QR) pro client
// renderizar in-page — sem redirect externo.

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ABACATE_API = "https://api.abacatepay.com/v2/transparents/create";

type Produto = "analise" | "pacote";

const PRODUTOS: Record<Produto, { amountCents: number; nome: string }> = {
  analise: {
    amountCents: 990,
    nome: "Análise de Contrato — Clara Law",
  },
  pacote: {
    amountCents: 4990,
    nome: "Pacote Ação — Clara Law",
  },
};

// Hash simples do e-mail para compor o externalId sem expor o e-mail cru.
function hashEmail(email: string): string {
  let h = 0;
  for (let i = 0; i < email.length; i++) {
    h = ((h << 5) - h) + email.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ABACATEPAY_API_KEY;
    if (!apiKey) {
      console.error("pix_create_missing_api_key");
      return NextResponse.json({ error: "pix_not_configured" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const produto = String(body.produto || "").trim() as Produto;

    // Metadata opcional (tipo_caso, descricao) — cai no dados_json do user_casos
    // quando o webhook processar o pagamento.
    const extraMetadataRaw = (body.metadata && typeof body.metadata === "object" ? body.metadata : {}) as Record<string, unknown>;
    const extraMetadata: Record<string, string> = {};
    for (const [k, v] of Object.entries(extraMetadataRaw)) {
      if (v === undefined || v === null) continue;
      const str = typeof v === "string" ? v : JSON.stringify(v);
      extraMetadata[k] = str.slice(0, 500);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "email_invalido" }, { status: 400 });
    }
    if (produto !== "analise" && produto !== "pacote") {
      return NextResponse.json({ error: "produto_invalido" }, { status: 400 });
    }

    const cfg = PRODUTOS[produto];
    const expiresInSec = 15 * 60; // 15 minutos
    const externalId = `${produto}_${Date.now()}_${hashEmail(email)}`;

    const payload = {
      method: "PIX",
      data: {
        amount: cfg.amountCents,
        expiresIn: expiresInSec,
        description: cfg.nome,
        externalId,
        // Toda info que o webhook precisa pra chamar fulfillCheckout
        metadata: {
          produto,
          email,
          ...extraMetadata,
        },
      },
    };

    console.log("pix_create_request", { produto, email, amount: cfg.amountCents, externalId });

    const resp = await fetch(ABACATE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const raw = await resp.text();
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error("pix_create_parse_error", { status: resp.status, raw: raw.slice(0, 300) });
      return NextResponse.json({ error: "gateway_invalid_response" }, { status: 502 });
    }

    if (!resp.ok) {
      console.error("pix_create_gateway_error", { status: resp.status, body: data });
      return NextResponse.json({ error: "gateway_error", detail: data }, { status: 502 });
    }

    // AbacatePay pode devolver o objeto sob `data` ou na raiz. Aceita ambos.
    const d = (data as { data?: Record<string, unknown> }).data ?? (data as Record<string, unknown>);
    const id = String(d.id || d.transactionId || "");
    const brCode = String(d.brCode || "");
    const brCodeBase64 = String(d.brCodeBase64 || "");
    const expiresAt = String(d.expiresAt || new Date(Date.now() + expiresInSec * 1000).toISOString());

    if (!id || !brCode || !brCodeBase64) {
      console.error("pix_create_incomplete_response", { hasId: !!id, hasBrCode: !!brCode, hasBase64: !!brCodeBase64 });
      return NextResponse.json({ error: "gateway_incomplete_response" }, { status: 502 });
    }

    console.log("pix_create_ok", { id, produto, externalId });

    return NextResponse.json({
      id,
      brCode,
      brCodeBase64,
      expiresAt,
      amount: cfg.amountCents,
      produto,
    });
  } catch (err) {
    console.error("pix_create_error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
