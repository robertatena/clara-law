"use client";


import LegalInsightsCard from "@/components/LegalInsightsCard"
import { useEffect, useRef, useState } from "react";

type ResultData = {
  score?: number;
  nota_geral?: number;
  resumo?: string;
  visao_geral?: string[];

  riscos_principais?: Array<{
    titulo?: string;
    linguagem_simples?: string;
    risco?: string;
  }>;

  pontos_atencao?: Array<{
    titulo?: string;
    explicacao?: string;
    risco?: string;
    por_que_importa?: string;
  }>;

  perguntas_para_negociar?: string[];

  email_pronto?: {
    assunto?: string;
    corpo?: string;
  };

  analise_completa?: {
  leitura_detalhada?: string[];
  recomendacoes?: string[];
};

base_legal?: Array<{
  titulo?: string;
  fundamento?: string;
}>;

grafico_risco?: {
  financeiro?: number;
  saida?: number;
  obrigacoes?: number;
};

  paywall?: {
    locked?: boolean;
    cta?: string;
    subtexto?: string;
  };

  orientacao_final?: string;
};

const CONTRACT_TYPES = [
  "União estável / família",
  "Locação",
  "Compra e venda",
  "Prestação de serviços",
  "Trabalho",
  "Financiamento / empréstimo",
  "Plano de saúde",
  "Educação",
  "Assinatura / fidelidade",
  "Outro",
];

const ROLE_OPTIONS = [
  "Sou cliente / consumidor(a)",
  "Sou contratante",
  "Sou contratado(a) / prestador(a)",
  "Sou locatário(a) / inquilino(a)",
  "Sou locador(a) / proprietário(a)",
  "Sou comprador(a)",
  "Sou vendedor(a)",
  "Sou empregado(a)",
  "Sou empregador(a)",
  "Sou aluno(a)",
  "Sou responsável",
  "Sou fiador(a)",
  "Outro",
];

export default function Page() {

  // ✅ cálculo correto central
async function registrarLead(payload: any) {
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Erro ao registrar lead:", err);
    }
  }

  const [step, setStep] = useState(1);

  const [contractType, setContractType] = useState("União estável / família");
  const [inputMethod, setInputMethod] = useState<"upload" | "paste">("upload");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [papelNoContrato, setPapelNoContrato] = useState("");
  const [statusContrato, setStatusContrato] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultData | null>(null);


