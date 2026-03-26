import fs from "node:fs";
import path from "node:path";

const file = "app/enviar/page.tsx";
const dir = path.dirname(file);

function pickBackup() {
  const preferred = file + ".bak";
  if (fs.existsSync(preferred)) return preferred;

  // tenta pegar o .bak* mais recente
  const files = fs.readdirSync(dir)
    .filter(n => n.startsWith("page.tsx.bak"))
    .map(n => ({ n, t: fs.statSync(path.join(dir, n)).mtimeMs }))
    .sort((a,b) => b.t - a.t);

  if (files.length) return path.join(dir, files[0].n);

  return null;
}

if (!fs.existsSync(file)) {
  console.error("Não achei:", file);
  process.exit(1);
}

// 1) restaura backup seguro
const bak = pickBackup();
if (!bak) {
  console.error("Não achei backup (page.tsx.bak*). Veja na pasta app/enviar.");
  process.exit(1);
}
const bakContent = fs.readFileSync(bak, "utf8");
fs.writeFileSync(file, bakContent, "utf8");
let s = bakContent;

// 2) leadRole começa vazio
s = s.replace(
  /const\s+\[leadRole,\s*setLeadRole\]\s*=\s*useState\((["'`]).*?\1\);/g,
  `const [leadRole, setLeadRole] = useState("");`
);

// 3) gateOn exige email + posição
if (!s.includes("const gateOn =")) {
  // injeta depois do state emailDraft (se existir) ou depois do leadRole
  const m = s.match(/const\s+\[emailDraft,\s*setEmailDraft\][\s\S]*?\);\s*/);
  if (m) {
    s = s.replace(m[0], m[0] + `\n  const gateOn = showLead && (!(leadEmail || "").trim() || !(leadRole || "").trim());\n`);
  } else {
    s = s.replace(
      /const\s+\[leadRole,\s*setLeadRole\]\s*=\s*useState\(""\);\s*/,
      (x) => x + `\n  const gateOn = showLead && (!(leadEmail || "").trim() || !(leadRole || "").trim());\n`
    );
  }
} else {
  // se já existe, reforça a condição
  s = s.replace(
    /const\s+gateOn\s*=\s*showLead\s*&&\s*\(.*?\);\s*/g,
    `const gateOn = showLead && (!(leadEmail || "").trim() || !(leadRole || "").trim());\n`
  );
}

// 4) placeholder do select (INSERE APENAS dentro do bloco de opções)
s = s.replace(
  /(<select[^>]*value=\{leadRole\}[^>]*>)([\s\S]*?)(<\/select>)/,
  (all, open, inner, close) => {
    if (inner.includes('value="" disabled')) return all;
    const placeholder = `\n                      <option value="" disabled>Selecione sua posição</option>\n`;
    return open + placeholder + inner + close;
  }
);

// 5) faz o gate realmente “trancar” o resultado sem mexer em JSX gigante:
//   - Em vez de esconder cards inteiros (arriscado), a gente só bloqueia o conteúdo do Resumo.
s = s.replace(
  /\{summary\s*\|\|\s*'Envie 1 ou mais contratos e clique em SAnalisar agora⬝\.'\}/g,
  `{gateOn ? "Para ver o resultado, preencha seu e-mail e selecione sua posição no contrato." : (summary || 'Envie 1 ou mais contratos e clique em SAnalisar agora⬝.')}`
);

fs.writeFileSync(file, s, "utf8");

console.log("✅ Restaurado de:", bak);
console.log("✅ Gate ajustado: exige e-mail + posição (sem quebrar JSX).");
