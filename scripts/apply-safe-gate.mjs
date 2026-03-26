import fs from "node:fs";

const pages = ["app/enviar/page.tsx", "app/analisar/page.tsx"];

function ensureUseClient(src) {
  const t = src.trimStart();
  if (t.startsWith('"use client";') || t.startsWith("'use client';")) return src;
  return '"use client";\\n\\n' + src;
}

function ensureReactHooksImport(src) {
  // se já tem import de react com chaves, adiciona useState/useEffect
  const re = /import\\s*\\{([^}]+)\\}\\s*from\\s*["']react["'];/m;
  const m = src.match(re);
  if (!m) return src; // não mexe se não tiver
  const inside = m[1].split(",").map(s => s.trim()).filter(Boolean);
  const set = new Set(inside);
  set.add("useState");
  set.add("useEffect");
  const repl = import {  } from "react";;
  return src.replace(re, repl);
}

function pickReadyExpr(src) {
  const candidates = ["result","analysisResult","analysis","finalResult","data","resultado","resumo"];
  for (const c of candidates) {
    const re = new RegExp(\\\\bconst\\\\s*\\\\[\\\\s*\\\\s*,, "m");
    if (re.test(src)) return !!;
  }
  for (const c of candidates) {
    const re = new RegExp(\\\\b\\\\b, "m");
    if (re.test(src)) return !!;
  }
  return "false";
}

function ensureImportGate(src) {
  if (src.includes("PreResultGateBlock")) return src;
  const lines = src.split("\\n");
  let lastImport = -1;
  for (let i=0;i<lines.length;i++) if (/^\\s*import\\s+/.test(lines[i])) lastImport = i;
  const imp = import PreResultGateBlock from "../../components/PreResultGateBlock";;
  if (lastImport >= 0) lines.splice(lastImport+1, 0, imp);
  else lines.unshift(imp);
  return lines.join("\\n");
}

function injectSafeGate(src) {
  if (src.includes("const [__registered")) return src; // já tem
  const readyExpr = pickReadyExpr(src);

  const gateBlock = 
  const __resultReady = false;
  const [__registered, __setRegistered] = useState(false);
  const [__checked, __setChecked] = useState(false);

  useEffect(() => {
    try {
      const ok = !!(
        localStorage.getItem("clara_token") ||
        localStorage.getItem("clara_user") ||
        localStorage.getItem("token") ||
        localStorage.getItem("leadEmail")
      );
      __setRegistered(ok);
    } catch (e) {
      __setRegistered(false);
    } finally {
      __setChecked(true);
    }
  }, []);

  if (__resultReady && __checked && !__registered) {
    return <PreResultGateBlock />;
  }
;

  const fnMatch = src.match(/export\\s+default\\s+function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*/m);
  if (fnMatch) {
    const idx = fnMatch.index + fnMatch[0].length;
    return src.slice(0, idx) + gateBlock + src.slice(idx);
  }
  // fallback
  return src.replace(/return\\s*\\(/m, gateBlock + "\\n  return (");
}

for (const file of pages) {
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  const bak = file + ".safeGate.bak";
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

  src = ensureUseClient(src);
  src = ensureReactHooksImport(src);
  src = ensureImportGate(src);
  src = injectSafeGate(src);

  fs.writeFileSync(file, src, "utf8");
  console.log("✅ gate seguro aplicado em:", file);
}

console.log("✅ concluído.");
