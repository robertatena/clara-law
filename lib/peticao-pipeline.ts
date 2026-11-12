// Orquestra a preparação da petição de um caso pago: carrega os dados de
// user_casos, roda o gerador (lib/gerar-peticao-jec.ts) só pra saber o que
// falta (não gera PDF/DOCX aqui — isso é renderizado sob demanda pelas
// rotas de download), e grava status/erro de volta.
//
// Chamado em dois momentos: (1) logo após o pagamento, dentro de
// fulfillCheckout() — primeira tentativa, normalmente "parcial" porque os
// dados do autor/empresa/fórum ainda não foram preenchidos; (2) depois que
// o usuário preenche o formulário pós-pagamento, pra recalcular o status.
//
// Disciplina anti-race: só grava peticao_status/peticao_gerada_em/
// peticao_erro — nunca os campos estruturados (nome/cpf/endereço/etc),
// que são escritos exclusivamente pela rota de completar-dados. Duas
// escritas quase simultâneas (fulfillment + formulário) não se pisam
// porque cada uma só toca as colunas que é dona.

import { supabaseAdmin } from "./supabase-server";
import { gerarPeticaoJec, type DadosPeticao, type TipoCasoPeticao } from "./gerar-peticao-jec";

const TIPOS_SUPORTADOS: TipoCasoPeticao[] = [
  "voo_atrasado", "voo_cancelado", "bagagem",
  "produto_defeito", "servico_nao_entregue", "cobranca_indevida",
];

type LinhaUserCaso = {
  tipo_caso: string;
  descricao: string | null;
  nome_completo: string | null;
  cpf: string | null;
  endereco_autor: DadosPeticao["enderecoAutor"] | null;
  nome_empresa: string | null;
  cnpj_empresa: string | null;
  endereco_empresa: DadosPeticao["enderecoEmpresa"] | null;
  valor_causa: string | null;
  cep_proprio: boolean | null;
  foro_json: DadosPeticao["foro"] | null;
};

export async function prepararPeticao(casoId: string): Promise<void> {
  try {
    const { data: row, error } = await supabaseAdmin
      .from("user_casos")
      .select("tipo_caso, descricao, nome_completo, cpf, endereco_autor, nome_empresa, cnpj_empresa, endereco_empresa, valor_causa, cep_proprio, foro_json")
      .eq("id", casoId)
      .maybeSingle<LinhaUserCaso>();

    if (error) throw error;
    if (!row) throw new Error("caso não encontrado");

    // Petição JEC só se aplica a casos de disputa — análise de contrato não vai a JEC.
    if (!TIPOS_SUPORTADOS.includes(row.tipo_caso as TipoCasoPeticao)) return;

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

    const { camposFaltantes } = gerarPeticaoJec(dados);
    const status = camposFaltantes.length === 0 ? "completo" : "parcial";

    await supabaseAdmin
      .from("user_casos")
      .update({ peticao_status: status, peticao_gerada_em: new Date().toISOString(), peticao_erro: null })
      .eq("id", casoId);
  } catch (err) {
    console.error("preparar_peticao_erro", { casoId, erro: err instanceof Error ? err.message : "unknown" });
    try {
      await supabaseAdmin
        .from("user_casos")
        .update({ peticao_status: "erro", peticao_erro: err instanceof Error ? err.message : "unknown" })
        .eq("id", casoId);
    } catch {
      // Se nem o update de erro funcionar (ex.: banco fora do ar), não há
      // mais nada a fazer aqui — o e-mail de confirmação já tem o texto da
      // petição inline como rede de segurança (ver lib/checkout-fulfillment.ts).
    }
  }
}
