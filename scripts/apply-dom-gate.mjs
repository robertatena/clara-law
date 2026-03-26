import fs from "node:fs";

const targets = ["app/enviar/page.tsx"]; // se quiser também no /analisar, adicione aqui

const GATE_BLOCK = 
  // --- Gate: exigir cadastro antes de mostrar resultado (DOM-safe) ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isOk = () => localStorage.getItem("clara_lead_ok") === "1";

    let tries = 0;
    const interval = setInterval(() => {
      tries++;

      if (isOk()) {
        clearInterval(interval);
        return;
      }

      const text = document.body?.innerText || "";
      const hasResult =
        text.includes("Resumo") ||
        text.includes("Pontos de atenção") ||
        text.includes("E-mail pronto") ||
        text.includes("Principais pontos");

      if (!hasResult) {
        if (tries > 30) clearInterval(interval); // ~15s
        return;
      }

      // esconder seções de resultado (procura headings e esconde o container mais próximo)
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4"));
      const hideKeys = ["Resumo", "Pontos de atenção", "E-mail pronto", "Principais pontos"];

      for (const h of headings) {
        const t = (h.textContent || "").trim();
        if (hideKeys.some(k => t.includes(k))) {
          const container = h.closest("section") || h.closest("div");
          if (container) (container).style.display = "none";
        }
      }

      // rolar para o cadastro
      const fin = headings.find(h => ((h.textContent || "").trim().includes("Para finalizar")));
      if (fin) fin.scrollIntoView({ behavior: "smooth", block: "start" });

      // depois de aplicar uma vez, para
      clearInterval(interval);
    }, 500);

    return () => clearInterval(interval);
  }, []);
  // --- fim gate ---
;

function ensureUseClient(src) {
  const t = src.trimStart();
  if (t.startsWith('"use client";') || t.startsWith("'use client';")) return src;
  return '"use client";\\n\\n' + src;
}

function ensureReactHooks(src) {
  // garante useEffect no import do react, se existir
  const re = /import\\s*\\{([^}]+)\\}\\s*from\\s*["']react["'];/m;
  const m = src.match(re);
  if (!m) return src;

  const inside = m[1].split(",").map(s => s.trim()).filter(Boolean);
  const set = new Set(inside);
  set.add("useEffect");
  const repl = import {  } from "react";;
  return src.replace(re, repl);
}

function injectGateIntoComponent(src) {
  if (src.includes("Gate: exigir cadastro antes de mostrar resultado")) return src;

  // injeta logo após a abertura do componente default function
  const fn = src.match(/export\\s+default\\s+function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*/m);
  if (fn) {
    const idx = fn.index + fn[0].length;
    return src.slice(0, idx) + GATE_BLOCK + src.slice(idx);
  }
  return src;
}

function patchSubmitLead(src) {
  // marca ok no localStorage quando cadastra (não depende de variáveis do seu form)
  if (src.includes('localStorage.setItem("clara_lead_ok"')) return src;

  // async function submitLeadAndUnlock(...) { ... }
  src = src.replace(
    /(async\\s+function\\s+submitLeadAndUnlock\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*\\n)/m,
    (all, body, end) => {
      if (body.includes('localStorage.setItem("clara_lead_ok"')) return all;
      return body + \\n    if (typeof window !== "undefined") localStorage.setItem("clara_lead_ok","1");\\n + end;
    }
  );

  // const submitLeadAndUnlock = async (...) => { ... }
  src = src.replace(
    /(const\\s+submitLeadAndUnlock\\s*=\\s*async\\s*\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*;?\\s*\\n)/m,
    (all, body, end) => {
      if (body.includes('localStorage.setItem("clara_lead_ok"')) return all;
      return body + \\n    if (typeof window !== "undefined") localStorage.setItem("clara_lead_ok","1");\\n + end;
    }
  );

  return src;
}

for (const file of targets) {
  if (!fs.existsSync(file)) {
    console.log("⚠️ não achei:", file);
    continue;
  }

  let src = fs.readFileSync(file, "utf8");

  const bak = file + ".domgate.bak";
  if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

  src = ensureUseClient(src);
  src = ensureReactHooks(src);
  src = injectGateIntoComponent(src);
  src = patchSubmitLead(src);

  fs.writeFileSync(file, src, "utf8");
  console.log("✅ gate aplicado em:", file, "| backup:", bak);
}

console.log("✅ pronto.");
