// Webhook AbacatePay — dispara o mesmo pipeline pós-pagamento do Stripe
// quando uma cobrança Pix é paga.
//
// Segurança em duas camadas:
//   1) Query string: ?webhookSecret=<X> comparado com ABACATEPAY_WEBHOOK_SECRET
//      (a URL configurada no dashboard AbacatePay carrega esse secret; secret
//      gerado por nós, sob nosso controle)
//   2) HMAC-SHA256 assinado pela AbacatePay com a CHAVE PÚBLICA deles (constante
//      pra todos os integradores), resultado em BASE64, entregue no header
//      "X-Webhook-Signature". A AbacatePay documenta essa chave publicamente —
//      cole em ABACATEPAY_PUBLIC_KEY (env) ou substitua o placeholder abaixo.
//
// Ambas precisam bater. Se qualquer falhar, devolve 401 e não faz nada.

import crypto from "crypto";
import { NextResponse } from "next/server";
import { fulfillCheckout, type Produto } from "@/lib/checkout-fulfillment";

export const runtime = "nodejs";

// Header oficial documentado pela AbacatePay (docs.abacatepay.com/pages/webhooks).
// Node/fetch normaliza cabeçalhos pra lowercase — comparação sempre em lowercase.
const SIG_HEADER_NAME = (process.env.ABACATEPAY_WEBHOOK_SIG_HEADER || "x-webhook-signature").toLowerCase();

// Chave pública AbacatePay usada para verificar HMAC-SHA256 dos webhooks.
// Constante entre integradores — precisa ser colada da doc oficial deles.
// Preferimos env var pra permitir rotação sem redeploy caso mudem.
const ABACATE_PUBLIC_KEY_PLACEHOLDER = "PASTE_ABACATEPAY_PUBLIC_KEY_HERE";
const ABACATE_PUBLIC_KEY = process.env.ABACATEPAY_PUBLIC_KEY || ABACATE_PUBLIC_KEY_PLACEHOLDER;

function timingSafeEqualStrings(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Verifica assinatura AbacatePay: HMAC-SHA256 com a chave pública, resultado base64.
// Exemplo oficial em docs.abacatepay.com/pages/webhooks.
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
    console.error("pix_webhook_missing_public_key: cole ABACATEPAY_PUBLIC_KEY (env) ou substitua o placeholder no código");
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

  // ─── LOG DEBUG TEMPORÁRIO (remover após diagnóstico) ─────────────────────
  // Logs pra investigar por que a AbacatePay v2 rejeita assinatura mesmo com
  // ABACATEPAY_PUBLIC_KEY correta. Captura todos os headers + assinatura em
  // várias formas pra facilitar comparação visual nos Vercel logs.
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((v, k) => { allHeaders[k] = v; });
  // Header em variantes de nome (v2 pode ter mudado)
  const sigCandidates = {
    "x-webhook-signature": req.headers.get("x-webhook-signature") || "",
    "x-abacate-signature": req.headers.get("x-abacate-signature") || "",
    "x-signature": req.headers.get("x-signature") || "",
    "webhook-signature": req.headers.get("webhook-signature") || "",
    "signature": req.headers.get("signature") || "",
  };
  // Calcula HMAC em vários formatos e prefixos pra ela conferir manualmente
  const hmacBase64 = crypto.createHmac("sha256", ABACATE_PUBLIC_KEY).update(Buffer.from(rawBody, "utf8")).digest("base64");
  const hmacHex = crypto.createHmac("sha256", ABACATE_PUBLIC_KEY).update(Buffer.from(rawBody, "utf8")).digest("hex");
  console.log("pix_webhook_debug", {
    url: req.url,
    method: req.method,
    body_length: rawBody.length,
    body_preview: rawBody.slice(0, 300),
    all_headers: allHeaders,
    sig_candidates: sigCandidates,
    public_key_len: ABACATE_PUBLIC_KEY.length,
    public_key_first6: ABACATE_PUBLIC_KEY.slice(0, 6),
    public_key_last4: ABACATE_PUBLIC_KEY.slice(-4),
    computed_hmac_base64: hmacBase64,
    computed_hmac_hex: hmacHex,
  });
  // ─── FIM DO LOG DEBUG ────────────────────────────────────────────────────

  const sigHeader = req.headers.get(SIG_HEADER_NAME) || "";
  if (!sigHeader) {
    const headerList: string[] = [];
    req.headers.forEach((_v, k) => headerList.push(k));
    console.warn("pix_webhook_missing_signature_header", {
      expected: SIG_HEADER_NAME,
      received_headers: headerList,
    });
    return NextResponse.json({ error: "missing_signature" }, { status: 401 });
  }
  if (!verifyAbacateSignature(rawBody, sigHeader)) {
    // Log detalhado do que não bateu — helps user diagnose
    console.warn("pix_webhook_bad_hmac", {
      header_name: SIG_HEADER_NAME,
      received_sig: sigHeader,
      received_sig_len: sigHeader.length,
      expected_base64: hmacBase64,
      expected_base64_len: hmacBase64.length,
      match_ignoring_prefix: sigHeader.replace(/^sha256=/, "") === hmacBase64,
    });
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
  // Aceitamos também variações de status (PAID/COMPLETED) por resiliência.
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
