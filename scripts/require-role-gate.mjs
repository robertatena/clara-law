import fs from "node:fs";

const file = "app/enviar/page.tsx";
if (!fs.existsSync(file)) {
  console.error("Não achei:", file);
  process.exit(1);
}

let s = fs.readFileSync(file, "utf8");

// backup
const bak = file + ".bak.requireRoleGate";
if (!fs.existsSync(bak)) fs.writeFileSync(bak, s, "utf8");

// helper
function replaceFirst(haystack, needle, replacement) {
  const idx = haystack.indexOf(needle);
  if (idx === -1) return haystack;
  return haystack.slice(0, idx) + replacement + haystack.slice(idx + needle.length);
}

// (A) 1) leadRole começar vazio (remove default)
{
  const a1 = 'const [leadRole, setLeadRole] = useState("Sou a parte que vai assinar");';
  const a2 = "const [leadRole, setLeadRole] = useState('Sou a parte que vai assinar');";
  if (s.includes(a1)) s = replaceFirst(s, a1, 'const [leadRole, setLeadRole] = useState("");');
  else if (s.includes(a2)) s = replaceFirst(s, a2, "const [leadRole, setLeadRole] = useState('');");
}

// (B) 2) gateOn exigir email + role
{
  // tenta achar linha existente do gateOn e substituir
  const lines = s.split("\n");
  const i = lines.findIndex(l => l.includes("const gateOn ="));
  if (i !== -1) {
    // substitui a linha toda por uma condição mais forte
    lines[i] = '  const gateOn = showLead && (!(leadEmail || "").trim() || !String(leadRole || "").trim());';
    s = lines.join("\n");
  } else {
    // se não existir, injeta após o state do emailDraft (fallback)
    const marker = "const [emailDraft, setEmailDraft]";
    const mIdx = s.indexOf(marker);
    if (mIdx !== -1) {
      const after = s.indexOf(");", mIdx);
      if (after !== -1) {
        const insertPos = after + 2;
        s = s.slice(0, insertPos) + "\n\n  const gateOn = showLead && (!(leadEmail || \"\").trim() || !String(leadRole || \"\").trim());\n" + s.slice(insertPos);
      }
    }
  }
}

// (C) 3) adiciona opção placeholder "Selecione..." no select de leadRole
{
  const selectNeedle = '<select value={leadRole} onChange={(e) => setLeadRole(e.target.value)}';
  const idx = s.indexOf(selectNeedle);
  if (idx !== -1) {
    // encontra o fim da tag <select ...>
    const gt = s.indexOf(">", idx);
    if (gt !== -1) {
      const openTag = s.slice(idx, gt + 1);
      // se já tiver placeholder, não duplica
      if (!s.slice(gt, gt + 220).includes('value=""') && !s.slice(gt, gt + 220).includes("value=''")) {
        const placeholder = '\n                      <option value="" disabled>Selecione sua posição</option>';
        s = s.slice(0, gt + 1) + placeholder + s.slice(gt + 1);
      }
    }
  }
}

fs.writeFileSync(file, s, "utf8");
console.log("✅ OK: agora só mostra resultado quando e-mail + posição estiverem preenchidos.");
console.log("Backup salvo em:", bak);
