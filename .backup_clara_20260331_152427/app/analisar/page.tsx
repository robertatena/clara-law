"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type User = { nome: string; email: string; telefone: string; papel: string };
type ExtractDoc = { name: string; ok: boolean; pages?: number; chars?: number; text?: string; error?: string };
type AnalyzePoint = { title: string; why: string; check: string; negotiate: string };
type AnalyzeOut = { resumo: string; pontos: AnalyzePoint[]; email: { assunto: string; corpo: string } };

export default function AnalisarPage() {
  const [user, setUser] = useState<User | null>(null);


// === CLARA_FAKE_GATE (auto) ===
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
// === /CLARA_FAKE_GATE ===
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [extract, setExtract] = useState<ExtractDoc[] | null>(null);
  const [out, setOut] = useState<AnalyzeOut | null>(null);

  useEffect(() => {
    const u = localStorage.getItem("clara_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const okDocs = useMemo(() => (extract || []).filter(d => d.ok && d.text), [extract]);

  async function onAnalyze() {
    setErro(null);
    setOut(null);
    setExtract(null);

    if (!files.length) {
      setErro("Selecione pelo menos 1 PDF.");
      return;
    }

    setLoading(true);
    try {
      // 1) EXTRACT
      const fd = new FormData();
      files.forEach(f => fd.append("files", f, f.name));

      const r1 = await fetch("/api/extract", { method: "POST", body: fd });
      const j1 = await r1.json().catch(() => null);

      if (!r1.ok || !j1?.ok) {
        setErro(j1?.error || "Falha ao extrair texto do PDF.");
        setLoading(false);
        return;
      }

      setExtract(j1.documents);

      const good = (j1.documents || []).filter((d: ExtractDoc) => d.ok && d.text);
      if (!good.length) {
        setErro("Nenhum PDF teve texto extra�vel. Se o contrato estiver escaneado, envie um PDF pesquis�vel (ou rode OCR).");
        setLoading(false);
        return;
      }

      // 2) ANALYZE
      const r2 = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user,
          documents: good.map((d: ExtractDoc) => ({ name: d.name, text: d.text }))
        })
      });

      const j2 = await r2.json().catch(() => null);

      if (!r2.ok || !j2?.ok) {
        setErro(j2?.error || "Falha ao analisar contrato.");
        setLoading(false);
        return;
      }

      setOut({ resumo: j2.resumo, pontos: j2.pontos, email: j2.email });
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  function openEmail() {
    if (!out?.email) return;
    const subject = encodeURIComponent(out.email.assunto);
    const body = encodeURIComponent(out.email.corpo);
    window.location.href = `mailto:${user?.email || ""}?subject=${subject}&body=${body}`;
  }

  async function copyEmail() {
    if (!out?.email) return;
    const txt = `Assunto: ${out.email.assunto}\n\n${out.email.corpo}`;
    await navigator.clipboard.writeText(txt);
    alert("E-mail copiado!");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Resultado da an�lise</h1>
          {user && <p className="mt-1 text-slate-600">Ol�, <b>{user.nome}</b>. Aqui est� o essencial.</p>}
        </div>

        <Link
          href="/"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          Voltar para a Home
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* LEFT: upload m�ltiplo */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Documentos</h2>
          <p className="mt-2 text-sm text-slate-600">
            Envie <b>1 ou mais</b> PDFs. Se algum estiver escaneado, pode n�o extrair texto.
          </p>

          <div className="mt-4">
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="block w-full text-sm"
            />
            {files.length > 0 && (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {files.map((f) => (
                  <li key={f.name} className="rounded-xl bg-slate-50 px-3 py-2">
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={onAnalyze}
            disabled={loading}
            className="mt-5 w-full rounded-full bg-slate-900 px-5 py-4 text-white shadow-sm disabled:opacity-60"
          >
            {loading ? "Analisando..." : "Analisar agora"}
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Transpar�ncia: a Clara n�o � advogada. � uma ferramenta de apoio para entender melhor e decidir com mais seguran�a.
          </p>

          {erro && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          {extract && (
            <div className="mt-5">
              <div className="text-xs font-semibold text-slate-700">Extra��o</div>
              <div className="mt-2 space-y-2">
                {extract.map((d) => (
                  <div key={d.name} className="rounded-2xl border border-slate-200 px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-900">{d.name}</div>
                      <div className={`text-xs ${d.ok ? "text-emerald-700" : "text-amber-700"}`}>
                        {d.ok ? "OK" : "Aten��o"}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {d.ok
                        ? `${d.pages ?? "-"} p�g � ${d.chars ?? 0} chars`
                        : d.error}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: resumo + pontos + email */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Resumo</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-700">
              {out?.resumo || "Envie 1 ou mais contratos e clique em �Analisar agora�."}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Pontos de aten��o</h2>

            {!out?.pontos?.length ? (
              <p className="mt-2 text-slate-600">Quando a an�lise terminar, voc� ver� aqui os pontos mais importantes.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {out.pontos.map((p) => (
                  <div key={p.title} className="rounded-2xl bg-slate-50 p-5">
                    <div className="text-sm font-semibold text-slate-900">{p.title}</div>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700">
                      <div><b>Por que importa:</b> {p.why}</div>
                      <div><b>O que verificar:</b> {p.check}</div>
                      <div><b>Como negociar:</b> {p.negotiate}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">E-mail pronto</h2>
            <p className="mt-2 text-slate-600">Abra com assunto e corpo preenchidos, ou copie o texto.</p>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={openEmail}
                disabled={!out?.email}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                Abrir e-mail
              </button>
              <button
                onClick={copyEmail}
                disabled={!out?.email}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 disabled:opacity-40"
              >
                Copiar e-mail
              </button>
            </div>

            {out?.email && (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-800">
                <div className="font-semibold">Assunto: {out.email.assunto}</div>
                <pre className="mt-3 whitespace-pre-wrap font-sans">{out.email.corpo}</pre>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}








