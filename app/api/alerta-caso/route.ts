import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { nomeCompleto, cpf, emailUsuario, telefone, tipoCaso, ciaAerea, numVoo, dataVoo, casoId } = await req.json();

    const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    await transporter.sendMail({
      from: `"Clara Law" <${process.env.GMAIL_USER}>`,
      to: "robtena26@gmail.com",
      subject: `🔔 Novo caso recebido — ${nomeCompleto || "Passageiro"} — ${tipoCaso || "caso"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background: #f8f7f4; border-radius: 12px;">
          <div style="background: #1a2340; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <h2 style="color: #D4AF37; margin: 0; font-size: 18px;">🔔 Novo caso recebido</h2>
            <p style="color: rgba(168,216,240,0.7); font-size: 12px; margin: 6px 0 0;">Clara Law · ${agora}</p>
          </div>

          <div style="background: #fff; border-radius: 10px; padding: 22px; border: 1px solid #E0DDD6;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; color: #9ca3af; width: 38%;">Passageiro</td><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; font-weight: 600; color: #1a2340;">${nomeCompleto || "—"}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; color: #9ca3af;">CPF</td><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8;">${cpf || "—"}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; color: #9ca3af;">E-mail</td><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8;">${emailUsuario || "—"}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; color: #9ca3af;">Telefone</td><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8;">${telefone || "—"}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; color: #9ca3af;">Tipo do caso</td><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8;">${tipoCaso || "—"}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; color: #9ca3af;">Companhia</td><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8;">${ciaAerea || "—"}</td></tr>
              <tr><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8; color: #9ca3af;">Voo</td><td style="padding: 8px 0; border-bottom: 1px solid #f0ede8;">${numVoo || "—"}${dataVoo ? ` em ${dataVoo}` : ""}</td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af;">ID do caso</td><td style="padding: 8px 0; font-family: monospace; font-size: 12px; color: #6b7280;">${casoId || "—"}</td></tr>
            </table>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao enviar alerta:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
