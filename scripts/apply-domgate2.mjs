import fs from "node:fs";

const file = "app/enviar/page.tsx";
if (!fs.existsSync(file)) { console.error("Não achei", file); process.exit(1); }

let src = fs.readFileSync(file, "utf8");
const bak = file + ".domgate2.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

// garante "use client"
const t = src.trimStart();
if (!(t.startsWith('"use client";') || t.startsWith("'use client';"))) {
  src = '"use client";\\n\\n' + src;
}

// garante import de useEffect do react (sem quebrar import existente)
if (!src.includes("useEffect")) {
  // se já tiver import { ... } from "react"
  src = src.replace(/import\\s*\\{([^}]+)\\}\\s*from\\s*["']react["'];/m, (m, inner) => {
    const parts = inner.split(",").map(s => s.trim()).filter(Boolean);
    if (!parts.includes("useEffect")) parts.push("useEffect");
    return import {  } from "react";;
  });
}

// se não existir import nomeado do react, NÃO mexe (para não quebrar); o projeto já compila hoje.
// a gente só injeta o useEffect se já existir algum import com chaves.
// se não existir, a página provavelmente já usa React/useState com outro padrão.

const GATE = 

  // --- Gate DOM: cadastro antes do resultado ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ok = () => localStorage.getItem("clara_lead_ok") === "1";

    let tries = 0;
    const timer = setInterval(() => {
      tries++;

      // se já cadastrou, não faz nada
      if (ok()) { clearInterval(timer); return; }

      // só ativa quando o resultado existir na tela
      const text = document.body?.innerText || "";
      const hasResult =
        text.includes("Resumo") ||
        text.includes("Pontos de atenção") ||
        text.includes("E-mail pronto") ||
        text.includes("Principais pontos");

      if (!hasResult) {
        if (tries > 40) clearInterval(timer); // ~20s
        return;
      }

      // esconde os blocos de resultado
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4"));
      const hideKeys = ["Resumo", "Pontos de atenção", "E-mail pronto", "Principais pontos"];

      for (const h of headings) {
        const title = (h.textContent || "").trim();
        if (hideKeys.some(k => title.includes(k))) {
          const container = h.closest("section") || h.closest("div");
          if (container) container.style.display = "none";
        }
      }

      // rola para o cadastro
      const fin = headings.find(h => ((h.textContent || "").trim().includes("Para finalizar")));
      if (fin) fin.scrollIntoView({ behavior: "smooth", block: "start" });

      clearInterval(timer);
    }, 500);

    return () => clearInterval(timer);
  }, []);
  // --- fim gate DOM ---
;

// injeta o gate logo após a abertura do componente default function
if (!src.includes("Gate DOM: cadastro antes do resultado")) {
  src = src.replace(/export\\s+default\\s+function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*/m, m => m + GATE);
}

// marca o cadastro como ok no submitLeadAndUnlock (sem depender do JSX)
if (!src.includes('localStorage.setItem("clara_lead_ok"')) {
  src = src.replace(
    /(async\\s+function\\s+submitLeadAndUnlock\\s*\\([^)]*\\)\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*\\n)/m,
    (all, body, end) => body + \\n    if (typeof window !== "undefined") localStorage.setItem("clara_lead_ok","1");\\n + end
  );
  src = src.replace(
    /(const\\s+submitLeadAndUnlock\\s*=\\s*async\\s*\\([^)]*\\)\\s*=>\\s*\\{[\\s\\S]*?)(\\n\\s*\\}\\s*;?\\s*\\n)/m,
    (all, body, end) => body + \\n    if (typeof window !== "undefined") localStorage.setItem("clara_lead_ok","1");\\n + end
  );
}

fs.writeFileSync(file, src, "utf8");
console.log("✅ Gate aplicado em", file);
console.log("Backup em", bak);
