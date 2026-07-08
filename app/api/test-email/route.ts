// ⚠️ ENDPOINT TEMPORÁRIO — remover após validar entrega SMTP em produção.
// Envia um e-mail de teste para robtena26@gmail.com usando as mesmas credenciais
// (GMAIL_USER/GMAIL_PASS) que o webhook do Stripe usa.

import nodemailer from "nodemailer";

export const runtime = "nodejs";

export async function GET() {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Clara Law" <${process.env.GMAIL_USER}>`,
      to: "robtena26@gmail.com",
      subject: "Teste de e-mail Clara Law",
      text: "Se você recebeu isso, o e-mail está funcionando!",
    });
    return Response.json({ ok: true, from: process.env.GMAIL_USER });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) });
  }
}
