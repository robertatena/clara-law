// Preview do HTML do e-mail de confirmação — SEM enviar e-mail real.
// Retorna text/html direto pro browser renderizar.
//
// Uso:
//   /api/dev/preview-email                        → default: pacote com magic link fake
//   /api/dev/preview-email?produto=analise         → variante análise (sem botão "Guia")
//   /api/dev/preview-email?produto=pacote          → variante pacote (com botão "Guia")
//   /api/dev/preview-email?magiclink=false         → cai no fallback (legenda "Faça login com o seu e-mail")
//
// Pública (sem auth): o HTML aqui é idêntico ao que qualquer cliente pagante
// recebe — nada sensível vaza. Útil pra iterar visualmente sem gastar
// pagamento nem mexer no fluxo do fulfill.
//
// Se um dia quiser restringir, adicionar header X-Admin-Secret vs
// ADMIN_FULFILL_SECRET (padrão já usado em /api/pix/fulfill-manual).

import { NextResponse } from "next/server";
import { montarHtml, type Produto } from "@/lib/checkout-fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const produtoRaw = (url.searchParams.get("produto") || "pacote").toLowerCase();
  const produto: Produto =
    produtoRaw === "analise" || produtoRaw === "pacote" ? produtoRaw : "pacote";

  // ?magiclink=false → simula falha do gerarMagicLink (fallback UX)
  const magicFlag = url.searchParams.get("magiclink");
  const magicLinkUrl = magicFlag === "false"
    ? undefined
    : "https://example.com/fake-magic-link?token=preview-token-nao-funciona";

  const html = montarHtml(produto, magicLinkUrl);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
