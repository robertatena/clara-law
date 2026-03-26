import fs from "node:fs";

const f = "app/enviar/page.tsx";
if (!fs.existsSync(f)) { console.error("Não achei", f); process.exit(1); }

let s = fs.readFileSync(f, "utf8");
const bak = f + ".gateLeadBeforeResult.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, s, "utf8");

// injeta gateOn após o state emailDraft
if (!s.includes("const gateOn")) {
  s = s.replace(
    /(const\s+\[emailDraft,\s*setEmailDraft\]\s*=\s*useState[\s\S]*?\);\s*)/,
    $1\n\n  const gateOn = showLead && !(leadEmail || "").trim();\n
  );
}

// embrulha os 3 cards
function wrap(title) {
  const marker = ></h3>;
  const idx = s.indexOf(marker);
  if (idx === -1) return;

  const start = s.lastIndexOf('<div style={{ border: "1px solid #E6E8EC"', idx);
  if (start === -1) return;

  // acha o fim do card (o </div> que fecha esse bloco)
  const end = s.indexOf("</div>", idx);
  if (end === -1) return;

  // evita duplicar
  if (s.slice(Math.max(0, start - 80), start).includes("!gateOn")) return;

  const before = s.slice(0, start);
  const mid = s.slice(start, end + 6);
  const after = s.slice(end + 6);

  s = ${before}            {!gateOn && (\n\n            )}\n;
}

wrap("Resumo");
wrap("Pontos de atenção");
wrap("E-mail pronto");

fs.writeFileSync(f, s, "utf8");
console.log("✅ Gate aplicado em", f);
console.log("Backup:", bak);
