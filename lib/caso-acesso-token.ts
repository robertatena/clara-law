// Token assinado (HMAC) que dá acesso à página do caso (/caso/[id]) sem
// exigir login — o acesso a quem comprou o Kit Juizado é só por link, já
// que a área logada (Supabase Auth) está desativada (ver lib/feature-flags.ts).
//
// Segredo dedicado (CASO_ACESSO_SECRET), nunca reaproveitado de outro
// contexto — mesma convenção de lib/copia-notificacao-token.ts. TTL bem
// mais longo que o do token de cópia de e-mail: o caso pode ser revisitado
// por meses (completar dados, rebaixar petição, etc).

import crypto from "crypto";

const TOKEN_TTL_MS = 180 * 24 * 60 * 60 * 1000; // 180 dias

function getSecret(): string {
  // Sem fallback de propósito — mesmo motivo do EMAIL_COPIA_SECRET: um
  // segredo previsível anularia a proteção do token. Se CASO_ACESSO_SECRET
  // não estiver configurada, falha fechada.
  const secret = process.env.CASO_ACESSO_SECRET;
  if (!secret) {
    throw new Error("CASO_ACESSO_SECRET não configurada");
  }
  return secret;
}

export type CasoTokenPayload = { casoId: string; exp: number };

export function signCasoToken(casoId: string): string {
  const payload: CasoTokenPayload = { casoId, exp: Date.now() + TOKEN_TTL_MS };
  const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}

export function verifyCasoToken(token: string): CasoTokenPayload | null {
  const parts = (token || "").split(".");
  if (parts.length !== 2) return null;
  const [b64, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(b64).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString("utf8")) as CasoTokenPayload;
    if (!payload.casoId || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
