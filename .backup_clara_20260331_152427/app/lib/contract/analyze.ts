import { analyzeRental } from "./rules/rental";
import { analyzeStableUnion } from "./rules/stable_union";
import { classifyContract } from "./classify";
import { AnalysisResult, Finding } from "./types";

function sortFindings(findings: Finding[]): Finding[] {
  const weight = (s: Finding["severity"]) => (s === "high" ? 3 : s === "attention" ? 2 : 1);
  return [...findings].sort((a, b) => weight(b.severity) - weight(a.severity) || b.points - a.points);
}

export function analyzeBySector(text: string): AnalysisResult {
  const classification = classifyContract(text);

  let findings: Finding[] = [];
  switch (classification.type) {
    case "rental":
      findings = analyzeRental(text);
      break;
    case "stable_union":
      findings = analyzeStableUnion(text);
      break;
    default:
      findings = [{
        title: "Tipo de contrato ainda não identificado com segurança",
        severity: "attention",
        points: 5,
        whyItMatters: "Regras e riscos mudam muito conforme o tipo. A análise fica melhor quando o setor está claro.",
        whatToDo: "Confirme se é aluguel, união estável, empréstimo, prestação de serviço etc. Se puder, envie o contrato completo e legível.",
      }];
  }

  const ordered = sortFindings(findings);

  const summary =
    classification.type === "unknown"
      ? "Ainda não consegui classificar o contrato com segurança."
      : `Contrato classificado como "${classification.type}" (confiança ${(classification.confidence * 100).toFixed(0)}%).`;

  const nextQuestions =
    classification.type === "rental"
      ? [
          "Qual é o valor do aluguel, índice de reajuste e periodicidade?",
          "Existe garantia (fiador/caução/seguro-fiança)?",
          "Quem paga IPTU e condomínio? Há taxa extraordinária?",
        ]
      : classification.type === "stable_union"
      ? [
          "Qual regime de bens vocês querem adotar?",
          "Há bens prévios que devem ser listados em anexo?",
          "Como serão tratadas dívidas individuais vs. do casal?",
        ]
      : ["Que tipo de contrato é este (aluguel, união estável, empréstimo, serviço etc.)?"];

  return { classification, findings: ordered, summary, nextQuestions };
}