export type ContractType = "emprestimo" | "aluguel" | "servico" | "generico"

export type LegalInsightContent = {
  title: string
  intro: string
  practicalView: string
  judicialPattern: string
  consolidatedUnderstanding: string
  principles: string
}

export const legalInsightsByType: Record<ContractType, LegalInsightContent> = {
  emprestimo: {
    title: "Como esse contrato de crédito é visto na prática",
    intro:
      "Em contratos de crédito, é comum que os principais pontos de atenção estejam relacionados ao custo total da operação, incluindo juros, encargos e penalidades.",
    practicalView:
      "Na prática, situações envolvendo falta de transparência, vencimento antecipado amplo ou acúmulo de encargos costumam gerar questionamentos.",
    judicialPattern:
      "Com base em decisões semelhantes, cláusulas que aumentam de forma relevante o custo final ou dificultam a compreensão da dívida merecem atenção.",
    consolidatedUnderstanding:
      "O entendimento consolidado costuma valorizar boa-fé, equilíbrio contratual e transparência na informação ao consumidor.",
    principles:
      "Em uma análise mais ampla, o foco está em evitar desvantagem excessiva e garantir previsibilidade para quem assina."
  },
  aluguel: {
    title: "Como esse contrato de locação é visto na prática",
    intro:
      "Em contratos de locação, os principais riscos costumam estar ligados a multas, reajustes, garantias e responsabilidades durante o uso do imóvel.",
    practicalView:
      "Na prática, muitos conflitos surgem na rescisão, na devolução do imóvel e na divisão de custos de manutenção.",
    judicialPattern:
      "Com base em decisões semelhantes, cláusulas desproporcionais sobre multa, depósito, vistoria ou obrigações do locatário merecem atenção.",
    consolidatedUnderstanding:
      "O entendimento consolidado costuma observar equilíbrio entre as partes e proporcionalidade nas obrigações assumidas.",
    principles:
      "Em uma análise mais ampla, transparência e previsibilidade são essenciais para reduzir conflitos futuros."
  },
  servico: {
    title: "Como esse contrato de prestação de serviço é visto na prática",
    intro:
      "Em contratos de prestação de serviço, a clareza sobre escopo, entregas, prazos, responsabilidades e cancelamento é essencial.",
    practicalView:
      "Na prática, disputas costumam aparecer quando o contrato não define bem o que será entregue, quando será entregue e quem responde por falhas.",
    judicialPattern:
      "Com base em decisões semelhantes, ausência de SLA, limitação excessiva de responsabilidade e renovação automática merecem atenção.",
    consolidatedUnderstanding:
      "O entendimento consolidado costuma valorizar equilíbrio contratual, clareza das obrigações e possibilidade real de cumprimento.",
    principles:
      "Em uma análise mais ampla, contratos mais claros tendem a proteger melhor as duas partes e reduzir ruído operacional."
  },
  generico: {
    title: "Como esse contrato é visto na prática",
    intro:
      "A Clara não analisa apenas o texto do contrato. Ela também compara o conteúdo com padrões que costumam gerar conflitos na prática jurídica.",
    practicalView:
      "Na prática, cláusulas pouco claras, penalidades desproporcionais e obrigações mal definidas merecem atenção.",
    judicialPattern:
      "Com base em decisões semelhantes, desequilíbrio entre direitos e deveres das partes é um dos principais sinais de risco.",
    consolidatedUnderstanding:
      "O entendimento consolidado costuma valorizar boa-fé, transparência e proporcionalidade.",
    principles:
      "Em uma análise mais ampla, contratos mais justos e previsíveis tendem a gerar menos disputa."
  }
}

export function normalizeContractType(input?: string | null): ContractType {
  const value = (input || "").toLowerCase().trim()

  if (
    value.includes("emprest") ||
    value.includes("crédito") ||
    value.includes("credito") ||
    value.includes("financi") ||
    value.includes("banco") ||
    value.includes("parcel")
  ) {
    return "emprestimo"
  }

  if (
    value.includes("alugu") ||
    value.includes("loca") ||
    value.includes("imóv") ||
    value.includes("imov") ||
    value.includes("locat") ||
    value.includes("locador")
  ) {
    return "aluguel"
  }

  if (
    value.includes("servi") ||
    value.includes("freela") ||
    value.includes("consult") ||
    value.includes("prestação") ||
    value.includes("prestacao") ||
    value.includes("fornecimento")
  ) {
    return "servico"
  }

  return "generico"
}
