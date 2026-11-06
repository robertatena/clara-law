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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  // (a) rate limit por IP — 10/hora.
  if (!checkRateLimit(`preparar-email:${clientIp(req)}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const tipoCaso = String(body.tipoCaso || "");
  const descricao = String(body.descricao || "");
  const ciaNome = body.ciaNome !== undefined && body.ciaNome !== null ? String(body.ciaNome) : "";
  const ciaEmail = body.ciaEmail !== undefined && body.ciaEmail !== null ? String(body.ciaEmail) : "";
  const email = String(body.email || "").trim().toLowerCase();

  // (b) validação e limite de tamanho de cada campo — rejeita com 400 em
  // vez de truncar silenciosamente (truncar esconde o problema do chamador
  // e ainda deixa passar payloads grandes até o corte).
  if (!TIPOS_VALIDOS.includes(tipoCaso)) {
    return NextResponse.json({ error: "tipo_invalido" }, { status: 400 });
  }
  if (descricao.length > 2000) {
    return NextResponse.json({ error: "descricao_muito_longa", limite: 2000 }, { status: 400 });
  }
  if (ciaNome.length > 120) {
    return NextResponse.json({ error: "ciaNome_muito_longo", limite: 120 }, { status: 400 });
  }
  if (ciaEmail) {
    if (ciaEmail.length > 254 || !EMAIL_REGEX.test(ciaEmail)) {
      return NextResponse.json({ error: "ciaEmail_invalido" }, { status: 400 });
    }
  }
  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "email_invalido" }, { status: 400 });
  }

  const { assunto, corpo } = gerarEmailEmpresa(tipoCaso, descricao, {
    nome: ciaNome || undefined,
    email: ciaEmail || undefined,
  });

  let token: string;
  try {
    token = signEmailToken({ email, assunto, corpo });
  } catch (err) {
    // getSecret() em lib/copia-notificacao-token.ts lança se
    // EMAIL_COPIA_SECRET não estiver configurada — falha fechada, nunca
    // assina com um segredo previsível.
    console.error("preparar_email_sem_secret", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "servico_indisponivel" }, { status: 500 });
  }

  return NextResponse.json({ assunto, corpo, token });
}
