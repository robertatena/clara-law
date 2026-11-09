// POST /api/radar/admin/logout — apaga cookie radar_admin.
// Idempotente: chamar múltiplas vezes é seguro.

import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/radar/admin-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true }, { status: 200 });
  clearAdminCookie(response);
  return response;
}
