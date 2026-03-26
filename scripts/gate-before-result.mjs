import fs from "node:fs";

const file = "app/enviar/page.tsx";
if (!fs.existsSync(file)) {
  console.error("Não achei", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");
const bak = file + ".gate_before_result.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

// 1) garantir "use client"
const trimmed = src.trimStart();
if (!(trimmed.startsWith('"use client";') || trimmed.startsWith("'use client';"))) {
  src = '"use client";\\n\\n' + src;
}

// 2) adicionar state showResults (uma vez) dentro do componente
if (!src.includes("const [showResults, setShowResults]")) {
  // coloca logo depois do primeiro useState( que existir
  const m = src.match(/\\buseState\\s*\\(/);
  if (m) {
    const idx = m.index;
    // sobe até o começo da linha para inserir acima do primeiro useState
    const lineStart = src.lastIndexOf("\\n", idx) + 1;
    src =
      src.slice(0, lineStart) +
      "  const [showResults, setShowResults] = useState(false);\\n" +
      src.slice(lineStart);
  } else {
    // fallback: dentro do function { ... } no começo
    src = src.replace(
      /(export\\s+default\\s+function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*)/m,
      "\\n  const [showResults, setShowResults] = useState(false);\\n"
    );
  }
}

// 3) quando SALVAR cadastro: setShowResults(true)
// tenta achar a função submitLeadAndUnlock e inserir antes do final dela (uma vez)
if (!src.includes("setShowResults(true)")) {
  src = src.replace(
    /(async\\s+function\\s+submitLeadAndUnlock\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*\\n)/m,
    (all, body, end) => {
      // evita duplicar
      if (body.includes("setShowResults(true)")) return all;
      return body + "\\n    setShowResults(true);\\n" + end;
    }
  );

  // fallback: se submitLeadAndUnlock for const fn = async () => { ... }
  src = src.replace(
    /(const\\s+submitLeadAndUnlock\\s*=\\s*async\\s*\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*;?\\s*\\n)/m,
    (all, body, end) => {
      if (body.includes("setShowResults(true)")) return all;
      return body + "\\n    setShowResults(true);\\n" + end;
    }
  );
}

// 4) quando GERAR resultado (análise pronta): setShowResults(false)
// (insere perto do primeiro setResumo/setPontos/setAnalysisResult que aparecer)
if (!src.includes("setShowResults(false)")) {
  const markers = ["setResumo(", "setPontos(", "setAnalysisResult(", "setResult(", "setData("];
  let inserted = false;

  for (const mk of markers) {
    const idx = src.indexOf(mk);
    if (idx !== -1) {
      // insere uma linha ANTES desse set* (no começo da linha)
      const lineStart = src.lastIndexOf("\\n", idx) + 1;
      src =
        src.slice(0, lineStart) +
        "    setShowResults(false);\\n" +
        src.slice(lineStart);
      inserted = true;
      break;
    }
  }

  // se não achou, não insere (não quebra nada)
}

// 5) esconder bloco de resultado: tudo entre "Resumo" e "Para finalizar"
const iResumo = src.indexOf("Resumo");
const iFinalizar = src.indexOf("Para finalizar");

if (iResumo !== -1 && iFinalizar !== -1 && iResumo < iFinalizar) {
  // evita duplicar wrapper
  if (!src.includes("{showResults && (")) {
    const startLine = src.lastIndexOf("\\n", iResumo) + 1;
    const endLine = src.lastIndexOf("\\n", iFinalizar) + 1;

    src =
      src.slice(0, startLine) +
      "  {showResults && (\\n" +
      src.slice(startLine, endLine) +
      "  )}\\n" +
      src.slice(endLine);
  }
} else {
  console.warn("⚠️ Não consegui achar a faixa entre 'Resumo' e 'Para finalizar' para aplicar o gate automaticamente.");
}

fs.writeFileSync(file, src, "utf8");
console.log("✅ Gate aplicado com sucesso em", file);
console.log("Backup salvo em", bak);
