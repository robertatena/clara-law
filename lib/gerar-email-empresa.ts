// Gera o modelo de e-mail de notificação extrajudicial (fluxo de disputa,
// modo "caso" em /enviar). Função pura — sem DOM, sem Supabase — pra poder
// rodar tanto no client (exibição imediata) quanto no servidor (fonte de
// verdade por trás do token assinado em /api/caso/preparar-email), sem
// duplicar a lógica nos dois lados.

// Neutraliza URLs no texto livre (descricao) antes de entrar no e-mail —
// clientes de e-mail (Gmail etc.) costumam auto-linkificar qualquer coisa
// que pareça link em texto puro, mesmo sem tag <a>. Como /api/caso/preparar-email
// aceita descricao sem autenticação, isso fecha o vetor de phishing via link
// embutido no "relato do caso".
function removerLinks(texto: string): string {
  return texto.replace(/(https?:\/\/|www\.)[^\s]+/gi, "[link removido]");
}

export function gerarEmailEmpresa(
  tipo: string,
  descricaoBruta: string,
  cia: { nome?: string; email?: string } | undefined
): { assunto: string; corpo: string } {
  const descricao = removerLinks(descricaoBruta);
  const tipoLabel = tipo === "voo_atrasado" ? "ATRASO DE VOO" : tipo === "voo_cancelado" ? "CANCELAMENTO DE VOO" : tipo === "bagagem" ? "EXTRAVIO / DANO DE BAGAGEM" : "PROBLEMA DE CONSUMO";
  const assunto = tipo.startsWith("voo") || tipo === "bagagem"
    ? `NOTIFICAÇÃO EXTRAJUDICIAL — ${tipoLabel} — SOLICITAÇÃO DE INDENIZAÇÃO`
    : `NOTIFICAÇÃO EXTRAJUDICIAL — SOLICITAÇÃO DE REPARAÇÃO — CDC`;

  // Extrai campos estruturados do texto de descrição gerado pelo analisarCaso
  const matchNome = descricao.match(/Passageiro ([^,]+)/);
  const matchCpf  = descricao.match(/CPF ([^\s.]+)/);
  const matchVoo  = descricao.match(/Voo ([^\s]+)/);
  const matchData = descricao.match(/em ([0-9]{2}\/[0-9]{2}\/[0-9]{4})/);
  const nome  = matchNome?.[1]?.trim() || "[NOME DO PASSAGEIRO]";
  const cpf   = matchCpf?.[1]?.trim()  || "[CPF]";
  const voo   = matchVoo?.[1]?.trim()  || "[NÚMERO DO VOO]";
  const data  = matchData?.[1]?.trim() || "[DATA DO VOO]";
  const ciaNome = cia?.nome || "companhia aérea";

  const sep = "────────────────────────────────────";

  const blocoPassageiro = `${sep}
IDENTIFICAÇÃO DO PASSAGEIRO
${sep}
Passageiro:    ${nome}
CPF:           ${cpf}
Voo:           ${voo}
Data do voo:   ${data}
Companhia:     ${ciaNome}
${sep}`;

  const advertencia = `${sep}
ADVERTÊNCIA FINAL
${sep}

Na ausência de resposta satisfatória no prazo indicado, o(a) passageiro(a) adotará, imediata e cumulativamente, as seguintes medidas:

  1. Reclamação formal na ANAC — Agência Nacional de Aviação Civil;
  2. Registro no Portal consumidor.gov.br;
  3. Ação no Juizado Especial Cível competente, com pedido de condenação
     por danos materiais e morais.

O não atendimento dos pedidos no prazo estabelecido será interpretado como
recusa expressa e será utilizado como prova nos procedimentos acima.`;

  const rodape = (n: string, c: string) =>
    `Atenciosamente,\n\n${n}${c && c !== "[CPF]" ? `\nCPF: ${c}` : ""}\n\n` +
    `(Informação gerada pela plataforma educacional Clara Law — claralaw.com.br. Este e-mail é enviado pelo próprio consumidor.)`;

  // Rodapé genérico (sem exigir passageiro/CPF) — para casos não-voo
  const rodapeGenerico = (n: string) =>
    `Atenciosamente,\n\n${n || "[SEU NOME COMPLETO]"}\n\n` +
    `(Informação gerada pela plataforma educacional Clara Law — claralaw.com.br. Este e-mail é enviado pelo próprio consumidor.)`;

  const corpo = tipo === "voo_atrasado" ? `\
Ao Departamento de Atendimento ao Consumidor
${ciaNome}

NOTIFICAÇÃO EXTRAJUDICIAL — ATRASO DE VOO
Solicitação de Indenização por Danos Materiais e Morais

Prezados Senhores,

Eu, abaixo qualificado(a), venho, por meio desta NOTIFICAÇÃO EXTRAJUDICIAL,
comunicar e formalizar reclamação em face de ${ciaNome}, pelos fatos e
fundamentos de direito a seguir expostos.

${blocoPassageiro}

${sep}
I. DOS FATOS
${sep}

O voo identificado acima sofreu atraso significativo. Durante o período de
espera, a companhia aérea não cumpriu as obrigações legais de assistência
material ao passageiro, causando transtornos expressivos, despesas adicionais
não reembolsadas e danos de ordem moral.

${sep}
II. DO DIREITO
${sep}

A Resolução ANAC nº 400/2016 impõe obrigações expressas à companhia aérea,
que não foram observadas no presente caso:

  • Art. 27, caput — Assistência material obrigatória (alimentação, comunicação)
    a partir de 1 (uma) hora de atraso;

  • Art. 27, § 1º — A partir de 2 (duas) horas, a assistência deve incluir
    acomodação e transporte ao passageiro;

  • Art. 27, § 2º — A partir de 4 (quatro) horas de atraso, a empresa deve
    oferecer reacomodação em outro voo, endosso ou reembolso integral;

  • Art. 21 — A empresa responde pelos danos diretos causados ao passageiro
    em decorrência do atraso operacional.

Aplicam-se, ainda:

  • Art. 14 do CDC (Lei 8.078/1990) — Responsabilidade objetiva do fornecedor
    pelo defeito na prestação do serviço;

  • Art. 6º, VI do CDC — Direito à efetiva prevenção e reparação de danos
    patrimoniais e morais.

O descumprimento dessas obrigações configura falha na prestação do serviço,
sujeitando ${ciaNome} à reparação integral dos danos causados.

${sep}
III. DOS PEDIDOS
${sep}

Diante do exposto, SOLICITO, no prazo IMPRORROGÁVEL de 10 (dez) dias úteis
contados do recebimento desta notificação:

  1. Reembolso integral das despesas materiais comprovadas decorrentes do
     atraso (alimentação, transporte, hospedagem e similares);

  2. Indenização pelos danos morais sofridos, em valor a ser acordado entre
     as partes ou arbitrado judicialmente;

  3. Resposta formal e escrita ao presente comunicado, com informações sobre
     o tratamento dado à reclamação.

${advertencia}

${rodape(nome, cpf)}`

  : tipo === "voo_cancelado" ? `\
Ao Departamento de Atendimento ao Consumidor
${ciaNome}

NOTIFICAÇÃO EXTRAJUDICIAL — CANCELAMENTO DE VOO
Solicitação de Indenização por Danos Materiais e Morais

Prezados Senhores,

Eu, abaixo qualificado(a), venho, por meio desta NOTIFICAÇÃO EXTRAJUDICIAL,
comunicar e formalizar reclamação em face de ${ciaNome}, pelos fatos e
fundamentos de direito a seguir expostos.

${blocoPassageiro}

${sep}
I. DOS FATOS
${sep}

O voo identificado acima foi cancelado pela companhia aérea. Não foi oferecida
reacomodação adequada em voo alternativo em tempo razoável, tampouco foi
realizado o reembolso integral do bilhete, causando prejuízos materiais e danos
morais ao passageiro.

${sep}
II. DO DIREITO
${sep}

A Resolução ANAC nº 400/2016 estabelece obrigações expressas para os casos de
cancelamento de voo:

  • Art. 21 — A empresa responde pelos danos causados ao passageiro em
    decorrência do cancelamento ou interrupção do serviço;

  • Art. 25 — Em caso de cancelamento, a empresa deve oferecer ao passageiro,
    à sua escolha: (i) reacomodação em voo próprio ou de outra empresa;
    (ii) reembolso integral; ou (iii) execução do serviço por outra modalidade
    de transporte;

  • Art. 27, § 2º — O passageiro tem direito a assistência material completa
    enquanto aguarda solução.

Aplicam-se, ainda:

  • Art. 14 do CDC (Lei 8.078/1990) — Responsabilidade objetiva pelo defeito
    na prestação do serviço;

  • Art. 6º, VI do CDC — Direito à reparação de danos patrimoniais e morais.

${sep}
III. DOS PEDIDOS
${sep}

Diante do exposto, SOLICITO, no prazo IMPRORROGÁVEL de 10 (dez) dias úteis:

  1. Reacomodação imediata em voo equivalente ou reembolso integral do valor
     pago pelo bilhete, à escolha do passageiro;

  2. Reembolso das despesas materiais comprovadas (transporte, hospedagem,
     alimentação) decorrentes do cancelamento;

  3. Indenização pelos danos morais sofridos, em valor a ser acordado ou
     arbitrado judicialmente;

  4. Resposta formal e escrita ao presente comunicado.

${advertencia}

${rodape(nome, cpf)}`

  : tipo === "bagagem" ? `\
Ao Departamento de Atendimento ao Consumidor
${ciaNome}

NOTIFICAÇÃO EXTRAJUDICIAL — EXTRAVIO / DANO DE BAGAGEM
Solicitação de Indenização por Danos Materiais e Morais

Prezados Senhores,

Eu, abaixo qualificado(a), venho, por meio desta NOTIFICAÇÃO EXTRAJUDICIAL,
comunicar e formalizar reclamação em face de ${ciaNome} pelo extravio ou dano
à bagagem despachada, conforme identificado abaixo.

${blocoPassageiro}

${sep}
I. DOS FATOS
${sep}

A bagagem despachada no voo acima identificado foi extraviada ou danificada
sob a guarda exclusiva de ${ciaNome}. O passageiro cumpriu todas as obrigações
de check-in e despacho de bagagem dentro dos parâmetros exigidos pela empresa,
não havendo qualquer culpa do passageiro pelo ocorrido.

${sep}
II. DO DIREITO
${sep}

A responsabilidade da companhia aérea pela bagagem despachada é objetiva,
conforme previsto:

  • Art. 34 da Resolução ANAC nº 400/2016 — A empresa é responsável pelos
    danos causados à bagagem despachada desde o check-in até a entrega;

  • Art. 35 da Resolução ANAC nº 400/2016 — Em caso de extravio, a empresa
    deve localizar e entregar a bagagem ou indenizar o passageiro;

  • Art. 37 da Resolução ANAC nº 400/2016 — O prazo para localização é de
    7 dias para voos domésticos e 21 dias para voos internacionais; após esse
    prazo, a bagagem é considerada definitivamente extraviada;

  • Convenção de Montreal (Decreto nº 5.910/2006, art. 17) — Responsabilidade
    objetiva da transportadora por destruição, perda ou avaria da bagagem
    registrada ocorrida durante o transporte aéreo.

Aplicam-se, ainda:

  • Art. 14 do CDC (Lei 8.078/1990) — Responsabilidade objetiva pelo defeito
    na prestação do serviço;

  • Art. 6º, VI do CDC — Direito à reparação integral dos danos sofridos.

${sep}
III. DOS PEDIDOS
${sep}

Diante do exposto, SOLICITO, no prazo IMPRORROGÁVEL de 5 (cinco) dias úteis:

  1. Localização e entrega imediata da bagagem, caso ainda não tenha sido
     devolvida; ou, alternativamente,

  2. Indenização pelo valor dos itens extraviados ou danificados, mediante
     apresentação de relação de bens (até o limite previsto na Convenção de
     Montreal — atualmente aproximadamente USD 1.288 em voos internacionais);

  3. Reembolso das despesas de primeira necessidade comprovadas em decorrência
     do extravio (roupas, higiene pessoal e similares);

  4. Indenização pelos danos morais sofridos;

  5. Resposta formal e escrita ao presente comunicado.

${advertencia}

${rodape(nome, cpf)}`

  : tipo === "servico_nao_entregue" ? `\
Ao Departamento de Atendimento ao Consumidor
[NOME DA EMPRESA — preencher com a empresa contratada]

NOTIFICAÇÃO EXTRAJUDICIAL — SERVIÇO NÃO ENTREGUE
Solicitação de Devolução ou Execução — CDC art. 35

Prezados Senhores,

Venho, por meio desta NOTIFICAÇÃO EXTRAJUDICIAL, comunicar formalmente
reclamação a respeito de serviço contratado e não entregue, conforme
descrito abaixo:

${sep}
IDENTIFICAÇÃO DO CONSUMIDOR
${sep}
Nome:          [SEU NOME COMPLETO]
CPF:           [SEU CPF]
${sep}

${sep}
I. DOS FATOS
${sep}

${descricao}

${sep}
II. DO DIREITO
${sep}

A conduta narrada vai contra o Código de Defesa do Consumidor (Lei 8.078/1990),
em especial:

  • Art. 35 — Recusado o cumprimento da oferta, apresentação ou publicidade
    pelo fornecedor, o consumidor poderá, alternativamente e à sua livre
    escolha:
      (i)   exigir o cumprimento forçado da obrigação, nos termos da oferta;
      (ii)  aceitar outro produto ou prestação de serviço equivalente;
      (iii) rescindir o contrato, com direito à restituição de quantia
            eventualmente antecipada, monetariamente atualizada, e a perdas
            e danos;

  • Art. 49 (compras online / à distância) — Direito de arrependimento em até
    7 (sete) dias, contados da assinatura do contrato ou do recebimento do
    serviço, com devolução imediata e integral dos valores pagos;

  • Art. 20 — Vício ou má qualidade do serviço gera direito à reexecução, à
    restituição da quantia paga ou ao abatimento proporcional do preço,
    à escolha do consumidor;

  • Art. 14 — Responsabilidade objetiva do fornecedor pelo defeito na
    prestação do serviço;

  • Art. 6º, VI — Direito à efetiva reparação de danos patrimoniais e morais.

${sep}
III. DOS PEDIDOS
${sep}

Diante do exposto, SOLICITO, no prazo IMPRORROGÁVEL de 5 (cinco) dias úteis
contados do recebimento desta notificação:

  1. A devolução integral e imediata do valor pago, monetariamente atualizado;
     OU, alternativamente,

  2. A execução do serviço contratado no prazo máximo de 10 (dez) dias, sem
     custos adicionais;

  3. Indenização pelos danos materiais e morais eventualmente sofridos;

  4. Resposta formal e escrita ao presente comunicado.

${sep}
ADVERTÊNCIA FINAL
${sep}

Na ausência de resposta satisfatória no prazo indicado, serão adotadas,
imediata e cumulativamente, as seguintes medidas:

  1. Reclamação formal no Procon;
  2. Registro no Portal consumidor.gov.br;
  3. Registro no Reclame Aqui;
  4. Ação no Juizado Especial Cível competente, com pedido de condenação
     por danos materiais e morais.

${rodapeGenerico(nome !== "[NOME DO PASSAGEIRO]" ? nome : "")}`

  : tipo === "cobranca_indevida" ? `\
Ao Departamento de Atendimento ao Consumidor
[NOME DA EMPRESA — preencher com a empresa cobradora]

NOTIFICAÇÃO EXTRAJUDICIAL — COBRANÇA INDEVIDA
Solicitação de Cessação de Cobrança e Reparação — CDC

Prezados Senhores,

Venho, por meio desta NOTIFICAÇÃO EXTRAJUDICIAL, comunicar e formalizar
reclamação em relação a cobrança indevida, com base nas informações abaixo:

${sep}
IDENTIFICAÇÃO DO CONSUMIDOR
${sep}
Nome:          [SEU NOME COMPLETO]
CPF:           [SEU CPF]
${sep}

${sep}
I. DOS FATOS
${sep}

${descricao}

${sep}
II. DO DIREITO
${sep}

A conduta descrita vai contra o Código de Defesa do Consumidor (Lei 8.078/1990),
em especial:

  • Art. 42, caput — Vedação de constrangimento ou ameaça na cobrança de dívidas;

  • Art. 42, parágrafo único — O consumidor cobrado em quantia indevida tem
    direito à repetição do indébito, por valor igual ao dobro do que pagou em
    excesso, acrescido de correção monetária e juros legais, salvo hipótese
    de engano justificável;

  • Art. 43 — Direito de acesso e correção de dados cadastrais em bancos de
    dados de proteção ao crédito (Serasa, SPC, SCPC);

  • Súmula 385 STJ — Em caso de negativação indevida, casos assim costumam
    ensejar reparação por dano moral, salvo comprovada preexistência de
    negativação regular.

${sep}
III. DOS PEDIDOS
${sep}

Diante do exposto, SOLICITO, no prazo IMPRORROGÁVEL de 5 (cinco) dias úteis
contados do recebimento desta notificação:

  1. A cessação imediata da cobrança indevida;

  2. A devolução em dobro do valor cobrado indevidamente, corrigido
     monetariamente, nos termos do art. 42, parágrafo único, do CDC;

  3. A retirada imediata do meu nome de eventuais órgãos de proteção ao
     crédito (Serasa, SPC ou similares), se aplicável;

  4. Resposta formal e escrita ao presente comunicado.

${sep}
ADVERTÊNCIA FINAL
${sep}

Na ausência de resposta satisfatória no prazo indicado, serão adotadas,
imediata e cumulativamente, as seguintes medidas:

  1. Reclamação formal no Procon;
  2. Registro no Portal consumidor.gov.br;
  3. Reclamação junto ao Banco Central (se instituição financeira);
  4. Ação no Juizado Especial Cível competente, com pedidos cumulativos
     de repetição de indébito, indenização por danos morais e antecipação
     de tutela para remoção da negativação (quando aplicável).

${rodapeGenerico(nome !== "[NOME DO PASSAGEIRO]" ? nome : "")}`

  : tipo === "produto_defeito" ? `\
Ao Departamento de Atendimento ao Consumidor
[NOME DA EMPRESA — preencher com a loja/fabricante]

NOTIFICAÇÃO EXTRAJUDICIAL — PRODUTO COM VÍCIO / DEFEITO
Solicitação de Reparação — CDC art. 18

Prezados Senhores,

Venho, por meio desta NOTIFICAÇÃO EXTRAJUDICIAL, comunicar formalmente
reclamação a respeito de produto adquirido com vício/defeito, conforme
descrito abaixo:

${sep}
IDENTIFICAÇÃO DO CONSUMIDOR
${sep}
Nome:          [SEU NOME COMPLETO]
CPF:           [SEU CPF]
${sep}

${sep}
I. DOS FATOS
${sep}

${descricao}

${sep}
II. DO DIREITO
${sep}

A conduta narrada vai contra o Código de Defesa do Consumidor (Lei 8.078/1990),
em especial:

  • Art. 18, caput — Os fornecedores de produtos de consumo duráveis ou não
    duráveis respondem solidariamente pelos vícios de qualidade que os tornem
    impróprios ou inadequados ao consumo a que se destinam ou lhes diminuam
    o valor;

  • Art. 18, § 1º — Não sanado o vício no prazo máximo de 30 (trinta) dias,
    o consumidor pode exigir, à sua escolha:
      (i)  a substituição do produto por outro da mesma espécie;
      (ii) a restituição imediata da quantia paga, corrigida;
      (iii) o abatimento proporcional do preço;

  • Art. 26, II — Prazo decadencial de 90 (noventa) dias para reclamar de
    vícios em produtos duráveis, contados da entrega efetiva do produto ou
    da constatação do vício oculto;

  • Art. 49 (se aplicável a compras online/à distância) — Direito de
    arrependimento em até 7 (sete) dias, contados do recebimento do produto;

  • Art. 14 — Responsabilidade objetiva do fornecedor pelo defeito na
    prestação do serviço.

${sep}
III. DOS PEDIDOS
${sep}

Diante do exposto, SOLICITO, no prazo IMPRORROGÁVEL de 5 (cinco) dias úteis
contados do recebimento desta notificação:

  1. Reparo do produto, sem custos, no prazo máximo legal de 30 (trinta)
     dias; OU, alternativamente, à minha escolha:

  2. Substituição do produto por outro da mesma espécie, em perfeitas
     condições de uso; OU

  3. Restituição imediata da quantia paga, monetariamente atualizada; OU

  4. Abatimento proporcional do preço;

  5. Resposta formal e escrita ao presente comunicado.

${sep}
ADVERTÊNCIA FINAL
${sep}

Na ausência de resposta satisfatória no prazo indicado, serão adotadas,
imediata e cumulativamente, as seguintes medidas:

  1. Reclamação formal no Procon;
  2. Registro no Portal consumidor.gov.br;
  3. Registro no Reclame Aqui;
  4. Ação no Juizado Especial Cível competente, com pedido de condenação
     por danos materiais e morais.

${rodapeGenerico(nome !== "[NOME DO PASSAGEIRO]" ? nome : "")}`

  : `Prezados,\n\nVenho, por meio desta, notificar formalmente sobre o problema descrito abaixo, solicitando resolução:\n\n${descricao}\n\nNos termos do Código de Defesa do Consumidor (Lei 8.078/90, art. 14 e art. 6º, VI), solicito, no prazo de 10 (dez) dias úteis, a devida reparação pelos danos causados.\n\nNa ausência de resposta satisfatória, procederei com registro nos órgãos competentes e, se necessário, ação no Juizado Especial Cível.\n\n${rodapeGenerico(nome !== "[NOME DO PASSAGEIRO]" ? nome : "")}`;

  return { assunto, corpo };
}
