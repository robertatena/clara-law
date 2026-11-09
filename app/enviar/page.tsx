"use client";

import LegalInsightsCard from "@/components/LegalInsightsCard";
import ContratoModal from "@/components/ContratoModal";
import { salvarCaso, uploadDocumento, uploadContrato, salvarLead } from "@/lib/supabase";
import { createBrowserSupabase } from "@/lib/supabase-auth";
import { gerarEmailEmpresa } from "@/lib/gerar-email-empresa";
import { maskBRL } from "@/lib/format-brl";
import { DisclaimerBox } from "@/app/components/DisclaimerBox";
import { useEffect, useRef, useState } from "react";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Flag temporária — Pix fora do ar por problema na API key AbacatePay.
// Reverter (true → false) quando a chave for reativada/trocada e o /api/pix/create
// voltar a retornar QR code em vez de "Invalid or inactive API key".
const PIX_TEMPORARIAMENTE_INDISPONIVEL = false;

function emailValido(email: string): boolean {
  const e = (email || "").trim();
  // Formato mínimo: algo + @ + algo + . + algo (sem espaços)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

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
    pedidos_cabiveis?: string[];
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
    email: "atendimento@latam.com",
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
  // Ref no container do ResultadoContrato pra rolar automaticamente até o card
  // quando a análise for desbloqueada (?unlocked=true ou reanaliseDe).
  const resultadoContainerRef = useRef<HTMLDivElement | null>(null);

  const [tipoCaso, setTipoCaso] = useState<TipoCaso | null>(null);
  const descricaoCasoRef = useRef<HTMLTextAreaElement | null>(null);
  const [ciaAerea, setCiaAerea] = useState("");

  // Dados pessoais para casos de voo
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [cpf, setCpf] = useState("");
  const [numVoo, setNumVoo] = useState("");
  const [dataVoo, setDataVoo] = useState("");

  // Campos estruturados para calcularProbabilidade e e-mail
  const [tempoAtraso, setTempoAtraso] = useState("");
  const [assistenciaComida, setAssistenciaComida] = useState("");
  const [assistenciaHotel, setAssistenciaHotel] = useState("");
  const [prejuizoExtra, setPrejuizoExtra] = useState("");
  const [avisoPrevia] = useState("");
  const [tipoBagagem, setTipoBagagem] = useState("");
  // Bagagem — extras
  const [bagPir, setBagPir] = useState("");
  const [bagValor, setBagValor] = useState("");

  // Voo cancelado — campos específicos (reusa nomeCompleto, cpf, numVoo, dataVoo, ciaAerea)
  const [voocanOferecido, setVoocanOferecido] = useState("");
  const [voocanAviso, setVoocanAviso] = useState("");
  const [voocanPrejuizos, setVoocanPrejuizos] = useState<string[]>([]);

  // Cobrança indevida / Serasa
  const [cobrancaTipo, setCobrancaTipo] = useState("");
  const [cobrancaEmpresa, setCobrancaEmpresa] = useState("");
  const [cobrancaValor, setCobrancaValor] = useState("");
  const [cobrancaSerasa, setCobrancaSerasa] = useState("");
  const [cobrancaComprovante, setCobrancaComprovante] = useState("");

  // Produto com defeito
  const [prodNome, setProdNome] = useState("");
  const [prodProblema, setProdProblema] = useState("");
  const [prodPrazo, setProdPrazo] = useState("");
  const [prodOnde, setProdOnde] = useState("");
  const [prodEmpresa, setProdEmpresa] = useState("");
  const [prodValor, setProdValor] = useState("");

  // Serviço não entregue
  const [servNome, setServNome] = useState("");
  const [servEmpresa, setServEmpresa] = useState("");
  const [servValor, setServValor] = useState("");
  const [servPrazo, setServPrazo] = useState("");
  const [servComprovante, setServComprovante] = useState("");
  const [servResposta, setServResposta] = useState("");

  // Método de pagamento nos cards de checkout (pacote e análise).
  // "cartao" mantém o fluxo Stripe atual; "pix" abre modal com QR AbacatePay.
  const [metodoPagamento, setMetodoPagamento] = useState<"cartao" | "pix">("cartao");
  const [pixData, setPixData] = useState<{ id: string; brCode: string; brCodeBase64: string; expiresAt: string; amount: number } | null>(null);
  const [pixStatus, setPixStatus] = useState<"loading" | "aguardando" | "pago" | "expirado" | "erro">("loading");
  const [pixCopiado, setPixCopiado] = useState(false);
  // Controle explícito de abertura do modal — evita que "loading" inicial
  // apareça na tela e que o estado "erro" feche o modal silenciosamente.
  const [pixModalAberto, setPixModalAberto] = useState(false);
  // Metadata do Pix ativo — usada pelo polling pra passar email/produto/etc
  // pra o /api/pix/status/[id] executar fulfill server-side (workaround do
  // webhook AbacatePay que hoje não dispara).
  const [pixMetadata, setPixMetadata] = useState<Record<string, string>>({});
  // Guarda de qual produto disparou o Pix — usado pelo polling pra decidir
  // pra onde redirecionar após PAID (/sucesso pra pacote, /enviar?unlocked pra análise).
  const [pixProduto, setPixProduto] = useState<"pacote" | "analise" | null>(null);

  // Novos estados
  const [telefone, setTelefone] = useState("");
  // Gate do Kit Juizado — CPF/telefone/documentos/Termos só são pedidos aqui,
  // no momento da compra, nunca antes do plano de ação e do e-mail grátis.
  const [mostrarContrato, setMostrarContrato] = useState(false);
  const [casoId, setCasoId] = useState<string | null>(null);
  // Token assinado pelo servidor (/api/caso/preparar-email) que comprova que
  // o e-mail de notificação exibido veio de lá — usado só pra saber se o
  // aviso "te mandamos uma cópia" é verdade (a cópia em si já foi disparada
  // em analisarCaso() assim que o token chegou).
  const [emailCopiaToken, setEmailCopiaToken] = useState<string | null>(null);
  const [docBilhete, setDocBilhete] = useState<File | null>(null);
  const [docAtraso, setDocAtraso] = useState<File | null>(null);
  const [docDespesas, setDocDespesas] = useState<File | null>(null);

  // JEC state
  const [cepEmpresa, setCepEmpresa] = useState("");
  // Padrão: CEP do próprio consumidor (CDC art. 101, I; Lei 9.099/95 art. 4º, III).
  // Usar o CEP da empresa também é válido (art. 4º, I), mas é a opção secundária.
  const [cepProprioJec, setCepProprioJec] = useState(true);
  const [foroJec, setForoJec] = useState<any>(null);
  const [loadingForo, setLoadingForo] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const [defaultDescricaoJec, setDefaultDescricaoJec] = useState("");
  const descricaoJecRef = useRef<HTMLTextAreaElement | null>(null);
  const [peticaoJec, setPeticaoJec] = useState<{ assunto: string; corpo: string } | null>(null);

  const [emailUsuario, setEmailUsuario] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ResultData | null>(null);
  const [unlockedAnalysis, setUnlockedAnalysis] = useState(false);
  // Reanálise grátis: quando /enviar recebe ?reanalise=<caso_id> e o user
  // autenticado é dono do caso original de análise, `reanaliseDe` guarda o id
  // e pula o paywall. Verificação de ownership feita via Supabase RLS.
  const [reanaliseDe, setReanaliseDe] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const isVoo = tipoCaso === "voo_atrasado" || tipoCaso === "voo_cancelado" || tipoCaso === "bagagem";
  const isCasoAtivo = tipoCaso === "voo_atrasado" || tipoCaso === "voo_cancelado" || tipoCaso === "bagagem" || tipoCaso === "cobranca_indevida" || tipoCaso === "produto_defeito" || tipoCaso === "servico_nao_entregue";
  const totalStepsContrato = 5;
  const totalStepsCaso = 3;
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

            // Persiste o resultado da primeira análise paga no user_casos
            // criado pelo webhook. Rota busca o caso mais recente do user
            // que ainda não tem resultado — idempotente. Falha silenciosa
            // não bloqueia a UX (unlock já rolou no client).
            fetch("/api/analise/salvar-resultado", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contractType: parsed.contractType || "",
                resultado: parsed.resultado,
              }),
            }).catch((err) => console.warn("salvar_resultado_primeira_fail", err));
          }
        } catch { /* ignora */ }
      }
    }
  }, []);

  // Reanálise grátis via /enviar?reanalise=<caso_id>
  // Valida via Supabase (RLS): só entra em modo reanálise se user autenticado
  // for dono do caso E o caso for tipo "analise_contrato". Falha silenciosa
  // (segue fluxo normal, cobra) se qualquer verificação falhar.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("reanalise");
    if (!id) return;
    let cancelado = false;
    (async () => {
      try {
        const supabase = createBrowserSupabase();
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelado || !user) return;
        const { data: caso } = await supabase
          .from("user_casos")
          .select("id, tipo_caso, dados_json")
          .eq("id", id)
          .eq("tipo_caso", "analise_contrato")
          .maybeSingle();
        if (cancelado || !caso) return;
        setModo("contrato");
        setReanaliseDe(id);
        const ct = (caso.dados_json as Record<string, unknown> | null)?.contractType;
        if (typeof ct === "string" && ct) setContractType(ct);
        // Limpa a URL — evita revisitas re-triggerarem o modo reanálise
        window.history.replaceState({}, "", "/enviar");
      } catch { /* ignora — fluxo normal segue */ }
    })();
    return () => { cancelado = true; };
  }, []);

  // Scroll até o card verde de confirmação quando a análise for desbloqueada.
  // Cobre os dois caminhos: (a) volta do pagamento (?unlocked=true), (b) reanálise
  // grátis (?reanalise=<id> após analisar()). Prioriza o âncora do card verde
  // ("análise desbloqueada" ou "reanálise grátis") pra o usuário ver imediatamente
  // o feedback do sucesso; fallback pro topo do wrapper se por algum motivo o
  // âncora ainda não renderizou.
  useEffect(() => {
    if (!unlockedAnalysis || !resultado || modo !== "contrato") return;
    // Espera 2 frames: um pra React montar o DOM novo, outro pro browser calcular layout
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const anchor = document.getElementById("analise-unlocked-anchor");
        if (anchor) {
          anchor.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          resultadoContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  }, [unlockedAnalysis, resultado, modo]);

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
      if (step === 4 && !emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    }
    if (modo === "caso") {
      if (step === 1 && !tipoCaso) { setError("Escolha o que aconteceu com você."); return; }
      if (step === 2) {
        if (tipoCaso === "voo_atrasado") {
          if (!nomeCompleto.trim()) { setError("Informe seu nome completo."); return; }
          if (!numVoo.trim()) { setError("Informe o número do voo."); return; }
          if (!dataVoo) { setError("Informe a data do voo."); return; }
          if (!ciaAerea) { setError("Selecione a companhia aérea."); return; }
        } else if (tipoCaso === "voo_cancelado") {
          if (!nomeCompleto.trim()) { setError("Informe seu nome completo."); return; }
          if (!numVoo.trim()) { setError("Informe o número do voo."); return; }
          if (!dataVoo) { setError("Informe a data do voo."); return; }
          if (!ciaAerea) { setError("Selecione a companhia aérea."); return; }
          if (!voocanOferecido) { setError("Selecione o que a companhia ofereceu."); return; }
          if (!voocanAviso) { setError("Selecione quando você soube do cancelamento."); return; }
        } else if (tipoCaso === "bagagem") {
          if (!nomeCompleto.trim()) { setError("Informe seu nome completo."); return; }
          if (!numVoo.trim()) { setError("Informe o número do voo."); return; }
          if (!dataVoo) { setError("Informe a data do voo."); return; }
          if (!ciaAerea) { setError("Selecione a companhia aérea."); return; }
          if (!tipoBagagem) { setError("Selecione o que aconteceu com sua bagagem."); return; }
          if (!bagPir) { setError("Informe se você fez o PIR na companhia."); return; }
          if (!bagValor.trim()) { setError("Informe o valor estimado do prejuízo."); return; }
        } else if (tipoCaso === "servico_nao_entregue") {
          if (!servNome.trim()) { setError("Informe qual serviço foi contratado."); return; }
          if (!servEmpresa.trim()) { setError("Informe o nome da empresa."); return; }
          if (!servValor.trim()) { setError("Informe o valor pago."); return; }
          if (!servPrazo) { setError("Informe quando foi contratado."); return; }
          if (!servComprovante) { setError("Informe se tem comprovante de pagamento."); return; }
          if (!servResposta) { setError("Informe se a empresa respondeu alguma vez."); return; }
        } else if (tipoCaso === "cobranca_indevida") {
          if (!cobrancaTipo) { setError("Selecione o que a empresa fez."); return; }
          if (!cobrancaEmpresa.trim()) { setError("Informe o nome da empresa."); return; }
          if (!cobrancaValor.trim()) { setError("Informe o valor cobrado."); return; }
          if (!cobrancaSerasa) { setError("Informe se seu nome foi ao Serasa/SPC."); return; }
          if (!cobrancaComprovante) { setError("Informe se você tem comprovante."); return; }
        } else if (tipoCaso === "produto_defeito") {
          if (!prodNome.trim()) { setError("Informe o que você comprou."); return; }
          if (!prodProblema) { setError("Selecione qual o problema."); return; }
          if (!prodPrazo) { setError("Informe quando você comprou."); return; }
          if (!prodOnde) { setError("Informe onde você comprou."); return; }
          if (!prodEmpresa.trim()) { setError("Informe o nome da empresa."); return; }
          if (!prodValor.trim()) { setError("Informe o valor do produto."); return; }
        } else {
          if ((descricaoCasoRef.current?.value || "").trim().length < 30) { setError("Conta um pouco mais sobre o que aconteceu."); return; }
        }
      }
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
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    salvarLead({ email: emailUsuario, origem: "jec" });
    const descricao = descricaoJecRef.current?.value || "";
    const foroNome = foroJec?.foro || "Juizado Especial Cível";
    // Fundamento da competência varia conforme o CEP escolhido pra buscar o
    // fórum: próprio domicílio (padrão, CDC art. 101, I) ou domicílio do réu /
    // local do fato (Lei 9.099/95, art. 4º, I) — ver toggle no step 1 do JEC.
    const competencia = cepProprioJec
      ? "Ajuíza a presente ação neste Juizado, foro do domicílio do autor, com fundamento no art. 101, I, do Código de Defesa do Consumidor e no art. 4º, III, da Lei 9.099/95."
      : "Ajuíza a presente ação neste Juizado, foro do domicílio do réu, com fundamento no art. 4º, I, da Lei 9.099/95.";
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
      `II. DA COMPETÊNCIA\n\n` +
      `${competencia}\n\n` +
      `III. DO DIREITO\n\n` +
      `Os fatos narrados configuram violação ao Código de Defesa do Consumidor (Lei 8.078/1990), em especial ao art. 6º, que garante proteção contra práticas abusivas, e ao art. 14, que trata da responsabilidade por danos causados ao consumidor.\n\n` +
      `O descumprimento e/ou conduta negligente da empresa ré causou ao autor danos materiais e morais, passíveis de reparação nos termos dos arts. 186 e 927 do Código Civil.\n\n` +
      `IV. DOS PEDIDOS\n\n` +
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
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    salvarLead({ email: emailUsuario, origem: "contrato" });
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
      // Reanálise vinculada a caso pago pula o paywall automaticamente.
      const jaDesbloqueado = !!reanaliseDe;
      setUnlockedAnalysis(jaDesbloqueado);
      setResultado(data);
      registrarLead({
        email: emailUsuario, modo: "contrato",
        tipoContrato: contractType, papel: papelNoContrato,
        arquivo: inputMethod === "upload" ? (fileName || "upload") : "texto_colado",
        nota: data?.nota_geral || "", evento: "analise_gerada",
      });
      setStep(99);

      // Persiste o resultado no banco em 2 cenários:
      //  - Reanálise (jaDesbloqueado=true, reanaliseDe presente) → cria user_casos filho
      //  - Primeira análise paga: será chamado no useEffect de ?unlocked=true abaixo
      // Aqui só disparamos o path da reanálise; primeira paga tem hook próprio.
      if (jaDesbloqueado && reanaliseDe) {
        fetch("/api/analise/salvar-resultado", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            parent_caso_id: reanaliseDe,
            contractType,
            resultado: data,
          }),
        }).catch((err) => console.warn("salvar_resultado_reanalise_fail", err));
      }
    } catch (err: any) {
      setError(err?.message || "Erro ao analisar.");
    } finally { setLoading(false); }
  }

  async function analisarCaso() {
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    salvarLead({ email: emailUsuario, origem: "caso", tipo_caso: tipoCaso ?? undefined });
    try {
      setLoading(true); setError(""); setResultado(null);
      let descricaoCaso = descricaoCasoRef.current?.value || "";
      const cia = CIAS_AEREAS.find((c) => c.id === ciaAerea);
      if (isVoo) {
        const tipoLabel: Record<string,string> = { "voo_atrasado": "atraso do voo", "voo_cancelado": "cancelamento do voo", "bagagem": "problema com bagagem" };
        const dataFormatada = dataVoo ? new Date(dataVoo + "T12:00:00").toLocaleDateString("pt-BR") : "data não informada";
        descricaoCaso = `Passageiro ${nomeCompleto}${cpf ? `, CPF ${cpf}` : ""}. Voo ${numVoo} em ${dataFormatada} pela ${cia?.nome || "companhia aérea"}. Problema: ${tipoLabel[tipoCaso!] || tipoCaso}.`;
        if (tipoCaso === "voo_cancelado") {
          const ofLabel: Record<string,string> = {
            nada: "nada foi oferecido",
            reacomodacao_ruim: "reacomodação em voo muito posterior (+4h)",
            reembolso_atrasado: "reembolso demorou ou não foi recebido",
            vale_viagem: "ofereceram apenas vale-viagem",
          };
          const avLabel: Record<string,string> = {
            sem_aviso: "sem aviso prévio (soube no aeroporto)",
            menos_24h: "com menos de 72h de antecedência",
            mais_72h: "com mais de 72h de antecedência",
          };
          const prejLabel: Record<string,string> = {
            hotel: "hotel perdido",
            reuniao: "reunião/evento perdido",
            outros_gastos: "outros gastos comprovados",
            nenhum: "sem prejuízos adicionais",
          };
          const prejTxt = voocanPrejuizos.length > 0 ? voocanPrejuizos.map((v) => prejLabel[v] || v).join(", ") : "não informado";
          descricaoCaso += ` Oferta da companhia: ${ofLabel[voocanOferecido] || voocanOferecido}. Aviso: ${avLabel[voocanAviso] || voocanAviso}. Prejuízos: ${prejTxt}.`;
        } else if (tipoCaso === "bagagem") {
          const bagLabel: Record<string,string> = {
            extraviada: "mala extraviada (não chegou)",
            danificada: "mala danificada",
            itens_furtados: "itens furtados da mala",
            atrasou_muito: "mala atrasou muito",
          };
          const pirLabel: Record<string,string> = {
            sim: "sim, tem PIR",
            nao: "não fez PIR",
            tentei_nao_consegui: "tentou mas não conseguiu registrar PIR",
          };
          descricaoCaso += ` Ocorrência: ${bagLabel[tipoBagagem] || tipoBagagem}. PIR: ${pirLabel[bagPir] || bagPir}. Valor estimado do prejuízo: R$ ${bagValor}.`;
        }
      } else if (tipoCaso === "servico_nao_entregue") {
        const prazoLabel: Record<string,string> = {
          menos_7d: "menos de 7 dias",
          "7_30d": "entre 7 e 30 dias",
          "30_90d": "entre 30 e 90 dias",
          mais_90d: "mais de 90 dias",
        };
        const compLabel: Record<string,string> = { sim: "sim", nao: "não" };
        const respLabel: Record<string,string> = {
          nunca: "nunca respondeu",
          prometeu_nao_entregou: "prometeu entregar mas não entregou",
          prometeu_nao_devolveu: "disse que ia devolver mas não devolveu",
        };
        descricaoCaso =
          `Serviço contratado: ${servNome}. Empresa: ${servEmpresa}. Valor pago: R$ ${servValor}. ` +
          `Contratado há: ${prazoLabel[servPrazo] || servPrazo}. Comprovante: ${compLabel[servComprovante] || servComprovante}. ` +
          `Retorno da empresa: ${respLabel[servResposta] || servResposta}.`;
      } else if (tipoCaso === "cobranca_indevida") {
        const tpLabel: Record<string,string> = {
          nao_devo: "cobrança de algo que o consumidor não deve",
          serasa_sem_motivo: "negativação no Serasa/SPC sem motivo",
          valor_errado: "cobrança de valor errado (maior que o combinado)",
          apos_cancel: "cobrança persistente após cancelamento",
        };
        const serasaLabel: Record<string,string> = { sim: "sim", nao: "não", nao_sei: "não sabe ainda" };
        const compLabel: Record<string,string> = { sim: "sim, tem comprovante", nao: "não tem comprovante" };
        descricaoCaso =
          `Situação: ${tpLabel[cobrancaTipo] || cobrancaTipo}. Empresa: ${cobrancaEmpresa}. ` +
          `Valor cobrado: R$ ${cobrancaValor}. Negativação (Serasa/SPC): ${serasaLabel[cobrancaSerasa] || cobrancaSerasa}. ` +
          `Comprovante: ${compLabel[cobrancaComprovante] || cobrancaComprovante}.`;
      } else if (tipoCaso === "produto_defeito") {
        const probLabel: Record<string,string> = {
          defeito_entrega: "produto chegou com defeito",
          parou_pouco_tempo: "produto parou de funcionar em pouco tempo",
          diferente_anunciado: "produto diferente do que foi anunciado",
          nao_entregue: "produto não foi entregue",
        };
        const prazoLabel: Record<string,string> = {
          ate_30d: "menos de 30 dias",
          "30_90d": "entre 30 e 90 dias",
          "90d_6m": "entre 90 dias e 6 meses",
          mais_6m: "mais de 6 meses",
        };
        const ondeLabel: Record<string,string> = {
          loja_fisica: "loja física",
          site_app: "site/app (compra online)",
          marketplace: "marketplace (Mercado Livre, Shopee, etc)",
        };
        descricaoCaso =
          `Produto: ${prodNome}. Problema: ${probLabel[prodProblema] || prodProblema}. ` +
          `Comprado ${prazoLabel[prodPrazo] || prodPrazo} em ${ondeLabel[prodOnde] || prodOnde}. ` +
          `Empresa: ${prodEmpresa}. Valor: R$ ${prodValor}.`;
      }
      const situacao = SITUACOES_CASO.find((s) => s.id === tipoCaso);
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
      if (!data.plano_acao) data.plano_acao = {};
      data.plano_acao.resumo_direitos = data.plano_acao.resumo_direitos || gerarResumoDireitos(tipoCaso!, cia);
      data.plano_acao.pedidos_cabiveis = data.plano_acao.pedidos_cabiveis || pedidosCabiveis(tipoCaso!);

      // O e-mail de notificação e o token pra mandar cópia são sempre gerados
      // no SERVIDOR (/api/caso/preparar-email) — nunca confiamos em
      // assunto/corpo computados aqui pra disparar e-mail de verdade depois.
      // Se essa chamada falhar, cai pro gerador local só pra exibição —
      // nesse caso não há token, então a cópia por e-mail não é enviada.
      let token: string | null = null;
      try {
        const prepRes = await fetch("/api/caso/preparar-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipoCaso, descricao: descricaoCaso,
            ciaNome: cia?.nome, ciaEmail: cia?.email,
            email: emailUsuario,
          }),
        });
        const prepData = await prepRes.json();
        if (prepRes.ok && prepData.assunto && prepData.corpo) {
          data.plano_acao.email_empresa = { assunto: prepData.assunto, corpo: prepData.corpo };
          token = prepData.token;
        }
      } catch { /* segue com o fallback abaixo */ }
      if (!data.plano_acao.email_empresa) {
        data.plano_acao.email_empresa = gerarEmailEmpresa(tipoCaso!, descricaoCaso, cia);
      }

      setResultado(data);
      setEmailCopiaToken(token);
      registrarLead({ email: emailUsuario, modo: "caso", tipoCaso, ciaAerea, evento: "caso_gerado" });
      // Manda uma cópia do e-mail grátis pro próprio usuário — não bloqueia a
      // navegação se falhar. Só dispara quando temos o token assinado.
      if (token) {
        fetch("/api/enviar-copia-notificacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        }).catch(() => {});
      }
      setStep(99);
    } catch (err: any) {
      setError(err?.message || "Erro ao analisar o caso.");
    } finally { setLoading(false); }
  }

  async function handleCheckout() {
    if (!resultado) return;
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    setError("");
    setCheckoutLoading(true);
    localStorage.setItem("clara_resultado", JSON.stringify({ resultado, contractType, modo }));
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailUsuario,
          origin: window.location.origin,
          produto: "analise",
        }),
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

  // ─── Helpers de checkout (usados tanto pelo fluxo Cartão quanto Pix) ────
  // Gera o e-mail pra empresa, grava no localStorage e devolve a "descricaoCurta"
  // usada no metadata do provider de pagamento.
  function prepararCheckoutMetadata(): string {
    const cia = CIAS_AEREAS.find((c) => c.id === ciaAerea);
    const dataFmt = dataVoo ? new Date(dataVoo + "T12:00:00").toLocaleDateString("pt-BR") : "";
    let descricao = "";
    if (isVoo) {
      const tipoLabel: Record<string, string> = { voo_atrasado: "atraso do voo", voo_cancelado: "cancelamento do voo", bagagem: "problema com bagagem" };
      descricao = `Passageiro ${nomeCompleto}${cpf ? ", CPF " + cpf : ""}. Voo ${numVoo}${dataFmt ? " em " + dataFmt : ""}. ${SITUACOES_CASO.find((s) => s.id === tipoCaso)?.titulo || tipoLabel[tipoCaso!] || ""}.`;
    } else if (tipoCaso === "cobranca_indevida") {
      descricao = `Empresa: ${cobrancaEmpresa}. Valor cobrado: R$ ${cobrancaValor}. Negativação (Serasa/SPC): ${cobrancaSerasa === "sim" ? "sim" : cobrancaSerasa === "nao" ? "não" : "não sabe ainda"}.`;
    } else if (tipoCaso === "produto_defeito") {
      descricao = `Produto: ${prodNome}. Empresa: ${prodEmpresa}. Valor: R$ ${prodValor}.`;
    } else if (tipoCaso === "servico_nao_entregue") {
      descricao = `Serviço: ${servNome}. Empresa: ${servEmpresa}. Valor pago: R$ ${servValor}.`;
    }

    // Salva o e-mail gerado no localStorage pra /sucesso mostrar
    try {
      const emailGerado = gerarEmailEmpresa(tipoCaso!, descricao, cia);
      const paraEmpresa =
        isVoo ? (cia && cia.id !== "outra" && cia.email ? cia.email : "consulte o site da companhia") :
        tipoCaso === "cobranca_indevida" ? "consulte o site da empresa (SAC)" :
        tipoCaso === "produto_defeito" ? "consulte o site da loja (SAC)" :
        tipoCaso === "servico_nao_entregue" ? "consulte o site da empresa (SAC)" :
        "consulte o site da empresa";
      localStorage.setItem("clara_email_gerado", JSON.stringify({
        assunto: emailGerado.assunto,
        corpo: emailGerado.corpo,
        para: paraEmpresa,
        geradoEm: new Date().toISOString(),
      }));
    } catch { /* segue mesmo se falhar */ }

    // Descrição curta pro webhook salvar em user_casos
    const situacaoTitulo = SITUACOES_CASO.find((s) => s.id === tipoCaso)?.titulo ?? tipoCaso ?? "";
    let descricaoCurta = situacaoTitulo;
    if (isVoo && nomeCompleto) {
      descricaoCurta = `${situacaoTitulo} — ${nomeCompleto}${numVoo ? ` · Voo ${numVoo}` : ""}`;
    } else if (tipoCaso === "cobranca_indevida" && cobrancaEmpresa) {
      descricaoCurta = `Cobrança indevida — ${cobrancaEmpresa} · R$ ${cobrancaValor}`;
    } else if (tipoCaso === "produto_defeito" && prodNome) {
      descricaoCurta = `Produto defeituoso — ${prodNome}${prodEmpresa ? ` · ${prodEmpresa}` : ""}`;
    } else if (tipoCaso === "servico_nao_entregue" && servNome) {
      descricaoCurta = `Serviço não entregue — ${servNome}${servEmpresa ? ` · ${servEmpresa}` : ""}`;
    } else if (tipoCaso === "bagagem" && nomeCompleto) {
      descricaoCurta = `${situacaoTitulo} — ${nomeCompleto}${numVoo ? ` · Voo ${numVoo}` : ""}`;
    }
    return descricaoCurta;
  }

  async function iniciarCheckoutStripe() {
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    setError("");
    const descricaoCurta = prepararCheckoutMetadata();
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailUsuario,
          origin: window.location.origin,
          produto: "pacote",
          metadata: { tipo_caso: tipoCaso ?? "", descricao: descricaoCurta },
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Não foi possível iniciar o pagamento. Tente novamente.");
    } catch {
      setError("Erro ao iniciar o pagamento. Tente novamente.");
    }
  }

  async function iniciarCheckoutPix() {
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    setError("");
    setPixModalAberto(true);
    setPixStatus("loading");
    setPixData(null);
    setPixProduto("pacote");
    const descricaoCurta = prepararCheckoutMetadata();
    // Guarda a metadata pra o polling passar pro /api/pix/status quando detectar PAID.
    setPixMetadata({
      email: emailUsuario,
      produto: "pacote",
      tipo_caso: tipoCaso ?? "",
      descricao: descricaoCurta,
    });
    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailUsuario,
          produto: "pacote",
          metadata: { tipo_caso: tipoCaso ?? "", descricao: descricaoCurta },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.brCodeBase64) {
        setError("Não foi possível gerar o Pix agora. Tente Cartão de crédito ou tente de novo em instantes.");
        setPixStatus("erro");
        return;
      }
      setPixData({ id: data.id, brCode: data.brCode, brCodeBase64: data.brCodeBase64, expiresAt: data.expiresAt, amount: data.amount });
      setPixStatus("aguardando");
    } catch {
      setError("Erro ao gerar Pix. Tente Cartão de crédito ou tente de novo.");
      setPixStatus("erro");
    }
  }

  // ─── Handlers de checkout da Análise de Contrato ────────────────────────
  // Cartão e Pix usam a mesma infra dinâmica (/api/checkout e /api/pix/create),
  // que lê o preço de PRODUTOS.analise no backend — evita depender de um
  // Payment Link estático do Stripe com preço fixo (fonte do bug de preço errado).
  async function iniciarCheckoutAnaliseStripe() {
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailUsuario,
          origin: window.location.origin,
          produto: "analise",
          metadata: { contractType: contractType || "" },
        }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setError("Não foi possível iniciar o pagamento. Tente novamente.");
    } catch {
      setError("Erro ao iniciar o pagamento. Tente novamente.");
    }
  }

  async function iniciarCheckoutAnalisePix() {
    if (!emailValido(emailUsuario)) { setError("Informe seu e-mail para receber os documentos"); return; }
    setError("");
    setPixModalAberto(true);
    setPixStatus("loading");
    setPixData(null);
    setPixProduto("analise");
    // Salva o resultado da análise no localStorage pra sobreviver ao redirect
    // pós-PAID (o Page usa isso pra restaurar o unlocked em /enviar?unlocked=true).
    try {
      localStorage.setItem("clara_resultado", JSON.stringify({ resultado, contractType, modo }));
    } catch { /* segue mesmo se falhar */ }
    // Guarda a metadata pra o polling passar pro /api/pix/status quando detectar PAID.
    setPixMetadata({
      email: emailUsuario,
      produto: "analise",
      contractType: contractType || "",
    });
    try {
      const res = await fetch("/api/pix/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailUsuario,
          produto: "analise",
          metadata: { contractType: contractType || "" },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.brCodeBase64) {
        setError("Não foi possível gerar o Pix agora. Tente Cartão de crédito ou tente de novo em instantes.");
        setPixStatus("erro");
        return;
      }
      setPixData({ id: data.id, brCode: data.brCode, brCodeBase64: data.brCodeBase64, expiresAt: data.expiresAt, amount: data.amount });
      setPixStatus("aguardando");
    } catch {
      setError("Erro ao gerar Pix. Tente Cartão de crédito ou tente de novo.");
      setPixStatus("erro");
    }
  }

  // Polling do status do Pix a cada 4s, enquanto o modal está aberto e status = aguardando.
  useEffect(() => {
    if (!pixData || pixStatus !== "aguardando") return;
    let cancelado = false;
    const tick = async () => {
      try {
        // Passa metadata na URL — quando o backend detectar PAID, executa fulfillCheckout
        // server-side (workaround do webhook AbacatePay). Idempotente do lado do backend.
        const qs = new URLSearchParams(pixMetadata).toString();
        const url = `/api/pix/status/${encodeURIComponent(pixData.id)}${qs ? `?${qs}` : ""}`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();
        if (cancelado) return;
        const status = String(data.status || "").toUpperCase();
        if (status === "PAID") {
          setPixStatus("pago");
          // Redirect varia por produto:
          //  - pacote: /sucesso (bloco email pronto + acompanhar caso)
          //  - análise: /enviar?unlocked=true (recupera resultado do localStorage e mostra unlocked)
          const target = pixProduto === "analise"
            ? "/enviar?unlocked=true"
            : "/sucesso?src=pix&id=" + encodeURIComponent(pixData.id);
          setTimeout(() => { window.location.href = target; }, 1500);
        } else if (status === "EXPIRED" || status === "CANCELLED" || status === "FAILED") {
          setPixStatus("expirado");
        }
      } catch { /* silencia falhas transientes */ }
    };
    const interval = setInterval(tick, 4000);
    tick();
    return () => { cancelado = true; clearInterval(interval); };
  }, [pixData, pixStatus, pixProduto, pixMetadata]);

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
          <Shell title="Qual é o seu e-mail?" subtitle="Você vai receber a análise e os documentos por aqui.">
            <input type="email" required value={emailUsuario} onChange={(e) => setEmailUsuario(e.target.value)}
              placeholder="voce@email.com"
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
              {SITUACOES_CASO.map((s) => {
                const ativo = s.id === "voo_atrasado" || s.id === "voo_cancelado" || s.id === "bagagem" || s.id === "cobranca_indevida" || s.id === "produto_defeito" || s.id === "servico_nao_entregue";
                return (
                  <button key={s.id} type="button"
                    onClick={() => ativo && setTipoCaso(s.id)}
                    className={`rounded-[18px] border-2 p-4 text-left transition-all relative ${
                      !ativo ? "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60" :
                      tipoCaso === s.id ? "border-[#D4AF37] bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}>
                    {!ativo && (
                      <span className="absolute top-2 right-2 text-[10px] font-bold bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Em breve</span>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-[#0e2b50] mb-1">{s.titulo}</div>
                        <div className="text-xs text-slate-500 leading-relaxed">{s.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 — VOO ATRASADO (dados pessoais + cia + perguntas de atraso) */}
        {modo === "caso" && step === 2 && tipoCaso === "voo_atrasado" && (
          <Shell title="Seus dados para o caso" subtitle="A Clara vai preparar tudo com seu nome e número de voo.">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo</label>
                <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Como consta no documento de identidade"
                  className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
              </div>
              {/* CPF só é pedido depois, na hora do Kit Juizado (petição) — não antes do plano grátis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Número do voo</label>
                  <input type="text" value={numVoo} onChange={(e) => setNumVoo(e.target.value.toUpperCase())}
                    placeholder="Ex: LA1234 ou G31234"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data do voo</label>
                  <input type="date" value={dataVoo} onChange={(e) => setDataVoo(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Companhia aérea</label>
                <div className="grid grid-cols-2 gap-2">
                  {CIAS_AEREAS.map((cia) => (
                    <button key={cia.id} type="button" onClick={() => setCiaAerea(cia.id)}
                      className={`rounded-[16px] border-2 p-3 text-left transition-all ${ciaAerea === cia.id ? "border-[#D4AF37] bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <div className="text-sm font-semibold text-[#0e2b50]">{cia.nome}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Perguntas para calcular probabilidade */}
              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Detalhes do problema</div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quanto tempo de atraso?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "1_2h", l: "1 a 2 horas" },
                      { v: "2_4h", l: "2 a 4 horas" },
                      { v: "4_8h", l: "4 a 8 horas" },
                      { v: "8_12h", l: "8 a 12 horas" },
                      { v: "12_24h", l: "12 a 24 horas" },
                      { v: "mais_24h", l: "Mais de 24 horas" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setTempoAtraso(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold transition-all ${tempoAtraso === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Recebeu voucher de alimentação?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "sim", l: "Sim, adequado" },
                      { v: "voucher_pequeno", l: "Sim, mas insuficiente" },
                      { v: "nao", l: "Não recebi nada" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setAssistenciaComida(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold transition-all ${assistenciaComida === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Recebeu voucher de hotel?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "sim", l: "Sim" },
                      { v: "nao", l: "Não recebi" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setAssistenciaHotel(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold transition-all ${assistenciaHotel === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teve despesas extras comprovadas?</label>
                  <p className="text-xs text-slate-500 mb-2">Hotel, transporte, refeição paga do próprio bolso</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "sim", l: "Sim, tenho notas" },
                      { v: "nao", l: "Não tive" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setPrejuizoExtra(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold transition-all ${prejuizoExtra === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
            {/* Telefone e documentos só são pedidos depois, na hora do Kit Juizado */}
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 — VOO CANCELADO */}
        {modo === "caso" && step === 2 && tipoCaso === "voo_cancelado" && (
          <Shell title="Seus dados para o caso" subtitle="A Clara vai preparar tudo com seu nome e número de voo.">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo</label>
                <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Como consta no documento de identidade"
                  className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
              </div>
              {/* CPF só é pedido depois, na hora do Kit Juizado (petição) — não antes do plano grátis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Número do voo</label>
                  <input type="text" value={numVoo} onChange={(e) => setNumVoo(e.target.value.toUpperCase())}
                    placeholder="Ex: LA1234 ou G31234"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data do voo</label>
                  <input type="date" value={dataVoo} onChange={(e) => setDataVoo(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Companhia aérea</label>
                <div className="grid grid-cols-2 gap-2">
                  {CIAS_AEREAS.map((cia) => (
                    <button key={cia.id} type="button" onClick={() => setCiaAerea(cia.id)}
                      className={`rounded-[16px] border-2 p-3 text-left transition-all ${ciaAerea === cia.id ? "border-[#D4AF37] bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <div className="text-sm font-semibold text-[#0e2b50]">{cia.nome}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sobre o cancelamento</div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">O que a companhia ofereceu?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "nada", l: "Nada — não ofereceram alternativa" },
                      { v: "reacomodacao_ruim", l: "Reacomodação em voo muito posterior (+4h)" },
                      { v: "reembolso_atrasado", l: "Reembolso, mas demorou / não recebi" },
                      { v: "vale_viagem", l: "Vale-viagem que não quero" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setVoocanOferecido(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold text-left transition-all ${voocanOferecido === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">O cancelamento foi avisado com antecedência?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "sem_aviso", l: "Não — soube no aeroporto" },
                      { v: "menos_24h", l: "Menos de 72h antes" },
                      { v: "mais_72h", l: "Mais de 72h antes" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setVoocanAviso(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold text-left transition-all ${voocanAviso === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Teve prejuízo além do voo? <span className="text-slate-400 font-normal">(pode marcar mais de um)</span></label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "hotel", l: "Hotel perdido" },
                      { v: "reuniao", l: "Reunião/evento perdido" },
                      { v: "outros_gastos", l: "Outros gastos comprovados" },
                      { v: "nenhum", l: "Não tive prejuízo adicional" },
                    ].map((op) => {
                      const marcado = voocanPrejuizos.includes(op.v);
                      return (
                        <button key={op.v} type="button"
                          onClick={() => {
                            if (op.v === "nenhum") { setVoocanPrejuizos(marcado ? [] : ["nenhum"]); return; }
                            const semNenhum = voocanPrejuizos.filter((v) => v !== "nenhum");
                            setVoocanPrejuizos(marcado ? semNenhum.filter((v) => v !== op.v) : [...semNenhum, op.v]);
                          }}
                          className={`rounded-[12px] border-2 p-2 text-xs font-semibold text-left transition-all ${marcado ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                          {op.l}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 — BAGAGEM */}
        {modo === "caso" && step === 2 && tipoCaso === "bagagem" && (
          <Shell title="Seus dados para o caso" subtitle="A Clara vai preparar tudo com base na ANAC 400/2016 e na Convenção de Montreal.">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome completo</label>
                <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Como consta no documento de identidade"
                  className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
              </div>
              {/* CPF só é pedido depois, na hora do Kit Juizado (petição) — não antes do plano grátis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Número do voo</label>
                  <input type="text" value={numVoo} onChange={(e) => setNumVoo(e.target.value.toUpperCase())}
                    placeholder="Ex: LA1234 ou G31234"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Data do voo</label>
                  <input type="date" value={dataVoo} onChange={(e) => setDataVoo(e.target.value)}
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Companhia aérea</label>
                <div className="grid grid-cols-2 gap-2">
                  {CIAS_AEREAS.map((cia) => (
                    <button key={cia.id} type="button" onClick={() => setCiaAerea(cia.id)}
                      className={`rounded-[16px] border-2 p-3 text-left transition-all ${ciaAerea === cia.id ? "border-[#D4AF37] bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300"}`}>
                      <div className="text-sm font-semibold text-[#0e2b50]">{cia.nome}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sobre sua bagagem</div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">O que aconteceu com sua bagagem?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "extraviada", l: "Mala extraviada (não chegou)" },
                      { v: "danificada", l: "Mala danificada (chegou com dano)" },
                      { v: "itens_furtados", l: "Itens furtados da mala" },
                      { v: "atrasou_muito", l: "Mala atrasou muito" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setTipoBagagem(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${tipoBagagem === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Você fez o registro na companhia (PIR)?</label>
                  <p className="text-xs text-slate-500 mb-2">PIR é o Property Irregularity Report — registro obrigatório no balcão da cia no aeroporto.</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "sim", l: "Sim, tenho o número do PIR" },
                      { v: "nao", l: "Não fiz o registro" },
                      { v: "tentei_nao_consegui", l: "Tentei mas não consegui" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setBagPir(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${bagPir === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Qual o valor estimado do prejuízo?</label>
                  <p className="text-xs text-slate-500 mb-2">Some o valor dos itens perdidos, danificados ou furtados.</p>
                  <input type="text" inputMode="decimal" value={bagValor} onChange={(e) => setBagValor(e.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="R$ 0,00"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>
              </div>
            </div>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 — COBRANÇA INDEVIDA / SERASA */}
        {modo === "caso" && step === 2 && tipoCaso === "cobranca_indevida" && (
          <Shell title="Conta o que aconteceu" subtitle="A Clara vai preparar sua notificação com base nas suas respostas.">
            <div className="space-y-5">
              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">O que a empresa fez com você?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "nao_devo", l: "Cobraram algo que não devo" },
                      { v: "serasa_sem_motivo", l: "Meu nome foi ao Serasa/SPC sem motivo" },
                      { v: "valor_errado", l: "Cobraram valor errado (maior que o combinado)" },
                      { v: "apos_cancel", l: "Continuaram cobrando após cancelamento" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setCobrancaTipo(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${cobrancaTipo === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Qual empresa está te cobrando?</label>
                  <p className="text-xs text-slate-500 mb-2">Pode ser banco, financeira, operadora, loja — qualquer uma.</p>
                  <input type="text" value={cobrancaEmpresa} onChange={(e) => setCobrancaEmpresa(e.target.value)}
                    placeholder="Ex: Banco X, Operadora Y, Loja Z"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Qual valor estão cobrando?</label>
                  <p className="text-xs text-slate-500 mb-2">Mesmo que seja pequeno, a lei prevê devolução. Coloque o valor que estão cobrando.</p>
                  <input type="text" inputMode="decimal" value={cobrancaValor} onChange={(e) => setCobrancaValor(e.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="R$ 0,00"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Seu nome foi para o Serasa ou SPC?</label>
                  <p className="text-xs text-slate-500 mb-2">Negativação indevida costuma gerar indenização por dano moral — mesmo sem prejuízo comprovado.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "sim", l: "Sim" },
                      { v: "nao", l: "Não" },
                      { v: "nao_sei", l: "Não sei ainda" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setCobrancaSerasa(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold transition-all ${cobrancaSerasa === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Você tem algum comprovante?</label>
                  <p className="text-xs text-slate-500 mb-2">Pagamento, cancelamento, contrato — qualquer coisa que mostre que a cobrança está errada. Se não tiver, tudo bem — ainda tem como resolver.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "sim", l: "Sim, tenho" },
                      { v: "nao", l: "Não tenho" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setCobrancaComprovante(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold transition-all ${cobrancaComprovante === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 — PRODUTO COM DEFEITO */}
        {modo === "caso" && step === 2 && tipoCaso === "produto_defeito" && (
          <Shell title="Conta sobre o produto" subtitle="A Clara vai preparar sua notificação com base no CDC art. 18.">
            <div className="space-y-5">
              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">O que você comprou?</label>
                  <p className="text-xs text-slate-500 mb-2">Ex: celular, geladeira, roupa, sapato…</p>
                  <input type="text" value={prodNome} onChange={(e) => setProdNome(e.target.value)}
                    placeholder="Nome do produto"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Qual o problema?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "defeito_entrega", l: "Produto chegou com defeito" },
                      { v: "parou_pouco_tempo", l: "Parou de funcionar em pouco tempo" },
                      { v: "diferente_anunciado", l: "É diferente do que foi anunciado" },
                      { v: "nao_entregue", l: "Produto não foi entregue" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setProdProblema(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${prodProblema === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quando você comprou?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "ate_30d", l: "Menos de 30 dias" },
                      { v: "30_90d", l: "Entre 30 e 90 dias" },
                      { v: "90d_6m", l: "Entre 90 dias e 6 meses" },
                      { v: "mais_6m", l: "Mais de 6 meses" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setProdPrazo(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${prodPrazo === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Onde comprou?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "loja_fisica", l: "Loja física" },
                      { v: "site_app", l: "Site / app (compra online)" },
                      { v: "marketplace", l: "Marketplace (Mercado Livre, Shopee, etc)" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setProdOnde(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${prodOnde === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Qual empresa?</label>
                    <input type="text" value={prodEmpresa} onChange={(e) => setProdEmpresa(e.target.value)}
                      placeholder="Nome da loja/fabricante"
                      className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Valor do produto</label>
                    <input type="text" inputMode="decimal" value={prodValor ? `R$ ${prodValor}` : ""} onChange={(e) => setProdValor(maskBRL(e.target.value))}
                      placeholder="R$ 0,00"
                      className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                  </div>
                </div>
              </div>
            </div>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 — SERVIÇO NÃO ENTREGUE */}
        {modo === "caso" && step === 2 && tipoCaso === "servico_nao_entregue" && (
          <Shell title="Conta sobre o serviço" subtitle="A Clara vai preparar sua notificação com base no CDC art. 35.">
            <div className="space-y-5">
              <div className="rounded-[14px] bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Qual serviço você contratou?</label>
                  <p className="text-xs text-slate-500 mb-2">Ex: academia, curso online, reforma, delivery, assinatura…</p>
                  <input type="text" value={servNome} onChange={(e) => setServNome(e.target.value)}
                    placeholder="Nome ou tipo do serviço"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Qual empresa?</label>
                  <input type="text" value={servEmpresa} onChange={(e) => setServEmpresa(e.target.value)}
                    placeholder="Nome da empresa"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Qual o valor pago?</label>
                  <input type="text" inputMode="decimal" value={servValor} onChange={(e) => setServValor(e.target.value.replace(/[^\d,.]/g, ""))}
                    placeholder="R$ 0,00"
                    className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-3 text-base outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Quando foi contratado?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "menos_7d", l: "Menos de 7 dias" },
                      { v: "7_30d", l: "Entre 7 e 30 dias" },
                      { v: "30_90d", l: "Entre 30 e 90 dias" },
                      { v: "mais_90d", l: "Mais de 90 dias" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setServPrazo(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${servPrazo === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tem comprovante de pagamento?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { v: "sim", l: "Sim" },
                      { v: "nao", l: "Não" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setServComprovante(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-xs font-semibold transition-all ${servComprovante === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">A empresa respondeu alguma vez?</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { v: "nunca", l: "Nunca respondeu" },
                      { v: "prometeu_nao_entregou", l: "Prometeu entregar mas não entregou" },
                      { v: "prometeu_nao_devolveu", l: "Disse que vai devolver mas não devolveu" },
                    ].map((op) => (
                      <button key={op.v} type="button" onClick={() => setServResposta(op.v)}
                        className={`rounded-[12px] border-2 p-2 text-sm font-semibold text-left transition-all ${servResposta === op.v ? "border-[#D4AF37] bg-amber-50 text-[#0e2b50]" : "border-slate-200 bg-white text-slate-600"}`}>
                        {op.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Nav nextLabel="Continuar" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 2 — OUTROS (fallback textarea para tipos ainda não implementados) */}
        {modo === "caso" && step === 2 && !isCasoAtivo && (
          <Shell title="Conta com suas palavras o que aconteceu" subtitle="Quanto mais detalhe, mais preciso será o plano de ação da Clara.">
            <div className="mb-4 rounded-[14px] bg-blue-50 border border-blue-100 p-4 text-sm text-blue-800">
              <strong className="font-medium">Dicas para um relato completo:</strong>
              <ul className="mt-2 space-y-1 text-xs text-blue-700">
                <li>• Quando aconteceu? (data aproximada)</li>
                <li>• Qual empresa?</li>
                <li>• O que foi prometido e o que você recebeu?</li>
                <li>• Quanto pagou ou quanto perdeu?</li>
                <li>• Já tentou resolver antes? Como responderam?</li>
              </ul>
            </div>
            <textarea ref={descricaoCasoRef} rows={10}
              placeholder="Ex: Em março comprei um produto que apresentou defeito em 2 semanas. A loja se recusou a trocar..."
              className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none leading-relaxed" />
            <Nav nextLabel="Montar meu plano" onNext={next} onBack={back} />
          </Shell>
        )}

        {/* CASO step 3 — e-mail */}
        {modo === "caso" && step === 3 && (
          <Shell title="Qual é o seu e-mail?" subtitle="Enviaremos seu plano de ação e seu e-mail de notificação grátis para este endereço.">
            <input type="email" required value={emailUsuario} onChange={(e) => setEmailUsuario(e.target.value)}
              placeholder="voce@email.com"
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
          <Shell title={cepProprioJec ? "Qual é o CEP da sua casa?" : "Qual é o CEP da empresa?"} subtitle="O CEP determina qual fórum é competente para o seu caso.">
            <div className="flex gap-3 mb-2">
              <input
                type="text"
                inputMode="numeric"
                placeholder={cepProprioJec ? "Seu CEP (ex: 01310-100)" : "CEP da empresa (ex: 01310-100)"}
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
            <p className="text-sm text-slate-500 mb-1">
              {cepProprioJec
                ? "Como consumidor, você pode entrar com a ação no Juizado da sua cidade (CDC, art. 101, I)."
                : "Digite o CEP da empresa ou do local onde o problema aconteceu (Lei 9.099/95, art. 4º)."}
            </p>
            <button
              type="button"
              onClick={() => { setCepProprioJec((v) => !v); setCepEmpresa(""); setForoJec(null); }}
              className="text-sm font-medium text-blue-600 mb-5 block"
            >
              {cepProprioJec
                ? "Prefere usar o endereço da empresa ou do local onde o problema aconteceu? Também pode (Lei 9.099/95, art. 4º) →"
                : "← Usar o CEP da sua casa (recomendado)"}
            </button>

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
                <p className="text-xs text-slate-500 mt-1">Dano material + dano moral. Máximo 20 salários mínimos no JEC — acima disso precisa de advogado.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Descreva o que aconteceu</label>
                <textarea
                  ref={descricaoJecRef}
                  rows={8}
                  defaultValue={defaultDescricaoJec}
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
              <label className="block text-sm font-semibold text-slate-700 mb-2">Seu e-mail <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={emailUsuario}
                onChange={(e) => setEmailUsuario(e.target.value)}
                placeholder="voce@email.com"
                className="w-full rounded-[18px] border border-slate-300 bg-white px-4 py-4 text-base outline-none"
              />
            </div>
            <div className="rounded-[14px] bg-amber-50 border border-amber-200 p-4 mb-6">
              <p className="text-sm text-amber-800 leading-relaxed">
                💡 <strong>Como funciona:</strong> A Clara gera o modelo de petição agora. Você revisa e protocola no fórum (por e-mail ou presencialmente). <strong>R$49,90 — pagamento único</strong> pelo pacote completo.
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
                  <div className="text-xl font-bold text-[#0e2b50]">Seu modelo de petição JEC está pronto — revise e protocole</div>
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
              <h3 className="text-lg font-bold text-[#0e2b50] mb-2">R$49,90 — pagamento único</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Você paga uma única vez pelo pacote completo: notificação, orientações e modelos prontos para você revisar e agir.
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
              {resultado.plano_acao?.pedidos_cabiveis && resultado.plano_acao.pedidos_cabiveis.length > 0 && (
                <div className="mt-3 rounded-[14px] bg-green-50 border border-green-100 p-4">
                  <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">O que você pode pedir</div>
                  <ul className="space-y-1">
                    {resultado.plano_acao.pedidos_cabiveis.map((item, i) => (
                      <li key={i} className="text-sm font-semibold text-green-800 flex gap-2">
                        <span aria-hidden="true">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-xs text-green-600 mt-2">Orientativo · depende do caso</div>
                </div>
              )}
            </div>

            {/* Casos similares — classificação qualitativa (sem percentual) */}
            {(() => {
              const prob = calcularProbabilidade(tipoCaso!, tempoAtraso, assistenciaComida, assistenciaHotel, prejuizoExtra, avisoPrevia, tipoBagagem);
              const bgClass = prob.score >= 80 ? "bg-green-50 border-green-200" : prob.score >= 60 ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200";
              return (
                <div className={`rounded-[24px] border-2 ${bgClass} p-6`}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: prob.cor }}>Casos similares</div>
                  <div className="text-lg font-bold mb-3" style={{ color: prob.cor }}>{prob.label}</div>
                  <p className="text-sm leading-relaxed text-slate-700">{prob.texto}</p>
                  <p className="text-xs mt-3 text-slate-500">Baseado em casos similares · orientativo · não é garantia de resultado</p>
                </div>
              );
            })()}

            <>

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
                const dataFormatada = dataVoo ? new Date(dataVoo + "T12:00:00").toLocaleDateString("pt-BR") : "";
                return cia ? (
                  <div className="rounded-[14px] bg-blue-50 border border-blue-200 p-4 mb-4 space-y-4">
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Como enviar sua reclamação para a {cia.nome}</div>
                    {/* Dados do caso */}
                    {nomeCompleto && (
                      <div className="rounded-[12px] bg-white border border-blue-200 px-4 py-3 space-y-1">
                        <div className="text-xs font-semibold text-slate-500 mb-1.5">Seus dados para o e-mail</div>
                        <div className="text-xs text-slate-700"><span className="font-medium">Passageiro:</span> {nomeCompleto}{cpf ? ` — CPF ${cpf}` : ""}</div>
                        <div className="text-xs text-slate-700"><span className="font-medium">Voo:</span> {numVoo}{dataFormatada ? ` em ${dataFormatada}` : ""}</div>
                      </div>
                    )}
                    {/* E-mail direto */}
                    {cia.email && (
                      <div className="flex items-center gap-3 rounded-[12px] bg-white border border-blue-200 px-4 py-3">
                        <span className="text-lg">✉️</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-slate-500 mb-0.5">E-mail SAC</div>
                          <span className="text-sm font-bold text-blue-700 break-all">{cia.email}</span>
                        </div>
                        <a href={`mailto:${cia.email}?subject=${encodeURIComponent(`Notificação formal — Voo ${numVoo || ""}`)}&body=${encodeURIComponent(`Prezados,\n\nMeu nome é ${nomeCompleto || "[SEU NOME]"}${cpf ? ", CPF " + cpf : ""}.\n\n[DESCREVA O PROBLEMA AQUI]\n\nNúmero do voo: ${numVoo || "[NÚMERO]"}\nData: ${dataFormatada || "[DATA]"}\n\nAguardo retorno.\n\n${nomeCompleto || "[SEU NOME]"}`)}`}
                          className="rounded-full bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 whitespace-nowrap flex-shrink-0">
                          Abrir e-mail →
                        </a>
                      </div>
                    )}
                    {/* Docs etapa 1 */}
                    <div>
                      <div className="text-xs font-semibold text-blue-800 mb-2">Documentos para anexar neste e-mail</div>
                      <div className="space-y-1.5">
                        {[
                          { doc: "Comprovante de reserva/bilhete", req: true },
                          { doc: "Comprovante do atraso/cancelamento", desc: "print do app, e-mail da cia ou boarding pass", req: true },
                          { doc: "Notas de despesas extras", desc: "hotel, refeição — se tiver", req: false },
                        ].map((d) => (
                          <div key={d.doc} className="flex items-start gap-2 text-xs text-blue-800">
                            <span className="mt-0.5">{d.req ? "✅" : "⚪"}</span>
                            <span>{d.doc}{d.desc ? <span className="text-blue-600"> — {d.desc}</span> : null}{!d.req ? <span className="text-slate-400"> (opcional)</span> : null}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        cia.email ? `Clique em "Abrir e-mail" — o assunto e seus dados já estarão preenchidos` : "Copie o texto do e-mail gerado abaixo",
                        "Anexe os documentos listados acima",
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
              {resultado.plano_acao?.email_empresa && (() => {
                const email = resultado.plano_acao.email_empresa;
                const destinatario = isVoo ? (CIAS_AEREAS.find(c => c.id === ciaAerea)?.email || "") : "";
                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1${destinatario ? `&to=${encodeURIComponent(destinatario)}` : ""}&su=${encodeURIComponent(email.assunto)}&body=${encodeURIComponent(email.corpo)}`;
                const mailtoUrl = `mailto:${destinatario}?subject=${encodeURIComponent(email.assunto)}&body=${encodeURIComponent(email.corpo)}`;
                return (
                  <div className="rounded-[14px] border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="text-sm font-semibold text-[#0e2b50]">E-mail de notificação — liberado agora</div>
                      <button onClick={() => {
                        const texto = `Assunto: ${email.assunto}\n\n${email.corpo}`;
                        navigator.clipboard.writeText(texto);
                      }} className="rounded-full bg-[#0e2b50] text-white px-3 py-1.5 text-xs font-semibold">📋 Copiar e-mail</button>
                    </div>
                    {destinatario && (
                      <div className="text-xs text-slate-500 mb-2">Destinatário sugerido: <strong className="text-slate-700">{destinatario}</strong></div>
                    )}
                    <div className="text-xs text-slate-400 mb-1">Assunto</div>
                    <div className="text-sm font-semibold text-[#0e2b50] mb-3">{email.assunto}</div>
                    <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-3">
                      {email.corpo}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={gmailUrl} target="_blank" rel="noreferrer" className="rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold px-3 py-1.5">Abrir no Gmail →</a>
                      <a href={mailtoUrl} className="rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold px-3 py-1.5">Abrir no app de e-mail →</a>
                      <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium self-center">Gerado pela Clara · orientativo</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      ⚠️ Modelo orientativo — revise antes de enviar.{emailCopiaToken && emailUsuario ? ` Também te mandamos uma cópia em ${emailUsuario}.` : ""}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Passo 2 */}
            <div className="rounded-[24px] border border-amber-200 bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">2</div>
                <div>
                  <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Se a empresa não responder em 10 dias</div>
                  <div className="text-lg font-bold text-[#0e2b50]">
                    {isVoo ? "Registre na ANAC e no consumidor.gov.br" :
                     tipoCaso === "cobranca_indevida" ? "Registre no Procon e no Banco Central" :
                     tipoCaso === "produto_defeito" ? "Registre no Procon e no Reclame Aqui" :
                     "Registre no Procon e no consumidor.gov.br"}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">
                Taxa de resolução de 8 em cada 10 casos. A empresa tem 10 dias para responder ou o caso fica marcado como "não resolvido" no histórico dela.
              </p>

              {/* Documentos novos para esta etapa */}
              {isVoo && (
                <div className="rounded-[14px] bg-amber-50 border border-amber-200 p-4 mb-4">
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Documentos adicionais nesta etapa</div>
                  <div className="space-y-1.5">
                    {[
                      { doc: "Protocolo de atendimento da companhia", desc: "número que você recebeu na Etapa 1", req: true },
                      { doc: "Prazo decorrido", desc: "prova de que a empresa não respondeu (print ou print do e-mail sem retorno)", req: true },
                    ].map((d) => (
                      <div key={d.doc} className="flex items-start gap-2 text-xs text-amber-800">
                        <span className="mt-0.5">✅</span>
                        <span>{d.doc}{d.desc ? <span className="text-amber-600"> — {d.desc}</span> : null}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANAC — só para voos */}
              {isVoo && (
                <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 mb-4">
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
                      `Informe: voo ${numVoo || "[número]"}, data e companhia`,
                      "Anexe: boarding pass + protocolo da Etapa 1",
                      "Guarde o protocolo ANAC — apresente no JEC se precisar",
                    ].map((s, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Procon — para os tipos que não são de voo */}
              {!isVoo && (
                <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-semibold text-slate-700">Procon</div>
                      <div className="text-xs text-slate-500 mt-0.5">Órgão de proteção ao consumidor do seu estado/cidade.</div>
                    </div>
                    <a href="https://www.consumidor.gov.br/pages/conteudo/publico/procons" target="_blank" rel="noreferrer"
                      className="rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold px-4 py-1.5 whitespace-nowrap">
                      Encontrar →
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "Encontre o Procon da sua cidade ou estado",
                      "Registre a reclamação com o e-mail que você já enviou",
                      "O Procon pode notificar a empresa e mediar o acordo",
                    ].map((s, i) => (
                      <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* consumidor.gov.br / Banco Central / Reclame Aqui */}
              <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold text-amber-800">
                    {tipoCaso === "cobranca_indevida" ? "Banco Central (se instituição financeira)" :
                     tipoCaso === "produto_defeito" ? "Reclame Aqui" :
                     "consumidor.gov.br"}
                  </div>
                  <a href={
                    tipoCaso === "cobranca_indevida" ? "https://www.bcb.gov.br/acessoinformacao/registrar_reclamacao" :
                    tipoCaso === "produto_defeito" ? "https://www.reclameaqui.com.br" :
                    "https://www.consumidor.gov.br"
                  } target="_blank" rel="noreferrer"
                    className="rounded-full bg-amber-700 text-white text-xs font-semibold px-4 py-1.5">
                    Abrir →
                  </a>
                </div>
                <div className="space-y-1.5">
                  {[
                    'Clique em "Registrar reclamação" e busque a empresa',
                    "Descreva o problema — pode colar o e-mail que você já enviou",
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
            </div>

            {/* Passo 3 */}
            <div className="rounded-[24px] border-2 border-[#D4AF37] bg-white p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-amber-50 border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] font-bold text-sm flex-shrink-0">3</div>
                <div>
                  <div className="text-xs font-semibold text-[#854F0B] uppercase tracking-wider">Se não resolver — sem advogado</div>
                  <div className="text-lg font-bold text-[#0e2b50]">Juizado Especial Cível (JEC)</div>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Se a empresa não responder em até 10 dias, o próximo passo é o Juizado Especial — gratuito e sem advogado. O Kit Juizado prepara a petição e mostra o fórum certo. <strong>R$49,90 · pagamento único.</strong>
              </p>

              {/* Documentos novos para JEC */}
              <div className="rounded-[14px] bg-amber-50 border border-amber-200 p-4 mb-4">
                <div className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2">Documentos adicionais para o JEC</div>
                <div className="space-y-1.5">
                  {[
                    { doc: "CEP e endereço completo", desc: "seu endereço residencial", req: true },
                    { doc: "Comprovante de residência", desc: "conta de luz, água ou extrato recente", req: true },
                    { doc: "Protocolo ANAC ou consumidor.gov.br", desc: "da Etapa 2", req: true },
                    { doc: "Assinatura digital ou presença no fórum", req: true },
                  ].map((d) => (
                    <div key={d.doc} className="flex items-start gap-2 text-xs text-amber-800">
                      <span className="mt-0.5">✅</span>
                      <span>{d.doc}{d.desc ? <span className="text-amber-600"> — {d.desc}</span> : null}</span>
                    </div>
                  ))}
                </div>
                {isVoo && ciaAerea && (() => {
                  const cia = CIAS_AEREAS.find(c => c.id === ciaAerea);
                  return cia && cia.id !== "outra" ? (
                    <div className="mt-3 rounded-[10px] bg-white border border-amber-200 px-3 py-2 text-xs text-amber-700">
                      A Clara preenche automaticamente o endereço da {cia.nome} como ré.
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {[
                  { icon: "💸", t: "É gratuito",   s: "Sem custas até o julgamento" },
                  { icon: "🤝", t: "Sem advogado", s: "Para causas até 20 salários mínimos" },
                  { icon: "📧", t: "Por e-mail",   s: "Muitos foros aceitam protocolo online" },
                ].map((item) => (
                  <div key={item.t} className="rounded-[14px] bg-amber-50 border border-amber-100 p-3 text-center">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold text-amber-800">{item.t}</div>
                    <div className="text-xs text-amber-700 mt-0.5">{item.s}</div>
                  </div>
                ))}
              </div>
              {/* Tabs Cartão / Pix */}
              <div className="flex gap-2 mb-3" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={metodoPagamento === "cartao"}
                  onClick={() => setMetodoPagamento("cartao")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
                    metodoPagamento === "cartao"
                      ? "bg-[#0e2b50]/10 text-[#0e2b50] border border-[#0e2b50]/40"
                      : "bg-transparent text-slate-500 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  💳 Cartão
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={metodoPagamento === "pix"}
                  onClick={() => setMetodoPagamento("pix")}
                  className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
                    metodoPagamento === "pix"
                      ? "bg-[#0e2b50]/10 text-[#0e2b50] border border-[#0e2b50]/40"
                      : "bg-transparent text-slate-500 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  ⚡ Pix
                </button>
              </div>

              {PIX_TEMPORARIAMENTE_INDISPONIVEL && metodoPagamento === "pix" ? (
                <>
                  <div className="rounded-[14px] bg-[#FFF9ED] border border-[#fcd34d] p-4 text-center">
                    <div className="text-sm font-bold text-[#92400e] mb-1">⚠ Pix temporariamente indisponível</div>
                    <div className="text-xs text-[#92400e] leading-relaxed">
                      Estamos ajustando com o provedor. Enquanto isso, use <strong>Cartão de crédito</strong> na aba ao lado — funcionando normalmente.
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-center">R$49,90 · pagamento único</p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const cia = CIAS_AEREAS.find(c => c.id === ciaAerea);
                      if (cia && cia.id !== "outra") setNomeEmpresa(cia.nome);
                      const jecDesc = isVoo && nomeCompleto
                        ? `Passageiro ${nomeCompleto}${cpf ? ", CPF " + cpf : ""}. Voo ${numVoo}${dataVoo ? " em " + new Date(dataVoo + "T12:00:00").toLocaleDateString("pt-BR") : ""}. ${SITUACOES_CASO.find(s => s.id === tipoCaso)?.titulo || ""}.`
                        : descricaoCasoRef.current?.value || "";
                      setDefaultDescricaoJec(jecDesc);
                      setMostrarContrato(true);
                    }}
                    className="w-full rounded-full bg-[#D4AF37] text-[#0e2b50] font-black text-base py-4">
                    Quero meu Kit Juizado — R$49,90 →
                  </button>
                  <p className="text-xs text-slate-400 mt-2 text-center">
                    R$49,90 · pagamento único
                    {metodoPagamento === "pix" && <span> · confirmação em segundos</span>}
                  </p>
                  <DisclaimerBox variant="curto" style={{ marginTop: 10 }} />
                </>
              )}
            </div>

            {/* Gate do Kit Juizado — CPF/telefone/documentos (opcionais) + Termos,
                só agora, na hora de pagar. Ao aceitar, segue pro checkout. */}
            {mostrarContrato && (
              <ContratoModal
                nomePassageiro={nomeCompleto || "Consumidor"}
                tipoLabel={SITUACOES_CASO.find(s => s.id === tipoCaso)?.titulo}
                ciaNome={isVoo ? CIAS_AEREAS.find(c => c.id === ciaAerea)?.nome : undefined}
                numVoo={isVoo ? numVoo : undefined}
                dataVoo={isVoo && dataVoo ? new Date(dataVoo + "T12:00:00").toLocaleDateString("pt-BR") : undefined}
                cpf={cpf}
                onCpfChange={setCpf}
                telefone={telefone}
                onTelefoneChange={setTelefone}
                documentos={isVoo ? [
                  { label: "Comprovante de reserva/bilhete", value: docBilhete, onChange: setDocBilhete },
                  { label: "Comprovante do atraso (print, boarding pass)", value: docAtraso, onChange: setDocAtraso },
                  { label: "Notas de despesas extras (se tiver)", value: docDespesas, onChange: setDocDespesas },
                ] : undefined}
                onFechar={() => setMostrarContrato(false)}
                onAceitar={async (pdfBlob: Blob) => {
                  setMostrarContrato(false);
                  try {
                    const cia = CIAS_AEREAS.find(c => c.id === ciaAerea);
                    const caso = await salvarCaso({
                      tipo_caso: tipoCaso!,
                      cia_aerea: isVoo ? (cia?.nome || ciaAerea) : "",
                      nome_completo: nomeCompleto,
                      cpf,
                      email_usuario: emailUsuario,
                      telefone,
                      num_voo: isVoo ? numVoo : "",
                      data_voo: isVoo ? dataVoo : "",
                      tempo_atraso: isVoo ? tempoAtraso : "",
                      recebeu_comida: isVoo ? assistenciaComida : "",
                      recebeu_hotel: isVoo ? assistenciaHotel : "",
                      despesas_extras: isVoo ? prejuizoExtra : "",
                      contrato_aceito: true,
                    });
                    setCasoId(caso.id);
                    // Alerta interno
                    fetch("/api/alerta-caso", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        nomeCompleto, cpf, emailUsuario, telefone,
                        tipoCaso, ciaAerea: isVoo ? (cia?.nome || ciaAerea) : "",
                        numVoo, dataVoo, casoId: caso.id,
                      }),
                    }).catch(() => {});
                    // Upload contrato assinado
                    await uploadContrato(caso.id, pdfBlob, nomeCompleto);
                    // Upload docs se houver (só voo coleta documento nesta etapa)
                    if (docBilhete) await uploadDocumento(caso.id, docBilhete, "bilhete", nomeCompleto);
                    if (docAtraso) await uploadDocumento(caso.id, docAtraso, "comprovante_atraso", nomeCompleto);
                    if (docDespesas) await uploadDocumento(caso.id, docDespesas, "despesas_extras", nomeCompleto);
                  } catch (err) {
                    console.error("Erro ao salvar caso:", err);
                  }
                  // Segue pro checkout do Kit Juizado (Stripe ou Pix, conforme aba escolhida)
                  if (metodoPagamento === "cartao") iniciarCheckoutStripe();
                  else iniciarCheckoutPix();
                }}
              />
            )}
              </>
          </div>
        )}

        {/* RESULTADO CONTRATO */}
        {step === 99 && modo === "contrato" && resultado && (
          <div ref={resultadoContainerRef}>
            <ResultadoContrato
              resultado={resultado}
              contractType={contractType}
              unlockedAnalysis={unlockedAnalysis}
              emailUsuario={emailUsuario}
              metodoPagamento={metodoPagamento}
              setMetodoPagamento={setMetodoPagamento}
              iniciarCheckoutAnaliseStripe={iniciarCheckoutAnaliseStripe}
              iniciarCheckoutAnalisePix={iniciarCheckoutAnalisePix}
              reanaliseDe={reanaliseDe}
            />
          </div>
        )}

        {/* MODAL PIX — QR + copia-e-cola + polling do status */}
        {pixModalAberto && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Pagamento via Pix"
            style={{
              position: "fixed", inset: 0, background: "rgba(14,43,80,0.72)",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 100, padding: 16,
            }}
            onClick={() => {
              // Fechar clicando fora só quando não está no meio do polling ativo — evita perder o QR por acidente
              if (pixStatus === "expirado" || pixStatus === "erro") {
                setPixModalAberto(false); setPixData(null); setPixStatus("loading");
              }
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 20, padding: 24, maxWidth: 420, width: "100%",
                boxShadow: "0 20px 60px rgba(14,43,80,0.4)",
              }}
            >
              {pixStatus === "loading" && (
                <div style={{ textAlign: "center", padding: "40px 16px" }}>
                  <div style={{ fontSize: 16, color: "#0e2b50", fontWeight: 700 }}>Gerando seu Pix…</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 8 }}>Só um instante.</div>
                </div>
              )}

              {pixData && pixStatus === "aguardando" && (
                <>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 6 }}>Pagamento via Pix</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#0e2b50" }}>Escaneie o QR ou copie o código</div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>R$ {(pixData.amount / 100).toFixed(2).replace(".", ",")} · confirmação automática em segundos</div>
                  </div>

                  {/* QR image */}
                  <div style={{ display: "flex", justifyContent: "center", margin: "16px 0", padding: 12, background: "#F8F7F4", borderRadius: 12 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pixData.brCodeBase64.startsWith("data:") ? pixData.brCodeBase64 : `data:image/png;base64,${pixData.brCodeBase64}`}
                      alt="QR Code Pix"
                      style={{ width: 200, height: 200, imageRendering: "pixelated" }}
                    />
                  </div>

                  {/* Copia e cola */}
                  <div style={{ background: "#F8F7F4", border: "1px solid #E0DDD6", borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Código Pix (copia e cola)</div>
                    <div style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, Consolas, monospace", color: "#374151", wordBreak: "break-all", lineHeight: 1.5, maxHeight: 60, overflow: "auto" }}>
                      {pixData.brCode}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(pixData.brCode);
                        setPixCopiado(true);
                        setTimeout(() => setPixCopiado(false), 2000);
                      } catch {
                        setError("Não foi possível copiar. Selecione o código e copie manualmente.");
                      }
                    }}
                    style={{
                      width: "100%", padding: "12px 16px", borderRadius: 40, border: "none",
                      background: pixCopiado ? "#10b981" : "#1a2340", color: "#fff",
                      fontSize: 14, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    {pixCopiado ? "✓ Copiado!" : "📋 Copiar código Pix"}
                  </button>

                  <div style={{ marginTop: 14, padding: "10px 12px", background: "#F0F4FF", border: "1px solid #C7D2FE", borderRadius: 8, fontSize: 12, color: "#3730a3", textAlign: "center", lineHeight: 1.5 }}>
                    ⏳ Aguardando confirmação do pagamento…<br />
                    <span style={{ fontSize: 11, color: "#6b7280" }}>Assim que o banco confirmar, você é redirecionado automaticamente.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => { setPixModalAberto(false); setPixData(null); setPixStatus("loading"); }}
                    style={{ width: "100%", marginTop: 10, padding: "10px", background: "transparent", border: "none", color: "#6b7280", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                  >
                    Cancelar e voltar
                  </button>
                </>
              )}

              {pixStatus === "pago" && (
                <div style={{ textAlign: "center", padding: "40px 16px" }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#065f46", marginBottom: 6 }}>Pagamento confirmado!</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>Preparando seu kit…</div>
                </div>
              )}

              {pixStatus === "expirado" && (
                <div style={{ textAlign: "center", padding: "24px 16px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⏰</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0e2b50", marginBottom: 6 }}>Pix expirado</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Nenhuma cobrança foi feita. Gere um novo Pix pra tentar de novo.</div>
                  <button
                    type="button"
                    onClick={() => {
                      // Retry usa o mesmo produto que abriu esse modal (pacote ou análise)
                      setPixData(null);
                      setPixStatus("loading");
                      if (pixProduto === "analise") iniciarCheckoutAnalisePix();
                      else iniciarCheckoutPix();
                    }}
                    style={{ background: "#1a2340", color: "#fff", padding: "12px 24px", borderRadius: 40, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", marginRight: 8 }}
                  >
                    Gerar novo Pix
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPixModalAberto(false); setPixData(null); setPixStatus("loading"); }}
                    style={{ background: "transparent", color: "#6b7280", padding: "12px 16px", border: "none", fontSize: 13, cursor: "pointer" }}
                  >
                    Fechar
                  </button>
                </div>
              )}

              {pixStatus === "erro" && (
                <div style={{ textAlign: "center", padding: "24px 16px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#0e2b50", marginBottom: 6 }}>Falha ao gerar Pix</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
                    {error || "Tente Cartão de crédito ou tente de novo em instantes."}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPixData(null);
                      setPixStatus("loading");
                      if (pixProduto === "analise") iniciarCheckoutAnalisePix();
                      else iniciarCheckoutPix();
                    }}
                    style={{ background: "#1a2340", color: "#fff", padding: "12px 24px", borderRadius: 40, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", marginRight: 8 }}
                  >
                    Tentar de novo
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPixModalAberto(false); setPixData(null); setPixStatus("loading"); }}
                    style={{ background: "transparent", color: "#6b7280", padding: "12px 16px", border: "none", fontSize: 13, cursor: "pointer" }}
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
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

function OpcaoCard({ id, icon, label, desc, selecionada, onClick, cor = "blue" }: {
  id: string; icon: string; label: string; desc?: string;
  selecionada: boolean; onClick: () => void; cor?: "blue" | "amber";
}) {
  const sel = selecionada;
  const ring = cor === "amber"
    ? (sel ? "border-[#D4AF37] bg-amber-50" : "border-slate-200 bg-white hover:border-amber-200")
    : (sel ? "border-[#0e2b50] bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200");
  return (
    <button type="button" onClick={onClick}
      className={`rounded-[16px] border-2 p-3 text-left transition-all ${ring}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>
        <div>
          <div className={`text-sm font-semibold leading-snug ${sel ? "text-[#0e2b50]" : "text-slate-700"}`}>{label}</div>
          {desc && <div className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</div>}
        </div>
      </div>
    </button>
  );
}

function calcularProbabilidade(
  tipo: TipoCaso,
  tempoAtraso: string, assistenciaComida: string, assistenciaHotel: string, prejuizoExtra: string,
  avisoPrevia: string, tipoBagagem: string
): { score: number; label: string; cor: string; texto: string } {
  let score = 60;
  if (tipo === "voo_atrasado") {
    const base: Record<string, number> = { "1_2h": 25, "2_4h": 48, "4_8h": 72, "8_12h": 82, "12_24h": 88, "mais_24h": 93 };
    score = base[tempoAtraso] ?? 60;
    if (assistenciaComida === "nao") score = Math.min(95, score + 7);
    else if (assistenciaComida === "voucher_pequeno") score = Math.min(95, score + 3);
    if (assistenciaHotel === "nao") score = Math.min(95, score + 5);
    if (prejuizoExtra === "sim") score = Math.min(95, score + 5);
  } else if (tipo === "voo_cancelado") {
    const base: Record<string, number> = { "sem_aviso": 90, "menos_24h": 83, "24_72h": 72, "mais_72h": 52 };
    score = base[avisoPrevia] ?? 72;
  } else if (tipo === "bagagem") {
    score = 80;
  } else if (tipo === "cobranca_indevida") { score = 84; }
  else if (tipo === "produto_defeito") { score = 71; }
  else if (tipo === "servico_nao_entregue") { score = 85; }
  const label = score >= 80 ? "Favorável em casos similares" : score >= 60 ? "Moderado em casos similares" : "Depende do contexto";
  const cor = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#6b7280";
  const texto = score >= 80
    ? "Em casos similares registrados no TJSP, consumidores obtiveram resultado favorável. Cada caso é único — resultado não garantido."
    : score >= 60
    ? "Há precedentes favoráveis, mas o resultado depende das provas que você conseguir reunir."
    : "O resultado depende bastante do contexto e das provas — o e-mail costuma ser o melhor primeiro passo.";
  return { score, label, cor, texto };
}

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

function ResultadoContrato({
  resultado, contractType, unlockedAnalysis,
  emailUsuario, metodoPagamento, setMetodoPagamento,
  iniciarCheckoutAnaliseStripe, iniciarCheckoutAnalisePix,
  reanaliseDe,
}: {
  resultado: ResultData;
  contractType: string;
  unlockedAnalysis: boolean;
  emailUsuario: string;
  metodoPagamento: "cartao" | "pix";
  setMetodoPagamento: (m: "cartao" | "pix") => void;
  iniciarCheckoutAnaliseStripe: () => Promise<void>;
  iniciarCheckoutAnalisePix: () => Promise<void>;
  reanaliseDe: string | null;
}) {
  // emailUsuario recebido como prop pra futuras exibições/valicação inline;
  // hoje só os handlers do pai o consomem via closure.
  void emailUsuario;
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

      {unlockedAnalysis && reanaliseDe ? (
        // Reanálise grátis — vinculada ao caso original pago
        <div id="analise-unlocked-anchor" className="rounded-[18px] border-2 border-[#6EE7B7] bg-[#F0FDF9] p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">✓</span>
            <h3 className="text-lg font-bold text-[#065f46]">Reanálise grátis</h3>
          </div>
          <p className="text-sm text-[#065f46] leading-relaxed">
            Essa análise está vinculada ao seu caso original — nenhuma cobrança será feita.
          </p>
        </div>
      ) : unlockedAnalysis ? (
        // Análise desbloqueada após pagamento — substitui o paywall
        <div id="analise-unlocked-anchor" className="rounded-[18px] border-2 border-[#6EE7B7] bg-[#F0FDF9] p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">✅</span>
            <h3 className="text-lg font-bold text-[#065f46]">Análise desbloqueada</h3>
          </div>
          <p className="text-sm text-[#065f46] leading-relaxed mb-1">
            Pagamento confirmado — sua análise completa está liberada abaixo, junto com o e-mail pronto pra você negociar.
          </p>
        </div>
      ) : (
        <div className="rounded-[18px] border-2 border-[#0e2b50] bg-white p-8">
          <h3 className="text-xl font-bold text-[#0e2b50]">Você está a um clique de evitar um problema no seu contrato</h3>
          <p className="mt-1 text-sm text-slate-600">{resultado.paywall?.subtexto || "Desbloqueie a análise completa e proteja-se antes de assinar."}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>• Leitura detalhada cláusula por cláusula</li>
            <li>• Recomendações práticas para negociar</li>
            <li>• E-mail pronto com cada ponto do contrato</li>
            <li>• Perguntas para revisar com advogado ou com a outra parte</li>
          </ul>

          {/* Tabs Cartão / Pix — mesma UX do card do pacote, cores adaptadas ao fundo branco */}
          <div className="mt-5 flex gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={metodoPagamento === "cartao"}
              onClick={() => setMetodoPagamento("cartao")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
                metodoPagamento === "cartao"
                  ? "bg-[#0e2b50]/10 text-[#0e2b50] border border-[#0e2b50]/40"
                  : "bg-transparent text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              💳 Cartão
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={metodoPagamento === "pix"}
              onClick={() => setMetodoPagamento("pix")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold transition-all ${
                metodoPagamento === "pix"
                  ? "bg-[#0e2b50]/10 text-[#0e2b50] border border-[#0e2b50]/40"
                  : "bg-transparent text-slate-500 border border-slate-200 hover:border-slate-300"
              }`}
            >
              ⚡ Pix
            </button>
          </div>

          {PIX_TEMPORARIAMENTE_INDISPONIVEL && metodoPagamento === "pix" ? (
            <>
              <div className="mt-3 rounded-[14px] bg-[#FFF9ED] border border-[#fcd34d] p-4 text-center">
                <div className="text-sm font-bold text-[#92400e] mb-1">⚠ Pix temporariamente indisponível</div>
                <div className="text-xs text-[#92400e] leading-relaxed">
                  Estamos ajustando com o provedor. Enquanto isso, use <strong>Cartão de crédito</strong> na aba ao lado — funcionando normalmente.
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-slate-400">Acesso imediato · Pagamento único</p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={metodoPagamento === "cartao" ? iniciarCheckoutAnaliseStripe : iniciarCheckoutAnalisePix}
                className="mt-3 w-full rounded-full bg-[#0e2b50] py-3 text-sm font-semibold text-white">
                Desbloquear análise completa — R$9,90 →
              </button>
              <p className="mt-3 text-center text-xs text-slate-400">
                R$9,90 · acesso imediato · pagamento único
                {metodoPagamento === "pix" && <span> · confirmação em segundos</span>}
              </p>
            </>
          )}
        </div>
      )}

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
      return `Pela Resolução ANAC 400/2016, ${ciaNome} deve oferecer assistência material a partir de 1h de atraso (comunicação), alimentação a partir de 2h e acomodação + transporte a partir de 4h. Casos assim costumam resultar em reembolso das despesas comprovadas e, para atrasos acima de 4h, indenização por danos morais reconhecida pelo TJSP. Orientativo · depende do caso e do juiz.`;
    case "voo_cancelado":
      return `Pela Resolução ANAC 400/2016 (art. 21 e 25), ${ciaNome} deve oferecer reacomodação, reembolso integral ou viagem em data futura — à escolha do passageiro — além de assistência material completa. Cancelamento sem aviso prévio costuma ensejar reparação por dano moral. Orientativo · depende do caso e do juiz.`;
    case "bagagem":
      return `A Resolução ANAC 400/2016 fixa prazo de 7 dias (doméstico) ou 21 dias (internacional) para localização de bagagem extraviada. Casos assim costumam resultar em indenização pelo valor dos itens perdidos ou danificados e, em muitos casos, dano moral. Orientativo · depende do caso e do juiz.`;
    case "produto_defeito":
      return `O CDC (art. 18) prevê que, em caso de vício ou defeito de produto, a loja/fabricante deve reparar em até 30 dias. Não sanado o vício no prazo, casos assim costumam resultar em substituição, devolução ou abatimento do preço, à escolha do consumidor. Compras online têm ainda direito de arrependimento em 7 dias (art. 49). Orientativo · depende do caso e do juiz.`;
    case "cobranca_indevida":
      return `Cobrança de valor que o consumidor não deve vai contra o CDC (art. 42). Casos assim costumam resultar em devolução em dobro do valor cobrado. Se houve negativação indevida no Serasa/SPC, a Súmula 385 do STJ e a jurisprudência dominante costumam reconhecer reparação por dano moral. Orientativo · depende do caso e do juiz.`;
    case "servico_nao_entregue":
      return `Serviço pago e não entregue vai contra o CDC (art. 35). Casos assim costumam resultar em devolução integral do valor pago, mais reparação pelos danos materiais e morais comprovados. Orientativo · depende do caso e do juiz.`;
    default:
      return `O CDC prevê proteção ao consumidor em diversas situações. A Clara vai te ajudar a identificar o caminho certo para resolver seu caso.`;
  }
}

function pedidosCabiveis(tipo: TipoCaso): string[] {
  switch (tipo) {
    case "voo_atrasado":
      return [
        "Assistência material não prestada (alimentação, hospedagem, comunicação)",
        "Reembolso de despesas comprovadas por causa do atraso",
        "Eventual dano moral, dependendo da gravidade do caso",
      ];
    case "voo_cancelado":
      return [
        "Reembolso integral do bilhete ou reacomodação em outro voo",
        "Assistência material não prestada",
        "Eventual dano moral, dependendo da gravidade do caso",
      ];
    case "bagagem":
      return [
        "Reembolso pelos itens danificados, extraviados ou faltantes",
        "Eventual dano moral, dependendo da gravidade do caso",
      ];
    case "cobranca_indevida":
      return [
        "Devolução do valor cobrado indevidamente",
        "Eventual dano moral, especialmente em caso de negativação indevida",
      ];
    case "produto_defeito":
      return [
        "Substituição do produto",
        "Devolução do valor pago",
        "Abatimento proporcional do preço",
        "Eventual dano moral, dependendo do caso",
      ];
    case "servico_nao_entregue":
      return [
        "Devolução do valor pago pelo serviço",
        "Eventual dano moral, dependendo do caso",
      ];
    default:
      return [
        "Reparação dos danos materiais comprovados",
        "Eventual dano moral, dependendo do caso",
      ];
  }
}
