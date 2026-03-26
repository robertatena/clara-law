const fs = require("fs");

const f = "app/enviar/page.tsx";
if (!fs.existsSync(f)) {
  console.error("Não achei", f);
  process.exit(1);
}

let s = fs.readFileSync(f, "utf8");
const stamp = ".leadGateRequired.patch.bak";
const bak = f + stamp;
if (!fs.existsSync(bak)) fs.writeFileSync(bak, s, "utf8");

// 1) garantir state leadRole (se não existir)
if (!s.includes("const [leadRole, setLeadRole]")) {
  // tenta inserir perto do leadEmail/leadPhone
  const anchor = "const [leadEmail, setLeadEmail]";
  const idx = s.indexOf(anchor);
  if (idx !== -1) {
    const insertAt = s.indexOf("\n", idx);
    s =
      s.slice(0, insertAt + 1) +
      '  const [leadRole, setLeadRole] = useState("Sou a parte que vai assinar");\n' +
      s.slice(insertAt + 1);
  }
}

// 2) criar boolean leadReady + hasResult (se não existir)
if (!s.includes("const leadReady")) {
  // coloca depois do emailDraft state (ponto estável)
  s = s.replace(
    /const\s+\[emailDraft,\s*setEmailDraft\]\s*=\s*useState[\s\S]*?\);\s*/m,
    (m) =>
      m +
      "\n  const leadReady = !!(leadEmail || '').trim() && !!(leadRole || '').trim();\n" +
      "  const hasResult = !!summary || (findings && findings.length > 0) || !!emailDraft;\n"
  );
}

// 3) mostrar cadastro assim que selecionar arquivos (UX)
s = s.replace(
  /setFiles\(arr\);\s*setError\(null\);/m,
  "setFiles(arr);\n                setShowLead(true);\n                setError(null);"
);

// 4) BLOQUEAR runAnalysis se leadReady não estiver ok
//    (coloca logo no começo do runAnalysis, depois do setError(null))
s = s.replace(
  /async function runAnalysis\(\)\s*\{\s*setError\(null\);\s*/m,
  (m) =>
    m +
    "\n    // Gate: precisa cadastro mínimo antes de gerar o resultado\n" +
    "    if (!leadReady) {\n" +
    "      setShowLead(true);\n" +
    "      setError('Para receber o resultado, preencha seu e-mail e sua posição no contrato.');\n" +
    "      setTimeout(() => {\n" +
    "        const el = document.getElementById('lead-gate');\n" +
    "        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });\n" +
    "      }, 50);\n" +
    "      return;\n" +
    "    }\n"
);

// 5) RESULTADOS só aparecem quando hasResult && leadReady
//    (embrulha os 3 cards usando o título como âncora)
function wrapCard(title) {
  const marker = `>${title}</h3>`;
  const i = s.indexOf(marker);
  if (i === -1) return;

  const start = s.lastIndexOf('<div style={{ border: "1px solid #E6E8EC"', i);
  if (start === -1) return;

  // pega o final do card: fecha o primeiro </div> após o marker, e depois mais dois níveis
  // (heurística simples, mas funciona bem com seus cards)
  let pos = i;
  let closes = 0;
  while (pos < s.length) {
    const next = s.indexOf("</div>", pos);
    if (next === -1) break;
    closes++;
    pos = next + 6;
    if (closes >= 1) break;
  }
  const end = pos;
  if (end <= start) return;

  // evita duplicar
  const window = s.slice(Math.max(0, start - 120), start);
  if (window.includes("hasResult") || window.includes("leadReady")) return;

  const block = s.slice(start, end);
  s = s.slice(0, start) +
    "            {(hasResult && leadReady) && (\n" +
    block +
    "\n            )}\n" +
    s.slice(end);
}

wrapCard("Resumo");
wrapCard("Pontos de atenção");
wrapCard("E-mail pronto");

// 6) dar id no lead gate (pra scroll) se ainda não tiver
s = s.replace(
  /\{\s*showLead\s*&&\s*\(\s*\n\s*<div style=\{\{/m,
  "{showLead && (\n              <div id=\"lead-gate\" style={{"
);

// grava
fs.writeFileSync(f, s, "utf8");

console.log("✅ Patch aplicado em", f);
console.log("Backup salvo em:", bak);
