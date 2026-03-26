import { NextResponse } from "next/server";
import Stripe from "stripe";
import { addCredit } from "@/lib/db";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing", { apiVersion: "2024-06-20" });
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  if (!webhookSecret) return NextResponse.json({ error: "missing_STRIPE_WEBHOOK_SECRET" }, { status: 400 });
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: "invalid_signature", detail: err?.message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = (session.customer_email || session.metadata?.clara_email || "").toLowerCase();
    if (email) addCredit(email, Number(session.metadata?.credits || "1"));
  }

  return NextResponse.json({ ok: true });
}
