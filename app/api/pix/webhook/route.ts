// Webhook AbacatePay — dispara o mesmo pipeline pós-pagamento do Stripe
// quando uma cobrança Pix é paga (evento transparent.completed do checkout
// transparente).
//
// Segurança em duas camadas:
//   1) Query string: ?webhookSecret=<X> comparado com ABACATEPAY_WEBHOOK_SECRET.
//      Secret gerado por nós, sob nosso controle — protege contra requests
//      externos que descubram a URL do webhook mas não conhecem o secret.
//   2) HMAC-SHA256 assinado pela AbacatePay com a chave pública deles (fornecida
//      por conta, ~270 chars alfanuméricos, obtida via suporte), resultado em
//      BASE64, entregue no header "x-webhook-signature". Configurada em
//      ABACATEPAY_PUBLIC_KEY. Ref: docs.abacatepay.com/pages/webhooks/security
//
// Ambas precisam bater. Se qualquer falhar, devolve 401 e não faz nada.

import crypto from "crypto";
import { NextResponse } from "next/server";
import { fulfillCheckout, type Produto } from "@/lib/checkout-fulfillment";

export const runtime = "nodejs";

// Header oficial documentado pela AbacatePay. Node/fetch normaliza cabeçalhos
// pra lowercase — comparação sempre em lowercase. Configurável via env var
// caso a AbacatePay mude o nome no futuro.
const SIG_HEADER_NAME = (process.env.ABACATEPAY_WEBHOOK_SIG_HEADER || "x-webhook-signature").toLowerCase();

// Chave pública AbacatePay — específica por conta, obtida via suporte deles.
// Placeholder existe pra fail-safe: se ninguém setou a env var, o endpoint
// rejeita todos os webhooks (500) em vez de silenciosamente aceitar sem
// verificação real.
const ABACATE_PUBLIC_KEY_PLACEHOLDER = "PASTE_ABACATEPAY_PUBLIC_KEY_HERE";
const ABACATE_PUBLIC_KEY = process.env.ABACATEPAY_PUBLIC_KEY || ABACATE_PUBLIC_KEY_PLACEHOLDER;

function timingSafeEqualStrings(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Espelha o exemplo oficial da AbacatePay: HMAC-SHA256 com a chave pública
// como key literal (string), body como recebido, output base64.
function verifyAbacateSignature(rawBody: string, signatureFromHeader: string): boolean {
  const expected = crypto
    .createHmac("sha256", ABACATE_PUBLIC_KEY)
    .update(Buffer.from(rawBody, "utf8"))
    .digest("base64");
  return timingSafeEqualStrings(expected, signatureFromHeader.trim());
}

export async function POST(req: Request) {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET || "";
  if (!secret) {
    console.error("pix_webhook_missing_secret");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }
  if (ABACATE_PUBLIC_KEY === ABACATE_PUBLIC_KEY_PLACEHOLDER) {
    console.error("pix_webhook_missing_public_key: configure ABACATEPAY_PUBLIC_KEY com o valor fornecido pelo suporte AbacatePay");
    return NextResponse.json({ error: "webhook_public_key_not_configured" }, { status: 500 });
  }

  // 1) Query string secret (camada 1 — o secret é nosso)
  const url = new URL(req.url);
  const querySecret = url.searchParams.get("webhookSecret") || "";
  if (!querySecret || !timingSafeEqualStrings(querySecret, secret)) {
    console.warn("pix_webhook_bad_query_secret", {
      received_len: querySecret.length,
      expected_len: secret.length,
    });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) HMAC no header — precisa do body RAW
  const rawBody = await req.text();
  const sigHeader = req.headers.get(SIG_HEADER_NAME) || "";
  if (!sigHeader) {
    console.warn("pix_webhook_missing_signature_header", { expected: SIG_HEADER_NAME });
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }
  if (!verifyAbacateSignature(rawBody, sigHeader)) {
    console.warn("pix_webhook_bad_hmac", { header_name: SIG_HEADER_NAME });
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  // 3) Parse do payload
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("pix_webhook_invalid_json");
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const p = payload as { event?: string; data?: Record<string, unknown> };
  const event = String(p.event || "").toLowerCase();
  const data = p.data ?? {};

  // Checkout transparente Pix → evento oficial "transparent.completed".
  // Aceitamos também variações de status por resiliência caso o schema mude.
  const rawStatus = String(data.status || "").toUpperCase();
  const isPaid =
    event === "transparent.completed" ||
    rawStatus === "PAID" ||
    rawStatus === "COMPLETED";

  console.log("pix_webhook_received", {
    event,
    status: rawStatus,
    isPaid,
    id: data.id ? String(data.id) : "(none)",
  });

  if (!isPaid) {
    // Aceita 200 pra não gerar retry — ignoramos eventos que não sejam de pagamento concluído.
    return NextResponse.json({ received: true, processed: false, reason: "not_completed_event", event });
  }

  const id = String(data.id || data.transactionId || "");
  const metadata = (data.metadata && typeof data.metadata === "object" ? data.metadata : {}) as Record<string, unknown>;
  const emailRaw = metadata.email ?? data.email ?? "";
  const email = String(emailRaw || "").trim().toLowerCase();
  const produtoRaw = String(metadata.produto || "").trim();
  const produto: Produto =
    produtoRaw === "pacote" || produtoRaw === "analise" ? produtoRaw : "desconhecido";

  if (!id) {
    console.error("pix_webhook_missing_id");
    return NextResponse.json({ received: true, processed: false, reason: "missing_id" });
  }

  // Coerce metadata para Record<string, string>
  const md: Record<string, string> = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v === undefined || v === null) continue;
    md[k] = typeof v === "string" ? v : JSON.stringify(v);
  }

  try {
    await fulfillCheckout({
      email,
      produto,
      provider: "pix",
      providerId: id,
      metadata: md,
    });
  } catch (err) {
    // fulfillCheckout já cataliza erros por dentro — se chegar aqui é bug estrutural.
    console.error("pix_webhook_fulfillment_error", err instanceof Error ? err.message : "unknown");
  }

  return NextResponse.json({ received: true, processed: true });
}
