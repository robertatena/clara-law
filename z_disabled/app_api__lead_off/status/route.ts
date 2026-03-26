import { NextResponse } from "next/server";
import { getEntitlement } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = String(searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });
  return NextResponse.json({ ok: true, entitlement: getEntitlement(email) });
}
