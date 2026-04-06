"use client";

import { useMemo, useState } from "react";

type PapelOption = {
  value: string;
  label: string;
};

const PAPEL_OPTIONS: PapelOption[] = [
  { value: "", label: "Selecione seu papel no contrato" },
  { value: "contratante", label: "Sou a pessoa que está contratando" },
  { value: "contratado", label: "Sou a pessoa/empresa contratada" },
  { value: "consumidor", label: "Sou consumidor(a)/cliente" },
  { value: "fornecedor", label: "Sou fornecedor(a)/prestador(a)" },
  { value: "locatario", label: "Sou locatário(a)/inquilino(a)" },
  { value: "locador", label: "Sou locador(a)/proprietário(a)" },
  { value: "comprador", label: "Sou comprador(a)" },
  { value: "vendedor", label: "Sou vendedor(a)" },
  { value: "aluno", label: "Sou aluno(a)" },
  { value: "instituicao_ensino", label: "Sou instituição de ensino" },
  { value: "paciente", label: "Sou paciente" },
  { value: "clinica", label: "Sou clínica/profissional" },
  { value: "empregado", label: "Sou empregado(a)" },
  { value: "empregador", label: "Sou empregador(a)/empresa" },
  { value: "fiador", label: "Sou fiador(a)" },
  { value: "outro", label: "Outro" }];

export default function EnviarClient() {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [papel, setPapel] = useState("");
  const [papelOutro, setPapelOutro] = useState("");
  const [parteImportante, setParteImportante] = useState("");
  const [contextoExtra, setContextoExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<any>(null);

  const papelFinal = useMemo(() => {
    if (papel === "outro") return papelOutro.trim();
    return papel.trim();
  }, [papel, papelOutro]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setResultado(null);

    if (!arquivo) {
      setErro("Envie o contrato para continuar.");
      return;
    }

    if (!papelFinal) {
      setErro("Selecione qual é o seu papel no contrato.");
      return;
    }

    if (!parteImportante.trim()) {
      setErro("Conte qual parte do contrato você quer analisar com mais atenção.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", arquivo);
      formData.append("papelNoContrato", papelFinal);
      formData.append("parteImportante", parteImportante.trim());
      formData.append("contextoExtra", contextoExtra.trim());

      const res = await fetch("/api/analisar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível analisar o contrato.");
      }

      setResultado(data);
    } catch (err: any) {
      setErro(err?.message || "Ocorreu um erro ao analisar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f8f9fb] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-xl md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#123047]">
            Envie seu contrato
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A Clara analisa melhor quando entende qual é a sua posição no contrato
            e qual ponto merece mais atenção.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#123047]">
              Contrato
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="block w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">
              Formatos aceitos: PDF, DOC, DOCX e TXT.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#123047]">
              Qual é o seu papel no contrato? <span className="text-red-500">*</span>
            </label>
            <select
              value={papel}
              onChange={(e) => setPapel(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
            >
              {PAPEL_OPTIONS.map((item) => (
                <option key={item.value || "placeholder"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {papel === "outro" && (
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#123047]">
                Qual é o seu papel?
              </label>
              <input
                type="text"
                value={papelOutro}
                onChange={(e) => setPapelOutro(e.target.value)}
                placeholder="Ex.: sócia, avalista, representante comercial..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#123047]">
              Qual parte do contrato você quer analisar com mais atenção? <span className="text-red-500">*</span>
            </label>
            <textarea
              value={parteImportante}
              onChange={(e) => setParteImportante(e.target.value)}
              rows={4}
              placeholder="Ex.: multa de cancelamento, prazo de fidelidade, reajuste, rescisão, juros, responsabilidade, renovação automática..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#123047]">
              Contexto adicional
            </label>
            <textarea
              value={contextoExtra}
              onChange={(e) => setContextoExtra(e.target.value)}
              rows={4}
              placeholder="Ex.: já assinei, ainda estou negociando, recebi hoje, estou com medo de multa, quero cancelar, sou a parte mais vulnerável..."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none"
            />
          </div>

          {erro && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-[#123047] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Analisando..." : "Analisar contrato"}
          </button>
        </form>

        {resultado && (
          <section className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-xl font-bold text-[#123047]">Resultado da análise</h2>

            {resultado?.resumo && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Resumo</h3>
                <p className="text-sm leading-6 text-slate-700">{resultado.resumo}</p>
              </div>
            )}

            {resultado?.pontosAtencao && Array.isArray(resultado.pontosAtencao) && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-slate-800">Pontos de atenção</h3>
                <ul className="space-y-2 text-sm text-slate-700">
                  {resultado.pontosAtencao.map((item: string, idx: number) => (
                    <li key={idx} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resultado?.orientacaoFinal && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Orientação final</h3>
                <p className="text-sm leading-6 text-slate-700">{resultado.orientacaoFinal}</p>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
