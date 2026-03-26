�import { NextResponse } from "next/server";
type RiskLevel = "baixo" | "medio" | "alto";
type Hit = {
  id: string;
  title: string;
  level: RiskLevel;
  weight: number;
  rationale: string;
  clause_excerpt?: string;
};
function normalize(s: string) {
  return (s || "")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "\n");
}
function pickExcerpt(text: string, idx: number, len = 260) {
  const start = Math.max(0, idx - Math.floor(len / 3));
  const end = Math.min(text.length, start + len);
  return normalize(text.slice(start, end)).trim();
}
function scoreToRisk(score: number): RiskLevel {
  if (score >= 70) return "alto";
  if (score >= 35) return "medio";
  return "baixo";
}
function safeJson(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse em ESM pode vir como { default: fn } ou direto fn
  const mod = (await import("pdf-parse")) as any;
  const pdfParse = mod?.default ?? mod;
  if (typeof pdfParse !== "function") return "";
  try {
    const out = await pdfParse(buffer);
    return normalize(out?.text || "");
  } catch {
    return "";
  }
}
async function extractDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = (await import("mammoth")) as any;
    const out = await mammoth.extractRawText({ buffer });
    return normalize(out?.value || "");
  } catch {
    return "";
  }
}
function extractTxt(buffer: Buffer): string {
  try {
    return normalize(buffer.toString("utf8"));
  } catch {
    return "";
  }
}
function runRules(text: string): { hits: Hit[]; score: number; overall_risk: RiskLevel; resumo: string; proximos_passos: string[] } {
  const t = text.toLowerCase();
  const rules: Hit[] = [
    {
      id: "multa-rescisao",
      title: "Multa elevada / assimetria na rescisão",
      level: "alto",
      weight: 22,
      rationale: "Multas altas ou só uma parte podendo rescindir aumenta risco financeiro e de travamento do contrato.",
    },
    {
      id: "renovacao-automatica",
      title: "Renovação automática sem aviso claro",
      level: "medio",
      weight: 14,
      rationale: "Renovação automática sem janela de cancelamento clara pode gerar cobrança inesperada.",
    },
    {
      id: "foro",
      title: "Foro distante do seu domicílio",
      level: "medio",
      weight: 12,
      rationale: "Foro distante encarece defesa e aumenta fricção em disputa.",
    },
    {
      id: "reajuste-vago",
      title: "Reajuste/preço com critério vago",
      level: "medio",
      weight: 12,
      rationale: "Reajuste sem índice ou regra objetiva cria risco de aumento imprevisível.",
    },
    {
      id: "limitacao-responsabilidade",
      title: "Limitação forte de responsabilidade do fornecedor",
      level: "medio",
      weight: 12,
      rationale: "Limitar demais a responsabilidade pode deixar você sem reparação em falhas.",
    },
    {
      id: "cessao-dados",
      title: "Uso/cessão ampla de dados",
      level: "medio",
      weight: 10,
      rationale: "Cláusulas amplas sobre dados exigem atenção (LGPD, finalidade, compartilhamento).",
    },
    {
      id: "confidencialidade-assimetrica",
      title: "Confidencialidade assimétrica",
      level: "baixo",
      weight: 8,
      rationale: "Se só você tem deveres, pode haver desequilíbrio de risco.",
    },
  ];
  const patterns: Array<{ id: string; regs: RegExp[] }> = [
    { id: "multa-rescisao", regs: [/multa/i, /penalidade/i, /rescis[aã]o/i, /cl[aá]usula penal/i] },
    { id: "renovacao-automatica", regs: [/renova[cç][aã]o autom[aá]tica/i, /prorroga[cç][aã]o autom[aá]tica/i] },
    { id: "foro", regs: [/foro/i, /comarca/i] },
    { id: "reajuste-vago", regs: [/reajuste/i, /atualiza[cç][aã]o/i, /a crit[eé]rio/i] },
    { id: "limitacao-responsabilidade", regs: [/limita[cç][aã]o de responsabilidade/i, /n[aã]o se responsabiliza/i, /isenta/i] },
    { id: "cessao-dados", regs: [/dados pessoais/i, /compartilhamento/i, /terceiros/i, /lgpd/i] },
    { id: "confidencialidade-assimetrica", regs: [/confidencial/i, /sigilo/i] },
  ];
  const hits: Hit[] = [];
  let score = 0;
  for (const r of rules) {
    const p = patterns.find(x => x.id === r.id);
    if (!p) continue;
    let foundAt = -1;
    for (const re of p.regs) {
      const m = re.exec(text);
      if (m && typeof m.index === "number") { foundAt = m.index; break; }
      const m2 = re.exec(t);
      if (m2 && typeof m2.index === "number") { foundAt = m2.index; break; }
    }
    if (foundAt >= 0) {
      const excerpt = pickExcerpt(text, foundAt);
      hits.push({ ...r, clause_excerpt: excerpt });
      score += r.weight;
    }
  }
  // Normaliza score pra 0..100 (cap)
  score = Math.min(100, score);
  const overall_risk = scoreToRisk(score);
  const resumo =
    text.trim().length === 0
      ? "Não consegui extrair texto do arquivo. Se for PDF escaneado (imagem), envie uma versão pesquisável (com OCR) ou cole o texto."
      : `Extraí texto e encontrei ${hits.length} ponto(s) que merecem atenção.`;
  const proximos_passos: string[] = [
    "Confirme prazo, renovação e condições de rescisão (multa, aviso prévio e janela de cancelamento).",
    "Revise preço, reajuste (índice + periodicidade) e eventuais custos adicionais.",
    "Cheque foro, responsabilidades, garantias e obrigações pós-cancelamento.",
    "Se houver dados pessoais: valide finalidade, base legal, retenção e compartilhamento (LGPD).",
  ];
  return { hits, score, overall_risk, resumo, proximos_passos };
}
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    // Aceita: files[] (múltiplos) ou file (único) + text (opcional)
    const incomingFiles: File[] = [];
    const filesA = form.getAll("files") as File[];
    const file1 = form.get("file") as File | null;
    if (filesA && filesA.length) incomingFiles.push(...filesA.filter(Boolean));
    if (file1) incomingFiles.push(file1);
    const pastedText = (form.get("text") as string | null) ?? "";
    const received_files = incomingFiles.map(f => ({
      name: f.name || "arquivo",
      size: f.size || 0,
      type: f.type || "application/octet-stream",
    }));
    let extractedText = normalize(pastedText);
    // Extrai texto de cada arquivo e concatena
    for (const f of incomingFiles) {
      const ab = await f.arrayBuffer();
      const buffer = Buffer.from(ab);
      const name = (f.name || "").toLowerCase();
      const type = (f.type || "").toLowerCase();
      let part = "";
      const isPdf = type.includes("pdf") || name.endsWith(".pdf");
      const isDocx = type.includes("word") || name.endsWith(".docx");
      const isTxt = type.includes("text") || name.endsWith(".txt");
      if (isPdf) part = await extractPdf(buffer);
      else if (isDocx) part = await extractDocx(buffer);
      else if (isTxt) part = extractTxt(buffer);
      else {
        // fallback por extensão �S.doc⬝ / �S.rtf⬝ etc � por enquanto não suporta
        part = "";
      }
      if (part.trim()) extractedText += (extractedText ? "\n\n" : "") + part;
    }
    const extracted_chars = extractedText.length;
    const analysis = runRules(extractedText);
    return safeJson({
      ok: true,
      extracted_chars,
      received_files,
      overall_risk: analysis.overall_risk,
      score: analysis.score,
      resumo: analysis.resumo,
      hits: analysis.hits,
      proximos_passos: analysis.proximos_passos,
    });
  } catch (err: unknown) {
    return safeJson(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Erro inesperado na API.",
      },
      500
    );
  }
}


