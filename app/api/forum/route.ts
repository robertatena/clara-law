import { NextRequest, NextResponse } from "next/server";
import { resolverForo } from "@/lib/forum";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("cep") ?? "";
  const cepLimpo = cep.replace(/\D/g, "");

  if (cepLimpo.length !== 8) {
    return NextResponse.json({ erro: "CEP inválido. Digite 8 números." }, { status: 400 });
  }

  const resultado = await resolverForo(cepLimpo);
  return NextResponse.json(resultado);
}
