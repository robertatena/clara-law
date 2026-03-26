import { Classification, ContractType } from "./types";

type Rule = {
  type: ContractType;
  weight: number;
  patterns: RegExp[];
  signals: string[];
};

const RULES: Rule[] = [
  {
    type: "stable_union",
    weight: 3,
    patterns: [
      /\buni[aã]o\s+est[aá]vel\b/i,
      /\bconviv[eê]ncia\b/i,
      /\bcompanheir[oa]\b/i,
      /\bregime\s+de\s+bens\b/i,
      /\bpacto\s+antenupcial\b/i,
      /\bdeclara(m|ç)[aã]o\s+de\s+conviv[eê]ncia\b/i,
    ],
    signals: ["união estável", "convivência", "companheiro(a)", "regime de bens"],
  },
  {
    type: "rental",
    weight: 3,
    patterns: [
      /\blocador\b/i,
      /\blocat[aá]rio\b/i,
      /\baluguel\b/i,
      /\bim[oó]vel\b/i,
      /\bfiador\b/i,
      /\bgarantia\b/i,
      /\bcau[cç][aã]o\b/i,
      /\bIPTU\b/i,
      /\bcondom[ií]nio\b/i,
      /\bvistoria\b/i,
    ],
    signals: ["locador/locatário", "aluguel", "imóvel", "garantia", "IPTU/condomínio"],
  },
  {
    type: "loan",
    weight: 2.5,
    patterns: [
      /\bempr[eé]stimo\b/i,
      /\bfinanciamento\b/i,
      /\bCET\b/i,
      /\bjuros\b/i,
      /\bmulta\b/i,
      /\binadimpl[eê]ncia\b/i,
      /\bparcel(as|amento)\b/i,
      /\btaxa\b/i,
    ],
    signals: ["empréstimo/financiamento", "CET/juros", "parcelas", "inadimplência"],
  },
  {
    type: "service",
    weight: 2,
    patterns: [
      /\bprest(aç|ac)[aã]o\s+de\s+servi[cç]os\b/i,
      /\bescopo\b/i,
      /\bentreg(a|á)veis\b/i,
      /\bSLA\b/i,
      /\bvig[eê]ncia\b/i,
      /\brescis[aã]o\b/i,
      /\bmulta\b/i,
    ],
    signals: ["prestação de serviços", "escopo/entregáveis", "SLA", "rescisão"],
  },
  {
    type: "health_plan",
    weight: 2,
    patterns: [
      /\bplano\s+de\s+sa[uú]de\b/i,
      /\bcar[eê]ncia\b/i,
      /\bANS\b/i,
      /\breajuste\b/i,
      /\bcobertura\b/i,
      /\bexclus[aã]o\b/i,
    ],
    signals: ["plano de saúde", "carência", "ANS", "reajuste/cobertura"],
  },
  {
    type: "employment",
    weight: 2,
    patterns: [
      /\bCLT\b/i,
      /\bempregador\b/i,
      /\bempregado\b/i,
      /\bjornada\b/i,
      /\bsal[aá]rio\b/i,
      /\bf[eé]rias\b/i,
    ],
    signals: ["CLT", "jornada", "salário", "férias"],
  },
  {
    type: "sale",
    weight: 2,
    patterns: [
      /\bcompra\s+e\s+venda\b/i,
      /\bcomprador\b/i,
      /\bvendedor\b/i,
      /\bpre[cç]o\b/i,
      /\bsinal\b/i,
      /\bescritura\b/i,
      /\bregistro\b/i,
    ],
    signals: ["compra e venda", "preço/sinal", "escritura/registro"],
  },
];

export function classifyContract(text: string): Classification {
  const clean = (text || "").slice(0, 150_000); // limite pra performance
  const scored = RULES.map((r) => {
    let hits = 0;
    const matchedSignals: string[] = [];
    for (const p of r.patterns) {
      if (p.test(clean)) {
        hits++;
      }
    }
    if (hits > 0) matchedSignals.push(...r.signals);
    const score = hits * r.weight;
    return { type: r.type, score, signals: Array.from(new Set(matchedSignals)) };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];

  if (!top || top.score <= 0) {
    return { type: "unknown", confidence: 0.2, signals: ["texto sem sinais claros de categoria"] };
  }

  const second = scored[1]?.score ?? 0;
  const confidence = Math.max(0.35, Math.min(0.95, top.score / (top.score + second + 2)));

  return {
    type: top.type,
    confidence,
    signals: top.signals.length ? top.signals : ["padrões gerais encontrados"],
  };
}