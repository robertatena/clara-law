import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing");

type Produto = "analise" | "pacote";

const PRODUTOS: Record<Produto, { unitAmount: number; name: string; description: string }> = {
  analise: {
    unitAmount: 990,
    name: "Análise de Contrato — Clara Law",
    description: "Análise de riscos do seu contrato em linguagem simples.",
  },
  pacote: {
    unitAmount: 4990,
    name: "Pacote Ação — Clara Law",
    description: "E-mail de notificação + petição JEC + guia de acompanhamento. Você envia, você age.",
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").trim().toLowerCase();
    const origin = String(body.origin || process.env.NEXT_PUBLIC_APP_URL || "").trim();
    const produto = String(body.produto || "").trim() as Produto;

    if (!email) {
      return NextResponse.json({ error: "email_required" }, { status: 400 });
    }

    if (!origin) {
      return NextResponse.json({ error: "origin_required" }, { status: 400 });
    }

    if (produto !== "analise" && produto !== "pacote") {
      return NextResponse.json({ error: "produto_invalido" }, { status: 400 });
    }

    const cfg = PRODUTOS[produto];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: cfg.name,
              description: cfg.description,
            },
            unit_amount: cfg.unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/enviar?pagamento=cancelado`,
      metadata: {
        source: "clara_checkout",
        produto,
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
