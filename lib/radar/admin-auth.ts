// Autenticação admin do Radar via cookie HMAC.
//
// Modelo (V1):
//   1. POST /api/radar/admin/login recebe { token } no body
//   2. Server compara timing-safe com RADAR_ADMIN_TOKEN
//   3. Se OK: seta cookie `radar_admin` cujo VALOR é
//      HMAC-SHA256(RADAR_ADMIN_TOKEN, "radar-admin-v1")
//      (nunca o token cru — se cookie vazar, atacante tem só o hash)
//   4. Validação em preview/publicar: recalcula o HMAC esperado
//      e compara timing-safe com o valor do cookie
//
// Cookie:
//   - httpOnly: JS do browser não lê
//   - secure em produção (HTTPS-only)
//   - sameSite=strict: browser não envia cross-origin (anti-CSRF)
//   - maxAge: 24h (força re-login diário)
//   - path: /
//
// Rate limit de login: in-memory Map (V1). Perde estado em cold
// start do serverless. Sem infra externa (Redis). Migrar quando
// distribuir; documentado em `loginRateLimitOk` abaixo.

import crypto from "node:crypto";
import type { NextResponse } from "next/server";

export const ADMIN_COOKIE_NAME = "radar_admin";
export const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

/**
 * Deriva o valor do cookie a partir do token. Sempre determinístico
 * pra mesma env var. Se RADAR_ADMIN_TOKEN mudar, cookies antigos ficam
 * inválidos automaticamente (mecanismo natural de rotação).
 */
function computeCookieValue(): string | null {
  const token = process.env.RADAR_ADMIN_TOKEN;
  if (!token) return null;
  return crypto
    .createHmac("sha256", token)
    .update("radar-admin-v1")
    .digest("hex");
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Shape mínima de cookie store compatível com next/headers cookies()
type CookieGetter = {
  get: (name: string) => { value: string } | undefined;
};

/**
 * Valida o cookie `radar_admin` contra o HMAC esperado.
 * Retorna true APENAS se:
 *   - RADAR_ADMIN_TOKEN está configurado
 *   - cookie está presente
 *   - valor do cookie === HMAC esperado (comparação timing-safe)
 */
export function isAdmin(cookieStore: CookieGetter): boolean {
  const expected = computeCookieValue();
  if (!expected) return false;
  const cookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!cookie) return false;
  return timingSafeStringEqual(cookie.value, expected);
}

/**
 * Valida o token bruto contra RADAR_ADMIN_TOKEN.
 * Usado só no endpoint de login pra decidir se seta cookie.
 */
export function isValidAdminToken(rawToken: string): boolean {
  const secret = process.env.RADAR_ADMIN_TOKEN;
  if (!secret) return false;
  return timingSafeStringEqual(rawToken, secret);
}

/**
 * Seta o cookie no NextResponse.
 * Chamado APENAS em /api/radar/admin/login após validar o token.
 */
export function setAdminCookie(response: NextResponse): boolean {
  const value = computeCookieValue();
  if (!value) return false;
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
  });
  return true;
}

/**
 * Apaga o cookie. Usado em /api/radar/admin/logout.
 * Set com maxAge=0 pra o browser descartar imediatamente.
 */
export function clearAdminCookie(response: NextResponse): void {
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}

// ═════════════════════════════════════════════════════════════
//  Rate limit do LOGIN — proteção anti brute-force
// ═════════════════════════════════════════════════════════════
//
// V1: Map in-memory por IP. Reset em cold start (serverless).
// Limitação documentada: em cluster / múltiplas instâncias, cada
// instância tem seu contador; atacante pode multiplicar tentativas.
// Migrar pra Redis/Upstash se distribuir extensão ou área admin.
// Enquanto uso é privado (uma pessoa, um IP), Map basta.
//
// Threshold V1: 5 tentativas / 15 min / IP. Suficientemente frouxo
// pra não bloquear você em erro de digitação; suficientemente
// apertado pra impedir brute-force razoável.

const LOGIN_RL_MAX = 5;
const LOGIN_RL_WINDOW_MS = 15 * 60 * 1000; // 15 min
const loginBucket = new Map<string, { count: number; resetAt: number }>();

export function loginRateLimitOk(ip: string): boolean {
  const now = Date.now();
  const cur = loginBucket.get(ip);
  if (!cur || cur.resetAt < now) {
    loginBucket.set(ip, { count: 1, resetAt: now + LOGIN_RL_WINDOW_MS });
    return true;
  }
  if (cur.count >= LOGIN_RL_MAX) return false;
  cur.count++;
  return true;
}
