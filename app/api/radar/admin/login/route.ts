// POST /api/radar/admin/login
//
// Body: { token: string }
// Se token bate com RADAR_ADMIN_TOKEN, seta cookie httpOnly `radar_admin`
// com valor HMAC(RADAR_ADMIN_TOKEN, "radar-admin-v1"). Sem token no cookie.
//
// Rate limit: 5 tentativas/15min/IP in-memory (V1 uso privado). Sem Redis.
//
// Nunca loga token nem trecho dele.

import { NextResponse } from "next/server";
import {
  isValidAdminToken,
  setAdminCookie,
  loginRateLimitOk,
} from "@/lib/radar/admin-auth";

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const ts = new Date().toISOString();

  // 1) Rate limit
  if (!loginRateLimitOk(ip)) {
    console.warn("radar/admin/login: rate_limited", { ip, ts });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // 2) Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const token =
    body && typeof body === "object" && "token" in body && typeof (body as { token: unknown }).token === "string"
      ? (body as { token: string }).token
      : "";

  // 3) Config check + validação timing-safe
  if (!process.env.RADAR_ADMIN_TOKEN) {
    console.error("radar/admin/login: RADAR_ADMIN_TOKEN não configurado", { ts });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!isValidAdminToken(token)) {
    console.warn("radar/admin/login: token inválido", { ip, ts });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 4) Seta cookie
  const response = NextResponse.json({ ok: true }, { status: 200 });
  const cookieSetOk = setAdminCookie(response);
  if (!cookieSetOk) {
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
  return response;
}
