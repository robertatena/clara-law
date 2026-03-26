import { Finding } from "../types";

function pickEvidence(text: string, patterns: RegExp[], max = 2): string[] {
  const ev: string[] = [];
  const t = text || "";
  for (const p of patterns) {
    const m = t.match(p);
    if (m && m.index != null) {
      const start = Math.max(0, m.index - 80);
      const end = Math.min(t.length, m.index + 200);
      ev.push(t.slice(start, end).replace(/\s+/g, " ").trim());
      if (ev.length >= max) break;
    }
  }
  return ev;
}

export function analyzeStableUnion(text: string): Finding[] {
  const findings: Finding[] = [];

  // 1) Regime de bens
  const hasRegime = /\b(regime\s+de\s+bens|comunh[aã]o\s+parcial|comunh[aã]o\s+universal|separa[cç][aã]o\s+total)\b/i.test(text);
  if (!hasRegime) {
    findings.push({
      title: "Regime de bens não está claramente definido",
      severity: "high",
      points: 10,
      whyItMatters: "O regime define o que é patrimônio comum e o que fica individual — isso impacta separação, herança e dívidas.",
      whatToDo: "Defina expressamente o regime (ex: comunhão parcial) e, se houver exceções, liste bens e regras de que entram/não entram.",
      legalHint: "No Brasil, a união estável costuma seguir regras semelhantes às do casamento, e o regime influencia partilha e responsabilidades.",
    });
  }

  // 2) Data de início e intenção
  const hasStart = /\b(data\s+de\s+in[ií]cio|in[ií]cio\s+da\s+conviv[eê]ncia)\b/i.test(text);
  if (!hasStart) {
    findings.push({
      title: "Data de início da convivência não aparece",
      severity: "attention",
      points: 5,
      whyItMatters: "A data influencia o que foi adquirido durante a convivência e pode ser discutida no futuro.",
      whatToDo: "Inclua a data de início (ou período) e descreva a intenção de constituir família, se esse for o caso.",
    });
  }

  // 3) Dívidas e responsabilidades
  const hasDebts = /\b(d[ií]vidas|obriga[cç][oõ]es|responsabilidade)\b/i.test(text);
  if (!hasDebts) {
    findings.push({
      title: "Regras sobre dívidas e responsabilidades não estão claras",
      severity: "attention",
      points: 5,
      whyItMatters: "Sem regra, pode haver discussão sobre dívidas assumidas durante a convivência e obrigações de cada um.",
      whatToDo: "Estabeleça como serão tratadas dívidas pessoais vs. dívidas do casal e como será a comprovação.",
    });
  }

  // 4) Patrimônio pré-existente / bens listados
  const hasList = /\b(lista\s+de\s+bens|anexo|patrim[oô]nio\s+pr[eé]-?existente|bens\s+particulares)\b/i.test(text);
  if (!hasList) {
    findings.push({
      title: "Não há lista de bens pré-existentes (se aplicável)",
      severity: "attention",
      points: 5,
      whyItMatters: "Listar bens ajuda a evitar disputa sobre o que já era de cada um antes da convivência.",
      whatToDo: "Se fizer sentido, anexe lista de bens e contas relevantes (imóveis, veículos, investimentos) antes do início.",
      evidence: pickEvidence(text, [/\bpatrim[oô]nio\b/i, /\bbens\b/i], 1),
    });
  }

  return findings;
}