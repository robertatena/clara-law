// Gera o modelo de petição inicial pro Juizado Especial Cível (Kit Juizado).
// Server-safe (sem DOM) — chamado pelo pipeline pós-pagamento
// (lib/peticao-pipeline.ts) e pelas rotas de PDF/DOCX, nunca no client.
//
// Estrutura compartilhada entre os 6 tipos de caso (cabeçalho, fatos,
// competência, pedidos, fechamento); só os fundamentos de direito e os
// pedidos variam por tipo — mesmos artigos já usados em
// lib/gerar-email-empresa.ts (fonte única da verdade sobre qual artigo
// cabe em qual tipo de caso).
//
// Campos que faltam aparecem como "[PREENCHER: campo]" — nunca um
// "[PREENCHER]" genérico, pra quem revisar saber exatamente o que falta.

export type TipoCasoPeticao =
  | "voo_atrasado" | "voo_cancelado" | "bagagem"
  | "produto_defeito" | "servico_nao_entregue" | "cobranca_indevida";

export type EnderecoPeticao = {
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
};

export type DadosPeticao = {
  tipo: TipoCasoPeticao;
  descricaoFatos: string;
  nomeCompleto?: string;
  cpf?: string;
  enderecoAutor?: EnderecoPeticao;
  nomeEmpresa?: string;
  cnpjEmpresa?: string;
  enderecoEmpresa?: EnderecoPeticao;
  valorCausa?: string;
  foro?: { foro?: string; endereco?: string };
  cepProprio: boolean; // toggle de competência: própria casa (padrão) vs empresa/local do fato
};

export const AVISO_PETICAO =
  "Modelo orientativo — revise antes de protocolar. Plataforma educacional, não substitui advogado.";

type Resultado = { assunto: string; corpo: string; camposFaltantes: string[] };

// Fábrica dos dois helpers de preenchimento — cada chamada de gerarPeticaoJec
// recebe seu próprio array via closure, sem estado compartilhado entre
// chamadas concorrentes (duas gerações ao mesmo tempo não se corrompem).
function criarHelpersPreenchimento(camposFaltantes: string[]) {
  function preencher(valor: string | undefined, label: string): string {
    if (valor && valor.trim()) return valor.trim();
    camposFaltantes.push(label);
    return `[PREENCHER: ${label}]`;
  }

  function formatarEndereco(end: EnderecoPeticao | undefined, labelPrefixo: string): string {
    if (!end || (!end.logradouro && !end.cidade)) {
      camposFaltantes.push(`${labelPrefixo} — endereço`);
      return `[PREENCHER: ${labelPrefixo} — endereço completo]`;
    }
    const partes = [
      end.logradouro, end.numero, end.bairro,
      [end.cidade, end.uf].filter(Boolean).join("/"),
      end.cep ? `CEP ${end.cep}` : "",
    ].filter(Boolean);
    return partes.join(", ");
  }

  return { preencher, formatarEndereco };
}

