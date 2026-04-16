"use client";

import LegalInsightsCard from "@/components/LegalInsightsCard";
import { useEffect, useRef, useState } from "react";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

type Modo = "contrato" | "caso" | "jec" | null;

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
    email: "sac@latam.com",
    sac: "0800 0123 200",
  },
  {
    id: "gol", nome: "GOL Linhas Aéreas",
    canal: "Formulário online em Fale com a GOL",
    link: "https://www.voegol.com.br/atendimento",
    email: "sac@voegol.com.br",
    sac: "0800 704 0465",
  },
  {
    id: "azul", nome: "Azul Linhas Aéreas",
    canal: "WhatsApp e formulário online",
    link: "https://www.voeazul.com.br/atendimento",
    email: "atendimento@voeazul.com.br",
    sac: "0800 884 4040",
  },
  {
    id: "outra", nome: "Outra companhia",
    canal: "A Clara vai te ajudar a encontrar o canal certo",
    link: "", email: "", sac: "",
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

  // JEC state
  const [cepEmpresa, setCepEmpresa] = useState("");
  const [foroJec, setForoJec] = useState<any>(null);
  const [loadingForo, setLoadingForo] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const descricaoJecRef = useRef<HTMLTextAreaElement | null>(null);
  const [peticaoJec, setPeticaoJec] = useState<{ assunto: string; corpo: string } | null>(null);

  const [emailUsuario, setEmailUsuario] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultData | null>(null);
  const [unlockedAnalysis, setUnlockedAnalysis] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const isVoo = tipoCaso === "voo_atrasado" || tipoCaso === "voo_cancelado" || tipoCaso === "bagagem";
  const totalStepsContrato = 5;
  const totalStepsCaso = isVoo ? 4 : 3;
  const totalStepsJec = 3;
  const totalSteps = modo === "contrato" ? totalStepsContrato : modo === "jec" ? totalStepsJec : totalStepsCaso;

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
    if (modo === "jec") {
      if (step === 1 && !foroJec) { setError("Busque o fórum pelo CEP antes de continuar."); return; }
      if (step === 2) {
        if (!nomeEmpresa.trim()) { setError("Informe o nome da empresa."); return; }
        if (!valorCausa.trim()) { setError("Informe o valor aproximado da causa."); return; }
        if ((descricaoJecRef.current?.value || "").trim().length < 30) { setError("Descreva o que aconteceu com um pouco mais de detalhe."); return; }
      }
    }
    setStep((s) => s + 1);
  }

  function back() {
    setError("");
    if (step === 1) { setModo(null); setStep(0); }
    else setStep((s) => Math.max(1, s - 1));
  }

  async function buscarForoJec() {
    const cepLimpo = cepEmpresa.replace(/\D/g, "");
    if (cepLimpo.length !== 8) { setError("Digite o CEP completo da empresa (8 dígitos)."); return; }
    setError("");
    setLoadingForo(true);
    setForoJec(null);
    try {
      const res = await fetch(`/api/forum?cep=${cepLimpo}`);
      const data = await res.json();
      if (data.encontrado) {
        setForoJec(data);
      } else {
        setError("CEP não encontrado no mapa. Verifique e tente novamente.");
      }
    } catch {
      setError("Erro ao buscar o fórum. Tente novamente.");
    } finally {
      setLoadingForo(false);
    }
  }

  function gerarPeticaoJec() {
    const descricao = descricaoJecRef.current?.value || "";
    const foroNome = foroJec?.foro || "Juizado Especial Cível";
    const assunto = `Petição inicial — JEC — ${nomeEmpresa} — R$ ${valorCausa}`;
    const corpo =
      `Ao(À) Meritíssimo(a) Juiz(a) de Direito\n` +
      `${foroNome}\n\n` +
      `PETIÇÃO INICIAL\n\n` +
      `Eu, [SEU NOME COMPLETO], [ESTADO CIVIL], [PROFISSÃO], portador(a) do CPF nº [SEU CPF], RG nº [SEU RG], residente à [SEU ENDEREÇO COMPLETO, CIDADE, ESTADO], venho, respeitosamente, à presença de Vossa Excelência propor a presente\n\n` +
      `AÇÃO DE INDENIZAÇÃO POR DANOS MORAIS E MATERIAIS\n\n` +
      `em face de ${nomeEmpresa}, pessoa jurídica de direito privado, pelos fatos e fundamentos a seguir expostos.\n\n` +
      `I. DOS FATOS\n\n` +
      `${descricao}\n\n` +
      `II. DO DIREITO\n\n` +
      `Os fatos narrados configuram violação ao Código de Defesa do Consumidor (Lei 8.078/1990), em especial ao art. 6º, que garante proteção contra práticas abusivas, e ao art. 14, que trata da responsabilidade por danos causados ao consumidor.\n\n` +
      `O descumprimento e/ou conduta negligente da empresa ré causou ao autor danos materiais e morais, passíveis de reparação nos termos dos arts. 186 e 927 do Código Civil.\n\n` +
      `III. DOS PEDIDOS\n\n` +
      `Diante do exposto, requer:\n` +
      `a) A condenação da empresa ré ao pagamento de indenização por danos materiais no valor de R$ ${valorCausa};\n` +
      `b) A condenação ao pagamento de indenização por danos morais, a ser arbitrada por Vossa Excelência;\n` +
      `c) A condenação ao pagamento das custas processuais, se houver.\n\n` +
      `Dá-se à causa o valor de R$ ${valorCausa}.\n\n` +
      `Termos em que pede e espera deferimento.\n\n` +
      `[Cidade], [DATA]\n\n` +
      `_______________________________\n` +
      `[SEU NOME COMPLETO]\n` +
      `CPF: [SEU CPF]`;

    setPeticaoJec({ assunto, corpo });
    registrarLead({ email: emailUsuario, modo: "jec", nomeEmpresa, valorCausa, foro: foroJec?.foro, evento: "peticao_gerada" });
    setStep(99);
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
              {isResultado && modo === "jec" ? "Sua petição JEC"
                : isResultado && modo === "caso" ? "Seu plano de ação"
                : isResultado ? "Resultado da análise"
                : modo === "caso" ? "Resolva seu caso"
                : modo === "jec" ? "Petição JEC"
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
                  <div>
                    <div className="font-semibold text-[#0e2b50]">{cia.nome}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{cia.canal}</div>
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

        {/* JEC step 1 — encontrar fórum */}
        {modo === "jec" && step === 1 && (
          <Shell title="Qual é o CEP da empresa?" subtitle="O CEP determina qual fórum é competente para o seu caso.">
            <div className="flex gap-3 mb-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder="CEP da empresa (ex: 01310-100)"
                value={cepEmpresa}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setCepEmpresa(v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v);
                  setForoJec(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && buscarForoJec()}
                className="flex-1 rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none"
              />
              <button
                type="button"
                onClick={buscarForoJec}
                disabled={loadingForo}
                className="rounded-full bg-[#0e2b50] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 whitespace-nowrap"
              >
                {loadingForo ? "Buscando..." : "Buscar fórum"}
              </button>
            </div>
            <p className="text-sm text-slate-500 mb-5">Digite o CEP do endereço da empresa — não o seu.</p>

            {foroJec && (
              <div className="rounded-[18px] border border-green-200 bg-green-50 p-5 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">🏛️</span>
                  <span className="text-base font-bold text-[#0e2b50]">{foroJec.foro}</span>
                </div>
                <div className="space-y-1 text-sm text-slate-600 mb-3">
                  <div>📍 {foroJec.endereco}</div>
                  <div>✉️ <a href={`mailto:${foroJec.email}`} className="text-blue-600 font-medium">{foroJec.email}</a></div>
                  <div>🕐 {foroJec.horario}</div>
                </div>
                <div className="rounded-[10px] bg-white border border-green-200 px-3 py-2 text-xs text-green-700 font-medium">
                  ✅ Fórum encontrado — clique em Continuar para preencher os detalhes
                </div>
              </div>
            )}

            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* JEC step 2 — detalhes do caso */}
        {modo === "jec" && step === 2 && (
          <Shell title="Detalhes do seu caso" subtitle="Essas informações serão inseridas na petição formal.">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome da empresa</label>
                <input
                  type="text"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  placeholder="Ex: GOL Linhas Aéreas S.A."
                  className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Valor da causa (R$)</label>

                {/* Guia de cálculo */}
                <div className="rounded-[14px] bg-blue-50 border border-blue-100 p-4 mb-3">
                  <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Como calcular o valor a pedir</div>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <div className="text-xs font-semibold text-blue-800">Dano material — o que você perdeu de dinheiro</div>
                        <div className="text-xs text-blue-700 mt-0.5">Valor do produto/serviço não entregue, despesas extras, reembolsos devidos, multas cobradas indevidamente. Use o valor exato.</div>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <div className="text-xs font-semibold text-blue-800">Dano moral — pelo transtorno causado</div>
                        <div className="text-xs text-blue-700 mt-0.5">Nos juizados de SP costuma ser entre <strong>R$2.000 e R$5.000</strong> para casos comuns. Peça R$5.000 — o juiz pode reduzir, mas nunca vai aumentar.</div>
                      </div>
                    </div>
                    <div className="rounded-[10px] bg-white border border-blue-200 px-3 py-2">
                      <div className="text-xs font-bold text-blue-900">Exemplos práticos:</div>
                      <div className="mt-1 space-y-0.5 text-xs text-blue-700">
                        <div>• Voo atrasado sem assistência → R$5.000 a R$8.000</div>
                        <div>• Produto com defeito (R$800) + moral → R$5.800</div>
                        <div>• Cobrança indevida (R$300) + negativação indevida → R$5.300</div>
                        <div>• Serviço não entregue (R$1.500) + moral → R$6.500</div>
                      </div>
                    </div>
                  </div>
                </div>

                <input
                  type="text"
                  value={valorCausa}
                  onChange={(e) => setValorCausa(e.target.value)}
                  placeholder="Ex: 5.000,00"
                  className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Dano material + dano moral. Máximo R$28.000 no JEC — acima disso precisa de advogado.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descreva o que aconteceu</label>
                <textarea
                  ref={descricaoJecRef}
                  rows={8}
                  placeholder="Ex: Em 05/01/2026, contratei o serviço X da empresa Y pelo valor de R$ Z. A empresa não cumpriu o combinado porque..."
                  className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none leading-relaxed"
                />
                <p className="text-xs text-slate-500 mt-1">Seja específico: datas, valores, o que foi prometido vs. o que aconteceu.</p>
              </div>
            </div>
            <Nav nextLabel="Revisar e gerar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* JEC step 3 — revisão e geração */}
        {modo === "jec" && step === 3 && (
          <Shell title="Tudo pronto para gerar" subtitle="Confirme os dados antes de gerar sua petição.">
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Fórum competente</div>
                <div className="mt-1 text-base font-semibold text-[#123047]">{foroJec?.foro}</div>
                <div className="text-xs text-slate-500 mt-0.5">✉️ {foroJec?.email}</div>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Empresa ré</div>
                <div className="mt-1 text-base font-semibold text-[#123047]">{nomeEmpresa}</div>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Valor da causa</div>
                <div className="mt-1 text-base font-semibold text-[#123047]">R$ {valorCausa}</div>
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Seu e-mail (opcional)</label>
              <input
                type="email"
                value={emailUsuario}
                onChange={(e) => setEmailUsuario(e.target.value)}
                placeholder="voce@email.com"
                className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none"
              />
            </div>
            <div className="rounded-[14px] bg-amber-50 border border-amber-200 p-4 mb-6">
              <p className="text-sm text-amber-800 leading-relaxed">
                💡 <strong>Como funciona:</strong> A Clara gera a petição agora. Você protocola no fórum (por e-mail ou presencialmente). Se ganhar, paga <strong>10% do valor recebido</strong>. Se não ganhar, não paga nada.
              </p>
            </div>
            <div className="flex items-center justify-between mobile-action-row">
              <button type="button" onClick={back} className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">Voltar</button>
              <button type="button" onClick={gerarPeticaoJec} className="rounded-full bg-[#0e2b50] px-6 py-3 text-sm font-semibold text-white">
                Gerar minha petição
              </button>
            </div>
          </Shell>
        )}

        {/* RESULTADO JEC */}
        {step === 99 && modo === "jec" && peticaoJec && (
          <div className="space-y-5">
            <div className="rounded-[24px] border-2 border-green-300 bg-green-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🏛️</span>
                <div>
                  <div className="text-xs font-semibold text-green-600 uppercase tracking-wider">Petição gerada com sucesso</div>
                  <div className="text-xl font-bold text-[#0e2b50]">Sua petição JEC está pronta</div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="rounded-[14px] bg-white border border-green-200 p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Fórum competente</div>
                  <div className="font-semibold text-[#0e2b50]">{foroJec?.foro}</div>
                  <div className="text-xs text-slate-500 mt-1">✉️ {foroJec?.email}</div>
                  <div className="text-xs text-slate-500">📍 {foroJec?.endereco}</div>
                </div>
                <div className="rounded-[14px] bg-white border border-green-200 p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Empresa ré</div>
                  <div className="font-semibold text-[#0e2b50]">{nomeEmpresa}</div>
                  <div className="text-sm text-slate-600 mt-1">Valor da causa: <strong>R$ {valorCausa}</strong></div>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#0e2b50]">Petição gerada pela Clara</h3>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(`${peticaoJec.assunto}\n\n${peticaoJec.corpo}`)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-[#0e2b50]"
                >
                  Copiar tudo
                </button>
              </div>
              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 mb-4">
                <div className="text-xs font-semibold text-slate-400 uppercase mb-1">Assunto (para protocolo por e-mail)</div>
                <div className="text-sm font-semibold text-[#0e2b50]">{peticaoJec.assunto}</div>
              </div>
              <div className="rounded-[14px] bg-white border border-slate-200 p-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed max-h-96 overflow-y-auto">
                {peticaoJec.corpo}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">Gerado pela Clara · orientativo</span>
                <span className="inline-block text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full font-medium">Preencha os campos entre colchetes [ ] antes de protocolar</span>
              </div>
            </div>

            <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-6">
              <h3 className="text-lg font-bold text-[#0e2b50] mb-4">Próximos passos</h3>
              <div className="space-y-3">
                {[
                  { n: "1", t: "Preencha seus dados pessoais", s: "Substitua [SEU NOME], [CPF], [ENDEREÇO] na petição antes de enviar." },
                  { n: "2", t: "Protocole por e-mail no fórum", s: `Envie a petição para ${foroJec?.email} com documentos que comprovem o caso (notas, prints, recibos).` },
                  { n: "3", t: "Acompanhe pelo e-mail", s: "O fórum confirmará o recebimento e agendará a audiência de conciliação." },
                ].map((p) => (
                  <div key={p.n} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0 mt-0.5">{p.n}</div>
                    <div>
                      <div className="text-sm font-semibold text-[#0e2b50]">{p.t}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{p.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border-2 border-[#0e2b50] bg-white p-6 text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <h3 className="text-lg font-bold text-[#0e2b50] mb-2">10% apenas se você ganhar</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Se você ganhar a causa, a Clara recebe 10% do valor recebido. Se não ganhar, não paga nada.
              </p>
            </div>
          </div>
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
                  <div className="rounded-[14px] bg-blue-50 border border-blue-200 p-4 mb-4">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-3">Como enviar sua reclamação para a {cia.nome}</div>
                    {/* E-mail direto */}
                    {cia.email && (
                      <div className="mb-4 flex items-center gap-3 rounded-[12px] bg-white border border-blue-200 px-4 py-3">
                        <span className="text-lg">✉️</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-500 mb-0.5">E-mail SAC</div>
                          <a href={`mailto:${cia.email}?subject=${encodeURIComponent(`Notificação formal — solicitação de indenização`)}`}
                            className="text-sm font-bold text-blue-700 break-all">
                            {cia.email}
                          </a>
                        </div>
                        <a href={`mailto:${cia.email}?subject=${encodeURIComponent(`Notificação formal — solicitação de indenização`)}`}
                          className="rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 whitespace-nowrap flex-shrink-0">
                          Abrir e-mail →
                        </a>
                      </div>
                    )}
                    <div className="space-y-2 mb-4">
                      {[
                        cia.email ? `Clique em "Abrir e-mail" acima — o assunto já estará preenchido` : "Copie o texto do e-mail gerado abaixo",
                        "Cole o corpo do e-mail gerado abaixo no campo de mensagem",
                        "Envie e guarde o número de protocolo que você vai receber",
                      ].map((s, i) => (
                        <div key={i} className="flex gap-2 items-start text-sm text-blue-800">
                          <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                    {cia.link ? (
                      <a href={cia.link} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-blue-300 text-blue-700 bg-white text-sm font-medium px-4 py-2">
                        {cia.id === "azul" ? "Abrir formulário / WhatsApp Azul →" : `Ou use o formulário oficial da ${cia.nome} →`}
                      </a>
                    ) : (
                      <span className="text-sm text-blue-700 font-medium">Pesquise a empresa para encontrar o canal oficial.</span>
                    )}
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
                    }} className="rounded-full bg-[#0e2b50] text-white px-3 py-1.5 text-xs font-semibold">📋 Copiar</button>
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
                  <div className="text-lg font-bold text-[#0e2b50]">{isVoo ? "Registre no consumidor.gov.br e na ANAC" : "Registre no consumidor.gov.br"}</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                Taxa de resolução de 8 em cada 10 casos. A empresa tem 10 dias para responder ou o caso fica marcado como "não resolvido" no histórico dela.
              </p>

              {/* consumidor.gov.br */}
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-amber-800">consumidor.gov.br</div>
                  <a href="https://www.consumidor.gov.br" target="_blank" rel="noreferrer"
                    className="rounded-full bg-amber-700 text-white text-xs font-semibold px-4 py-1.5">
                    Abrir →
                  </a>
                </div>
                <div className="space-y-1.5">
                  {[
                    'Acesse consumidor.gov.br e clique em "Registrar reclamação"',
                    "Busque o nome da empresa no campo de pesquisa",
                    "Descreva o problema — pode colar o e-mail que você já tem",
                    "Envie e aguarde: a empresa tem 10 dias para responder",
                    "Avalie a resposta: isso impacta o índice público da empresa",
                  ].map((s, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs text-amber-800">
                      <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ANAC — só para voos */}
              {isVoo && (
                <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-700">ANAC — Agência Nacional de Aviação Civil</div>
                      <div className="text-xs text-slate-500 mt-0.5">Órgão regulador das companhias aéreas. Tel: 163 (gratuito)</div>
                    </div>
                    <a href="https://www.gov.br/anac/pt-br/assuntos/passageiros" target="_blank" rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold px-4 py-1.5 whitespace-nowrap">
                      Abrir →
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "Acesse o site ou ligue 163 (gratuito, seg–sex 8h–20h)",
                      'Selecione "Reclamação" e depois "Passageiro"',
                      "Informe o número do voo, data e companhia",
                      "Descreva o problema e anexe documentos (boarding pass, recibos)",
                      "Guarde o número de protocolo — a ANAC cobra resposta da empresa",
                    ].map((s, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  A Clara gera sua petição agora. Você paga <strong>10% do valor ganho</strong> — e apenas se ganhar. Se não ganhar, não paga nada.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <a href="/forum" className="inline-block rounded-full bg-[#0e2b50] text-white text-sm font-semibold px-5 py-3">
                  Encontrar meu fórum →
                </a>
                <button
                  type="button"
                  onClick={() => { setResultado(null); setForoJec(null); setPeticaoJec(null); window.scrollTo(0, 0); escolherModo("jec"); }}
                  className="inline-block rounded-full border border-[#D4AF37] text-[#854F0B] text-sm font-semibold px-5 py-3 bg-white cursor-pointer">
                  Gerar minha petição JEC
                </button>
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
