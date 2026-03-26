import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { PRICE_PER_ANALYSIS_CENTS, CURRENCY, appUrl } from "@/lib/billing";
import { getOrCreateAccount } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emailRaw = String(body?.email || "").trim();
    const qty = Math.max(1, Math.min(50, Number(body?.qty || 1)));

    const acc = getOrCreateAccount(emailRaw);
    const origin = appUrl();

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: "STRIPE_SECRET_KEY_missing" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: acc.email,
      payment_method_types: ["card", "pix"],
      line_items: [
        {
          quantity: qty,
          price_data: {
            currency: CURRENCY,
            unit_amount: PRICE_PER_ANALYSIS_CENTS,
            product_data: {
              name: "Clara — Crédito de análise",
              description: "1 crédito = 1 análise extra",
            },
          },
        },
      ],
      metadata: {
        email: acc.email,
        qty: String(qty),
      },
      success_url: `${origin}/enviar?paid=1`,
      cancel_url: `${origin}/enviar?canceled=1`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "checkout_error" }, { status: 400 });
  }
}
