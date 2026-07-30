import { NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfillCheckout, type Produto } from "@/lib/checkout-fulfillment";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature") || "";

  if (!webhookSecret) {
    console.error("webhook_missing_secret");
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 500 });
  }

  // CRÍTICO: Stripe exige o body RAW para verificar assinatura.
  // req.text() preserva exatamente os bytes enviados (não chamar .json()).
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("webhook_signature_failed", msg);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  // Processa o evento. Sempre responder 200 (mesmo para eventos não tratados
  // ou com erro de processamento) — caso contrário Stripe retentará
  // indefinidamente.
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const produtoRaw = session.metadata?.produto ?? "desconhecido";
        const produto: Produto =
          produtoRaw === "pacote" || produtoRaw === "analise" ? produtoRaw : "desconhecido";
        const email = session.customer_email || session.metadata?.email || "";
        const amountCents = session.amount_total ?? 0;

        console.log("checkout_completed", {
          session_id: session.id,
          produto,
          email: email || "(sem email)",
          amount_brl: (amountCents / 100).toFixed(2),
          payment_status: session.payment_status,
        });

        // Coleta metadata em strings puras (Stripe pode ter tipos mistos)
        const md: Record<string, string> = {};
        for (const [k, v] of Object.entries(session.metadata || {})) {
          if (typeof v === "string") md[k] = v;
        }

        await fulfillCheckout({
          email,
          produto,
          provider: "stripe",
          providerId: session.id,
          metadata: md,
        });
        break;
      }
      default:
        console.log("webhook_event_ignored", { type: event.type, id: event.id });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("webhook_processing_error", { type: event.type, msg });
  }

  return NextResponse.json({ received: true });
}
