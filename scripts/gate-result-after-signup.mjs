import fs from "node:fs";

const file = "app/enviar/page.tsx";
if (!fs.existsSync(file)) { console.error("Não achei", file); process.exit(1); }

let src = fs.readFileSync(file, "utf8");
const bak = file + ".beforeGateResult.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

// 1) garantir use client
const t = src.trimStart();
if (!(t.startsWith('"use client";') || t.startsWith("'use client';"))) {
  src = '"use client";\\n\\n' + src;
}

// 2) inserir showResults state (uma vez) dentro do componente
if (!src.includes("const [showResults, setShowResults]")) {
  const fn = src.match(/export\\s+default\\s+function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*/m);
  if (fn) {
    const idx = fn.index + fn[0].length;
    src = src.slice(0, idx) + "\\n  const [showResults, setShowResults] = useState(false);\\n" + src.slice(idx);
  }
}

// 3) quando salvar cadastro: setShowResults(true)
if (!src.includes("setShowResults(true)")) {
  // async function submitLeadAndUnlock() { ... }
  src = src.replace(
    /(async\\s+function\\s+submitLeadAndUnlock\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*\\n)/m,
    (all, body, end) => body.includes("setShowResults(true)") ? all : body + "\\n    setShowResults(true);\\n" + end
  );
  // const submitLeadAndUnlock = async () => { ... }
  src = src.replace(
    /(const\\s+submitLeadAndUnlock\\s*=\\s*async\\s*\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*;?\\s*\\n)/m,
    (all, body, end) => body.includes("setShowResults(true)") ? all : body + "\\n    setShowResults(true);\\n" + end
  );
}

// 4) quando resultado ficar pronto: setShowResults(false)
// insere antes do primeiro setResumo/setPontos/setAnalysisResult/setResult/setData
if (!src.includes("setShowResults(false)")) {
  const markers = ["setResumo(", "setPontos(", "setAnalysisResult(", "setResult(", "setData("];
  for (const mk of markers) {
    const idx = src.indexOf(mk);
    if (idx !== -1) {
      const lineStart = src.lastIndexOf("\\n", idx) + 1;
      src = src.slice(0, lineStart) + "    setShowResults(false);\\n" + src.slice(lineStart);
      break;
    }
  }
}

// 5) esconder o RESULTADO (Resumo + Pontos) até showResults === true
// tenta envolver a primeira ocorrência do título "Resumo"
const key = ">Resumo<";
let pos = src.indexOf(key);
if (pos === -1) pos = src.indexOf("Resumo");

if (pos !== -1 && !src.includes("{showResults && (")) {
  // envolve o container do resultado: procura o início do bloco de Resumo pelo primeiro "<section" antes do "Resumo"
  const before = src.lastIndexOf("<section", pos);
  if (before !== -1) {
    // insere "{showResults && (" antes do section
    src = src.slice(0, before) + "{showResults && (\\n" + src.slice(before);

    // fecha depois do fim desse section: pega o próximo "</section>" após pos
    const after = src.indexOf("</section>", pos);
    if (after !== -1) {
      const closePos = after + "</section>".length;
      src = src.slice(0, closePos) + "\\n)}\\n" + src.slice(closePos);
    }
  }
}

fs.writeFileSync(file, src, "utf8");
console.log("✅ Gate aplicado. Backup em:", bak);
