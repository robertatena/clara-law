// Token assinado (HMAC) que vincula destinatário + conteúdo do e-mail de
// notificação grátis gerados no servidor em /api/caso/preparar-email.
// /api/enviar-copia-notificacao só aceita esse token — nunca um e-mail ou
// texto solto vindo do client — então o destinatário e o conteúdo enviados
// são sempre exatamente os que o servidor gerou, nunca algo que um client
// malicioso possa forjar sem conhecer o segredo do servidor.

import crypto from "crypto";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 min — cobre a sessão de uso do resultado grátis

function getSecret(): string {
  // EMAIL_COPIA_SECRET é o ideal (dedicado); na ausência, deriva de
  // GMAIL_PASS (já um segredo só-servidor) pra não exigir configurar uma
  // env var nova só pra isso funcionar.
  return process.env.EMAIL_COPIA_SECRET || `${process.env.GMAIL_PASS || "clara-law-fallback-secret"}::copia-notificacao`;
}

export type EmailTokenPayload = { email: string; assunto: string; corpo: string; exp: number };

export function signEmailToken(data: { email: string; assunto: string; corpo: string }): string {
  const payload: EmailTokenPayload = { ...data, exp: Date.now() + TOKEN_TTL_MS };
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyEmailToken(token: string): EmailTokenPayload | null {
  const parts = (token || "").split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as EmailTokenPayload;
    if (!payload.email || !payload.assunto || !payload.corpo || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
