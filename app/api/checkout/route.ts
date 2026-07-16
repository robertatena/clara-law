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

    // Metadata adicional opcional (tipo_caso, descricao, dados do wizard).
    // Stripe aceita até 50 chaves, cada valor até 500 chars.
    const extraMetadataRaw = (body.metadata && typeof body.metadata === "object" ? body.metadata : {}) as Record<string, unknown>;
    const extraMetadata: Record<string, string> = {};
    for (const [k, v] of Object.entries(extraMetadataRaw)) {
      if (v === undefined || v === null) continue;
      const str = typeof v === "string" ? v : JSON.stringify(v);
      extraMetadata[k] = str.slice(0, 500);
    }

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
        ...extraMetadata,
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
