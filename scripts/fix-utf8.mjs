import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const targets = [
  "app/api/analyze/route.ts",
  "app/enviar/page.tsx",
  "app/page.tsx",
].map(p => path.join(ROOT, ...p.split("/")));

function rel(p){ return p.replace(ROOT + path.sep, ""); }

function decodeSmart(buf){
  // 1) UTF-8 com BOM
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf.subarray(3));
  }

  // 2) UTF-16LE com BOM
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return new TextDecoder("utf-16le", { fatal: true }).decode(buf.subarray(2));
  }

  // 3) Tenta UTF-8 "fatal"
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {}

  // 4) Tenta UTF-16LE "fatal" (sem BOM) — às vezes salva assim
  try {
    // Heurística: muitos zeros sugere UTF-16LE
    let zeros = 0;
    for (let i=1; i<Math.min(buf.length, 2000); i+=2) if (buf[i] === 0x00) zeros++;
    if (zeros > 50) return new TextDecoder("utf-16le", { fatal: true }).decode(buf);
  } catch {}

  // 5) Fallback: Windows-1252 (ANSI do Windows)
  // Node TextDecoder costuma suportar "windows-1252"
  return new TextDecoder("windows-1252", { fatal: false }).decode(buf);
}

function writeUtf8(filePath, text){
  fs.writeFileSync(filePath, text, { encoding: "utf8" });
}

for (const f of targets){
  if (!fs.existsSync(f)) {
    console.log("⚠️ Não encontrado:", rel(f));
    continue;
  }
  const buf = fs.readFileSync(f);
  const text = decodeSmart(buf);
  writeUtf8(f, text);
  console.log("✅ Regravado em UTF-8:", rel(f));
}
