// Gera o e-mail de notificação grátis (modo "caso" em /enviar) e devolve um
// token assinado que amarra destinatário + conteúdo — é o que
// /api/enviar-copia-notificacao exige pra enviar a cópia, em vez de aceitar
// "to"/"assunto"/"corpo" soltos vindos do client.

import { NextResponse } from "next/server";
import { gerarEmailEmpresa } from "@/lib/gerar-email-empresa";
import { signEmailToken } from "@/lib/copia-notificacao-token";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const TIPOS_VALIDOS = [
  "voo_atrasado", "voo_cancelado", "bagagem",
  "produto_defeito", "cobranca_indevida", "servico_nao_entregue", "outro",
];

export async function POST(req: Request) {
  if (!checkRateLimit(`preparar-email:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const tipoCaso = String(body.tipoCaso || "");
  const descricao = String(body.descricao || "").slice(0, 4000);
  const ciaNome = body.ciaNome ? String(body.ciaNome).slice(0, 120) : undefined;
  const ciaEmail = body.ciaEmail ? String(body.ciaEmail).slice(0, 200) : undefined;
  const email = String(body.email || "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "email_invalido" }, { status: 400 });
  }
  if (!TIPOS_VALIDOS.includes(tipoCaso)) {
    return NextResponse.json({ error: "tipo_invalido" }, { status: 400 });
  }

  const { assunto, corpo } = gerarEmailEmpresa(tipoCaso, descricao, { nome: ciaNome, email: ciaEmail });
  const token = signEmailToken({ email, assunto, corpo });

  return NextResponse.json({ assunto, corpo, token });
}
