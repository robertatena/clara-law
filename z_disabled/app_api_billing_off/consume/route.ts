import { NextResponse } from "next/server";
import { consumeOne, logAnalysis } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, meta } = await req.json();
    const r = consumeOne(String(email || ""));
    if (!r.ok) {
      return NextResponse.json({ ok: false, code: r.code, freeLeft: r.freeLeft, credits: r.credits }, { status: 402 });
    }
    // registra só se consumiu (free ou credit)
    logAnalysis(String(email || ""), meta || null);
    return NextResponse.json({ ok: true, used: r.used, freeLeft: r.freeLeft, credits: r.credits });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "consume_error" }, { status: 400 });
  }
}
