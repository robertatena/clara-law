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

  // ─── LOG DEBUG v2 (remover após diagnóstico) ─────────────────────────────
  // Testa 3 algoritmos × 3 encodings de key × 2 outputs = 18 variantes,
  // procura qual bate com received_sig. Logs em várias linhas curtas
  // pra não truncar no dashboard Vercel.

  // Header candidates (multi-nome)
  const sigVariants = {
    "x-webhook-signature": req.headers.get("x-webhook-signature") || "",
    "x-abacate-signature": req.headers.get("x-abacate-signature") || "",
    "x-signature": req.headers.get("x-signature") || "",
    "webhook-signature": req.headers.get("webhook-signature") || "",
    "signature": req.headers.get("signature") || "",
  };
  const receivedSig = sigVariants[SIG_HEADER_NAME as keyof typeof sigVariants] || "";
  const receivedNormalized = receivedSig.replace(/^sha256=/, "").replace(/^sha1=/, "").replace(/^sha512=/, "").trim();

  // Metadata do body
  console.log("pix_webhook_debug_meta", {
    url: req.url,
    body_length: rawBody.length,
    body_first_80: rawBody.slice(0, 80),
    body_last_40: rawBody.slice(-40),
  });

  // Metadata da chave
  console.log("pix_webhook_debug_key", {
    public_key_len: ABACATE_PUBLIC_KEY.length,
    public_key_first6: ABACATE_PUBLIC_KEY.slice(0, 6),
    public_key_last4: ABACATE_PUBLIC_KEY.slice(-4),
    looks_like_hex_48b: /^[0-9a-f]{96}$/i.test(ABACATE_PUBLIC_KEY),
    looks_like_hex_32b: /^[0-9a-f]{64}$/i.test(ABACATE_PUBLIC_KEY),
    looks_like_base64: /^[A-Za-z0-9+/]+=*$/.test(ABACATE_PUBLIC_KEY),
  });

  // Assinatura recebida
  console.log("pix_webhook_debug_sig", {
    header_using: SIG_HEADER_NAME,
    all_sig_headers: sigVariants,
    received_raw: receivedSig,
    received_len: receivedSig.length,
    received_normalized: receivedNormalized,
    normalized_len: receivedNormalized.length,
    looks_hex: /^[0-9a-f]+$/i.test(receivedNormalized),
    looks_base64: /^[A-Za-z0-9+/]+=*$/.test(receivedNormalized),
  });

  // Todos os headers pra descartar outros nomes
  const allHeaders: Record<string, string> = {};
  req.headers.forEach((v, k) => { allHeaders[k] = v; });
  console.log("pix_webhook_debug_headers", allHeaders);

  // Constrói variantes de key
  const keyString = ABACATE_PUBLIC_KEY;
  let keyHex: Buffer | null = null;
  let keyB64: Buffer | null = null;
  try { if (/^[0-9a-f]+$/i.test(ABACATE_PUBLIC_KEY) && ABACATE_PUBLIC_KEY.length % 2 === 0) keyHex = Buffer.from(ABACATE_PUBLIC_KEY, "hex"); } catch { /* skip */ }
  try { if (/^[A-Za-z0-9+/]+=*$/.test(ABACATE_PUBLIC_KEY)) keyB64 = Buffer.from(ABACATE_PUBLIC_KEY, "base64"); } catch { /* skip */ }

  // Descoberta: AbacatePay envia o secret no header x-webhook-secret.
  // Testa se ele entra no cálculo (como parte do payload assinado).
  const xWebhookSecret = req.headers.get("x-webhook-secret") || "";

  // Variantes de PAYLOAD (não só body — inclui possíveis prefixos/sufixos)
  const payloadVariants: Array<{ label: string; body: Buffer }> = [
    { label: "raw", body: Buffer.from(rawBody, "utf8") },
  ];
  // Se body é JSON: re-serializar sem espaços + pretty-printed
  try {
    const parsed = JSON.parse(rawBody);
    const restringified = JSON.stringify(parsed);
    if (restringified !== rawBody) {
      payloadVariants.push({ label: "json_restringified_min", body: Buffer.from(restringified, "utf8") });
    }
    const pretty2 = JSON.stringify(parsed, null, 2);
    if (pretty2 !== rawBody) {
      payloadVariants.push({ label: "json_pretty_2sp", body: Buffer.from(pretty2, "utf8") });
    }
  } catch { /* body não é JSON válido */ }
  // Trim
  const trimmed = rawBody.trim();
  if (trimmed !== rawBody) {
    payloadVariants.push({ label: "trimmed", body: Buffer.from(trimmed, "utf8") });
  }
  // Variantes com x-webhook-secret concatenado (padrão comum em signature-covers-headers)
  if (xWebhookSecret) {
    payloadVariants.push({ label: "secret+body", body: Buffer.from(xWebhookSecret + rawBody, "utf8") });
    payloadVariants.push({ label: "body+secret", body: Buffer.from(rawBody + xWebhookSecret, "utf8") });
    payloadVariants.push({ label: "secret.body", body: Buffer.from(xWebhookSecret + "." + rawBody, "utf8") });
    payloadVariants.push({ label: "secret_only", body: Buffer.from(xWebhookSecret, "utf8") });
  }

  console.log("pix_webhook_debug_payload_variants", {
    count: payloadVariants.length,
    lengths: payloadVariants.map((b) => `${b.label}:${b.body.length}`),
  });

  // Hipótese α: x-webhook-secret é usado COMO key do HMAC (em vez do configured)
  const xSecretHex: Buffer | null = /^[0-9a-f]+$/i.test(xWebhookSecret) && xWebhookSecret.length % 2 === 0
    ? Buffer.from(xWebhookSecret, "hex") : null;

  const algos: Array<"sha256" | "sha512" | "sha1"> = ["sha256", "sha512", "sha1"];
  const keyForms: Array<{ label: string; key: Buffer | string }> = [
    { label: "cfg_string", key: keyString },
    ...(keyHex ? [{ label: "cfg_hex_bytes", key: keyHex }] : []),
    ...(keyB64 ? [{ label: "cfg_b64_bytes", key: keyB64 }] : []),
    // Hipótese α: header x-webhook-secret como key
    ...(xWebhookSecret ? [{ label: "hdr_string", key: xWebhookSecret }] : []),
    ...(xSecretHex ? [{ label: "hdr_hex_bytes", key: xSecretHex }] : []),
  ];

  const computed: Array<{ variant: string; base64: string; hex: string; matches_normalized: boolean; matches_raw: boolean }> = [];
  for (const algo of algos) {
    for (const kf of keyForms) {
      for (const bv of payloadVariants) {
        try {
          const h = crypto.createHmac(algo, kf.key).update(bv.body).digest();
          const b64 = h.toString("base64");
          const hex = h.toString("hex");
          const variant = `${algo}_${kf.label}_${bv.label}`;
          computed.push({
            variant,
            base64: b64,
            hex: hex,
            matches_normalized: b64 === receivedNormalized || hex === receivedNormalized,
            matches_raw: b64 === receivedSig || hex === receivedSig,
          });
        } catch { /* skip */ }
      }
    }
  }

  // Auto-detecta winners
  const winners = computed.filter((c) => c.matches_normalized || c.matches_raw);

  // Loga todas as variantes de forma COMPACTA (só first-12 do base64 + flag).
  // Fatia em batches pra evitar truncar no dashboard.
  const compactList = computed.map((c) => `${c.variant}=${c.base64.slice(0, 12)}${c.matches_normalized ? "✓N" : ""}${c.matches_raw ? "✓R" : ""}`);
  const CHUNK = 8;
  for (let i = 0; i < compactList.length; i += CHUNK) {
    console.log("pix_webhook_debug_hmac_batch", { i, batch: compactList.slice(i, i + CHUNK) });
  }

  // Se algum winner, loga ele por extenso pra fix imediato
  for (const w of winners) {
    console.log("pix_webhook_debug_WINNER", {
      variant: w.variant,
      base64: w.base64,
      hex: w.hex,
      matches_normalized: w.matches_normalized,
      matches_raw: w.matches_raw,
    });
  }
  console.log("pix_webhook_debug_summary", { winners_count: winners.length, total_variants_tested: computed.length });
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
    console.warn("pix_webhook_bad_hmac", {
      header_name: SIG_HEADER_NAME,
      received_sig_len: sigHeader.length,
      // Diagnóstico detalhado (variantes de algoritmo/encoding) já foi
      // logado acima em pix_webhook_debug_hmac + pix_webhook_debug_winners.
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
