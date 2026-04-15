import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn("GOOGLE_SHEETS_WEBHOOK_URL não configurado.");
      return NextResponse.json({ ok: true });
    }

    const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, data: agora }),
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro ao enviar lead:", err?.message);
    return NextResponse.json({ ok: true }); // não bloqueia o usuário
  }
}
