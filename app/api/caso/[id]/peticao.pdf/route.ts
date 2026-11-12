// Baixa a petição em PDF, renderizada na hora a partir dos dados atuais do
// caso (nunca armazenada como arquivo — sempre reflete a versão mais
// recente). Exige o token assinado do caso, igual à página /caso/[id].

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyCasoToken } from "@/lib/caso-acesso-token";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { gerarPeticaoPdf } from "@/lib/gerar-peticao-pdf";
import type { DadosPeticao, TipoCasoPeticao } from "@/lib/gerar-peticao-jec";

export const runtime = "nodejs";

const TIPOS_SUPORTADOS: TipoCasoPeticao[] = [
  "voo_atrasado", "voo_cancelado", "bagagem",
  "produto_defeito", "servico_nao_entregue", "cobranca_indevida",
];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(`caso-pdf:${clientIp(req)}`, 20, 60 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") || "";

  let payload: ReturnType<typeof verifyCasoToken>;
  try {
    payload = verifyCasoToken(token);
  } catch (err) {
    console.error("caso_pdf_sem_secret", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "servico_indisponivel" }, { status: 500 });
  }
  if (!payload || payload.casoId !== id) {
    return NextResponse.json({ error: "token_invalido" }, { status: 400 });
  }

  const { data: row, error } = await supabaseAdmin
    .from("user_casos")
    .select("tipo_caso, descricao, nome_completo, cpf, endereco_autor, nome_empresa, cnpj_empresa, endereco_empresa, valor_causa, cep_proprio, foro_json")
    .eq("id", id)
    .maybeSingle();

  if (error || !row || !TIPOS_SUPORTADOS.includes(row.tipo_caso as TipoCasoPeticao)) {
    return NextResponse.json({ error: "caso_nao_encontrado" }, { status: 404 });
  }

  const dados: DadosPeticao = {
    tipo: row.tipo_caso as TipoCasoPeticao,
    descricaoFatos: row.descricao || "",
    nomeCompleto: row.nome_completo || undefined,
    cpf: row.cpf || undefined,
    enderecoAutor: row.endereco_autor || undefined,
    nomeEmpresa: row.nome_empresa || undefined,
    cnpjEmpresa: row.cnpj_empresa || undefined,
    enderecoEmpresa: row.endereco_empresa || undefined,
    valorCausa: row.valor_causa || undefined,
    foro: row.foro_json || undefined,
    cepProprio: row.cep_proprio ?? true,
  };

  const arrayBuffer = gerarPeticaoPdf(dados);
  return new NextResponse(Buffer.from(arrayBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=peticao-jec-clara-law.pdf",
    },
  });
}
