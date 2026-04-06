"use client";

import { useMemo, useState } from "react";

const COLORS = {
  gold: "#D4AF37",
  sky: "#A8D8F0",
  white: "#FFFFFF",
  gray: "#F2F2F2",
  ink: "#0A2540",
  text: "#425466",
  muted: "#6B7C93",
};

type Finding = {
  title: string;
  whyItMatters: string;
  whatToDo: string;
  legalHint?: string;
  severity: "ok" | "attention" | "high";
  points: 0 | 5 | 10;
};

export default function NovoContrato() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const totalChars = useMemo(() => {
    if (!result?.extracted) return 0;
    return result.extracted.reduce((acc: number, x: any) => acc + (x.chars || 0), 0);
  }, [result]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setResult(null);
    setError("");
  };

  const removeAt = (idx: number) => {
    const next = files.slice();
    next.splice(idx, 1);
    setFiles(next);
  };

  const analyze = async () => {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const fd = new FormData();
      files.forEach(f => fd.append("files", f));

      const r = await fetch("/api/analyze", { method: "POST", body: fd });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Falha na análise.");

      setResult(j);
    } catch (e: any) {
      setError(e?.message || "Erro.");
    } finally {
      setLoading(false);
    }
  };

  const openEmail = () => {
    if (!result?.email) return;
    const subject = encodeURIComponent(result.email.subject || "Revisão de contrato");
    const body = encodeURIComponent(result.email.body || "");
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const copyEmail = async () => {
    if (!result?.email) return;
    const content = `Assunto: ${result.email.subject}\n\n${result.email.body}`;
    await navigator.clipboard.writeText(content);
    alert("E-mail copiado. É só colar no seu e-mail.");
  };

  return (
    <main className="min-h-screen px-6 py-10" style={{ background: `linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.gray} 100%)` }}>
      <div className="mx-auto max-w-5xl space-y-8">

        <header className="rounded-3xl p-6 md:p-8 shadow-sm" style={{ background: COLORS.white, border: `1px solid rgba(10,37,64,.08)` }}>
          <h1 className="text-2xl md:text-3xl font-semibold" style={{ color: COLORS.ink }}>
            Análise de contrato — com clareza (sem juridiquês)
          </h1>
          <p className="mt-2 text-sm md:text-base" style={{ color: COLORS.text }}>
            Envie <b>um ou vários</b> contratos (PDF) e/ou <b>fotos</b> (JPG/PNG). A Clara extrai o texto (OCR quando necessário),
            destaca pontos de atenção e te entrega um e-mail pronto para seu advogado.
          </p>

          <div className="mt-4 text-xs rounded-2xl p-4" style={{ background: `rgba(168,216,240,.28)`, border: `1px solid rgba(168,216,240,.60)`, color: COLORS.ink }}>
            ⚠️ <b>Transparência:</b> a Clara <b>não é um advogado</b> e não substitui orientação jurídica profissional.
            Ela é uma ferramenta de apoio para você entender melhor e conversar com mais segurança.
          </div>
        </header>

        <section className="rounded-3xl p-6 md:p-8 shadow-sm space-y-4" style={{ background: COLORS.white, border: `1px solid rgba(10,37,64,.08)` }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>1) Selecione arquivos</div>
              <div className="text-xs" style={{ color: COLORS.muted }}>PDF, JPG, PNG. Você pode selecionar vários de uma vez.</div>
            </div>

            <label className="inline-flex items-center justify-center rounded-2xl px-5 py-3 cursor-pointer"
                   style={{ background: COLORS.gray, border: `1px solid rgba(10,37,64,.10)`, color: COLORS.ink }}>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                multiple
                className="hidden"
                onChange={onPick}
              />
              Escolher arquivos
            </label>
          </div>

          {files.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: COLORS.gray, border: `1px solid rgba(10,37,64,.06)` }}>
              <div className="text-sm font-medium" style={{ color: COLORS.ink }}>Arquivos selecionados</div>
              <ul className="mt-2 space-y-2">
                {files.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3">
                    <div className="text-sm" style={{ color: COLORS.text }}>
                      {f.name} <span style={{ color: COLORS.muted }}>({Math.round(f.size/1024)} KB)</span>
                    </div>
                    <button
                      onClick={() => removeAt(idx)}
                      className="text-xs px-3 py-2 rounded-xl"
                      style={{ border: `1px solid rgba(10,37,64,.12)`, color: COLORS.ink, background: COLORS.white }}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            <button
              disabled={loading || files.length === 0}
              onClick={analyze}
              className="w-full rounded-2xl px-6 py-4 font-semibold transition disabled:opacity-50"
              style={{ background: COLORS.ink, color: COLORS.white }}
            >
              {loading ? "Analisando..." : "2) Analisar agora"}
            </button>
            {error && <div className="mt-3 text-sm" style={{ color: "#b91c1c" }}>{error}</div>}
          </div>
        </section>

        {result && (
          <section className="rounded-3xl p-6 md:p-8 shadow-sm space-y-6" style={{ background: COLORS.white, border: `1px solid rgba(10,37,64,.08)` }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: COLORS.ink }}>Resultado</h2>
                <div className="text-sm mt-1" style={{ color: COLORS.muted }}>
                  Caracteres extraídos: <b>{totalChars}</b>
                </div>
              </div>

              <div className="rounded-2xl px-4 py-2 text-sm font-semibold"
                   style={{ background: `rgba(212,175,55,.12)`, border: `1px solid rgba(212,175,55,.35)`, color: result.riskColor || COLORS.ink }}>
                {result.riskLabel} • score {result.totalScore}
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ background: COLORS.gray, border: `1px solid rgba(10,37,64,.06)` }}>
              <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Resumo</div>
              <div className="mt-2 text-sm" style={{ color: COLORS.text }}>{result.summary}</div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Pontos de atenção</div>

              {(!result.findings || result.findings.length === 0) ? (
                <div className="rounded-2xl p-5" style={{ background: COLORS.gray, border: `1px solid rgba(10,37,64,.06)` }}>
                  <div className="text-sm font-medium" style={{ color: COLORS.ink }}>Nenhum alerta automático detectado</div>
                  <div className="text-sm mt-1" style={{ color: COLORS.text }}>
                    Ainda assim, vale revisar prazo, preço, reajuste, rescisão, garantias e dados pessoais (LGPD).
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {(result.findings as Finding[]).map((f, i) => {
                    const tag =
                      f.severity === "high" ? { label: "Precisa de muita atenção", bg: "rgba(220,38,38,.10)", bd: "rgba(220,38,38,.25)", c: "#b91c1c" } :
                      f.severity === "attention" ? { label: "Atenção", bg: "rgba(245,158,11,.12)", bd: "rgba(245,158,11,.28)", c: "#92400e" } :
                      { label: "Ok", bg: "rgba(22,163,74,.10)", bd: "rgba(22,163,74,.25)", c: "#166534" };

                    return (
                      <div key={i} className="rounded-2xl p-5" style={{ background: COLORS.white, border: `1px solid rgba(10,37,64,.08)` }}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="text-base font-semibold" style={{ color: COLORS.ink }}>{f.title}</div>
                          <div className="text-xs font-semibold rounded-full px-3 py-1" style={{ background: tag.bg, border: `1px solid ${tag.bd}`, color: tag.c }}>
                            {tag.label} • {f.points} pts
                          </div>
                        </div>

                        <div className="mt-3 grid gap-2 text-sm" style={{ color: COLORS.text }}>
                          <div><b>Por que importa:</b> {f.whyItMatters}</div>
                          <div><b>O que verificar:</b> {f.whatToDo}</div>
                          {f.legalHint && <div style={{ color: COLORS.muted }}><b>Base/Referência:</b> {f.legalHint}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Email automático */}
            <div className="rounded-2xl p-5" style={{ background: `rgba(168,216,240,.20)`, border: `1px solid rgba(168,216,240,.55)` }}>
              <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>E-mail pronto para advogado</div>
              <div className="mt-2 text-sm" style={{ color: COLORS.text }}>
                Abra seu e-mail com assunto e corpo preenchidos, ou copie o texto.
              </div>

              <div className="mt-4 flex gap-3 flex-wrap">
                <button onClick={openEmail} className="rounded-2xl px-5 py-3 font-semibold"
                        style={{ background: COLORS.ink, color: COLORS.white }}>
                  Abrir e-mail
                </button>
                <button onClick={copyEmail} className="rounded-2xl px-5 py-3 font-semibold"
                        style={{ background: COLORS.white, color: COLORS.ink, border: `1px solid rgba(10,37,64,.12)` }}>
                  Copiar e-mail
                </button>
              </div>

              <div className="mt-3 text-xs" style={{ color: COLORS.muted }}>
                Dica: anexe o contrato ao e-mail e peça confirmação das cláusulas destacadas.
              </div>
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
