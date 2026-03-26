import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { addCredits, db } from "@/lib/db";
import { PRICE_PER_ANALYSIS_CENTS, CURRENCY } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature");
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: "STRIPE_SECRET_KEY_missing" }, { status: 500 });
  }
  if (!whSecret) {
    return NextResponse.json({ ok: false, error: "STRIPE_WEBHOOK_SECRET_missing" }, { status: 500 });
  }
  if (!sig) return NextResponse.json({ ok: false, error: "missing_signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, whSecret);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "bad_signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as any;
      const email = String(s?.metadata?.email || s?.customer_email || "").trim().toLowerCase();
      const qty = Number(s?.metadata?.qty || 1);

      // registra pagamento
      const amount = qty * PRICE_PER_ANALYSIS_CENTS;
      const sid = String(s?.id || "");

      db.prepare(`
        INSERT OR IGNORE INTO payments (email, stripe_session_id, qty, amount_cents, currency, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(email, sid, qty, amount, CURRENCY, "completed");

      addCredits(email, qty);
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "webhook_error" }, { status: 500 });
  }
}