const FUNDAMENTOS: Record<TipoCasoPeticao, string> = {
  voo_atrasado:
    "A Resolução ANAC nº 400/2016, art. 27 e seus parágrafos, impõe assistência material " +
    "obrigatória e, a partir de 4 (quatro) horas de atraso, reacomodação, endosso ou reembolso " +
    "integral; o art. 21 responsabiliza a companhia pelos danos diretos decorrentes do atraso. " +
    "Aplicam-se ainda o art. 14 do CDC (Lei 8.078/1990), responsabilidade objetiva do fornecedor " +
    "pelo defeito na prestação do serviço, e o art. 6º, VI, do CDC, direito à efetiva reparação " +
    "de danos patrimoniais e morais.",
  voo_cancelado:
    "A Resolução ANAC nº 400/2016 estabelece, no art. 25, que em caso de cancelamento a empresa " +
    "deve oferecer reacomodação, reembolso integral ou execução por outra modalidade de " +
    "transporte, à escolha do passageiro; o art. 21 responsabiliza a companhia pelos danos " +
    "decorrentes do cancelamento, e o art. 27, §2º, garante assistência material completa " +
    "enquanto o passageiro aguarda solução. Aplicam-se ainda o art. 14 do CDC (Lei 8.078/1990) " +
    "e o art. 6º, VI, do CDC.",
  bagagem:
    "A responsabilidade da companhia aérea pela bagagem despachada é objetiva, conforme os " +
    "arts. 34, 35 e 37 da Resolução ANAC nº 400/2016 (localização, entrega ou indenização, com " +
    "prazo de 7 dias para voos domésticos e 21 para internacionais) e o art. 17 da Convenção de " +
    "Montreal (Decreto nº 5.910/2006), responsabilidade objetiva da transportadora por " +
    "destruição, perda ou avaria da bagagem registrada. Aplicam-se ainda o art. 14 do CDC " +
    "(Lei 8.078/1990) e o art. 6º, VI, do CDC.",
  produto_defeito:
    "O art. 18, caput, do CDC (Lei 8.078/1990) responsabiliza solidariamente os fornecedores " +
    "pelos vícios de qualidade do produto; não sanado o vício no prazo máximo de 30 (trinta) " +
    "dias, o art. 18, §1º, garante ao consumidor, à sua escolha, a substituição do produto, a " +
    "restituição da quantia paga ou o abatimento proporcional do preço. O art. 26, II, estabelece " +
    "prazo decadencial de 90 (noventa) dias para reclamar de vícios em produtos duráveis, e o " +
    "art. 49, quando aplicável a compras online/à distância, garante direito de arrependimento " +
    "em até 7 (sete) dias.",
  servico_nao_entregue:
    "O art. 35 do CDC (Lei 8.078/1990) garante ao consumidor, perante a recusa do fornecedor em " +
    "cumprir a oferta, exigir o cumprimento forçado, aceitar produto/serviço equivalente ou " +
    "rescindir o contrato com restituição integral e perdas e danos; o art. 20 garante reexecução, " +
    "restituição ou abatimento proporcional em caso de má execução do serviço; o art. 49, quando " +
    "aplicável, garante direito de arrependimento em 7 (sete) dias. Aplicam-se ainda o art. 14 do " +
    "CDC e o art. 6º, VI, do CDC.",
  cobranca_indevida:
    "O art. 42, caput, do CDC (Lei 8.078/1990) veda o constrangimento ou ameaça na cobrança de " +
    "dívidas, e o art. 42, parágrafo único, garante ao consumidor cobrado em quantia indevida a " +
    "repetição do indébito em dobro, salvo engano justificável; o art. 43 garante o direito de " +
    "correção de dados em bancos de proteção ao crédito. A Súmula 385 do STJ reconhece, em casos " +
    "de negativação indevida, a possibilidade de reparação por dano moral.",
};

const PEDIDOS: Record<TipoCasoPeticao, string[]> = {
  voo_atrasado: [
    "a condenação da ré ao reembolso integral das despesas materiais comprovadas decorrentes do atraso (alimentação, transporte, hospedagem e similares)",
    "a condenação da ré ao pagamento de indenização por danos morais, a ser arbitrada por Vossa Excelência",
  ],
  voo_cancelado: [
    "a condenação da ré à reacomodação ou ao reembolso integral do valor pago pelo bilhete, à escolha do autor",
    "a condenação da ré ao reembolso das despesas materiais comprovadas decorrentes do cancelamento",
    "a condenação da ré ao pagamento de indenização por danos morais, a ser arbitrada por Vossa Excelência",
  ],
  bagagem: [
    "a condenação da ré à indenização pelos itens danificados, extraviados ou faltantes, mediante apresentação de relação de bens",
    "a condenação da ré ao pagamento de indenização por danos morais, a ser arbitrada por Vossa Excelência",
  ],
  produto_defeito: [
    "a condenação da ré à substituição do produto, à devolução do valor pago ou ao abatimento proporcional do preço, à escolha do autor",
    "a condenação da ré ao pagamento de indenização por danos morais, caso comprovados, a ser arbitrada por Vossa Excelência",
  ],
  servico_nao_entregue: [
    "a condenação da ré à devolução integral do valor pago ou à execução do serviço contratado, à escolha do autor",
    "a condenação da ré ao pagamento de indenização por danos materiais e morais, caso comprovados, a ser arbitrada por Vossa Excelência",
  ],
  cobranca_indevida: [
    "a condenação da ré à devolução em dobro do valor cobrado indevidamente, corrigido monetariamente, nos termos do art. 42, parágrafo único, do CDC",
    "a retirada do nome do autor de eventuais órgãos de proteção ao crédito (Serasa, SPC ou similares), se aplicável",
    "a condenação da ré ao pagamento de indenização por danos morais, especialmente em caso de negativação indevida, a ser arbitrada por Vossa Excelência",
  ],
};

