�import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function exists(p){ try{ fs.accessSync(p); return true;}catch{return false;} }

function readTextSmart(filePath){
  const buf = fs.readFileSync(filePath);
  // UTF-16 LE BOM (FF FE)
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.slice(2).toString("utf16le");
  }
  // UTF-8 BOM (EF BB BF)
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.slice(3).toString("utf8");
  }
  // Default: utf8
  return buf.toString("utf8");
}

function writeUtf8(filePath, text){
  // normaliza quebras de linha sem mexer no conte�do
  fs.writeFileSync(filePath, text, { encoding: "utf8" });
}

function fixEncodingIfNeeded(filePath){
  const buf = fs.readFileSync(filePath);
  // Se for UTF-16LE, converte para UTF-8
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    const t = buf.slice(2).toString("utf16le");
    writeUtf8(filePath, t);
    console.log(" Encoding UTF-16 -> UTF-8:", filePath.replace(ROOT+path.sep,""));
  }
}

function patchLinkHome(filePath){
  let src = readTextSmart(filePath);

  if (src.includes('href="/"') && src.includes("<a") && !src.includes("next/link")) {
    // adiciona import Link (depois do 'use client' se existir, sen�o no topo)
    if (src.includes('"use client"') || src.includes("'use client'")) {
      src = src.replace(/(['"]use client['"];\s*\n)/, `$1import Link from "next/link";\n`);
    } else {
      src = `import Link from "next/link";\n` + src;
    }
  }

  // troca apenas o caso simples <a href="/">...</a>
  src = src.replace(/<a\s+href="\/"\s*>/g, `<Link href="/">`);
  src = src.replace(/<\/a>/g, `</Link>`);

  writeUtf8(filePath, src);
  console.log(" Link home (Next/Link):", filePath.replace(ROOT+path.sep,""));
}

function patchTsIgnoreToExpect(filePath){
  let src = readTextSmart(filePath);
  // troca @ts-ignore por @ts-expect-error (com coment�rio curto)
  src = src.replace(/@ts-ignore/g, `@ts-expect-error -- compat/interop (auto)`);
  writeUtf8(filePath, src);
  console.log(" ts-ignore -> ts-expect-error:", filePath.replace(ROOT+path.sep,""));
}

function patchUnescapedQuotesDashboard(filePath){
  let src = readTextSmart(filePath);
  // regra react/no-unescaped-entities: trocar aspas " em texto JSX por &quot;
  // (bem conservador: substitui apenas aspas duplas literais no arquivo)
  src = src.replace(/"/g, "&quot;");
  writeUtf8(filePath, src);
  console.log(" Aspas escapadas (JSX):", filePath.replace(ROOT+path.sep,""));
}

function ensureHistoricoPageIsModule(filePath){
  // Next exige default export em page.tsx
  if (!exists(filePath)) return;
  const src = readTextSmart(filePath);
  if (src.includes("export default")) return;

  const stub =
`"use client";

export default function Page() {
  return null;
}
`;
  writeUtf8(filePath, stub);
  console.log(" Stub criado p/ Next page (export default):", filePath.replace(ROOT+path.sep,""));
}

function patchAnalisarFlow(filePath){
  // Aqui a gente N�O mexe em layout: s� controla "gate" do login e injeta bloco ReclameAqui no final do resultado.
  let src = readTextSmart(filePath);

  // garante import Link se houver <a href="/">
  if (src.includes('href="/"') && src.includes("<a") && !src.includes("next/link")) {
    if (src.includes('"use client"') || src.includes("'use client'")) {
      src = src.replace(/(['"]use client['"];\s*\n)/, `$1import Link from "next/link";\n`);
    } else {
      src = `import Link from "next/link";\n` + src;
    }
  }
  src = src.replace(/<a\s+href="\/"\s*>/g, `<Link href="/">`);
  src = src.replace(/<\/a>/g, `</Link>`);

  // estados: s� adiciona se n�o existir
  if (!src.includes("CLARA_FAKE_GATE")) {
    // injeta depois do primeiro useState encontrado
    const m = src.match(/const\s+\[[^\]]+\]\s*=\s*useState[\s\S]*?;\s*\n/);
    if (m) {
      const inject =
`\n// === CLARA_FAKE_GATE (auto) ===
const [analysisReady, setAnalysisReady] = useState(false);
const [fakeLoading, setFakeLoading] = useState(false);
const [fakePct, setFakePct] = useState(0);

function claraStartFakeLoading() {
  if (analysisReady || fakeLoading) return;
  setFakeLoading(true);
  setFakePct(0);
  const started = Date.now();
  const totalMs = 2600;

  const t = setInterval(() => {
    const elapsed = Date.now() - started;
    const pct = Math.min(100, Math.round((elapsed / totalMs) * 100));
    setFakePct(pct);
    if (pct >= 100) {
      clearInterval(t);
      setFakeLoading(false);
      setAnalysisReady(true);
    }
  }, 60);
}
// === /CLARA_FAKE_GATE ===\n`;
      src = src.replace(m[0], m[0] + inject);
    }
  }

  // hook no input file: adiciona claraStartFakeLoading() na primeira ocorr�ncia de onChange que lida com files
  if (!src.includes("CLARA_FILE_ONCHANGE_HOOK") && src.includes('type="file"')) {
    src = src.replace(/onChange=\{\s*\(e\)\s*=>\s*\{([\s\S]*?)\}\s*\}/m, (all, inner) => {
      if (!inner.includes("files")) return all;
      return `onChange={(e) => {\n  // === CLARA_FILE_ONCHANGE_HOOK (auto) ===\n${inner}\n  claraStartFakeLoading();\n  // === /CLARA_FILE_ONCHANGE_HOOK ===\n}}`;
    });
  }

  // gate do login: envolve o primeiro <form ...> (bem conservador)
  if (!src.includes("CLARA_LOGIN_GATE_WRAPPER")) {
    const hasLoginHints = /password|Senha|senha|Login|login/.test(src);
    if (hasLoginHints) {
      src = src.replace(/(<form[\s\S]*?>)/m, (tag) => {
        return `<!-- CLARA_LOGIN_GATE_WRAPPER (auto) -->\n<div style={{ opacity: analysisReady ? 1 : 0, pointerEvents: analysisReady ? "auto" : "none", transition: "opacity 180ms ease" }}>\n${tag}`;
      });
      src = src.replace(/<\/form>/m, (end) => `${end}\n</div>\n<!-- /CLARA_LOGIN_GATE_WRAPPER -->`);
    }
  }

  // bloco ReclameAqui: s� injeta uma vez e apenas se achar "resultado/an�lise"
  if (!src.includes("CLARA_RECLAME_AQUI_BLOCK")) {
    const anchor = /Resultado|resultado|An�lise|analise|an�lise|analysis/.test(src);
    if (anchor) {
      const idx = src.lastIndexOf("\n);");
      if (idx !== -1) {
        const block =
`

{/* === CLARA_RECLAME_AQUI_BLOCK (auto) === */}
{user ? (
  <div className="mt-6">
    <div className="rounded-2xl border p-4">
      <div className="font-semibold">=� Reclame Aqui + texto instagram�vel</div>
      <div className="text-sm opacity-80 mt-1">
        Se voc� identificou algo fora do jogo, gere abaixo um texto simples, pronto para copiar (Reclame Aqui) e uma vers�o curta para redes sociais.
      </div>

      <div className="mt-4 grid gap-3">
        <input className="w-full rounded-xl border px-3 py-2" placeholder="Nome da empresa (como aparece no contrato)" id="clara_company" />
        <textarea className="w-full rounded-xl border px-3 py-2" placeholder="Resumo do problema (simples e direto)" rows={4} id="clara_problem" />
        <textarea className="w-full rounded-xl border px-3 py-2" placeholder="O que voc� quer como solu��o (objetivo)" rows={3} id="clara_solution" />
      </div>

      <div className="mt-4 grid gap-3">
        <div className="text-sm font-medium">Texto para Reclame Aqui</div>
        <pre className="whitespace-pre-wrap rounded-xl border p-3 text-sm" id="clara_ra_out"></pre>

        <div className="text-sm font-medium">Texto curto (Instagram/LinkedIn)</div>
        <pre className="whitespace-pre-wrap rounded-xl border p-3 text-sm" id="clara_ig_out"></pre>

        <div className="text-xs opacity-70">
          Dica: n�o publique dados pessoais (CPF, endere�o, n�mero de contrato). Se for postar print, borre informa��es sens�veis.
        </div>
      </div>

      <script dangerouslySetInnerHTML={{ __html: \`
(function(){
  const company = document.getElementById("clara_company");
  const problem = document.getElementById("clara_problem");
  const solution = document.getElementById("clara_solution");
  const ra = document.getElementById("clara_ra_out");
  const ig = document.getElementById("clara_ig_out");

  function val(el){ return (el && el.value || "").trim(); }

  function render(){
    const c = val(company) || "[EMPRESA]";
    const p = val(problem) || "[RESUMO]";
    const s = val(solution) || "[SOLU��O]";

    ra.textContent =
\`Ol�, \${c}.

Estou registrando esta reclama��o porque identifiquei pontos no meu contrato/atendimento que me deixaram em desvantagem.

=� O que aconteceu (resumo):
\${p}

=� O que eu pe�o como solu��o:
\${s}

Pe�o retorno por escrito e uma proposta objetiva de resolu��o, com prazos.
Obrigado(a).\`;

    ig.textContent =
\`� Aten��o, consumidores

Assinei/contratei com \${c} e fiquei em alerta:
\${p.split("\\n").slice(0,2).join(" ")}

Pe�am tudo por escrito e guardem os comprovantes.
#direitodoconsumidor #transparencia #contratos\`;
  }

  [company,problem,solution].forEach(el => el && el.addEventListener("input", render));
  render();
})();
\` }} />
    </div>
  </div>
) : null}
{/* === /CLARA_RECLAME_AQUI_BLOCK === */}

`;
        src = src.slice(0, idx) + block + src.slice(idx);
      }
    }
  }

  writeUtf8(filePath, src);
  console.log(" Patch do fluxo (upload->loading->login + ReclameAqui):", filePath.replace(ROOT+path.sep,""));
}

function main(){
  // 1) Corrigir encoding nos arquivos que deram erro do Turbopack
  const encodingTargets = [
    "app/analisar/page.tsx",
    "app/api/analyze/route.ts",
    "app/api/extract/route.ts",
    "app/enviar/page.tsx",
    "app/page.tsx"
  ].map(p => path.join(ROOT, ...p.split("/")));

  for (const f of encodingTargets){
    if (exists(f)) fixEncodingIfNeeded(f);
  }

  // 2) Lint fixes m�nimos
  const analisar = path.join(ROOT,"app","analisar","page.tsx");
  if (exists(analisar)) patchAnalisarFlow(analisar);

  const extractRoute = path.join(ROOT,"app","api","extract","route.ts");
  if (exists(extractRoute)) patchTsIgnoreToExpect(extractRoute);

  const dashNovo = path.join(ROOT,"app","dashboard","contratos","novo","page.tsx");
  if (exists(dashNovo)) patchUnescapedQuotesDashboard(dashNovo);

  // 3) Build fix: historico/page.tsx n�o � m�dulo
  const historico = path.join(ROOT,"app","dashboard","contratos","novo","historico","page.tsx");
  ensureHistoricoPageIsModule(historico);

  console.log("\n Patch conclu�do.");
}

main();
