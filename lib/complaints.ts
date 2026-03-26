export type FindingLite = {
  title: string;
  whyItMatters?: string;
  whatToDo?: string;
};

export type ComplaintContext = {
  consumerName?: string;
  consumerEmail?: string;
  consumerPhone?: string;
  companyName?: string;
  contractType?: string;
  role?: string; // "sou a parte..." etc
  summary?: string;
  selectedFindings: FindingLite[];
};

function clean(s?: string) {
  return (s ?? "").trim();
}

function bullets(items: string[]) {
  return items.filter(Boolean).map((x) => `- ${x}`).join("\n");
}

export function buildBaseNarrative(ctx: ComplaintContext) {
  const company = clean(ctx.companyName) || "[NOME DA EMPRESA]";
  const contractType = clean(ctx.contractType) || "[TIPO DE CONTRATO]";
  const role = clean(ctx.role) || "[MINHA POSIÇÃO NO CONTRATO]";
  const summary = clean(ctx.summary);

  const points = ctx.selectedFindings?.length
    ? ctx.selectedFindings.map((f) => {
        const a = clean(f.title);
        const b = clean(f.whyItMatters);
        const c = clean(f.whatToDo);
        const parts = [a, b ? `Por que importa: ${b}` : "", c ? `O que peço: ${c}` : ""].filter(Boolean);
        return parts.join(" — ");
      })
    : ["[DESCREVA AQUI O PROBLEMA PRINCIPAL]"];

  return {
    company,
    contractType,
    role,
    summary,
    pointsText: bullets(points),
  };
}

export function templateReclameAqui(ctx: ComplaintContext) {
  const n = buildBaseNarrative(ctx);
  return [
    `Olá, ${n.company}.`,
    ``,
    `Venho relatar um problema relacionado a um contrato de ${n.contractType}. Minha posição: ${n.role}.`,
    n.summary ? `` : "",
    n.summary ? `Resumo: ${n.summary}` : "",
    ``,
    `Pontos para resolver:`,
    n.pointsText,
    ``,
    `O que eu solicito objetivamente:`,
    `- Confirmação/ajuste dos itens acima e proposta de solução com prazos.`,
    `- Caso haja valores, envio do detalhamento de cálculo e base contratual.`,
    ``,
    `Peço retorno em até 5 dias úteis.`,
    ``,
    `Obrigada.`,
  ].filter(Boolean).join("\n");
}

export function templateConsumidorGov(ctx: ComplaintContext) {
  const n = buildBaseNarrative(ctx);
  return [
    `RELATO (Consumidor.gov.br)`,
    ``,
    `Empresa: ${n.company}`,
    `Contrato: ${n.contractType}`,
    `Posição no contrato: ${n.role}`,
    n.summary ? `Resumo: ${n.summary}` : "",
    ``,
    `Pontos:`,
    n.pointsText,
    ``,
    `Pedido ao fornecedor:`,
    `- Solução objetiva e por escrito, com prazo e responsáveis;`,
    `- Se aplicável, revisão/ajuste de cláusulas/valores e envio de memória de cálculo;`,
    ``,
    `Prazo solicitado: 5 dias úteis.`,
  ].filter(Boolean).join("\n");
}

export function templateProcon(ctx: ComplaintContext) {
  const n = buildBaseNarrative(ctx);
  const anexos = [
    "Contrato/Termos assinados (PDF)",
    "Comprovantes de pagamento (se houver)",
    "Prints/e-mails/WhatsApp relevantes",
    "Propostas/orçamentos/anúncios (se houver)",
    "Documentos pessoais (conforme orientação do Procon)",
  ];
  return [
    `RECLAMAÇÃO (PROCON)`,
    ``,
    `Eu, ${clean(ctx.consumerName) || "[SEU NOME]"}, apresento reclamação em face de ${n.company}, referente a contrato de ${n.contractType}.`,
    `Minha posição no contrato: ${n.role}.`,
    n.summary ? `Resumo: ${n.summary}` : "",
    ``,
    `FATOS E PONTOS PRINCIPAIS:`,
    n.pointsText,
    ``,
    `PEDIDOS:`,
    `- Solução/regularização do problema descrito;`,
    `- Esclarecimentos formais e, se houver cobranças, detalhamento de cálculo e base contratual;`,
    `- Definição de prazos e confirmação por escrito.`,
    ``,
    `ANEXOS SUGERIDOS:`,
    anexos.map((a) => `- ${a}`).join("\n"),
    ``,
    `Nestes termos,`,
    `Pede deferimento.`,
  ].filter(Boolean).join("\n");
}
