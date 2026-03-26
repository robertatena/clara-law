import { NextResponse } from "next/server";
import { upsertUser } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email_required" }, { status: 400 });

  const user = upsertUser({
    email,
    name: body.name ? String(body.name) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    role: body.role ? String(body.role) : undefined,
  });

  return NextResponse.json({ ok: true, user });
}
