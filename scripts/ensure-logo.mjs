import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const pub = path.join(process.cwd(), "public");
if (!fs.existsSync(pub)) fs.mkdirSync(pub, { recursive: true });
const candidates = [
  path.join(pub, "logo-source.png"),
  path.join(pub, "logo-source.jpg"),
  path.join(pub, "logo-source.jpeg"),
  path.join(pub, "logo.png"), // fallback: já existe
];
const src = candidates.find(p => fs.existsSync(p));
if (!src) {
  console.log("⚠️  Logo não encontrado. Coloque o arquivo em public/logo-source.png (recomendado) ou .jpg/.jpeg");
  process.exit(0);
}
const out = path.join(pub, "logo.png");
if (src.endsWith("logo.png") && src === out) {
  console.log("✅ public/logo.png já existe.");
  process.exit(0);
}
await sharp(src).png({ quality: 100 }).toFile(out);
console.log("✅ Logo atualizado:", out);
