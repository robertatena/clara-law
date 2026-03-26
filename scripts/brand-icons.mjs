import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const pub = path.join(process.cwd(), "public");
const candidates = [
  path.join(pub, "logo-source.png"),
  path.join(pub, "logo-source.jpg"),
  path.join(pub, "logo-source.jpeg"),
];
const src = candidates.find(p => fs.existsSync(p));
if (!src) throw new Error("logo-source não encontrado em /public");
const outDir = path.join(pub, "brand");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outLogo = path.join(outDir, "clara-logo.png");
const outApple = path.join(pub, "apple-touch-icon.png");
const outIcon = path.join(pub, "icon.png");
const outFavicon = path.join(pub, "favicon.ico");
// Logo principal (header/landing) – transparente e nítido
await sharp(src)
  .resize(320, 320, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ quality: 100 })
  .toFile(outLogo);
// Icons
await sharp(src)
  .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ quality: 100 })
  .toFile(outApple);
await sharp(src)
  .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ quality: 100 })
  .toFile(outIcon);
// favicon: em dev, gravar PNG 64 com nome .ico costuma funcionar bem
const fav = await sharp(src)
  .resize(64, 64, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
  .png({ quality: 100 })
  .toBuffer();
fs.writeFileSync(outFavicon, fav);
console.log("✅ Logo:", outLogo);
console.log("✅ apple-touch-icon:", outApple);
console.log("✅ icon:", outIcon);
console.log("✅ favicon:", outFavicon);
