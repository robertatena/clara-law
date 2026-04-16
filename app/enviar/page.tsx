"use client";

import LegalInsightsCard from "@/components/LegalInsightsCard";
import { useEffect, useRef, useState } from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Modo = "contrato" | "caso" | null;

type TipoCaso =
  | "voo_atrasado"
  | "voo_cancelado"
  | "bagagem"
  | "produto_defeito"
  | "cobranca_indevida"
  | "servico_nao_entregue"
  | "outro";

type ResultData = {
  score?: number;
  nota_geral?: number;
  resumo?: string;
  visao_geral?: string[];
  riscos_principais?: Array<{ titulo?: string; linguagem_simples?: string; risco?: string }>;
  pontos_atencao?: Array<{ titulo?: string; explicacao?: string; risco?: string; por_que_importa?: string }>;
  perguntas_para_negociar?: string[];
  email_pronto?: { assunto?: string; corpo?: string };
  analise_completa?: { leitura_detalhada?: string[]; recomendacoes?: string[] };
  base_legal?: Array<{ titulo?: string; fundamento?: string }>;
  grafico_risco?: { financeiro?: number; saida?: number; obrigacoes?: number };
  paywall?: { locked?: boolean; cta?: string; subtexto?: string };
  orientacao_final?: string;
  plano_acao?: {
    resumo_direitos?: string;
    email_empresa?: { assunto: string; corpo: string };
    valor_estimado?: string;
  };
};

// ─── DADOS ────────────────────────────────────────────────────────────────────

const CONTRACT_TYPES = [
  "União estável / família", "Locação", "Compra e venda", "Prestação de serviços",
  "Trabalho", "Financiamento / empréstimo", "Plano de saúde", "Educação",
  "Assinatura / fidelidade", "Outro",
];

const ROLE_OPTIONS = [
  "Sou cliente / consumidor(a)", "Sou contratante", "Sou contratado(a) / prestador(a)",
  "Sou locatário(a) / inquilino(a)", "Sou locador(a) / proprietário(a)", "Sou comprador(a)",
  "Sou vendedor(a)", "Sou empregado(a)", "Sou empregador(a)", "Sou aluno(a)",
  "Sou responsável", "Sou fiador(a)", "Outro",
];

const SITUACOES_CASO: { id: TipoCaso; icon: string; titulo: string; desc: string }[] = [
  { id: "voo_atrasado",         icon: "⏱️", titulo: "Meu voo atrasou",                           desc: "Fiquei esperando no aeroporto e não fui assistido como deveria" },
  { id: "voo_cancelado",        icon: "✈️", titulo: "Meu voo foi cancelado",                     desc: "A companhia cancelou o voo sem oferecer solução adequada" },
  { id: "bagagem",              icon: "🧳", titulo: "Minha bagagem foi perdida ou danificada",   desc: "Mala extraviada, violada ou com itens danificados" },
  { id: "produto_defeito",      icon: "📦", titulo: "Comprei algo com defeito",                  desc: "A loja ou fabricante se recusa a trocar, consertar ou devolver" },
  { id: "cobranca_indevida",    icon: "💳", titulo: "Cobrança indevida ou Serasa",               desc: "Cobraram algo que não devo ou colocaram meu nome no SPC/Serasa" },
  { id: "servico_nao_entregue", icon: "🔧", titulo: "Paguei por um serviço que não foi entregue", desc: "Empresa não entregou o serviço contratado e não quer devolver" },
];

