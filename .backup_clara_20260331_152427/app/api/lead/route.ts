import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ ok: false, error: "Webhook não configurado" }, { status: 200 });
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      });
    } catch (err) {
      console.error("Erro ao enviar lead para planilha:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro na rota /api/lead:", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
