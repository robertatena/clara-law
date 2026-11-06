// Envia por e-mail uma cópia do modelo de notificação gerado gratuitamente
// pra Clara em /enviar (modo "caso"), pra quem não copiar/enviar na hora.
//
// Segurança: só aceita um `token` assinado (HMAC) emitido por
// /api/caso/preparar-email. O destinatário e o conteúdo do e-mail SEMPRE
// vêm de dentro desse token verificado no servidor — nunca de campos soltos
// no body da requisição. Isso impede que alguém use esta rota como relay
// pra mandar texto arbitrário pra um e-mail arbitrário.
//
// Limites: 1 envio por token (idempotente — reenvio do mesmo token não
// duplica) + rate limit por IP. Ambos em memória, best-effort (ver
// lib/rate-limit.ts) — não sobrevivem a cold start nem são compartilhados
// entre instâncias, mas já cortam scripts simples de abuso.

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { verifyEmailToken } from "@/lib/copia-notificacao-token";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Tokens já enviados nesta instância — evita duplicar em duplo clique/retry.
const tokensEnviados = new Set<string>();

export async function POST(req: Request) {
  if (!checkRateLimit(`enviar-copia:${clientIp(req)}`, 5, 60 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");
  const payload = verifyEmailToken(token);
  if (!payload) {
    return NextResponse.json({ error: "token_invalido" }, { status: 400 });
  }

  if (tokensEnviados.has(token)) {
    return NextResponse.json({ ok: true, ja_enviado: true });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("enviar_copia_notificacao_skipped_missing_credentials");
    return NextResponse.json({ ok: false, skipped: true });
  }

  tokensEnviados.add(token);

  try {
    const corpoEscapado = payload.corpo
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    await transporter.sendMail({
      from: `"Clara Law" <${process.env.GMAIL_USER}>`,
      to: payload.email, // vem só do token assinado — nunca de um campo solto do client
      subject: `Cópia — ${payload.assunto}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F8F7F4;">
        <div style="background:#1a2340;border-radius:12px;padding:20px;text-align:center;margin-bottom:16px;">
          <div style="color:#D4AF37;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">Clara Law</div>
          <div style="color:#fff;font-size:16px;font-weight:700;margin-top:6px;">Cópia do seu e-mail de notificação</div>
        </div>
        <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #E0DDD6;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 14px;">⚠️ Modelo orientativo — revise antes de enviar.</p>
          <div style="color:#9ca3af;font-size:11px;margin-bottom:2px;">Assunto</div>
          <div style="color:#1a2340;font-size:14px;font-weight:700;margin-bottom:14px;">${payload.assunto}</div>
          <div style="color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;border-top:1px solid #F0EDE8;padding-top:14px;">${corpoEscapado}</div>
        </div>
      </div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    tokensEnviados.delete(token); // permite retry se o envio falhou de verdade
    console.error("enviar_copia_notificacao_error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "erro_envio" }, { status: 500 });
  }
}
