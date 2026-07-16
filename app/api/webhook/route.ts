import { NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_missing");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.claralaw.com.br";

// ─── ENTREGA POR E-MAIL ───────────────────────────────────────────────────────
// Reutiliza mesma config do /api/enviar-email (GMAIL_USER + senha de app).

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

type Produto = "pacote" | "analise" | "desconhecido";

function itensPorProduto(produto: Produto): string[] {
  if (produto === "pacote") {
    return [
      "E-mail de notificação com a lei certa",
      "Orientação para ANAC e consumidor.gov.br",
      "Petição para o JEC pronta para protocolar",
      "Guia completo das etapas do processo",
    ];
  }
  if (produto === "analise") {
    return [
      "Análise completa do seu contrato",
      "Pontos de risco identificados",
      "Perguntas para negociar antes de assinar",
    ];
  }
  return [];
}

function montarHtml(produto: Produto, magicLinkUrl?: string): string {
  const itens = itensPorProduto(produto);
  const listaItens = itens
    .map(
      (i) =>
        `<li style="color:#374151;line-height:1.7;margin-bottom:6px;">${i}</li>`
    )
    .join("");

  const blocoMinhaConta = magicLinkUrl
    ? `<div style="text-align:center;margin:12px 0 28px;">
        <a href="${magicLinkUrl}" style="display:inline-block;background:#1a2340;color:#fff;font-weight:700;font-size:14px;padding:12px 24px;border-radius:40px;text-decoration:none;">
          Acessar minha área →
        </a>
        <p style="color:#9ca3af;font-size:11px;margin:8px 0 0;">Login sem senha · válido por 1 hora</p>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">

    <div style="background:#1a2340;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
      <div style="color:#D4AF37;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">Clara Law</div>
      <h1 style="color:#fff;font-size:24px;font-weight:800;margin:8px 0 0;">Tudo pronto. Agora é com você.</h1>
    </div>

    <div style="background:#fff;border-radius:12px;padding:28px 24px;border:1px solid #E0DDD6;">
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Obrigada por confiar na Clara Law. Seu kit foi gerado e está disponível.
      </p>

      ${
        itens.length > 0
          ? `<div style="background:#F8F7F4;border:1px solid #E0DDD6;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <div style="color:#1a2340;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">O que você recebeu</div>
              <ul style="margin:0;padding-left:20px;">${listaItens}</ul>
            </div>`
          : ""
      }

      <div style="text-align:center;margin:28px 0 12px;">
        <a href="${APP_URL}/guia" style="display:inline-block;background:#D4AF37;color:#1a2340;font-weight:800;font-size:15px;padding:14px 28px;border-radius:40px;text-decoration:none;">
          Acesse seu guia do processo →
        </a>
      </div>

      ${blocoMinhaConta}

      <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:20px 0 0;">
        Dúvidas? Responda este e-mail ou escreva para
        <a href="mailto:contato@claralaw.com.br" style="color:#185FA5;text-decoration:none;">contato@claralaw.com.br</a>.
      </p>

      <hr style="border:none;border-top:1px solid #E0DDD6;margin:24px 0 16px;" />

      <p style="color:#9ca3af;font-size:11px;line-height:1.6;text-align:center;margin:0;">
        A Clara Law é uma plataforma educacional. Os documentos são orientativos.
      </p>
    </div>

  </div>
</body>
</html>`;
}

async function enviarConfirmacaoCompra(email: string, produto: Produto, magicLinkUrl?: string): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("webhook_email_skipped_missing_credentials", {
      hasUser: !!process.env.GMAIL_USER,
      hasPass: !!process.env.GMAIL_PASS,
    });
    return;
  }

  const html = montarHtml(produto, magicLinkUrl);

  await transporter.sendMail({
    from: `"Clara Law" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Seu kit Clara Law está pronto 🎉",
    html,
  });
}

// Provisiona o usuário no Supabase Auth (idempotente) e retorna o user_id.
// Se o usuário já existe, apenas retorna o id.
async function provisionarUsuario(email: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("provisionar_usuario_skipped_missing_service_key");
    return null;
  }
  try {
    // Tenta criar. Se já existe, o admin.createUser retorna erro que capturamos e
    // buscamos o user pelo email via listUsers (não há getUserByEmail no SDK).
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // já confirmado — o pagamento comprova o email
    });
    if (created?.user?.id) return created.user.id;

    // Já existia — procurar. listUsers lê a primeira página; para volume alto
    // seria preciso paginar, mas pra checkout único a probabilidade é irrelevante.
    if (createErr) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
      // Tipar user como Record — supabase-js infere `never[]` aqui por motivos internos
      const usersList = (list?.users ?? []) as Array<{ id: string; email?: string }>;
      const found = usersList.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found?.id) return found.id;
    }
    return null;
  } catch (err) {
    console.error("provisionar_usuario_error", { email, err: err instanceof Error ? err.message : "unknown" });
    return null;
  }
}

// Gera um magic link e retorna a URL (o próprio Supabase cria o token).
// Se falhar, retorna null e o email de confirmação segue sem o botão de acesso.
async function gerarMagicLink(email: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${APP_URL}/auth/callback?next=/minha-conta` },
    });
    if (error) {
      console.error("gerar_magic_link_error", error.message);
      return null;
    }
    return data.properties?.action_link ?? null;
  } catch (err) {
    console.error("gerar_magic_link_error", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

// Salva o caso no Supabase (idempotente — usa UNIQUE em stripe_session_id).
async function salvarCasoNoSupabase(params: {
  userId: string;
  email: string;
  produto: Produto;
  sessionId: string;
  metadata: Record<string, string>;
}): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const tipoCaso =
    params.produto === "pacote"
      ? (params.metadata.tipo_caso || "desconhecido")
      : "analise_contrato";
  const descricao = params.metadata.descricao || "";

  const { error } = await supabaseAdmin.from("user_casos").upsert(
    {
      user_id: params.userId,
      email: params.email,
      tipo_caso: tipoCaso,
      descricao,
      dados_json: params.metadata,
      stripe_session_id: params.sessionId,
      status: "ativo",
    },
    { onConflict: "stripe_session_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("salvar_caso_error", { sessionId: params.sessionId, error: error.message });
  }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

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
  // indefinidamente. Falhas no envio de e-mail NÃO devem propagar.
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

        // Pipeline pós-pagamento (executa se tiver email + produto válido).
        // Cada etapa é independente e loga erro sem propagar — webhook sempre 200.
        if (email && produto !== "desconhecido") {
          // 1) Provisiona (ou encontra) usuário no Supabase Auth
          const userId = await provisionarUsuario(email);
          console.log("user_provisioned", { session_id: session.id, email, userId: userId || "(none)" });

          // 2) Salva o caso na tabela user_casos (idempotente por stripe_session_id)
          if (userId) {
            const md: Record<string, string> = {};
            for (const [k, v] of Object.entries(session.metadata || {})) {
              if (typeof v === "string") md[k] = v;
            }
            await salvarCasoNoSupabase({ userId, email, produto, sessionId: session.id, metadata: md });
            console.log("caso_salvo", { session_id: session.id, userId });
          }

          // 3) Gera magic link pra área logada (segue mesmo se falhar)
          const magicLink = await gerarMagicLink(email);
          if (magicLink) console.log("magic_link_gerado", { session_id: session.id });

          // 4) Envia e-mail de confirmação com botão "Acessar minha área" (se magic link ok)
          try {
            await enviarConfirmacaoCompra(email, produto, magicLink ?? undefined);
            console.log("delivery_email_sent", { session_id: session.id, email, produto, hasMagicLink: !!magicLink });
          } catch (err) {
            const msg = err instanceof Error ? err.message : "unknown";
            console.error("delivery_email_failed", {
              session_id: session.id,
              email,
              produto,
              error: msg,
            });
          }
        } else {
          console.warn("delivery_email_not_sent", {
            session_id: session.id,
            reason: !email ? "missing_email" : "unknown_product",
            produto,
          });
        }
        break;
      }
      default:
        console.log("webhook_event_ignored", { type: event.type, id: event.id });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("webhook_processing_error", { type: event.type, msg });
    // Mesmo em erro de processamento, responder 200 — o evento foi recebido e
    // verificado. Retentar via Stripe não vai resolver erro lógico interno.
  }

  return NextResponse.json({ received: true });
}