const [unlockedAnalysis, setUnlockedAnalysis] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const contractTextRef = useRef<HTMLTextAreaElement | null>(null);
  const focusRef = useRef<HTMLTextAreaElement | null>(null);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const [reviewData, setReviewData] = useState({
    contractText: "",
    parteImportante: "",
    nome: "",
    email: "",
  });

  // Restaura análise após retorno do pagamento Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("unlocked") === "true") {
      const saved = localStorage.getItem("clara_resultado");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.resultado) {
            setResultado(parsed.resultado);
            if (parsed.contractType) setContractType(parsed.contractType);
            setUnlockedAnalysis(true);
            setStep(9);
            window.history.replaceState({}, "", "/enviar");
          }
        } catch {
          // ignora erro de parse
        }
      }
    }
  }, []);

  async function handleCheckout() {
    if (!resultado) return;
    setCheckoutLoading(true);
    setError("");
    // Persiste resultado para restaurar após o redirect
    localStorage.setItem(
      "clara_resultado",
      JSON.stringify({ resultado, contractType })
    );
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: reviewData.email || "nao_informado@clara.law",
          origin: window.location.origin,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Não foi possível iniciar o pagamento. Tente novamente.");
      }
    } catch {
      setError("Erro ao iniciar o pagamento.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  function next() {
    setError("");

    if (step === 1 && !contractType) {
      setError("Escolha o tipo de contrato.");
      return;
    }

    if (step === 2) {
      if (inputMethod === "upload" && !file) {
        setError("Envie um arquivo para continuar.");
        return;
      }
      const pasted = contractTextRef.current?.value || "";
      if (inputMethod === "paste" && pasted.trim().length < 50) {
        setError("Cole pelo menos um trecho relevante do contrato.");
        return;
      }
    }

    if (step === 3 && !papelNoContrato) {
      setError("Escolha seu papel no contrato.");
      return;
    }

    if (step === 4) {
      const parte = focusRef.current?.value || "";
      if (!parte.trim()) {
        setError("Conte qual parte você quer entender melhor.");
        return;
      }
    }

    if (step === 5 && !statusContrato) {
      setError("Escolha sua situação.");
      return;
    }

    if (step === 6) {
      const nome = nameRef.current?.value || "";
      if (!nome.trim()) {
        setError("Preencha seu nome.");
        return;
      }
    }

    if (step === 7) {
      const email = emailRef.current?.value || "";
      if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Digite um e-mail válido.");
        return;
      }

      setReviewData({
        contractText: contractTextRef.current?.value || "",
        parteImportante: focusRef.current?.value || "",
        nome: nameRef.current?.value || "",
        email: emailRef.current?.value || "",
      });
    }

    setStep((s) => s + 1);
  }

  function back() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function analisar() {
    try {
      setLoading(true);
      setError("");
      setResultado(null);

      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("contractText", reviewData.contractText);
      formData.append("contractType", contractType);
      formData.append("papelNoContrato", papelNoContrato);
      formData.append("parteImportante", reviewData.parteImportante);
      formData.append(
        "contextoExtra",
        `Nome: ${reviewData.nome}. E-mail: ${reviewData.email}. Situação: ${statusContrato}.`
      );

      const res = await fetch("/api/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      const raw = await res.text();

      let data: any;
      try {
        data = JSON.parse(raw);
      } catch {
        console.error("Resposta não JSON:", raw);
        throw new Error("A rota de análise respondeu em formato inválido.");
      }

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível analisar o contrato.");
      }

      setUnlockedAnalysis(false);
      setResultado(data);

      registrarLead({
        nome: reviewData.nome || "",
        email: reviewData.email || "",
        tipoContrato: contractType || "",
        papel: papelNoContrato || "",
        situacao: statusContrato || "",
        arquivo: inputMethod === "upload" ? (fileName || "upload") : "texto_colado",
        nota: data?.nota_geral || "",
        evento: "analise_gerada",
        origem: "clara-law",
      });

      setStep(9);
    } catch (err: any) {
      setError(err?.message || "Erro ao analisar o contrato.");
    } finally {
      setLoading(false);
    }
  }

  function Shell({
    title,
    subtitle,
    children,
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8">
        <h2 className="text-3xl font-bold text-[#0e2b50]">{title}</h2>
        <p className="mt-2 text-base text-slate-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </div>
    );
  }

  function Nav({
    nextLabel = "Continuar",
    hideBack = false,
    onNext = next,
  }: {
    nextLabel?: string;
    hideBack?: boolean;
    onNext?: () => void;
  }) {
    return (
      <div className="mt-8 flex items-center justify-between mobile-action-row">
        <div>
          {!hideBack && step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Voltar
            </button>
          ) : (
            <div />
          )}
        </div>

        <button
          type="button"
          onClick={onNext}
          className="rounded-full bg-[#0e2b50] px-6 py-3 text-sm font-semibold text-white"
        >
          {nextLabel}
        </button>
      </div>
    );
  }

  return (
    <main className="clara-mobile-fix min-h-screen bg-[#f6f8fc] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">Vamos por etapas.</p>
            <h1 className="text-5xl font-black text-[#0e2b50]">
              {step === 9 ? "Resultado da análise" : "Entenda seu contrato"}
            </h1>
          </div>

          <a
            href="/"
            className="rounded-full border border-slate-200 bg-white px-6 py-4 text-[15px] font-semibold text-[#0e2b50]"
          >
            Voltar para a Home
          </a>
        </div>

        <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600">Etapa</span>
            <span className="text-sm font-semibold text-[#2854ff]">{Math.min(step, 7)}/7</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-[#2854ff]"
              style={{ width: `${(Math.min(step, 7) / 7) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {step === 1 && (
          <Shell
            title="Que tipo de contrato você quer analisar?"
            subtitle="Primeiro, escolha a categoria que mais se aproxima do seu caso."
          >
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none"
            >
              {CONTRACT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Nav hideBack />
          </Shell>
        )}

        {step === 2 && (
          <Shell
            title="Como você prefere enviar o contrato?"
            subtitle="Você pode anexar um arquivo ou colar o texto."
          >
            <div className="mb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setInputMethod("upload")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  inputMethod === "upload"
                    ? "bg-[#0e2b50] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Anexar arquivo
              </button>

              <button
                type="button"
                onClick={() => setInputMethod("paste")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  inputMethod === "paste"
                    ? "bg-[#0e2b50] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                Colar texto
              </button>
            </div>

            {inputMethod === "upload" ? (
              <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-5">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setFile(selected);
                    setFileName(selected?.name || "");
                  }}
                  className="block w-full rounded-[14px] border border-slate-300 bg-white px-4 py-3 text-base"
                />
                <p className="mt-3 text-sm text-slate-500">
                  {fileName || "Nenhum arquivo selecionado ainda."}
                </p>
              </div>
            ) : (
              <textarea
                ref={contractTextRef}
                defaultValue=""
                rows={12}
                placeholder="Cole aqui o texto do contrato..."
                className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none"
              />
            )}

            <Nav />
          </Shell>
        )}

        {step === 3 && (
          <Shell
            title="Qual é o seu papel nesse contrato?"
            subtitle="Isso ajuda a Clara a interpretar os pontos com mais contexto."
          >
            <select
              value={papelNoContrato}
              onChange={(e) => setPapelNoContrato(e.target.value)}
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none"
            >
              <option value="">Selecione</option>
              {ROLE_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <Nav />
          </Shell>
        )}

        {step === 4 && (() => {
          setTimeout(() => setStep(6), 0)
          return null
        })()}

        {step === 5 && null}

        {step === 6 && (
          <Shell
            title="Como a Clara pode te chamar?"
            subtitle="Só para deixar a experiência mais próxima."
          >
            <input
              ref={nameRef}
              defaultValue=""
              placeholder="Seu nome"
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none"
            />
            <Nav />
          </Shell>
        )}

        {step === 7 && (
          <Shell
            title="Qual é o seu e-mail?"
            subtitle="Usamos isso para organizar a sua análise."
          >
            <input
              ref={emailRef}
              defaultValue=""
              type="email"
              placeholder="voce@email.com"
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none"
            />
            <Nav nextLabel="Revisar respostas" />
          </Shell>
        )}

        {step === 8 && (
          <Shell
            title="Tudo certo para analisar"
            subtitle="Veja se esse resumo representa bem o seu contexto."
          >
            <div className="grid gap-4 md:grid-cols-2 mobile-summary-grid">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Tipo de contrato</div>
                <div className="mt-1 text-lg font-semibold text-[#123047]">{contractType}</div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Envio</div>
                <div className="mt-1 text-lg font-semibold text-[#123047]">
                  {inputMethod === "upload" ? (fileName || "Arquivo") : "Texto colado"}
                </div>
              </div>

              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Seu papel</div>
                <div className="mt-1 text-lg font-semibold text-[#123047]">{papelNoContrato}</div>
              </div>

              {statusContrato ? (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Situação</div>
                  <div className="mt-1 text-lg font-semibold text-[#123047]">{statusContrato}</div>
                </div>
              ) : null}
            </div>

            {reviewData.parteImportante ? (
              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Ponto principal de atenção</div>
                <div className="mt-1 text-lg font-semibold text-[#123047]">
                  {reviewData.parteImportante}
                </div>
              </div>
            ) : null}

            <div className="mt-8 flex items-center justify-between mobile-action-row">
              <button
                type="button"
                onClick={back}
                className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={analisar}
                disabled={loading}
                className="rounded-full bg-[#0e2b50] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Analisando..." : "Analisar contrato"}
              </button>
            </div>
          </Shell>
        )}

        {step === 9 && (
  <Shell
    title="Resumo inicial do contrato"
    subtitle="A Clara organizou os principais pontos para facilitar sua leitura."
  >
    {!resultado ? (
      <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-5 text-slate-600">
        Nenhum resultado encontrado.
      </div>
    ) : (
      <div className="space-y-5">
        {/* Card de Nota */}
        {(() => {
          const nota = resultado.nota_geral ?? resultado.score ?? null;
          if (nota === null) return null;
          const faltam = Math.max(0, 100 - nota);

          const config =
            nota >= 70
              ? {
                  ring: "#22c55e",
                  ringLight: "#bbf7d0",
                  bg: "from-green-50 to-white",
                  border: "border-green-200",
                  text: "text-green-600",
                  badge: "bg-green-100 text-green-700",
                  label: "Bom",
                  emoji: "🟡",
                  headline: "Ainda há brechas que podem te custar caro.",
                  sub: "Contratos com nota abaixo de 80 ainda expõem você a riscos evitáveis.",
                  stat: "1 em cada 3 contratos nessa faixa gera algum tipo de disputa.",
                }
              : nota >= 45
              ? {
                  ring: "#f59e0b",
                  ringLight: "#fde68a",
                  bg: "from-amber-50 to-white",
                  border: "border-amber-200",
                  text: "text-amber-500",
                  badge: "bg-amber-100 text-amber-700",
                  label: "Precisa de atenção",
                  emoji: "🔶",
                  headline: "Seu contrato tem brechas que podem ser usadas contra você.",
                  sub: "Cláusulas mal redigidas são a principal causa de prejuízo em contratos comuns.",
                  stat: "Contratos nessa faixa têm 2x mais chance de gerar cobranças inesperadas.",
                }
              : {
                  ring: "#ef4444",
                  ringLight: "#fecaca",
                  bg: "from-red-50 to-white",
                  border: "border-red-200",
                  text: "text-red-500",
                  badge: "bg-red-100 text-red-700",
                  label: "Em risco",
                  emoji: "🔴",
                  headline: "Esse contrato tem falhas sérias que precisam ser resolvidas antes de assinar.",
                  sub: "Assinar sem revisar pode gerar obrigações que você não esperava.",
                  stat: "Contratos com essa nota são os mais comuns em disputas jurídicas.",
                };

          return (
            <div className={`rounded-[20px] border ${config.border} bg-gradient-to-b ${config.bg} p-6 shadow-sm`}>

              {/* Topo: badge de status */}
              <div className="mb-4 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${config.badge}`}>
                  {config.emoji} {config.label}
                </span>
                <span className="text-xs text-slate-400">Segurança contratual</span>
              </div>

              {/* Linha principal: círculo + texto */}
              <div className="flex items-center gap-5">
                {/* Círculo */}
                <div className="relative flex-shrink-0">
                  <div
                    className="flex h-24 w-24 items-center justify-center rounded-full border-[6px]"
                    style={{ borderColor: config.ringLight }}
                  >
                    <div
                      className="absolute inset-0 rounded-full border-[6px]"
                      style={{
                        borderColor: config.ring,
                        clipPath: `inset(0 ${100 - nota}% 0 0 round 100px)`,
                      }}
                    />
                    <div className="text-center">
                      <span className={`block text-3xl font-black leading-none ${config.text}`}>{nota}</span>
                      <span className="text-[11px] font-semibold text-slate-400">/100</span>
                    </div>
                  </div>
                </div>

                {/* Texto ao lado */}
                <div className="flex-1">
                  <p className="text-base font-bold leading-snug text-[#0e2b50]">
                    {config.headline}
                  </p>
                  {faltam > 0 && (
                    <p className={`mt-1 text-sm font-semibold ${config.text}`}>
                      Faltam {faltam} pontos para blindar seu contrato.
                    </p>
                  )}
                </div>
              </div>

              {/* Barra de progresso com gap visível */}
              <div className="mt-5">
                <div className="mb-1 flex justify-between text-xs text-slate-400">
                  <span>Proteção atual</span>
                  <span>{nota}/100</span>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full transition-all duration-700"
                    style={{ width: `${nota}%`, backgroundColor: config.ring }}
                  />
                  {faltam > 0 && (
                    <div
                      className="absolute right-0 top-0 h-3 rounded-r-full"
                      style={{ width: `${faltam}%`, background: "repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.06) 4px, rgba(0,0,0,0.06) 8px)" }}
                    />
                  )}
                </div>
                <p className="mt-2 text-xs text-slate-500 italic">{config.stat}</p>
              </div>
            </div>
          );
        })()}

        {resultado.grafico_risco && (() => {
          const areas = [
            { label: "Impacto financeiro", value: resultado.grafico_risco!.financeiro ?? 0 },
            { label: "Saída do contrato", value: resultado.grafico_risco!.saida ?? 0 },
            { label: "Obrigações e responsabilidades", value: resultado.grafico_risco!.obrigacoes ?? 0 },
          ];
          function areaStyle(v: number) {
            if (v >= 60) return { bar: "bg-red-500", badge: "bg-red-100 text-red-700", label: "Alto risco" };
            if (v >= 35) return { bar: "bg-amber-400", badge: "bg-amber-100 text-amber-700", label: "Atenção" };
            return { bar: "bg-green-500", badge: "bg-green-100 text-green-700", label: "Baixo risco" };
          }
          return (
            <div className="rounded-[18px] border border-slate-200 bg-white p-6">
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Diagnóstico do contrato</div>
              <h3 className="text-xl font-bold text-[#0e2b50]">Quanto ainda falta para seu contrato estar seguro</h3>
              <p className="mt-1 text-sm text-slate-500">Quanto maior a barra, maior a exposição ainda presente nessa área.</p>
              <div className="mt-5 space-y-5">
                {areas.map((item, idx) => {
                  const s = areaStyle(item.value);
                  return (
                    <div key={idx}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badge}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="relative h-2 rounded-full bg-slate-100">
                        <div
                          className={`h-2 rounded-full ${s.bar} transition-all`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <div className="mt-1 text-right text-xs text-slate-400">{item.value}% de exposição</div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-5 rounded-[12px] bg-slate-50 px-4 py-3 text-sm text-slate-600">
                A análise completa mostra exatamente o que fazer em cada uma dessas áreas.
              </p>
            </div>
          );
        })()}

        {resultado.resumo && (
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-bold text-[#0e2b50]">Resumo da leitura</h3>
            <p className="mt-2 text-base leading-7 text-slate-700">{resultado.resumo}</p>
          </div>
        )}

        {(() => {
          const todosPontos = [
            ...(resultado.riscos_principais || []).map((r: any) => ({
              titulo: r.titulo,
              explicacao: r.linguagem_simples,
              risco: r.risco,
              por_que_importa: undefined as string | undefined,
            })),
            ...(resultado.pontos_atencao || []).map((p: any) => ({
              titulo: p.titulo,
              explicacao: p.explicacao,
              risco: p.risco,
              por_que_importa: p.por_que_importa as string | undefined,
            })),
          ];
          if (todosPontos.length === 0) return null;
          function riscoStyles(risco?: string) {
            const r = (risco || "").toLowerCase();
            if (r === "alto") return { card: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700" };
            if (r === "medio" || r === "médio") return { card: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700" };
            if (r === "baixo") return { card: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-700" };
            return { card: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-700" };
          }
          return (
            <div className="rounded-[18px] border border-slate-200 bg-white p-5">
              <h3 className="text-xl font-bold text-[#0e2b50]">Pontos de atenção</h3>
              <div className="mt-3 space-y-3">
                {todosPontos.slice(0, 2).map((item, idx) => {
                  const styles = riscoStyles(item.risco);
                  return (
                    <div key={idx} className={`rounded-[14px] border p-4 ${styles.card}`}>
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="text-lg font-bold text-[#123047]">{item.titulo || `Ponto ${idx + 1}`}</h4>
                        {item.risco && (
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                            Risco {item.risco}
                          </span>
                        )}
                      </div>
                      {item.explicacao && (
                        <p className="mt-2 text-base leading-7 text-slate-700">{item.explicacao}</p>
                      )}
                      {item.por_que_importa && (
                        <div className="mt-3 rounded-[10px] bg-white px-4 py-3">
                          <span className="text-sm font-semibold text-[#123047]">Por que importa: </span>
                          <span className="text-sm text-slate-700">{item.por_que_importa}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {todosPontos.length > 2 && (
                  <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                    <span className="text-sm text-slate-500">
                      🔒 + {todosPontos.length - 2} pontos adicionais na análise completa
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {Array.isArray(resultado.base_legal) && resultado.base_legal.length > 0 && (
          <div className="rounded-[18px] border border-slate-200 bg-white p-5">
            <h3 className="text-xl font-bold text-[#0e2b50]">Base legal relacionada</h3>
            <div className="mt-3 space-y-3">
              {resultado.base_legal.map((item: any, idx: number) => (
                <div key={idx} className="rounded-[14px] bg-slate-50 p-4">
                  <div className="font-semibold text-[#123047]">{item.titulo}</div>
                  <div className="mt-1 text-sm text-slate-700">{item.fundamento}</div>
                  {item.titulo && (
                    <a
                      href={`https://www.jusbrasil.com.br/busca?q=${encodeURIComponent(`${item.titulo} ${contractType}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-[#2854ff] hover:underline"
                    >
                      Ver no JusBrasil →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <LegalInsightsCard contractType={contractType} pontos={resultado.pontos_atencao} />

        <div className="rounded-[18px] border-2 border-[#0e2b50] bg-white p-8">
          <h3 className="text-xl font-bold text-[#0e2b50]">
            Você está a um clique de evitar um problema no seu contrato
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {resultado.paywall?.subtexto || "Desbloqueie a análise completa e proteja-se antes de assinar."}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Leitura detalhada cláusula por cláusula</li>
            <li>• Recomendações práticas para negociar</li>
            <li>• E-mail pronto com cada ponto do contrato</li>
            <li>• Perguntas para revisar com advogado ou com a outra parte</li>
          </ul>
          <button
            type="button"
            onClick={() => window.location.href = "https://buy.stripe.com/28E6oH7Wc58p2cb6mj57W00"}
            className="mt-6 w-full rounded-full bg-[#0e2b50] py-3 text-sm font-semibold text-white"
          >
            Desbloquear análise completa →
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">Acesso imediato · Pagamento único</p>
        </div>

        {unlockedAnalysis && (
          <div className="space-y-4">
            {resultado.analise_completa && (
              <div className="rounded-[14px] bg-slate-50 p-4">
                <h4 className="text-lg font-bold text-[#123047]">Análise completa</h4>

                {Array.isArray(resultado.analise_completa.leitura_detalhada) &&
                  resultado.analise_completa.leitura_detalhada.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-2 text-sm font-semibold text-slate-500">Leitura detalhada</div>
                      <ul className="space-y-2">
                        {resultado.analise_completa.leitura_detalhada.map((item: string, idx: number) => (
                          <li key={idx} className="rounded-[12px] bg-white px-4 py-3 text-slate-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                {Array.isArray(resultado.analise_completa.recomendacoes) &&
                  resultado.analise_completa.recomendacoes.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-semibold text-slate-500">Recomendações</div>
                      <ul className="space-y-2">
                        {resultado.analise_completa.recomendacoes.map((item: string, idx: number) => (
                          <li key={idx} className="rounded-[12px] bg-white px-4 py-3 text-slate-700">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            {Array.isArray(resultado.perguntas_para_negociar) && resultado.perguntas_para_negociar.length > 0 && (
              <div className="rounded-[14px] bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-lg font-bold text-[#123047]">Perguntas para negociar</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const texto = resultado.perguntas_para_negociar!
                        .map((q: string, i: number) => `${i + 1}. ${q}`)
                        .join("\n");
                      navigator.clipboard.writeText(texto);
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#0e2b50]"
                  >
                    Copiar tudo
                  </button>
                </div>
                <ul className="mt-3 space-y-2">
                  {resultado.perguntas_para_negociar.map((item: string, idx: number) => (
                    <li key={idx} className="rounded-[12px] bg-white px-4 py-3 text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resultado.email_pronto && (
              <div className="rounded-[14px] bg-slate-50 p-4">
                <h4 className="text-lg font-bold text-[#123047]">E-mail pronto</h4>

                <div className="mt-3 rounded-[12px] bg-white p-4">
                  <div className="text-sm text-slate-500">Assunto</div>
                  <div className="mt-1 font-semibold text-[#123047]">
                    {resultado.email_pronto.assunto}
                  </div>
                </div>

                <div className="mt-3 rounded-[12px] bg-white p-4 text-slate-700 whitespace-pre-line">
                  {resultado.email_pronto.corpo}
                </div>
              </div>
            )}
          </div>
        )}

        {resultado.orientacao_final && (
          <div className="rounded-[18px] border border-slate-200 bg-[#f8fbff] p-5">
            <h3 className="text-xl font-bold text-[#0e2b50]">Orientação final</h3>
            <p className="mt-2 text-base leading-7 text-slate-700">{resultado.orientacao_final}</p>
          </div>
        )}
      </div>
    )}
  </Shell>
)}
      </div>
    
      <style jsx global>{`
        .clara-mobile-style-patch {}

        @media (max-width: 768px) {
          .clara-mobile-fix {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }

          .clara-mobile-fix h1 {
            font-size: 2.7rem !important;
            line-height: 0.95 !important;
            letter-spacing: -0.03em !important;
          }

          .clara-mobile-fix h2 {
            font-size: 2rem !important;
            line-height: 1.05 !important;
          }

          .clara-mobile-fix .mobile-summary-grid,
          .clara-mobile-fix [class*="md:grid-cols-2"] {
            grid-template-columns: 1fr !important;
          }

          .clara-mobile-fix .mobile-action-row {
            flex-direction: column-reverse !important;
            align-items: stretch !important;
            gap: 12px !important;
          }

          .clara-mobile-fix .mobile-action-row button,
          .clara-mobile-fix .mobile-action-row a {
            width: 100% !important;
            justify-content: center !important;
          }

          .clara-mobile-fix input,
          .clara-mobile-fix select,
          .clara-mobile-fix textarea {
            font-size: 16px !important;
            min-height: 52px !important;
          }

          .clara-mobile-fix textarea {
            min-height: 180px !important;
          }

          .clara-mobile-fix [class*="rounded-[24px]"],
          .clara-mobile-fix [class*="rounded-[20px]"],
          .clara-mobile-fix [class*="rounded-[18px]"] {
            border-radius: 18px !important;
          }

          .clara-mobile-fix [class*="p-5"] {
            padding: 18px !important;
          }

          .clara-mobile-fix [class*="p-4"] {
            padding: 16px !important;
          }

          .clara-mobile-fix [class*="px-5"] {
            padding-left: 18px !important;
            padding-right: 18px !important;
          }

          .clara-mobile-fix [class*="py-4"] {
            padding-top: 14px !important;
            padding-bottom: 14px !important;
          }

          .clara-mobile-fix [class*="text-lg"] {
            font-size: 1rem !important;
          }

          .clara-mobile-fix [class*="text-sm"] {
            font-size: 0.9rem !important;
          }
        }
      `}</style>
    </main>
  );
}













// force redeploy 2026-03-27 17:30:28
