export function gerarPeticaoJec(dados: DadosPeticao): Resultado {
  const camposFaltantes: string[] = [];
  const { preencher, formatarEndereco } = criarHelpersPreenchimento(camposFaltantes);

  const nome = preencher(dados.nomeCompleto, "nome completo do autor");
  const cpf = preencher(dados.cpf, "CPF do autor");
  const enderecoAutorTxt = formatarEndereco(dados.enderecoAutor, "endereço do autor");
  const nomeEmpresa = preencher(dados.nomeEmpresa, "nome da empresa ré");
  const cnpjEmpresa = dados.cnpjEmpresa?.trim() || "[PREENCHER: CNPJ da empresa ré — opcional, se souber]";
  const valorCausa = preencher(dados.valorCausa, "valor da causa");
  const foroNome = dados.foro?.foro || "[PREENCHER: fórum competente — busque pelo CEP]";

  const competencia = dados.cepProprio
    ? "Ajuíza a presente ação neste Juizado, foro do domicílio do autor, com fundamento no art. 101, I, do Código de Defesa do Consumidor e no art. 4º, III, da Lei 9.099/95."
    : "Ajuíza a presente ação neste Juizado, foro do domicílio do réu ou do local do fato, com fundamento no art. 4º, I, da Lei 9.099/95.";

  const pedidosTexto = PEDIDOS[dados.tipo]
    .map((p, i) => `${String.fromCharCode(97 + i)}) ${p};`)
    .join("\n");

  const assunto = `Petição inicial — JEC — ${nomeEmpresa} — R$ ${valorCausa}`;

  const corpo =
    `Ao(À) Meritíssimo(a) Juiz(a) de Direito\n${foroNome}\n\n` +
    `PETIÇÃO INICIAL\n\n` +
    `${AVISO_PETICAO}\n\n` +
    `Eu, ${nome}, portador(a) do CPF nº ${cpf}, residente e domiciliado(a) em ${enderecoAutorTxt}, ` +
    `venho, respeitosamente, à presença de Vossa Excelência propor a presente\n\n` +
    `AÇÃO DE INDENIZAÇÃO POR DANOS MATERIAIS E MORAIS\n\n` +
    `em face de ${nomeEmpresa}${cnpjEmpresa !== "[PREENCHER: CNPJ da empresa ré — opcional, se souber]" ? `, CNPJ ${cnpjEmpresa},` : ","} ` +
    `pessoa jurídica de direito privado, com endereço em ${formatarEndereco(dados.enderecoEmpresa, "endereço da empresa ré")}, ` +
    `pelos fatos e fundamentos a seguir expostos.\n\n` +
    `I. DOS FATOS\n\n${dados.descricaoFatos}\n\n` +
    `II. DO DIREITO\n\n${FUNDAMENTOS[dados.tipo]}\n\n` +
    `III. DA COMPETÊNCIA\n\n${competencia}\n\n` +
    `IV. DOS PEDIDOS\n\nDiante do exposto, requer:\n${pedidosTexto}\nd) a condenação da ré ao pagamento das custas processuais, se houver.\n\n` +
    `Dá-se à causa o valor de R$ ${valorCausa}.\n\n` +
    `Termos em que pede e espera deferimento.\n\n` +
    `[Cidade], [DATA]\n\n_______________________________\n${nome}\nCPF: ${cpf}\n\n` +
    `${AVISO_PETICAO}`;

  return { assunto, corpo, camposFaltantes };
}
