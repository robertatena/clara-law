import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,   // claralaw.aviso@gmail.com
    pass: process.env.GMAIL_PASS,   // senha de app do Gmail
  },
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nomePassageiro,
      emailPassageiro,
      ciaAerea,
      emailCia,
      numVoo,
      dataVoo,
      cpf,
      tempoAtraso,
      assunto,
      corpo,
    } = body;

    // 1. E-mail para a companhia aérea
    await transporter.sendMail({
      from: `"Clara Law" <${process.env.GMAIL_USER}>`,
      to: emailCia,
      cc: process.env.GMAIL_USER,
      bcc: "robtena26@gmail.com",
      subject: assunto,
      html: `<div style="font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.7; color: #1a1a1a; max-width: 680px; margin: 0 auto; padding: 32px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; white-space: pre-wrap;">${corpo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>`,
    });

    // 2. E-mail de confirmação para o passageiro
    const dataHoje = new Date().toLocaleDateString("pt-BR");
    const horaAgora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    await transporter.sendMail({
      from: `"Clara Law" <${process.env.GMAIL_USER}>`,
      to: emailPassageiro,
      subject: "Sua notificação foi enviada — Clara Law",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8f7f4;">
          <div style="background: #1a2340; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: #D4AF37; font-size: 22px; margin: 0;">Clara Law</h1>
            <p style="color: rgba(168,216,240,0.7); font-size: 13px; margin: 8px 0 0;">Inteligência para um mundo mais claro e justo</p>
          </div>

          <div style="background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #E0DDD6;">
            <h2 style="color: #1a2340; font-size: 18px; margin-top: 0;">Olá, ${nomePassageiro}!</h2>

            <p style="color: #4b5563; line-height: 1.7;">
              Sua notificação foi enviada para a <strong>${ciaAerea}</strong> em ${dataHoje} às ${horaAgora}.
            </p>

            <div style="background: #F0FDF9; border: 1px solid #6EE7B7; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="color: #065f46; font-size: 13px; margin: 0;"><strong>Detalhes do envio:</strong></p>
              <p style="color: #065f46; font-size: 13px; margin: 8px 0 0;">
                Voo ${numVoo} · ${dataVoo} · CPF ${cpf}
              </p>
            </div>

            <h3 style="color: #1a2340; font-size: 15px;">Próximos passos:</h3>
            <ol style="color: #4b5563; line-height: 2; padding-left: 20px;">
              <li>Aguarde até <strong>5 dias úteis</strong> pela resposta da companhia</li>
              <li>Caso não haja resposta, <strong>a Clara cuidará de tudo</strong> — registraremos sua reclamação na ANAC e, se necessário, levaremos seu caso ao Juizado Especial</li>
              <li>Você receberá nossas atualizações por este e-mail</li>
            </ol>

            <p style="color: #4b5563; line-height: 1.7; margin-top: 20px;">
              <strong style="color: #1a2340;">Estamos com você em cada etapa.</strong>
            </p>

            <hr style="border: none; border-top: 1px solid #E0DDD6; margin: 24px 0;" />

            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              ⚠️ A Clara não é um escritório de advocacia. As orientações são informativas e não substituem a consulta com um advogado.
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao enviar e-mail:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
