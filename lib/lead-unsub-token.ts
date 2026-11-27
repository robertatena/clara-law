// Token assinado (HMAC) pro link de descadastro do lembrete de 10 dias —
// mesmo padrão de lib/caso-acesso-token.ts. Segredo dedicado
// (LEAD_LEMBRETE_SECRET), nunca reaproveitado de CASO_ACESSO_SECRET ou
// EMAIL_COPIA_SECRET (mesma convenção do projeto). TTL longo: o link de
// descadastro precisa continuar válido bem depois do lembrete ser enviado.

import crypto from "crypto";

const TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 ano

function getSecret(): string {
  const secret = process.env.LEAD_LEMBRETE_SECRET;
  if (!secret) {
    throw new Error("LEAD_LEMBRETE_SECRET não configurada");
  }
  return secret;
}

export type LeadTokenPayload = { leadId: string; exp: number };

export function signLeadUnsubToken(leadId: string): string {
  const payload: LeadTokenPayload = { leadId, exp: Date.now() + TOKEN_TTL_MS };
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyLeadUnsubToken(token: string): LeadTokenPayload | null {
  const parts = (token || "").split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as LeadTokenPayload;
    if (!payload.leadId || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
