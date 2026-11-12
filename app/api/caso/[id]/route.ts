// Snapshot do caso pra página /caso/[id] — nunca acessível só pelo id da
// URL, exige o token assinado (?token=) que prova que quem está pedindo
// recebeu o link certo (e-mail de confirmação da compra).

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyCasoToken } from "@/lib/caso-acesso-token";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!checkRateLimit(`caso-dados:${clientIp(req)}`, 30, 60 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") || "";

  let payload: ReturnType<typeof verifyCasoToken>;
  try {
    payload = verifyCasoToken(token);
  } catch (err) {
    console.error("caso_dados_sem_secret", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "servico_indisponivel" }, { status: 500 });
  }
  if (!payload || payload.casoId !== id) {
    return NextResponse.json({ error: "token_invalido" }, { status: 400 });
  }

  const { data: row, error } = await supabaseAdmin
    .from("user_casos")
    .select("id, tipo_caso, descricao, nome_completo, cpf, endereco_autor, nome_empresa, cnpj_empresa, endereco_empresa, valor_causa, cep_proprio, foro_json, peticao_status, peticao_erro")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ error: "caso_nao_encontrado" }, { status: 404 });
  }

  return NextResponse.json({ caso: row });
}
