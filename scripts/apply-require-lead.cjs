const fs = require("fs");

const f = "app/enviar/page.tsx";
let s = fs.readFileSync(f, "utf8");
const stamp = ".patch.requireLead.bak";
if (!fs.existsSync(f + stamp)) fs.writeFileSync(f + stamp, s, "utf8");

// (A) garante leadRole existir
if (!s.includes("const [leadRole, setLeadRole]")) {
  s = s.replace(
    /const\s+\[leadPhone,\s*setLeadPhone\]\s*=\s*useState[\s\S]*?\);\s*/m,
    (m) => m + '  const [leadRole, setLeadRole] = useState("");\n'
  );
} else {
  // força começar vazio pra obrigar seleção
  s = s.replace(
    /const\s+\[leadRole,\s*setLeadRole\]\s*=\s*useState\([^\)]*\);\s*/m,
    '  const [leadRole, setLeadRole] = useState("");\n'
  );
}

// (B) cria leadReady + hasResult (após emailDraft)
if (!s.includes("const leadReady")) {
  s = s.replace(
    /const\s+\[emailDraft,\s*setEmailDraft\]\s*=\s*useState[\s\S]*?\);\s*/m,
    (m) =>
      m +
      "\n  const leadReady = !!(leadEmail || '').trim() && !!(leadRole || '').trim();\n" +
      "  const hasResult = !!summary || (findings && findings.length > 0) || !!emailDraft;\n"
  );
}

// (C) ao selecionar arquivo -> abre cadastro
s = s.replace(
  /setFiles\(arr\);\s*setError\(null\);/m,
  "setFiles(arr);\n                setShowLead(true);\n                setError(null);"
);

// (D) bloqueia análise sem cadastro mínimo (logo no começo do runAnalysis)
s = s.replace(
  /async function runAnalysis\(\)\s*\{\s*setError\(null\);\s*/m,
  (m) =>
    m +
    "\n    if (!leadReady) {\n" +
    "      setShowLead(true);\n" +
    "      setError('Para receber o resultado, preencha seu e-mail e selecione sua posição no contrato.');\n" +
    "      setTimeout(() => {\n" +
    "        const el = document.getElementById('lead-gate');\n" +
    "        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });\n" +
    "      }, 50);\n" +
    "      return;\n" +
    "    }\n"
);

// (E) adiciona id no lead gate para scroll
s = s.replace(
  /\{\s*showLead\s*&&\s*\(\s*\n\s*<div style=\{\{/m,
  "{showLead && (\n              <div id=\"lead-gate\" style={{"
);

// (F) garante placeholder desabilitado no select de posição
// tenta achar o <select value={leadRole} ...> e inserir a primeira option
s = s.replace(
  /<select\s+value=\{leadRole\}([\s\S]*?)>\s*/m,
  (m) => m + "\n                      <option value=\"\" disabled>Selecione sua posição</option>\n"
);

// (G) RESULTADOS só aparecem depois de analisar + cadastro ok
function wrapCard(title) {
  const marker = `>${title}</h3>`;
  const i = s.indexOf(marker);
  if (i === -1) return;

  const start = s.lastIndexOf('<div style={{ border: "1px solid #E6E8EC"', i);
  if (start === -1) return;

  // pega o fim do card: primeiro </div> depois do marker
  const end = s.indexOf("</div>", i);
  if (end === -1) return;

  // evita duplicar
  const window = s.slice(Math.max(0, start - 140), start);
  if (window.includes("hasResult") || window.includes("leadReady")) return;

  const block = s.slice(start, end + 6);
  s = s.slice(0, start) +
    "            {(hasResult && leadReady) && (\n" +
    block +
    "\n            )}\n" +
    s.slice(end + 6);
}

wrapCard("Resumo");
wrapCard("Pontos de atenção");
wrapCard("E-mail pronto");

fs.writeFileSync(f, s, "utf8");
console.log("✅ Patch aplicado com sucesso:", f);
console.log("Backup do patch:", f + stamp);
