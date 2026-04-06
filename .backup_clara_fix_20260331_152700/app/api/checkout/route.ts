import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing");

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const origin = String(body.origin || process.env.NEXT_PUBLIC_APP_URL || "").trim();

    if (!email) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }

    if (!origin) {
      return NextResponse.json({ error: "origin_required" }, { status: 400 });
    }

    const priceCents = Number(process.env.CLARA_PRICE_CENTS || 1990);
    const currency = String(process.env.CLARA_CURRENCY || "brl");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Clara — análise completa",
              description: "Liberação da análise completa do contrato",
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/enviar?pagamento=cancelado`,
      metadata: {
        source: "clara_checkout",
        email,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("checkout_error", error);
    return NextResponse.json(
      { error: "checkout_error" },
      { status: 500 }
    );
  }
}
