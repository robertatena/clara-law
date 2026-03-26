import fs from "node:fs";

const f = "app/enviar/page.tsx";
let s = fs.readFileSync(f, "utf8");

// ---------- (A) normaliza início do arquivo (remove lixo antes de "use client") ----------
const idxUse = s.indexOf('"use client"');
if (idxUse >= 0) {
  // pega tudo a partir da linha do use client
  const lineStart = s.lastIndexOf("\n", idxUse);
  const afterLine = s.indexOf("\n", idxUse);
  const rest = afterLine >= 0 ? s.slice(afterLine + 1) : "";
  s = `"use client";\n` + rest;
}

// ---------- (B) garante imports do React (useState/useMemo etc) ----------
if (!s.includes('from "react"')) {
  // não mexe se você já tiver import React, { ... } from "react";
} else {
  // ok
}

// ---------- (C) força leadRole começar vazio (pra obrigar escolher) ----------
s = s.replace(
  /const\s+\[leadRole,\s*setLeadRole\]\s*=\s*useState\([^\)]*\);/,
  'const [leadRole, setLeadRole] = useState("");'
);

// ---------- (D) se não existir leadEmail state, não quebra (mas normalmente existe) ----------
if (!s.match(/const\s+\[leadEmail,\s*setLeadEmail\]/)) {
  console.log("⚠️ Não encontrei state leadEmail. Patch vai só ajustar botão/JSX se possível.");
}

// ---------- (E) habilita showLead assim que selecionar arquivo ----------
s = s.replace(
  /setFiles\(arr\);\s*\n\s*setError\(null\);/g,
  `setFiles(arr);\n                setShowLead(true);\n                setError(null);`
);

// ---------- (F) exige e-mail + posição para poder analisar ----------
s = s.replace(
  /const\s+canAnalyze\s*=\s*files\.length\s*>\s*0\s*&&\s*!isAnalyzing\s*;/,
  'const canAnalyze = files.length > 0 && !isAnalyzing && !!leadEmail.trim() && !!leadRole;'
);

// ---------- (G) melhora o texto do botão quando falta lead ----------
s = s.replace(
  /\{isAnalyzing\s*\?\s*"Analisando\.\.\."\s*:\s*"Analisar agora"\s*\}/,
  '{isAnalyzing ? "Analisando..." : (!leadEmail.trim() || !leadRole ? "Preencha e-mail e sua posição" : "Analisar agora")}'
);

// ---------- (H) garante que o SELECT de posição tenha opção vazia (obrigatória) ----------
const selStart = s.indexOf("<select value={leadRole}");
if (selStart >= 0) {
  const selEnd = s.indexOf("</select>", selStart);
  if (selEnd >= 0) {
    const before = s.slice(0, selStart);
    const after = s.slice(selEnd + "</select>".length);

    const newSelect = `
                    <select value={leadRole} onChange={(e) => setLeadRole(e.target.value)} style={{ width: "100%", marginTop: 6, padding: "10px 12px", borderRadius: 12, border: "1px solid #E6E8EC" }}>
                      <option value="" disabled>Selecione sua posição</option>
                      <option value="Sou a parte que vai assinar">Sou a parte que vai assinar</option>
                      <option value="Sou a outra parte / recebi este contrato">Sou a outra parte / recebi este contrato</option>
                      <option value="Sou fiador(a) / garantidor(a)">Sou fiador(a) / garantidor(a)</option>
                      <option value="Sou representante legal">Sou representante legal</option>
                      <option value="Estou ajudando alguém a avaliar">Estou ajudando alguém a avaliar</option>
                    </select>`.trim();

    s = before + newSelect + after;
  }
}

// ---------- (I) remove caracteres invisíveis comuns que detonam parse ----------
s = s
  .replace(/\u0000/g, "")      // NULL
  .replace(/\u001A/g, "")      // SUB
  .replace(/\u001D/g, "")      // GS
  .replace(/\u001E/g, "")      // RS
  .replace(/\u001F/g, "");     // US

// ---------- (J) pdfjs: garante disableWorker e não depende de workerSrc ----------
s = s.replace(/workerSrc\s*=\s*["'][^"']+["'];?/g, ""); // tira workerSrc se tiver
s = s.replace(/getDocument\(\{\s*data:\s*ab\s*\}\)/g, 'getDocument({ data: ab, disableWorker: true })');
s = s.replace(/getDocument\(\{\s*data:\s*ab,\s*disableWorker:\s*false\s*\}\)/g, 'getDocument({ data: ab, disableWorker: true })');

// escreve de volta
fs.writeFileSync(f, s, "utf8");
console.log("✅ Patch aplicado em", f);
