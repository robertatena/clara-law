import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function exists(p){ try{ fs.accessSync(p); return true;}catch{return false;} }
function read(p){ return fs.readFileSync(p,"utf8"); }

function walk(dir){
  let out = [];
  if(!exists(dir)) return out;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(path.join(ROOT,"app")).filter(f => f.endsWith(".tsx") || f.endsWith(".ts"));
const picks = [];

for(const f of files){
  const t = read(f);
  const score =
    (t.includes('type="file"') ? 3 : 0) +
    (t.toLowerCase().includes("upload") ? 1 : 0) +
    (t.includes("localStorage.getItem") ? 2 : 0) +
    (t.toLowerCase().includes("login") ? 2 : 0) +
    (t.toLowerCase().includes("senha") ? 1 : 0) +
    (t.toLowerCase().includes("resultado") ? 1 : 0) +
    (t.includes("/api/") ? 1 : 0) +
    (t.toLowerCase().includes("analisar") ? 3 : 0);
  if(score >= 4) picks.push({f, score});
}

picks.sort((a,b)=>b.score-a.score);

console.log("\n=== ROTAS em /app (principais) ===");
console.log(files.filter(f=>f.endsWith("page.tsx")).slice(0,200).map(f=>f.replace(ROOT+path.sep,"")).join("\n"));

console.log("\n=== TOP arquivos candidatos (upload/login/resultado) ===");
for(const p of picks.slice(0,12)){
  console.log(${p.score}  );
}

console.log("\nDica: normalmente o alvo é algo como app/analisar/page.tsx e app/login/page.tsx.");