const CIAS_AEREAS = [
  {
    id: "latam", nome: "LATAM Airlines",
    canal: "Formulário online na Central de Ajuda",
    link: "https://www.latamairlines.com/br/pt/central-ajuda",
    sac: "0800 0123 200",
  },
  {
    id: "gol", nome: "GOL Linhas Aéreas",
    canal: "Formulário online em Fale com a GOL",
    link: "https://www.voegol.com.br/atendimento",
    sac: "0800 704 0465",
  },
  {
    id: "azul", nome: "Azul Linhas Aéreas",
    canal: "WhatsApp e formulário online",
    link: "https://www.voeazul.com.br/atendimento",
    sac: "0800 884 4040",
  },
  {
    id: "outra", nome: "Outra companhia",
    canal: "A Clara vai te ajudar a encontrar o canal certo",
    link: "", sac: "",
  },
];

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function Page() {

  const [modo, setModo] = useState<Modo>(null);
  const [step, setStep] = useState(0);

  const [contractType, setContractType] = useState("União estável / família");
  const [inputMethod, setInputMethod] = useState<"upload" | "paste">("upload");
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [papelNoContrato, setPapelNoContrato] = useState("");
  const contractTextRef = useRef<HTMLTextAreaElement | null>(null);

  const [tipoCaso, setTipoCaso] = useState<TipoCaso | null>(null);
  const descricaoCasoRef = useRef<HTMLTextAreaElement | null>(null);
  const [ciaAerea, setCiaAerea] = useState("");

  const [emailUsuario, setEmailUsuario] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultData | null>(null);
  const [unlockedAnalysis, setUnlockedAnalysis] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const isVoo = tipoCaso === "voo_atrasado" || tipoCaso === "voo_cancelado" || tipoCaso === "bagagem";
  const totalStepsContrato = 5;
  const totalStepsCaso = isVoo ? 4 : 3;
  const totalSteps = modo === "contrato" ? totalStepsContrato : totalStepsCaso;

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
            setModo(parsed.modo || "contrato");
            setStep(99);
            window.history.replaceState({}, "", "/enviar");
          }
        } catch { /* ignora */ }
      }
    }
  }, []);

  async function registrarLead(payload: any) {
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) { console.error("Lead error:", err); }
  }

  function escolherModo(m: Modo) {
    setModo(m);
    setStep(1);
    setError("");
  }

  function next() {
    setError("");
    if (modo === "contrato") {
      if (step === 1 && !contractType) { setError("Escolha o tipo de contrato."); return; }
      if (step === 2) {
        if (inputMethod === "upload" && !file) { setError("Envie um arquivo para continuar."); return; }
        const pasted = contractTextRef.current?.value || "";
        if (inputMethod === "paste" && pasted.trim().length < 50) { setError("Cole pelo menos um trecho do contrato."); return; }
      }
      if (step === 3 && !papelNoContrato) { setError("Escolha seu papel no contrato."); return; }
    }
    if (modo === "caso") {
      if (step === 1 && !tipoCaso) { setError("Escolha o que aconteceu com você."); return; }
      if (step === 2 && (descricaoCasoRef.current?.value || "").trim().length < 30) { setError("Conta um pouco mais sobre o que aconteceu."); return; }
      if (step === 3 && isVoo && !ciaAerea) { setError("Selecione a companhia aérea."); return; }
    }
    setStep((s) => s + 1);
  }

  function back() {
    setError("");
    if (step === 1) { setModo(null); setStep(0); }
    else setStep((s) => Math.max(1, s - 1));
  }

  async function analisar() {
    try {
      setLoading(true); setError(""); setResultado(null);
      const formData = new FormData();
      if (file) formData.append("file", file);
      formData.append("contractText", contractTextRef.current?.value || "");
      formData.append("contractType", contractType);
      formData.append("papelNoContrato", papelNoContrato);
      formData.append("contextoExtra", `E-mail: ${emailUsuario}.`);
      const res = await fetch("/api/analyze-pdf", { method: "POST", body: formData });
      const raw = await res.text();
      let data: any;
      try { data = JSON.parse(raw); } catch { throw new Error("Resposta inválida da análise."); }
      if (!res.ok) throw new Error(data?.error || "Não foi possível analisar.");
      setUnlockedAnalysis(false);
      setResultado(data);
      registrarLead({
        email: emailUsuario, modo: "contrato",
        tipoContrato: contractType, papel: papelNoContrato,
        arquivo: inputMethod === "upload" ? (fileName || "upload") : "texto_colado",
        nota: data?.nota_geral || "", evento: "analise_gerada",
      });
      setStep(99);
    } catch (err: any) {
      setError(err?.message || "Erro ao analisar.");
    } finally { setLoading(false); }
  }

  async function analisarCaso() {
    try {
      setLoading(true); setError(""); setResultado(null);
      const descricaoCaso = descricaoCasoRef.current?.value || "";
      const situacao = SITUACOES_CASO.find((s) => s.id === tipoCaso);
      const cia = CIAS_AEREAS.find((c) => c.id === ciaAerea);
      const res = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modo: "caso", tipoCaso, descricaoCaso,
          ciaAerea: cia?.nome || "", email: emailUsuario,
          contextoExtra: `Tipo: ${situacao?.titulo}. Cia: ${cia?.nome || "N/A"}. Descrição: ${descricaoCaso}`,
        }),
      });
      const raw = await res.text();
      let data: any;
      try { data = JSON.parse(raw); } catch { data = {}; }
      if (!data.plano_acao) {
        data.plano_acao = {
          resumo_direitos: gerarResumoDireitos(tipoCaso!, cia),
          email_empresa: gerarEmailEmpresa(tipoCaso!, descricaoCaso, cia),
          valor_estimado: estimarValor(tipoCaso!),
        };
      }
      setResultado(data);
      registrarLead({ email: emailUsuario, modo: "caso", tipoCaso, ciaAerea, evento: "caso_gerado" });
      setStep(99);
    } catch (err: any) {
      setError(err?.message || "Erro ao analisar o caso.");
    } finally { setLoading(false); }
  }

  async function handleCheckout() {
    if (!resultado) return;
    setCheckoutLoading(true);
    localStorage.setItem("clara_resultado", JSON.stringify({ resultado, contractType, modo }));
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailUsuario || "nao_informado@clara.law", origin: window.location.origin }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Não foi possível iniciar o pagamento.");
    } catch { setError("Erro ao iniciar o pagamento."); }
    finally { setCheckoutLoading(false); }
  }

  const isResultado = step === 99;
  const progressStep = isResultado ? totalSteps : step;
  const showProgress = step > 0;

  return (
    <main className="clara-mobile-fix min-h-screen bg-[#f6f8fc] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">
              {step === 0 ? "A Clara está aqui para te ajudar." : "Vamos por etapas."}
            </p>
            <h1 className="text-5xl font-black text-[#0e2b50]">
              {isResultado && modo === "caso" ? "Seu plano de ação"
                : isResultado ? "Resultado da análise"
                : modo === "caso" ? "Resolva seu caso"
                : modo === "contrato" ? "Entenda seu contrato"
                : "O que você precisa hoje?"}
            </h1>
          </div>
          <a href="/" className="rounded-full border border-slate-200 bg-white px-6 py-4 text-[15px] font-semibold text-[#0e2b50]">
            Voltar para a Home
          </a>
        </div>

        {/* Progresso */}
        {showProgress && (
          <div className="mb-6 rounded-[24px] border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-600">Etapa</span>
              <span className="text-sm font-semibold text-[#2854ff]">{Math.min(progressStep, totalSteps)}/{totalSteps}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div className="h-3 rounded-full bg-[#2854ff] transition-all duration-500"
                style={{ width: `${(Math.min(progressStep, totalSteps) / totalSteps) * 100}%` }} />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-[20px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        )}

        {/* STEP 0: ESCOLHA DO MODO */}
        {step === 0 && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8">
            <p className="text-base text-slate-600 mb-6">Escolha o que se encaixa melhor na sua situação:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <button type="button" onClick={() => escolherModo("contrato")}
                className="rounded-[20px] border-2 border-slate-200 bg-slate-50 p-6 text-left hover:border-[#0e2b50] hover:bg-white transition-all">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-bold text-[#0e2b50] mb-2">Tenho um contrato para analisar</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Vou assinar algo e quero entender os riscos, ou já tenho um contrato com pontos de dúvida.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Locação", "Serviços", "Trabalho", "Financiamento"].map((t) => (
                    <span key={t} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{t}</span>
                  ))}
                </div>
              </button>

              <button type="button" onClick={() => escolherModo("caso")}
                className="rounded-[20px] border-2 border-slate-200 bg-slate-50 p-6 text-left hover:border-[#D4AF37] hover:bg-white transition-all">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-[#0e2b50] mb-2">Aconteceu algo e quero resolver</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tive um problema com uma empresa e quero saber o que fazer — e-mail, reclamação, ou juizado.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Voo atrasado", "Produto com defeito", "Cobrança indevida", "Serviço não entregue"].map((t) => (
                    <span key={t} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{t}</span>
                  ))}
                </div>
                <div className="mt-3 rounded-[10px] bg-green-50 border border-green-100 px-3 py-2 text-xs text-green-700 font-medium">
                  💡 Muitos casos se resolvem por e-mail — sem ir ao fórum
                </div>
              </button>
            </div>
          </div>
        )}

        {/* CONTRATO step 1 */}
        {modo === "contrato" && step === 1 && (
          <Shell title="Que tipo de contrato você quer analisar?" subtitle="Escolha a categoria que mais se aproxima do seu caso.">
            <select value={contractType} onChange={(e) => setContractType(e.target.value)}
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none">
              {CONTRACT_TYPES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CONTRATO step 2 */}
        {modo === "contrato" && step === 2 && (
          <Shell title="Como você prefere enviar o contrato?" subtitle="Você pode anexar um arquivo ou colar o texto.">
            <div className="mb-4 flex gap-3">
              {(["upload", "paste"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setInputMethod(m)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${inputMethod === m ? "bg-[#0e2b50] text-white" : "border border-slate-200 bg-white text-slate-700"}`}>
                  {m === "upload" ? "Anexar arquivo" : "Colar texto"}
                </button>
              ))}
            </div>
            {inputMethod === "upload" ? (
              <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50 p-5">
                <input type="file" accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => { const f = e.target.files?.[0] || null; setFile(f); setFileName(f?.name || ""); }}
                  className="block w-full rounded-[14px] border border-slate-300 bg-white px-4 py-3 text-base" />
                <p className="mt-3 text-sm text-slate-500">{fileName || "Nenhum arquivo selecionado ainda."}</p>
              </div>
            ) : (
              <textarea ref={contractTextRef} rows={12} placeholder="Cole aqui o texto do contrato..."
                className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none" />
            )}
            <Nav onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CONTRATO step 3 */}
        {modo === "contrato" && step === 3 && (
          <Shell title="Qual é o seu papel nesse contrato?" subtitle="Isso ajuda a Clara a interpretar os pontos com mais contexto.">
            <select value={papelNoContrato} onChange={(e) => setPapelNoContrato(e.target.value)}
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none">
              <option value="">Selecione</option>
              {ROLE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <Nav onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CONTRATO step 4 */}
        {modo === "contrato" && step === 4 && (
          <Shell title="Qual é o seu e-mail?" subtitle="Para você receber o resultado — opcional.">
            <input type="email" value={emailUsuario} onChange={(e) => setEmailUsuario(e.target.value)}
              placeholder="voce@email.com (opcional)"
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none" />
            <Nav nextLabel="Revisar e analisar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CONTRATO step 5 */}
        {modo === "contrato" && step === 5 && (
          <Shell title="Tudo certo para analisar" subtitle="Veja se esse resumo representa bem o seu contexto.">
            <div className="grid gap-4 md:grid-cols-2">
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
              {papelNoContrato && (
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">Seu papel</div>
                  <div className="mt-1 text-lg font-semibold text-[#123047]">{papelNoContrato}</div>
                </div>
              )}
            </div>
            <div className="mt-8 flex items-center justify-between mobile-action-row">
              <button type="button" onClick={back} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Voltar</button>
              <button type="button" onClick={analisar} disabled={loading} className="rounded-full bg-[#0e2b50] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {loading ? "Analisando..." : "Analisar contrato"}
              </button>
            </div>
          </Shell>
        )}

        {/* CASO step 1 */}
        {modo === "caso" && step === 1 && (
          <Shell title="O que aconteceu com você?" subtitle="Escolha a situação que melhor descreve o seu caso.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SITUACOES_CASO.map((s) => (
                <button key={s.id} type="button" onClick={() => setTipoCaso(s.id)}
                  className={`rounded-[18px] border-2 p-4 text-left transition-all ${tipoCaso === s.id ? "border-[#D4AF37] bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-[#0e2b50] mb-1">{s.titulo}</div>
                      <div className="text-xs text-slate-500 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 */}
        {modo === "caso" && step === 2 && (
          <Shell title="Conta com suas palavras o que aconteceu" subtitle="Quanto mais detalhe, mais preciso será o plano de ação da Clara.">
            <div className="mb-4 rounded-[14px] bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
              <strong className="font-medium">Dicas para um relato completo:</strong>
              <ul className="mt-2 space-y-1 text-xs text-blue-700">
                <li>• Quando aconteceu? (data e horário aproximados)</li>
                <li>• Qual empresa ou companhia?</li>
                <li>• O que foi prometido e o que você recebeu?</li>
                <li>• Quanto pagou ou quanto perdeu?</li>
                <li>• Já tentou resolver antes? Como responderam?</li>
              </ul>
            </div>
            <textarea ref={descricaoCasoRef} rows={10}
              placeholder="Ex: Meu voo estava marcado para às 14h e atrasou mais de 4 horas. A GOL só me deu um voucher de R$12 para lanche e não ofereceu hospedagem ou remarcação. Perdi uma reunião importante de trabalho..."
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none leading-relaxed" />
            <Nav nextLabel={isVoo ? "Continuar" : "Montar meu plano"} onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 3 — cia aérea (só para voos) */}
        {modo === "caso" && step === 3 && isVoo && (
          <Shell title="Qual foi a companhia aérea?" subtitle="A Clara vai te mostrar o canal oficial certo para reclamar.">
            <div className="space-y-3">
              {CIAS_AEREAS.map((cia) => (
                <button key={cia.id} type="button" onClick={() => setCiaAerea(cia.id)}
                  className={`w-full rounded-[18px] border-2 p-4 text-left transition-all ${ciaAerea === cia.id ? "border-[#D4AF37] bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-[#0e2b50]">{cia.nome}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{cia.canal}</div>
                    </div>
                    {cia.sac && <span className="text-xs text-slate-400 font-mono">{cia.sac}</span>}
                  </div>
                </button>
              ))}
            </div>
            <Nav nextLabel="Montar meu plano" onNext={() => { if (!ciaAerea) { setError("Selecione a companhia aérea."); return; } setStep(s => s + 1); }} onBack={back} />
          </Shell>
        )}

        {/* CASO step e-mail */}
        {modo === "caso" && step === (isVoo ? 4 : 3) && (
          <Shell title="Qual é o seu e-mail?" subtitle="Para enviar o plano de ação e acompanhar o caso — opcional.">
            <input type="email" value={emailUsuario} onChange={(e) => setEmailUsuario(e.target.value)}
              placeholder="voce@email.com (opcional)"
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-lg outline-none" />
            <div className="mt-8 flex items-center justify-between mobile-action-row">
              <button type="button" onClick={back} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Voltar</button>
              <button type="button" onClick={analisarCaso} disabled={loading} className="rounded-full bg-[#0e2b50] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
                {loading ? "Montando seu plano..." : "Montar meu plano de ação"}
              </button>
            </div>
          </Shell>
        )}

        {/* RESULTADO CASO */}
        {step === 99 && modo === "caso" && resultado && (
          <div className="space-y-5">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{SITUACOES_CASO.find(s => s.id === tipoCaso)?.icon || "⚡"}</span>
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Seu caso</div>
                  <div className="text-xl font-bold text-[#0e2b50]">{SITUACOES_CASO.find(s => s.id === tipoCaso)?.titulo}</div>
                </div>
              </div>
              {resultado.plano_acao?.resumo_direitos && (
                <div className="rounded-[14px] bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800 leading-relaxed">
                  {resultado.plano_acao.resumo_direitos}
                </div>
              )}
              {resultado.plano_acao?.valor_estimado && (
                <div className="mt-3 rounded-[14px] bg-green-50 border border-green-100 p-4">
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-1">Estimativa de indenização</div>
                  <div className="text-lg font-bold text-green-800">{resultado.plano_acao.valor_estimado}</div>
                  <div className="text-xs text-green-600 mt-1">Orientativo · depende do caso e do juiz</div>
                </div>
              )}
            </div>

            {/* Passo 1 */}
            <div className="rounded-[24px] border-2 border-green-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">1</div>
                <div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wider">Comece por aqui</div>
                  <div className="text-lg font-bold text-[#0e2b50]">Mande um e-mail para a empresa</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                A maioria dos casos se resolve nessa etapa. Um e-mail bem fundamentado faz a empresa levar a sério e responder em 48–72h.
              </p>
              {isVoo && ciaAerea && (() => {
                const cia = CIAS_AEREAS.find(c => c.id === ciaAerea);
                return cia ? (
                  <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 mb-4">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Canal oficial da {cia.nome}</div>
                    <div className="text-sm text-slate-700 mb-2">{cia.canal}</div>
                    {cia.link && (
                      <a href={cia.link} target="_blank" rel="noreferrer" className="inline-block rounded-full bg-[#0e2b50] text-white text-xs font-semibold px-4 py-2 mr-2">
                        Abrir canal oficial →
                      </a>
                    )}
                    {cia.sac && <span className="text-xs text-slate-500">ou ligue {cia.sac}</span>}
                  </div>
                ) : null;
              })()}
              {resultado.plano_acao?.email_empresa && (
                <div className="rounded-[14px] border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-[#0e2b50]">E-mail gerado pela Clara</div>
                    <button onClick={() => {
                      const texto = `Assunto: ${resultado.plano_acao?.email_empresa?.assunto}\n\n${resultado.plano_acao?.email_empresa?.corpo}`;
                      navigator.clipboard.writeText(texto);
                    }} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-[#0e2b50]">Copiar</button>
                  </div>
                  <div className="text-xs text-slate-400 mb-1">Assunto</div>
                  <div className="text-sm font-semibold text-[#0e2b50] mb-3">{resultado.plano_acao.email_empresa.assunto}</div>
                  <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-3">
                    {resultado.plano_acao.email_empresa.corpo}
                  </div>
                  <div className="mt-2">
                    <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">Gerado pela Clara · orientativo</span>
                  </div>
                </div>
              )}
            </div>

            {/* Passo 2 */}
            <div className="rounded-[24px] border border-amber-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Se a empresa não responder em 10 dias</div>
                  <div className="text-lg font-bold text-[#0e2b50]">Registre no consumidor.gov.br e na ANAC</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                O consumidor.gov.br é monitorado pelo governo. A empresa tem 10 dias para responder. Taxa de resolução: 8 em cada 10 casos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a href="https://www.consumidor.gov.br" target="_blank" rel="noreferrer"
                  className="rounded-[14px] border border-amber-200 bg-amber-50 p-4 block hover:bg-amber-100 transition-colors">
                  <div className="font-semibold text-amber-800 mb-1">consumidor.gov.br</div>
                  <div className="text-xs text-amber-700">Plataforma oficial do governo. Gratuito e monitorado pela ANAC e Senacon.</div>
                  <div className="mt-2 text-xs font-semibold text-amber-800">Acessar →</div>
                </a>
                {isVoo && (
                  <a href="https://falecomaanac.anac.gov.br" target="_blank" rel="noreferrer"
                    className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 block hover:bg-slate-100 transition-colors">
                    <div className="font-semibold text-slate-700 mb-1">ANAC — Fale Conosco</div>
                    <div className="text-xs text-slate-600">Canal direto da Agência Nacional de Aviação Civil. Tel: 163.</div>
                    <div className="mt-2 text-xs font-semibold text-slate-700">Acessar →</div>
                  </a>
                )}
              </div>
            </div>

            {/* Passo 3 */}
            <div className="rounded-[24px] border-2 border-[#D4AF37] bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <div className="text-xs font-semibold text-[#854F0B] uppercase tracking-wider">Se não resolver — sem advogado</div>
                  <div className="text-lg font-bold text-[#0e2b50]">Juizado Especial Cível</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                É de graça. Você mesmo protocola. A Clara gera a petição no formato certo e encontra o fórum competente pelo CEP da empresa.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {[
                  { icon: "💸", t: "É gratuito",   s: "Sem custas até o julgamento" },
                  { icon: "🤝", t: "Sem advogado", s: "Para causas até R$28 mil" },
                  { icon: "📧", t: "Por e-mail",   s: "Muitos foros aceitam protocolo online" },
                ].map((item) => (
                  <div key={item.t} className="rounded-[14px] bg-amber-50 border border-amber-100 p-3 text-center">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold text-amber-800">{item.t}</div>
                    <div className="text-xs text-amber-700 mt-0.5">{item.s}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 mb-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Modelo de negócio — fee por sucesso</div>
                <p className="text-sm text-slate-700 leading-relaxed">
                  A Clara gera sua petição agora. Você paga <strong>20% do valor ganho</strong> — e apenas se ganhar. Se não ganhar, não paga nada.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <a href="/forum" className="inline-block rounded-full bg-[#0e2b50] text-white text-sm font-semibold px-5 py-3">
                  Encontrar meu fórum →
                </a>
                <a href="/enviar" className="inline-block rounded-full border border-[#D4AF37] text-[#854F0B] text-sm font-semibold px-5 py-3">
                  Gerar minha petição JEC
                </a>
              </div>
            </div>
          </div>
        )}

        {/* RESULTADO CONTRATO */}
        {step === 99 && modo === "contrato" && resultado && (
          <ResultadoContrato resultado={resultado} contractType={contractType} unlockedAnalysis={unlockedAnalysis} />
        )}

      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .clara-mobile-fix { padding-left: 16px !important; padding-right: 16px !important; }
          .clara-mobile-fix h1 { font-size: 2.7rem !important; line-height: 0.95 !important; letter-spacing: -0.03em !important; }
          .clara-mobile-fix h2 { font-size: 2rem !important; line-height: 1.05 !important; }
          .clara-mobile-fix .mobile-action-row { flex-direction: column-reverse !important; align-items: stretch !important; gap: 12px !important; }
          .clara-mobile-fix .mobile-action-row button, .clara-mobile-fix .mobile-action-row a { width: 100% !important; justify-content: center !important; }
          .clara-mobile-fix input, .clara-mobile-fix select, .clara-mobile-fix textarea { font-size: 16px !important; min-height: 52px !important; }
          .clara-mobile-fix textarea { min-height: 180px !important; }
        }
      `}</style>
    </main>
  );
}

// ─── COMPONENTES AUXILIARES ───────────────────────────────────────────────────

function Shell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 md:p-8">
      <h2 className="text-3xl font-bold text-[#0e2b50]">{title}</h2>
      {subtitle && <p className="mt-2 text-base text-slate-600">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Nav({ nextLabel = "Continuar", onNext, onBack, disabled = false }: {
  nextLabel?: string; onNext: () => void; onBack: () => void; disabled?: boolean;
}) {
  return (
    <div className="mt-8 flex items-center justify-between mobile-action-row">
      <button type="button" onClick={onBack} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Voltar</button>
      <button type="button" onClick={onNext} disabled={disabled} className="rounded-full bg-[#0e2b50] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">{nextLabel}</button>
    </div>
  );
}

// ─── RESULTADO CONTRATO ───────────────────────────────────────────────────────

function ResultadoContrato({ resultado, contractType, unlockedAnalysis }: {
  resultado: ResultData; contractType: string; unlockedAnalysis: boolean;
}) {
  return (
    <div className="space-y-5">
      {(() => {
        const nota = resultado.nota_geral ?? resultado.score ?? null;
        if (nota === null) return null;
        const faltam = Math.max(0, 100 - nota);
        const config = nota >= 70
          ? { ring: "#22c55e", ringLight: "#bbf7d0", bg: "from-green-50 to-white", border: "border-green-200", text: "text-green-600", badge: "bg-green-100 text-green-700", label: "Bom", emoji: "🟢", headline: "Ainda há brechas que podem te custar caro.", stat: "1 em cada 3 contratos nessa faixa gera algum tipo de disputa." }
          : nota >= 45
          ? { ring: "#f59e0b", ringLight: "#fde68a", bg: "from-amber-50 to-white", border: "border-amber-200", text: "text-amber-500", badge: "bg-amber-100 text-amber-700", label: "Precisa de atenção", emoji: "🟡", headline: "Seu contrato tem brechas que podem ser usadas contra você.", stat: "Contratos nessa faixa têm 2x mais chance de gerar cobranças inesperadas." }
          : { ring: "#ef4444", ringLight: "#fecaca", bg: "from-red-50 to-white", border: "border-red-200", text: "text-red-500", badge: "bg-red-100 text-red-700", label: "Em risco", emoji: "🔴", headline: "Esse contrato tem falhas sérias que precisam ser resolvidas antes de assinar.", stat: "Contratos com essa nota são os mais comuns em disputas jurídicas." };
        return (
          <div className={`rounded-[20px] border ${config.border} bg-gradient-to-b ${config.bg} p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${config.badge}`}>{config.emoji} {config.label}</span>
              <span className="text-xs text-slate-400">Segurança contratual</span>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-[6px]" style={{ borderColor: config.ringLight }}>
                  <div className="absolute inset-0 rounded-full border-[6px]" style={{ borderColor: config.ring, clipPath: `inset(0 ${100 - nota}% 0 0 round 100px)` }} />
                  <div className="text-center">
                    <span className={`block text-3xl font-black leading-none ${config.text}`}>{nota}</span>
                    <span className="text-[11px] font-semibold text-slate-400">/100</span>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-base font-bold leading-snug text-[#0e2b50]">{config.headline}</p>
                {faltam > 0 && <p className={`mt-1 text-sm font-semibold ${config.text}`}>Faltam {faltam} pontos para blindar seu contrato.</p>}
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-1 flex justify-between text-xs text-slate-400"><span>Proteção atual</span><span>{nota}/100</span></div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-3 rounded-full transition-all duration-700" style={{ width: `${nota}%`, backgroundColor: config.ring }} />
              </div>
              <p className="mt-2 text-xs text-slate-500 italic">{config.stat}</p>
            </div>
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
        const pontos = [
          ...(resultado.riscos_principais || []).map((r: any) => ({ titulo: r.titulo, explicacao: r.linguagem_simples, risco: r.risco, por_que_importa: undefined as string | undefined })),
          ...(resultado.pontos_atencao || []).map((p: any) => ({ titulo: p.titulo, explicacao: p.explicacao, risco: p.risco, por_que_importa: p.por_que_importa as string | undefined })),
        ];
        if (!pontos.length) return null;
        const riscoStyle = (r?: string) => {
          const v = (r || "").toLowerCase();
          return v === "alto" ? { card: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700" }
            : v === "medio" || v === "médio" ? { card: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700" }
            : { card: "bg-slate-50 border-slate-200", badge: "bg-slate-100 text-slate-700" };
        };
        return (
          <div className="rounded-[18px] border border-slate-200 bg-white p-5">
            <h3 className="text-xl font-bold text-[#0e2b50]">Pontos de atenção</h3>
            <div className="mt-3 space-y-3">
              {pontos.slice(0, 2).map((item, idx) => {
                const s = riscoStyle(item.risco);
                return (
                  <div key={idx} className={`rounded-[14px] border p-4 ${s.card}`}>
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-lg font-bold text-[#123047]">{item.titulo || `Ponto ${idx + 1}`}</h4>
                      {item.risco && <span className={`rounded-full px-3 py-1 text-xs font-semibold ${s.badge}`}>Risco {item.risco}</span>}
                    </div>
                    {item.explicacao && <p className="mt-2 text-base leading-7 text-slate-700">{item.explicacao}</p>}
                    {item.por_que_importa && (
                      <div className="mt-3 rounded-[10px] bg-white px-4 py-3">
                        <span className="text-sm font-semibold text-[#123047]">Por que importa: </span>
                        <span className="text-sm text-slate-700">{item.por_que_importa}</span>
                      </div>
                    )}
                  </div>
                );
              })}
              {pontos.length > 2 && (
                <div className="rounded-[14px] border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
                  <span className="text-sm text-slate-500">🔒 + {pontos.length - 2} pontos adicionais na análise completa</span>
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
                  <a href={`https://www.jusbrasil.com.br/busca?q=${encodeURIComponent(`${item.titulo} ${contractType}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-[#2854ff] hover:underline">
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
        <h3 className="text-xl font-bold text-[#0e2b50]">Você está a um clique de evitar um problema no seu contrato</h3>
        <p className="mt-1 text-sm text-slate-600">{resultado.paywall?.subtexto || "Desbloqueie a análise completa e proteja-se antes de assinar."}</p>
        <ul className="mt-4 space-y-2 text-sm text-slate-600">
          <li>• Leitura detalhada cláusula por cláusula</li>
          <li>• Recomendações práticas para negociar</li>
          <li>• E-mail pronto com cada ponto do contrato</li>
          <li>• Perguntas para revisar com advogado ou com a outra parte</li>
        </ul>
        <button type="button" onClick={() => window.location.href = "https://buy.stripe.com/28E6oH7Wc58p2cb6mj57W00"}
          className="mt-6 w-full rounded-full bg-[#0e2b50] py-3 text-sm font-semibold text-white">
          Desbloquear análise completa →
        </button>
        <p className="mt-3 text-center text-xs text-slate-400">Acesso imediato · Pagamento único</p>
      </div>

      {unlockedAnalysis && resultado.email_pronto && (
        <div className="rounded-[14px] bg-slate-50 p-4">
          <h4 className="text-lg font-bold text-[#123047]">E-mail pronto</h4>
          <div className="mt-3 rounded-[12px] bg-white p-4">
            <div className="text-sm text-slate-500">Assunto</div>
            <div className="mt-1 font-semibold text-[#123047]">{resultado.email_pronto.assunto}</div>
          </div>
          <div className="mt-3 rounded-[12px] bg-white p-4 text-slate-700 whitespace-pre-line">{resultado.email_pronto.corpo}</div>
        </div>
      )}

      {resultado.orientacao_final && (
        <div className="rounded-[18px] border border-slate-200 bg-[#f8fbff] p-5">
          <h3 className="text-xl font-bold text-[#0e2b50]">Orientação final</h3>
          <p className="mt-2 text-base leading-7 text-slate-700">{resultado.orientacao_final}</p>
        </div>
      )}
    </div>
  );
}

// ─── FUNÇÕES AUXILIARES ────────────────────────────────────────────────────────

function gerarResumoDireitos(tipo: TipoCaso, cia: typeof CIAS_AEREAS[0] | undefined): string {
  const ciaNome = cia?.nome || "a companhia aérea";
  switch (tipo) {
    case "voo_atrasado":
      return `Pela ANAC Resolução 400, ${ciaNome} é obrigada a oferecer assistência material a partir de 1h de atraso (comunicação), alimentação a partir de 2h, e acomodação + transporte a partir de 4h. Se você teve danos comprovados (reunião perdida, hotel, etc.), tem direito a indenização por danos materiais. Dano moral é frequentemente reconhecido pelo TJSP para atrasos acima de 4h.`;
    case "voo_cancelado":
      return `${ciaNome} é obrigada a oferecer reacomodação imediata em outro voo, reembolso integral ou viagem em data futura — à sua escolha. Além disso, deve cobrir alimentação, hospedagem e transporte se necessário. Em caso de cancelamento sem aviso prévio, o dano moral é frequentemente reconhecido nos juizados.`;
    case "bagagem":
      return `A ANAC estabelece prazo de 7 dias (doméstico) ou 21 dias (internacional) para resolver bagagem extraviada ou danificada. Se não resolvido, você tem direito a indenização pelo valor dos itens danificados/perdidos e possível dano moral.`;
    case "produto_defeito":
      return `O CDC (art. 18) garante que você tem direito à troca, conserto gratuito ou devolução do dinheiro quando um produto apresenta defeito dentro do prazo de garantia. A loja tem 30 dias para resolver (produtos não duráveis) ou 90 dias (duráveis). Se não resolver, você pode pedir a substituição, devolução ou abatimento do preço.`;
    case "cobranca_indevida":
      return `Cobrança de valores que você não deve é prática abusiva (CDC art. 42). Se seu nome foi negativado indevidamente, o STJ reconhece dano moral automático (Súmula 385). Você tem direito à remoção imediata da negativação e indenização por danos morais, além da devolução em dobro do valor cobrado indevidamente.`;
    case "servico_nao_entregue":
      return `Quando você paga por um serviço e ele não é entregue conforme acordado, você tem direito à devolução integral do valor pago (CDC art. 35). Dependendo dos danos causados pelo descumprimento, também pode pedir indenização por danos morais e materiais.`;
    default:
      return `Você tem direitos como consumidor garantidos pelo CDC. A Clara vai te ajudar a identificar o caminho certo para resolver seu caso.`;
  }
}

function gerarEmailEmpresa(tipo: TipoCaso, descricao: string, cia: typeof CIAS_AEREAS[0] | undefined): { assunto: string; corpo: string } {
  const assunto = tipo.startsWith("voo") || tipo === "bagagem"
    ? `Notificação formal — ${tipo === "voo_atrasado" ? "atraso de voo" : tipo === "voo_cancelado" ? "cancelamento de voo" : "bagagem extraviada/danificada"} — solicitação de indenização`
    : `Notificação extrajudicial — solicitação de resolução — CDC`;

  const corpo = tipo === "voo_atrasado"
    ? `Prezados,\n\nVenho por meio desta notificar formalmente sobre o atraso ocorrido no meu voo, conforme descrito abaixo:\n\n${descricao}\n\nNos termos da Resolução ANAC nº 400/2016, a companhia aérea tem obrigação de prestar assistência material ao passageiro (alimentação, comunicação e, quando aplicável, hospedagem e transporte) a partir de determinados tempos de atraso, obrigação que não foi cumprida adequadamente.\n\nSolicito, no prazo de 10 (dez) dias úteis:\n1. Reembolso das despesas comprovadas decorrentes do atraso;\n2. Indenização pelos danos sofridos;\n3. Posicionamento formal sobre o ocorrido.\n\nNa ausência de resposta satisfatória, procederei com registro no consumidor.gov.br, reclamação na ANAC e, se necessário, ação no Juizado Especial Cível, com pedido de dano moral.\n\nAtenciosamente.`
    : `Prezados,\n\nVenho por meio desta notificar formalmente sobre o problema descrito abaixo, solicitando resolução:\n\n${descricao}\n\nNos termos do Código de Defesa do Consumidor (Lei 8.078/90), solicito no prazo de 10 (dez) dias úteis a devida reparação pelos danos causados.\n\nNa ausência de resposta satisfatória, procederei com registro nos órgãos competentes e, se necessário, ação no Juizado Especial Cível.\n\nAtenciosamente.`;

  return { assunto, corpo };
}

function estimarValor(tipo: TipoCaso): string {
  switch (tipo) {
    case "voo_atrasado":      return "R$2.000 – R$5.000 (dano moral) + despesas comprovadas";
    case "voo_cancelado":     return "R$3.000 – R$8.000 (dano moral) + reembolso integral do bilhete";
    case "bagagem":           return "R$2.000 – R$5.000 (dano moral) + valor dos itens perdidos";
    case "cobranca_indevida": return "R$2.000 – R$5.000 (dano moral) + valor em dobro da cobrança";
    default:                  return "Valor a calcular com base nos seus danos materiais + dano moral";
  }
}
