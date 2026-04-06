import { Finding } from "../types";

function pickEvidence(text: string, patterns: RegExp[], max = 2): string[] {
  const ev: string[] = [];
  const t = text || "";
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m.index != null) {
      const start = Math.max(0, m.index - 80);
      const end = Math.min(t.length, m.index + 180);
      ev.push(t.slice(start, end).replace(/\s+/g, " ").trim());
      if (ev.length >= max) break;
    }
  }
  return ev;
}

export function analyzeRental(text: string): Finding[] {
  const findings: Finding[] = [];

  // 1) Garantia (fiador/caução/seguro-fiança)
  const hasGuarantee = /\b(fiador|cau[cç][aã]o|seguro[-\s]?fian[cç]a)\b/i.test(text);
  if (!hasGuarantee) {
    findings.push({
      title: "Garantia locatícia não está clara",
      severity: "attention",
      points: 5,
      whyItMatters: "Sem garantia definida, aumentam disputas sobre inadimplência, devolução de valores e prazos de desocupação.",
      whatToDo: "Confirme se haverá fiador, caução ou seguro-fiança e como funciona a devolução (no caso de caução) e a cobertura (no caso de seguro).",
      legalHint: "Lei do Inquilinato (8.245/1991) trata de garantias e responsabilidades na locação.",
    });
  }

  // 2) Reajuste
  const hasIndex = /\b(IGP-?M|IPCA|INPC|reajuste)\b/i.test(text);
  if (!hasIndex) {
    findings.push({
      title: "Reajuste do aluguel não está especificado",
      severity: "attention",
      points: 5,
      whyItMatters: "Sem índice e periodicidade, o reajuste pode virar ponto de conflito e gerar aumento inesperado.",
      whatToDo: "Peça para constar índice (ex: IPCA) e periodicidade (normalmente anual), e se há limite/negociação.",
      evidence: pickEvidence(text, [/\breajuste\b/i], 1),
    });
  }

  // 3) Encargos (IPTU/condomínio)
  const hasCondo = /\bcondom[ií]nio\b/i.test(text);
  const hasIptu = /\bIPTU\b/i.test(text);
  if (!hasCondo || !hasIptu) {
    findings.push({
      title: "Encargos (condomínio/IPTU) podem não estar bem distribuídos",
      severity: "attention",
      points: 5,
      whyItMatters: "Muita gente se surpreende com custos além do aluguel. Isso pesa no orçamento e causa atrito.",
      whatToDo: "Confirme quem paga IPTU, condomínio e taxas extraordinárias e como será comprovado (boletos).",
    });
  }

  // 4) Vistoria e devolução
  const hasInspection = /\bvistoria\b/i.test(text);
  if (!hasInspection) {
    findings.push({
      title: "Sem regra clara de vistoria/devolução",
      severity: "attention",
      points: 5,
      whyItMatters: "É comum surgirem cobranças na saída por danos discutíveis.",
      whatToDo: "Exija laudo de vistoria de entrada (com fotos) e critérios objetivos para devolução do imóvel.",
    });
  }

  return findings;
}