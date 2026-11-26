// E-mail de lembrete, mandado pelo cron (app/api/cron/lembrete-dia10) 10 dias
// depois de alguém gerar o plano grátis sem comprar o Kit Juizado — o
// momento em que o Kit passa a fazer sentido (empresa não respondeu no
// prazo). Reaproveita o transporter compartilhado de lib/mailer.ts.

import { transporter, emailConfigurado } from "@/lib/mailer";
import { signLeadUnsubToken } from "@/lib/lead-unsub-token";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.claralaw.com.br";

function montarHtml(tipoCaso: string | null, leadId: string): string {
  // Sem um "caso" persistido pra reabrir (o plano grátis não salva o plano
  // gerado, só a intenção) — o link de volta reabre o wizard no tipo certo,
  // não resgata o plano em si.
  const linkRetomar = tipoCaso ? `${APP_URL}/enviar?retomar=${encodeURIComponent(tipoCaso)}` : `${APP_URL}/enviar`;
  const linkDescadastro = `${APP_URL}/api/leads/descadastrar?token=${encodeURIComponent(signLeadUnsubToken(leadId))}`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#F8F7F4;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">

    <div style="background:#1a2340;border-radius:12px;padding:24px;text-align:center;margin-bottom:20px;">
      <div style="color:#D4AF37;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">Clara Law</div>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:8px 0 0;">A empresa respondeu?</h1>
    </div>

    <div style="background:#fff;border-radius:12px;padding:28px 24px;border:1px solid #E0DDD6;">
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 20px;">
        Há 10 dias você notificou a empresa através da Clara Law. Se ela não respondeu,
        o próximo passo é o Juizado Especial — o Kit Juizado prepara a petição
        e te mostra o fórum certo pra protocolar.
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${linkRetomar}" style="display:inline-block;background:#D4AF37;color:#1a2340;font-weight:800;font-size:15px;padding:14px 28px;border-radius:40px;text-decoration:none;">
          Continuar meu caso →
        </a>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:20px 0 0;">
        Dúvidas? Responda este e-mail ou escreva para
        <a href="mailto:contato@claralaw.com.br" style="color:#185FA5;text-decoration:none;">contato@claralaw.com.br</a>.
      </p>

      <hr style="border:none;border-top:1px solid #E0DDD6;margin:24px 0 16px;" />

      <p style="color:#9ca3af;font-size:11px;line-height:1.6;text-align:center;margin:0;">
        A Clara Law é uma plataforma educacional. Os documentos são orientativos.<br />
        Não quer mais receber esses lembretes? <a href="${linkDescadastro}" style="color:#9ca3af;text-decoration:underline;">Descadastrar</a>.
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function enviarLembreteDia10(email: string, tipoCaso: string | null, leadId: string): Promise<void> {
  if (!emailConfigurado()) {
    console.warn("lembrete_dia10_skipped_missing_credentials");
    return;
  }
  await transporter.sendMail({
    from: `"Clara Law" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "A empresa respondeu? Veja o próximo passo",
    html: montarHtml(tipoCaso, leadId),
  });
}
