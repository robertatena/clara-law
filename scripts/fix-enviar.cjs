const fs = require("fs");

const f = "app/enviar/page.tsx";
let s = fs.readFileSync(f, "utf8");

// remove BOM
s = s.replace(/^\uFEFF/, "");

// remove caracteres de controle bizarros (mantém \n \r \t)
s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

// troca import legado se existir
s = s.replace(/pdfjs-dist\/legacy\/build\/pdf/g, "pdfjs-dist/build/pdf");

// se tiver a linha "use client" corrompida com �, normaliza
s = s.replace(/^[^\S\r\n]*.*use client.*$/m, '"use client";');

// salva
fs.writeFileSync(f, s, "utf8");
console.log("✅ Sanitizado + pdfjs path corrigido:", f);
