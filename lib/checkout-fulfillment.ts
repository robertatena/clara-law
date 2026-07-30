// Pipeline pós-pagamento compartilhado entre Stripe e AbacatePay (Pix).
// Cada gateway tem seu próprio webhook, mas as etapas de "provisionar user,
// gerar magic link, gravar caso, mandar e-mail" são idênticas.
//
// Extraído de app/api/webhook/route.ts sem alterar comportamento.

import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabase-server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.claralaw.com.br";

export type Produto = "pacote" | "analise" | "desconhecido";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

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

export async function enviarConfirmacaoCompra(email: string, produto: Produto, magicLinkUrl?: string): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("fulfillment_email_skipped_missing_credentials", {
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
export async function provisionarUsuario(email: string): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("provisionar_usuario_skipped_missing_service_key");
    return null;
  }
  try {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (created?.user?.id) return created.user.id;

    if (createErr) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
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

// Gera um magic link e retorna a URL. Se falhar, retorna null.
export async function gerarMagicLink(email: string): Promise<string | null> {
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

// Salva o caso no Supabase. Idempotente por provider+id:
// - Stripe: UNIQUE em stripe_session_id
// - AbacatePay: UNIQUE em abacate_transaction_id
export async function salvarCasoNoSupabase(params: {
  userId: string;
  email: string;
  produto: Produto;
  provider: "stripe" | "pix";
  providerId: string;
  metadata: Record<string, string>;
}): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  const tipoCaso =
    params.produto === "pacote"
      ? (params.metadata.tipo_caso || "desconhecido")
      : "analise_contrato";
  const descricao = params.metadata.descricao || "";

  const row: Record<string, unknown> = {
    user_id: params.userId,
    email: params.email,
    tipo_caso: tipoCaso,
    descricao,
    dados_json: params.metadata,
    status: "ativo",
    payment_method: params.provider,
  };
  const onConflict = params.provider === "stripe" ? "stripe_session_id" : "abacate_transaction_id";
  if (params.provider === "stripe") {
    row.stripe_session_id = params.providerId;
  } else {
    row.abacate_transaction_id = params.providerId;
  }

  const { error } = await supabaseAdmin.from("user_casos").upsert(row, {
    onConflict,
    ignoreDuplicates: true,
  });
  if (error) {
    console.error("salvar_caso_error", { provider: params.provider, providerId: params.providerId, error: error.message });
  }
}

// Pipeline completo: provisiona → salva caso → gera magic link → envia e-mail.
// Loga cada etapa. Nunca lança — cada camada tem seu try/catch.
export async function fulfillCheckout(params: {
  email: string;
  produto: Produto;
  provider: "stripe" | "pix";
  providerId: string;
  metadata: Record<string, string>;
}): Promise<void> {
  const { email, produto, provider, providerId, metadata } = params;

  if (!email || produto === "desconhecido") {
    console.warn("fulfillment_skipped_invalid_input", { provider, providerId, hasEmail: !!email, produto });
    return;
  }

  const userId = await provisionarUsuario(email);
  console.log("fulfillment_user_provisioned", { provider, providerId, email, userId: userId || "(none)" });

  if (userId) {
    await salvarCasoNoSupabase({ userId, email, produto, provider, providerId, metadata });
    console.log("fulfillment_caso_saved", { provider, providerId, userId });
  }

  const magicLink = await gerarMagicLink(email);
  if (magicLink) console.log("fulfillment_magic_link_ok", { provider, providerId });

  try {
    await enviarConfirmacaoCompra(email, produto, magicLink ?? undefined);
    console.log("fulfillment_email_sent", { provider, providerId, email, produto, hasMagicLink: !!magicLink });
  } catch (err) {
    console.error("fulfillment_email_failed", { provider, providerId, email, produto, error: err instanceof Error ? err.message : "unknown" });
  }
}
