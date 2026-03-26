import fs from "node:fs";

const pages = ["app/enviar/page.tsx", "app/analisar/page.tsx"];

function pickReadyExpr(src: string) {
  // tenta achar estados comuns
  const candidates = [
    "result",
    "analysisResult",
    "analysis",
    "finalResult",
    "data",
    "resultado",
    "resumo"
  ];

  // caso tenha useState declarado
  for (const c of candidates) {
    const re = new RegExp(`\\bconst\\s*\\[\\s*${c}\\s*,`, "m");
    if (re.test(src)) return `!!${c}`;
  }

  // caso use direto no JSX/condicional
  for (const c of candidates) {
    const re = new RegExp(`\\b${c}\\b`, "m");
    if (re.test(src)) return `!!${c}`;
  }

  return "false";
}

for (const file of pages) {
  if (!fs.existsSync(file)) continue;

  let src = fs.readFileSync(file, "utf8");

  // garantir use client (essas páginas mexem com upload e estado)
  if (!src.trimStart().startsWith('"use client";') && !src.trimStart().startsWith("'use client';")) {
    src = `"use client";\n\n` + src;
  }

  // import do gate (sem alias @)
  if (!src.includes("PreResultGateBlock")) {
    // inserir após o último import
    const lines = src.split("\n");
    let lastImport = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*import\s+/.test(lines[i])) lastImport = i;
    }
    const imp = `import PreResultGateBlock from "../../components/PreResultGateBlock";`;
    if (lastImport >= 0) lines.splice(lastImport + 1, 0, imp);
    else lines.unshift(imp);
    src = lines.join("\n");
  }

  // evita duplicar o bloco
  if (!src.includes("const __registered")) {
    const readyExpr = pickReadyExpr(src);

    const gateBlock = `
  const __resultReady = ${readyExpr};
  const __registered =
    typeof window !== "undefined" &&
    !!(
      localStorage.getItem("clara_token") ||
      localStorage.getItem("clara_user") ||
      localStorage.getItem("token") ||
      localStorage.getItem("leadEmail")
    );

  if (__resultReady && !__registered) {
    return <PreResultGateBlock />;
  }
`;

    // inserir dentro do componente: logo após a primeira linha "export default function ..."
    // (ou "function ..." caso seja diferente)
    const fnMatch = src.match(/export\s+default\s+function\s+\w+\s*\([^)]*\)\s*\{\s*/m);
    if (fnMatch) {
      const idx = fnMatch.index! + fnMatch[0].length;
      src = src.slice(0, idx) + gateBlock + src.slice(idx);
    } else {
      // fallback: inserir antes do primeiro "return ("
      src = src.replace(/return\s*\(/m, gateBlock + "\n  return (");
    }

    console.log(`✅ Gate early-return inserido em ${file} (resultReady=${readyExpr})`);
  } else {
    console.log(`ℹ️ Gate já existe em ${file}, pulando...`);
  }

  fs.writeFileSync(file, src, "utf8");
}

console.log("✅ Patch concluído.");
