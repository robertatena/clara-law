import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addCreditFromSession } from "@/lib/billing/core";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const sessionId = body?.session_id || "";
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "Faltou STRIPE_SECRET_KEY no .env.local" }, { status: 500 });
  }
  if (!sessionId) return NextResponse.json({ ok: false, error: "session_id ausente" }, { status: 400 });

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const email = (session.customer_details?.email || session.customer_email || "").toString();

  if (session.payment_status !== "paid") {
    return NextResponse.json({ ok: false, error: "Pagamento ainda não está como paid" }, { status: 402 });
  }

  const amount = session.amount_total || 0;
  const currency = (session.currency || "brl").toString();
  const r = addCreditFromSession(email, sessionId, amount, currency);
  return NextResponse.json({ ok: true, ...r });
}
