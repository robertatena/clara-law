import { NextResponse } from "next/server";
import { getOrCreateAccount } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const acc = getOrCreateAccount(String(email || ""));
    const freeUsed = Number(acc.free_used || 0);
    const freeLeft = Math.max(0, 2 - freeUsed);
    const credits = Number(acc.credits || 0);
    return NextResponse.json({ ok: true, email: acc.email, freeLeft, credits });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "status_error" }, { status: 400 });
  }
}
