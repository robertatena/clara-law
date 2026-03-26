import fs from "node:fs";

const f = "app/enviar/page.tsx";
if (!fs.existsSync(f)) { console.error("Não achei", f); process.exit(1); }

let s = fs.readFileSync(f, "utf8");
const bak = f + ".gate_robusto.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, s, "utf8");

// 1) garantir gateOn (após leadEmail state, ou após showLead se preferir)
if (!s.includes("const gateOn")) {
  // tenta depois do leadEmail
  const re1 = /(const\s+\[leadEmail,\s*setLeadEmail\]\s*=\s*useState[\s\S]*?\);\s*)/;
  if (re1.test(s)) {
    s = s.replace(re1, (m) => m + `\n  const gateOn = showLead && !(leadEmail || "").trim();\n`);
  } else {
    // fallback: depois do showLead
    const re2 = /(const\s+\[showLead,\s*setShowLead\]\s*=\s*useState[\s\S]*?\);\s*)/;
    if (re2.test(s)) {
      s = s.replace(re2, (m) => m + `\n  const gateOn = showLead && !(leadEmail || "").trim();\n`);
    } else {
      console.error("Não achei estados showLead/leadEmail pra inserir gateOn.");
      process.exit(1);
    }
  }
}

// util: encontra início do card (último <div style={{ border: "1px solid #E6E8EC"... antes do marker)
function findCardStart(idx) {
  const needle = '<div style={{ border: "1px solid #E6E8EC"';
  return s.lastIndexOf(needle, idx);
}

// util: fecha o card contando divs
function findCardEnd(startIdx) {
  let i = startIdx;
  let depth = 0;
  while (i < s.length) {
    const nextOpen = s.indexOf("<div", i);
    const nextClose = s.indexOf("</div>", i);
    if (nextClose === -1) return -1;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 4;
    } else {
      depth--;
      i = nextClose + 6;
      if (depth <= 0) return i; // posição depois do </div>
    }
  }
  return -1;
}

function wrapTitle(title) {
  // procura o <h3 ...>Title</h3> independente de espaços
  const re = new RegExp(`<h3[^>]*>\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*<\\/h3>`, "m");
  const m = re.exec(s);
  if (!m) return { ok:false, msg:`Não achei h3 do título: ${title}` };

  const idx = m.index;
  const start = findCardStart(idx);
  if (start === -1) return { ok:false, msg:`Não achei início do card para: ${title}` };

  // já está wrapado?
  if (s.slice(Math.max(0, start-200), start).includes("!gateOn")) return { ok:true, msg:`${title}: já estava wrapado` };

  const end = findCardEnd(start);
  if (end === -1) return { ok:false, msg:`Não achei fim do card para: ${title}` };

  const before = s.slice(0, start);
  const mid = s.slice(start, end);
  const after = s.slice(end);

  s = `${before}            {!gateOn && (\n${mid}\n            )}\n${after}`;
  return { ok:true, msg:`${title}: wrap ok` };
}

const r1 = wrapTitle("Resumo");
const r2 = wrapTitle("Pontos de atenção");
const r3 = wrapTitle("E-mail pronto");

console.log(r1.msg);
console.log(r2.msg);
console.log(r3.msg);

fs.writeFileSync(f, s, "utf8");
console.log("✅ Gate robusto aplicado em", f);
console.log("Backup:", bak);
