import fs from "fs";
import path from "path";

const file = path.join(process.cwd(), "tsconfig.json");
let txt = fs.readFileSync(file, "utf8");

// tira BOM invisível se existir
txt = txt.replace(/^\uFEFF/, "");

// tenta achar o trecho JSON válido
const first = txt.indexOf("{");
const last  = txt.lastIndexOf("}");
if (first === -1 || last === -1 || last <= first) {
  console.error("tsconfig.json parece corrompido (não achei { } direito).");
  process.exit(1);
}
txt = txt.slice(first, last + 1);

const obj = JSON.parse(txt);

// garante exclude como array e adiciona padrões de backup
obj.exclude = Array.isArray(obj.exclude) ? obj.exclude : ["node_modules"];
const add = (v) => { if (!obj.exclude.includes(v)) obj.exclude.unshift(v); };
add("_backup_*");
add("_backup_before_restore_*");

fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
console.log("✅ tsconfig.json reparado e exclude atualizado com segurança.");
