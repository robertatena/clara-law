// Formulário curto pós-pagamento: nome completo, CPF, endereço do autor,
// nome/CNPJ/endereço da empresa, valor da causa e CEP+toggle pro fórum.
// Só é alcançável por quem tem o token assinado do caso (link do e-mail de
// confirmação) — nunca pelo id isolado.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyCasoToken } from "@/lib/caso-acesso-token";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { resolverForo } from "@/lib/forum";
import { prepararPeticao } from "@/lib/peticao-pipeline";

export const runtime = "nodejs";

type EnderecoInput = { logradouro?: string; numero?: string; bairro?: string; cidade?: string; uf?: string; cep?: string };

function validarEndereco(end: unknown): EnderecoInput | undefined {
  if (!end || typeof end !== "object") return undefined;
  const e = end as Record<string, unknown>;
  const campo = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);
  return {
    logradouro: campo(e.logradouro, 200),
    numero: campo(e.numero, 20),
    bairro: campo(e.bairro, 100),
    cidade: campo(e.cidade, 100),
    uf: campo(e.uf, 2),
    cep: campo(e.cep, 9),
  };
}

export async function POST(req: Request) {
  if (!checkRateLimit(`caso-completar:${clientIp(req)}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const token = String(body.token || "");

  let payload: ReturnType<typeof verifyCasoToken>;
  try {
    payload = verifyCasoToken(token);
  } catch (err) {
    console.error("completar_dados_sem_secret", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "servico_indisponivel" }, { status: 500 });
  }
  if (!payload) {
    return NextResponse.json({ error: "token_invalido" }, { status: 400 });
  }
  const casoId = payload.casoId;

  const nomeCompleto = typeof body.nomeCompleto === "string" ? body.nomeCompleto.trim().slice(0, 150) : "";
  const cpf = typeof body.cpf === "string" ? body.cpf.replace(/\D/g, "").slice(0, 11) : "";
  const nomeEmpresa = typeof body.nomeEmpresa === "string" ? body.nomeEmpresa.trim().slice(0, 150) : "";
  const cnpjEmpresa = typeof body.cnpjEmpresa === "string" ? body.cnpjEmpresa.replace(/\D/g, "").slice(0, 14) : "";
  const valorCausa = typeof body.valorCausa === "string" ? body.valorCausa.trim().slice(0, 30) : "";
  const cepBusca = typeof body.cepBusca === "string" ? body.cepBusca.replace(/\D/g, "").slice(0, 8) : "";
  const cepProprio = typeof body.cepProprio === "boolean" ? body.cepProprio : true;

  if (body.cpf && cpf.length !== 11) {
    return NextResponse.json({ error: "cpf_invalido" }, { status: 400 });
  }
  if (body.cnpjEmpresa && cnpjEmpresa.length !== 14) {
    return NextResponse.json({ error: "cnpj_invalido" }, { status: 400 });
  }
  if (body.cepBusca && cepBusca.length !== 8) {
    return NextResponse.json({ error: "cep_invalido" }, { status: 400 });
  }

  const update: Record<string, unknown> = { cep_proprio: cepProprio };
  if (nomeCompleto) update.nome_completo = nomeCompleto;
  if (cpf) update.cpf = cpf;
  if (nomeEmpresa) update.nome_empresa = nomeEmpresa;
  if (cnpjEmpresa) update.cnpj_empresa = cnpjEmpresa;
  if (valorCausa) update.valor_causa = valorCausa;

  const enderecoAutor = validarEndereco(body.enderecoAutor);
  if (enderecoAutor) update.endereco_autor = enderecoAutor;
  const enderecoEmpresa = validarEndereco(body.enderecoEmpresa);
  if (enderecoEmpresa) update.endereco_empresa = enderecoEmpresa;

  if (cepBusca) {
    update.cep_busca = cepBusca;
    try {
      const foro = await resolverForo(cepBusca);
      if (foro.encontrado) update.foro_json = { foro: foro.foro, endereco: foro.endereco };
    } catch (err) {
      console.error("completar_dados_forum_error", err instanceof Error ? err.message : "unknown");
    }
  }

  const { error } = await supabaseAdmin.from("user_casos").update(update).eq("id", casoId);
  if (error) {
    console.error("completar_dados_update_error", { casoId, error: error.message });
    return NextResponse.json({ error: "erro_ao_salvar" }, { status: 500 });
  }

  await prepararPeticao(casoId);

  return NextResponse.json({ ok: true });
}
