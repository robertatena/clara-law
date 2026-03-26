import fs from "fs";
import path from "path";
const ROOT = process.cwd();
const exts = new Set([".ts",".tsx",".js",".jsx",".json",".css",".md",".txt",".env",".mjs",".cjs"]);
const skipDirs = new Set(["node_modules",".next",".git",".turbo","dist","build","out"]);
function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (skipDirs.has(ent.name)) continue;
      out.push(...walk(path.join(dir, ent.name)));
    } else {
      const fp = path.join(dir, ent.name);
      const ext = path.extname(fp).toLowerCase();
      if (exts.has(ext) || ent.name === "package.json") out.push(fp);
    }
  }
  return out;
}
function stripBom(buf) {
  // UTF-8 BOM EF BB BF
  if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    return buf.slice(3);
  }
  return buf;
}
function fixText(s) {
  // Remove caracteres “fantasmas” que quebram parsing e UI
  // U+FFFD (), U+FEFF (BOM), e o char "" quando vira texto
  s = s.replace(/\uFFFD/g, "");     //
  s = s.replace(/\uFEFF/g, "");     // BOM char
  s = s.replace(//g, "");        // BOM renderizado
  // Troca bullets quebrados que às vezes viram símbolo estranho
  s = s.replace(/[•]/g, "•");
  // Corrige alguns “artefatos” comuns (sem destruir o texto)
  s = s.replace(/\s+\n/g, "\n");
  return s;
}
function writeUtf8NoBom(fp, text) {
  fs.writeFileSync(fp, text, { encoding: "utf8" });
}
const files = walk(ROOT);
let changed = 0;
for (const fp of files) {
  const raw = fs.readFileSync(fp);
  const buf = stripBom(raw);
  let s = buf.toString("utf8");
  const fixed = fixText(s);
  if (fixed !== s || buf !== raw) {
    writeUtf8NoBom(fp, fixed);
    changed++;
  }
}
console.log(`[OK] Encoding/char-fix aplicado em ${changed} arquivos.`);
// 3) Patch: desligar Turbopack (muito provável ser a causa do "Parsing ecmascript source code failed")
const pkgPath = path.join(ROOT, "package.json");
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.scripts = pkg.scripts || {};
  const dev = pkg.scripts.dev || "next dev";
  // remove flags turbo/turbopack se existirem e força porta 3000
  const cleaned = dev
    .replace(/--turbo\b/g, "")
    .replace(/turbopack\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  pkg.scripts.dev = cleaned.includes("next dev")
    ? (cleaned.match(/-p\s+\d+/) || cleaned.match(/--port\s+\d+/) ? cleaned : `${cleaned} -p 3000`)
    : "next dev -p 3000";
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
  console.log(`[OK] package.json -> scripts.dev = "${pkg.scripts.dev}" (sem turbo).`);
}
// 4) Patch: impedir que /enviar te jogue pra home depois do cadastro (remove redirect)
const enviar = path.join(ROOT, "app", "enviar", "page.tsx");
if (fs.existsSync(enviar)) {
  let s = fs.readFileSync(enviar, "utf8");
  const before = s;
  // comenta redirects comuns
  s = s.replace(/window\.location\.href\s*=\s*["'`][^"'`]*["'`]\s*;?/g, (m) => `// ${m}  // (auto-patch)`);
  s = s.replace(/router\.push\(\s*["'`][^"'`]*["'`]\s*\)\s*;?/g, (m) => `// ${m}  // (auto-patch)`);
  // remove erros de sintaxe que já apareceram: "return;?.scrollIntoView"
  s = s.replace(/return\s*;\s*\?\.\s*scrollIntoView\([^)]*\)\s*;?/g, "return; // (auto-patch) removido optional chaining inválido");
  if (s !== before) {
    fs.writeFileSync(enviar, s, "utf8");
    console.log("[OK] Patch aplicado em app/enviar/page.tsx (sem redirect).");
  } else {
    console.log("[INFO] app/enviar/page.tsx não precisou de patch de redirect.");
  }
} else {
  console.log("[INFO] Não achei app/enviar/page.tsx (ok se sua rota for diferente).");
}
console.log("=== FIX DONE ===");
