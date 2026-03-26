import fs from "node:fs";

const file = "app/enviar/page.tsx";
if (!fs.existsSync(file)) { console.error("Não achei", file); process.exit(1); }

let src = fs.readFileSync(file, "utf8");
const bak = file + ".domgate4.bak";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, src, "utf8");

// remove gate antigo (se existir) pra evitar duplicar
src = src.replace(/\\n\\s*\\/\\/ --- CLARA DOMGATE4 START ---[\\s\\S]*?\\/\\/ --- CLARA DOMGATE4 END ---\\n/m, "\\n");

// garante "use client"
const t = src.trimStart();
if (!(t.startsWith('"use client";') || t.startsWith("'use client';"))) {
  src = '"use client";\\n\\n' + src;
}

const GATE = 

  // --- CLARA DOMGATE4 START ---
  // Gate: depois que a análise aparecer, esconder tudo acima do card "Para finalizar"
  // até o cadastro ser salvo (localStorage clara_lead_ok=1).
  if (typeof window !== "undefined") {
    const w = window as any;
    if (!w.__claraDomGate4) {
      w.__claraDomGate4 = true;

      const isOk = () => {
        try { return localStorage.getItem("clara_lead_ok") === "1"; }
        catch { return false; }
      };

      const run = () => {
        if (isOk()) return;

        const bodyText = document.body?.innerText || "";
        const hasResult =
          bodyText.includes("Resumo") ||
          bodyText.includes("Pontos de atenção") ||
          bodyText.includes("E-mail pronto") ||
          bodyText.includes("Principais pontos");

        if (!hasResult) return;

        const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4"));
        const fin = headings.find(h => ((h.textContent || "").trim().includes("Para finalizar")));
        if (!fin) return;

        const finCard = (fin.closest("section") || fin.closest("div")) as HTMLElement | null;
        if (!finCard) return;

        // esconde irmãos anteriores do card dentro do mesmo parent (coluna)
        const parent = finCard.parentElement;
        if (parent) {
          const kids = Array.from(parent.children) as HTMLElement[];
          for (const el of kids) {
            if (el === finCard) break;
            el.style.display = "none";
          }
        }

        finCard.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      // tenta algumas vezes (porque a análise pode demorar)
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        run();
        if (tries > 80 || isOk()) clearInterval(timer); // ~32s
      }, 400);
    }
  }
  // --- CLARA DOMGATE4 END ---
;

// injeta o gate logo após abrir o componente default function
if (!src.includes("CLARA DOMGATE4 START")) {
  src = src.replace(/export\\s+default\\s+function\\s+\\w+\\s*\\([^)]*\\)\\s*\\{\\s*/m, m => m + GATE);
}

// marca cadastro ok no submitLeadAndUnlock (para liberar resultado após salvar)
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
console.log("✅ DOMGATE4 aplicado em", file);
console.log("Backup:", bak);
