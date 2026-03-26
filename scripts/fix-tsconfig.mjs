import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "tsconfig.json");
const buf = fs.readFileSync(file);

// decodifica como utf8 "tolerante"
let txt = buf.toString("utf8");

// remove BOM unicode (às vezes vira "caractere invisível")
txt = txt.replace(/^\uFEFF/, "");

// remove qualquer lixo antes do primeiro "{"
const first = txt.indexOf("{");
const last  = txt.lastIndexOf("}");
if (first === -1 || last === -1 || last <= first) {
  console.error("tsconfig.json parece corrompido (não achei { } direito).");
  process.exit(1);
}
txt = txt.slice(first, last + 1);

// valida JSON
let obj;
try {
  obj = JSON.parse(txt);
} catch (e) {
  console.error("Ainda inválido. Primeiros 80 chars:", JSON.stringify(txt.slice(0,80)));
  throw e;
}

// regrava bonitinho
fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
console.log("✅ tsconfig.json limpo e regravado como JSON válido (UTF-8).");
