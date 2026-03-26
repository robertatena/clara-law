import fs from "node:fs";

const f = "app/enviar/page.tsx";
if (!fs.existsSync(f)) throw new Error("Não achei " + f);

let s = fs.readFileSync(f, "utf8");

// backup do estado atual (antes de mexer)
const bak = f + ".preLeadGatePatch.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, s, "utf8");

// -------------------------
// A) garantir workerSrc do pdfjs
// -------------------------
// procura bloco extractPdfText e injeta workerSrc = "/pdf.worker.min.mjs"
if (s.includes("async function extractPdfText")) {
  // tenta achar onde está pdfjs.GlobalWorkerOptions
  if (!s.includes('pdfjs.GlobalWorkerOptions.workerSrc')) {
    s = s.replace(
      /if\s*\(\s*pdfjs\?\.\s*GlobalWorkerOptions\s*\)\s*\{\s*/m,
      (m) => m + '\n    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";\n'
    );
  } else {
    // força o valor correto
    s = s.replace(
      /pdfjs\.GlobalWorkerOptions\.workerSrc\s*=\s*["'`][^"'`]*["'`]\s*;/g,
      'pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";'
    );
  }

  // força disableWorker: true (se alguém removeu)
  s = s.replace(
    /pdfjs\.getDocument\(\s*\{\s*data:\s*ab\s*,\s*disableWorker:\s*false\s*\}\s*\)/g,
    "pdfjs.getDocument({ data: ab, disableWorker: true })"
  );
}

// -------------------------
// B) Lead gate antes do resultado (obrigar e-mail + posição)
// -------------------------

// 1) tornar leadRole obrigatório (começa vazio)
s = s.replace(
  /const\s+\[leadRole,\s*setLeadRole\]\s*=\s*useState\((["'`])([^"'`]*)\1\)\s*;/,
  'const [leadRole, setLeadRole] = useState("");'
);

// 2) criar gateComplete e gateOn depois dos states (se não existir)
if (!s.includes("const gateComplete")) {
  // coloca depois do state emailDraft (bem estável)
  s = s.replace(
    /(const\s+\[emailDraft,\s*setEmailDraft\][\s\S]*?\);\s*)/,
    `$1\n  const gateComplete = !!(leadEmail || "").trim() && !!(leadRole || "").trim();\n  const gateOn = showLead && !gateComplete;\n`
  );
}

// 3) quando escolher arquivo, abrir o cadastro (mostrar form antes)
s = s.replace(
  /setFiles\(arr\);\s*setError\(null\);\s*/m,
  'setFiles(arr);\n                setShowLead(true);\n                setError(null);\n'
);

// 4) no começo do runAnalysis: se não tem gateComplete, não roda e rola pro cadastro
if (s.includes("async function runAnalysis")) {
  if (!s.includes("Para ver o resultado, preencha")) {
    s = s.replace(
      /async function runAnalysis\(\)\s*\{\s*/m,
      `async function runAnalysis() {\n    setError(null);\n\n    // Lead gate: exige e-mail + posição ANTES de analisar\n    if (!((leadEmail || "").trim()) || !((leadRole || "").trim())) {\n      setShowLead(true);\n      setError("Para ver o resultado, preencha seu e-mail e sua posição no contrato.");\n      setTimeout(() => {\n        const el = document.getElementById("lead-gate");\n        el?.scrollIntoView({ behavior: "smooth", block: "start" });\n      }, 50);\n      return;\n    }\n\n`
    );
  }
}

// 5) mover o bloco LEAD GATE para antes dos cards (topo do painel direito)
//    a gente pega o bloco inteiro e reinjeta no começo do container de resultados.
const leadMarker = "/* LEAD GATE";
let leadBlock = "";
if (s.includes(leadMarker)) {
  const start = s.indexOf(leadMarker);
  // pega a partir do comentário até o fechamento do )} do showLead
  const slice = s.slice(start);
  const end = slice.indexOf(")}") + 2; // fecha o {showLead && ( ... )}
  if (end > 1) {
    leadBlock = slice.slice(0, end);
    // remove do lugar original
    s = s.slice(0, start) + s.slice(start + end);
  }
}

// injeta o lead gate logo após <div id="clara-results"...>
if (leadBlock) {
  // adiciona id no container do lead gate (pra scroll)
  leadBlock = leadBlock.replace(
    /<div style=\{\{/,
    '<div id="lead-gate" style={{'
  );

  s = s.replace(
    /(\<div id="clara-results"[\s\S]*?\>\s*)/m,
    `$1\n            ${leadBlock}\n`
  );
}

// 6) esconder os 3 cards (Resumo / Pontos / Email) quando gateOn == true
function wrapCard(title) {
  const marker = `>${title}</h3>`;
  const idx = s.indexOf(marker);
  if (idx === -1) return;

  const start = s.lastIndexOf('<div style={{ border: "1px solid #E6E8EC"', idx);
  if (start === -1) return;

  // pega o card inteiro: do start até o próximo "\n            </div>" correspondente
  // aqui é heurística, mas funciona bem no seu padrão
  const end = s.indexOf("            </div>", idx);
  if (end === -1) return;
  const end2 = s.indexOf("</div>", end) + 6;

  const block = s.slice(start, end2);
  if (block.includes("!gateOn")) return; // já embrulhado

  const wrapped =
`            {!gateOn && (
${block}
            )}`;

  s = s.slice(0, start) + wrapped + s.slice(end2);
}

wrapCard("Resumo");
wrapCard("Pontos de atenção");
wrapCard("E-mail pronto");

// 7) no select de posição, colocar placeholder disabled "Selecione..."
s = s.replace(
  /<select value=\{leadRole\}([\s\S]*?)>\s*/m,
  (m) => m.replace(">", ">\n                      <option value=\"\" disabled>Selecione sua posição</option>")
);

// 8) limpeza de caracteres invisíveis que quebram TS/JS (ex: \u001d, �)
s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ");
s = s.replace(/\uFFFD/g, ""); // remove replacement char

fs.writeFileSync(f, s, "utf8");
console.log("✅ Patch aplicado em", f);
console.log("Backup:", bak);
