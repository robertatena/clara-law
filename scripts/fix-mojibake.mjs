�import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const EXT_OK = new Set([
  ".ts",".tsx",".js",".jsx",".mjs",".cjs",
  ".json",".md",".txt",".css",".scss",".html"
]);

const SKIP_DIRS = new Set(["node_modules",".next",".git","dist","build","out",".turbo",".vercel","coverage"]);
const NEEDLE_RE = /�|�|�|�/; // padr�es t�picos de mojibake

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(p);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (!EXT_OK.has(ext)) continue;

    let s;
    try {
      s = fs.readFileSync(p, "utf8");
    } catch {
      continue;
    }

    if (!NEEDLE_RE.test(s)) continue;

    // Tentativa de "desfazer" UTF-8 interpretado como Latin-1
    const fixed = Buffer.from(s, "latin1").toString("utf8");

    // S� salva se melhorar (reduzir padr�es ruins)
    const beforeBad = (s.match(NEEDLE_RE) || []).length;
    const afterBad  = (fixed.match(NEEDLE_RE) || []).length;

    if (afterBad < beforeBad) {
      const bak = p + ".bak";
      if (!fs.existsSync(bak)) fs.writeFileSync(bak, s, "utf8");
      fs.writeFileSync(p, fixed, "utf8");
      console.log(" corrigido:", path.relative(ROOT, p), `(bad ${beforeBad} -> ${afterBad})`);
    }
  }
}

console.log("= Varredura e corre��o de caracteres estranhos (com .bak)...");
walk(ROOT);
console.log(" Finalizado.");
console.log("Dica: se algo n�o deveria ter mudado, restaure pelo .bak correspondente.");
