export type Role = "Contratante" | "Contratado" | "Consumidor (PF)";
export type Severity = "ALTO" | "MÉDIO" | "BAIXO";
export type Finding = {
  key: string;
  title: string;
  severity: Severity;
  explanationEasy: string;
  whyItMatters: string;
  legalBasis?: string[];
  confirmQuestions?: string[];
  suggestedRewrite?: string;
  evidenceSnippets?: string[];
};
const CDC = {
  art6: "CDC, art. 6º — direito à informação adequada e clara; proteção contra práticas abusivas.",
  art46: "CDC, art. 46 — cláusulas só obrigam se houver chance real de conhecimento prévio.",
  art47: "CDC, art. 47 — interpretação mais favorável ao consumidor em contratos de adesão.",
  art51: "CDC, art. 51 — cláusulas abusivas podem ser nulas (ex.: desvantagem exagerada).",
  art54: "CDC, art. 54 — contrato de adesão exige clareza e destaque para cláusulas limitativas.",
};
function normalize(text: string) {
  return (text || "").replace(/\u00A0/g, " ").trim();
}
function splitSentences(text: string): string[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const out: string[] = [];
  for (const line of lines) {
    const parts = line.split(/(?<=[.!?;])\s+/g);
    for (const p of parts) {
      const s = p.trim();
      if (s) out.push(s);
    }
  }
  return out;
}
function findEvidence(text: string, patterns: RegExp[], maxHits = 6): string[] {
  const sentences = splitSentences(text);
  const hits: string[] = [];
  for (const s of sentences) {
    for (const pat of patterns) {
      if (pat.test(s)) { hits.push(s); break; }
    }
    if (hits.length >= maxHits) break;
  }
  return hits;
}
function isConsumer(role: Role) {
  return role === "Consumidor (PF)";
}
export function analyzeContract(input: { text: string; role: Role }): {
  findings: Finding[];
  score: number;
  level: "BAIXO" | "MÉDIO" | "ALTO";
  summary: string;
} {
  const text = normalize(input.text);
  const role = input.role;
  const findings: Finding[] = [];
  if (!text) return { findings, score: 0, level: "BAIXO", summary: "Nenhum texto recebido." };
  // 1) Multa elevada / assimetria
  {
    const patterns = [
      /\bmulta\b/i,
      /\b100%\b/i,
      /saldo\s+restante/i,
      /rescis[aã]o/i,
      /(apenas|somente)\s+o\s+(contratante|contratado)/i,
      /irrevog[aá]vel|irretrat[aá]vel/i,
    ];
    const evidence = findEvidence(text, patterns, 6);
    const strong = evidence.some(s => /\b100%\b/i.test(s) || /saldo\s+restante/i.test(s));
    if (evidence.length && strong) {
      findings.push({
        key: "multa_assimetria",
        title: "Multa elevada / assimetria na rescisão",
        severity: "ALTO",
        explanationEasy: "Há indícios de multa muito alta (ex.: 100% do saldo restante) e/ou rescisão desequilibrada entre as partes.",
        whyItMatters:
          role === "Contratante"
            ? "Pode travar sua saída do contrato e gerar custo elevado mesmo sem entrega proporcional do serviço."
            : role === "Contratado"
              ? "Se a multa só pesa para um lado, isso pode criar desequilíbrio e risco de disputa."
              : "Em relações de consumo/adesão, multa desproporcional pode caracterizar desvantagem exagerada e precisa estar clara e justificada.",
        legalBasis: isConsumer(role) ? [CDC.art6, CDC.art51, CDC.art54] : undefined,
        confirmQuestions: [
          "A multa é proporcional ao serviço já prestado ou ao prejuízo comprovado?",
          "Existe simetria (multa equivalente quando o outro lado rescinde sem justificativa)?",
          "Há rescisão por justa causa sem multa (ex.: descumprimento, falha grave)?",
        ],
        suggestedRewrite:
          "Texto-base sugerido: Em caso de rescisão imotivada, a multa será proporcional ao período remanescente e limitada ao prejuízo efetivamente comprovado, assegurada simetria entre as partes. Não haverá multa em caso de rescisão por justa causa.",
        evidenceSnippets: evidence,
      });
    }
  }
  // 2) Reajuste unilateral / retroativo
  {
    const patterns = [
      /reajustad[oa]s?\s+unilateralmente/i,
      /cobrad[oa]s?\s+retroativamente/i,
      /poder[aá]\s+alterar\s+os\s+valores/i,
      /a\s+qualquer\s+tempo/i,
      /tabela\s+vigente\s+no\s+momento/i,
    ];
    const evidence = findEvidence(text, patterns, 6);
    if (evidence.length) {
      findings.push({
        key: "reajuste_unilateral",
        title: "Reajuste unilateral / cobrança retroativa",
        severity: "ALTO",
        explanationEasy: "O texto sugere alteração de valores por um lado só e/ou cobrança retroativa.",
        whyItMatters: "Isso reduz previsibilidade e pode gerar cobranças inesperadas. O ideal é ter índice, periodicidade e aviso prévio.",
        legalBasis: isConsumer(role) ? [CDC.art6, CDC.art51, CDC.art54] : undefined,
        confirmQuestions: [
          "Há índice definido (ex.: IPCA) e periodicidade (ex.: anual)?",
          "Existe aviso prévio e opção de rescisão sem multa se você não aceitar?",
        ],
        suggestedRewrite:
          "Texto-base sugerido: Os valores poderão ser reajustados uma vez ao ano pelo IPCA, mediante aviso prévio mínimo de 30 dias. Caso o contratante não concorde, poderá rescindir sem multa.",
        evidenceSnippets: evidence,
      });
    }
  }
  // 3) Isenção ampla de responsabilidade
  {
    const patterns = [
      /n[aã]o\s+se\s+responsabiliza/i,
      /sem\s+responsabilidade/i,
      /por\s+quaisquer\s+danos|por\s+danos\s+de\s+qualquer\s+natureza/i,
      /perdas\s+ou\s+danos/i,
      /lucros\s+cessantes/i,
    ];
    const evidence = findEvidence(text, patterns, 6);
    if (evidence.length) {
      findings.push({
        key: "isencao_total",
        title: "Isenção ampla de responsabilidade",
        severity: "ALTO",
        explanationEasy: "Há indícios de exclusão ampla (ou total) de responsabilidade por falhas, perdas ou danos.",
        whyItMatters: "Limites podem existir, mas 'zero responsabilidade' pode te deixar sem solução quando houver falha do serviço/produto.",
        legalBasis: isConsumer(role) ? [CDC.art6, CDC.art51] : undefined,
        confirmQuestions: [
          "A isenção vale mesmo quando há culpa/erro do prestador/fornecedor?",
          "Existe SLA/garantia, correção de falhas, reexecução ou reembolso?",
        ],
        suggestedRewrite:
          "Texto-base sugerido: A responsabilidade não será excluída em caso de dolo ou culpa, e haverá obrigação de correção/reexecução do serviço em prazo razoável, com abatimento proporcional quando aplicável.",
        evidenceSnippets: evidence,
      });
    }
  }
  // score simples
  const weight: Record<string, number> = { "ALTO": 35, "MÉDIO": 20, "BAIXO": 10 };
  const score = Math.min(100, findings.reduce((acc, f) => acc + (weight[f.severity] ?? 10), 0));
  const level = score >= 70 ? "ALTO" : score >= 40 ? "MÉDIO" : "BAIXO";
  const summary = findings.length
    ? `Encontrei ${findings.length} ponto(s) que merecem atenção.`
    : "Não encontrei gatilhos claros nas regras atuais (cole cláusulas de rescisão, pagamento, reajuste e responsabilidade).";
  return { findings, score, level, summary };
}
