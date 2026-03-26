import fs from "node:fs";

const file = "app/enviar/page.tsx";
if (!fs.existsSync(file)) { console.error("Não achei", file); process.exit(1); }

let src = fs.readFileSync(file, "utf8");
const bak = file + ".domgate3.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

// remove gate anterior (se existir) para evitar duplicar
src = src.replace(/\\n\\s*\\/\\/ --- Gate DOM: cadastro antes do resultado ---[\\s\\S]*?\\/\\/ --- fim gate DOM ---\\n/m, "\\n");

// garante use client
const t = src.trimStart();
if (!(t.startsWith('"use client";') || t.startsWith("'use client';"))) {
  src = '"use client";\\n\\n' + src;
}

// garante useEffect no import { } from react (se existir)
src = src.replace(/import\\s*\\{([^}]+)\\}\\s*from\\s*["']react["'];/m, (m, inner) => {
  const parts = inner.split(",").map(s => s.trim()).filter(Boolean);
  if (!parts.includes("useEffect")) parts.push("useEffect");
  return import {  } from "react";;
});

const GATE = 

  // --- Gate DOM: cadastro ANTES da análise (esconde coluna inteira do resultado) ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ok = () => localStorage.getItem("clara_lead_ok") === "1";

    let tries = 0;
    const timer = setInterval(() => {
      tries++;

      if (ok()) { clearInterval(timer); return; }

      const text = document.body?.innerText || "";
      const hasResult =
        text.includes("Resumo") ||
        text.includes("Pontos de atenção") ||
        text.includes("E-mail pronto") ||
        text.includes("Principais pontos");

      // só ativa quando a análise apareceu
      if (!hasResult) {
        if (tries > 60) clearInterval(timer); // ~30s
        return;
      }

      // achar o card "Para finalizar"
      const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4"));
      const fin = headings.find(h => ((h.textContent || "").trim().includes("Para finalizar")));
      const finCard = fin ? (fin.closest("section") || fin.closest("div")) : null;

      // esconder a "coluna" do resultado: pega o container pai do cadastro e esconde os irmãos acima
      if (finCard) {
        const parent = finCard.parentElement; // normalmente a coluna direita
        if (parent) {
          // esconde tudo antes do cadastro dentro da mesma coluna
          const kids = Array.from(parent.children);
          for (const el of kids) {
            if (el === finCard) break;
            (el as HTMLElement).style.display = "none";
          }
        }
        finCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      clearInterval(timer);
    }, 400);

    return () => clearInterval(timer);
  }, []);
  // --- fim gate DOM ---
;

// injeta gate logo após abrir o componente
if (!src.includes("Gate DOM: cadastro ANTES da análise")) {
  src = src.replace(/export\\s+default\\s+function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*/m, m => m + GATE);
}

// marca cadastro ok no submitLeadAndUnlock
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
console.log("✅ Gate atualizado (domgate3). Backup:", bak);
