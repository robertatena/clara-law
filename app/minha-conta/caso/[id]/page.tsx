"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-auth";

const ClaraIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

type Caso = {
  id: string;
  tipo_caso: string;
  descricao: string | null;
  status: string;
  created_at: string;
  email_enviado_em: string | null;
  resolvido_em: string | null;
  dados_json: Record<string, unknown> | null;
};

type ForumInfo = {
  encontrado: boolean;
  fonte?: "mapa_local_sp" | "mapa_nacional" | "tribunal_uf";
  foro?: string;
  tribunal?: string;
  sigla?: string;
  endereco?: string;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string;
  estado?: string;
  email?: string;
  telefone?: string;
  horario?: string;
  buscaUrl?: string;
  fonteUrl?: string;
  observacoes?: string;
  verificado?: "tj_oficial_fetch" | "busca_oficial" | "parcial";
  cep?: string;
  aviso?: string;
  mensagem?: string;
  link?: string;
};

type Mensagem = {
  id: string;
  role: "user" | "assistant";
  conteudo: string;
  created_at: string;
};

const LABEL_TIPO: Record<string, string> = {
  voo_atrasado: "Voo atrasado",
  voo_cancelado: "Voo cancelado",
  cobranca_indevida: "Cobrança indevida",
  produto_defeito: "Produto com defeito",
  analise_contrato: "Análise de contrato",
  desconhecido: "Caso",
};

export default function CasoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const casoId = params?.id ?? "";
  const supabase = createBrowserSupabase();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [caso, setCaso] = useState<Caso | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [escaladoStatus, setEscaladoStatus] = useState<"" | "enviado" | "falhou">("");
  const [respostaLembrete, setRespostaLembrete] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

  // Busca de fórum por CEP
  const [cepInput, setCepInput] = useState("");
  const [buscandoForum, setBuscandoForum] = useState(false);
  const [forum, setForum] = useState<ForumInfo | null>(null);
  const [erroForum, setErroForum] = useState("");

  // Auth + fetch caso + fetch mensagens
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelado) return;
      if (!session) {
        router.replace("/minha-conta");
        return;
      }

      const { data: casoData, error: casoErr } = await supabase
        .from("user_casos")
        .select("id, tipo_caso, descricao, status, created_at, email_enviado_em, resolvido_em, dados_json")
        .eq("id", casoId)
        .maybeSingle();
      if (cancelado) return;
      if (casoErr || !casoData) {
        setErro("Caso não encontrado ou você não tem acesso.");
        setCarregando(false);
        return;
      }
      setCaso(casoData as Caso);

      const { data: msgData } = await supabase
        .from("mensagens")
        .select("id, role, conteudo, created_at")
        .eq("caso_id", casoId)
        .order("created_at", { ascending: true });
      if (cancelado) return;
      setMensagens((msgData as Mensagem[] | null) ?? []);
      setCarregando(false);
    })();
    return () => { cancelado = true; };
  }, [casoId, router, supabase]);

  // Auto-scroll pro final do chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens.length, enviando]);

  // Busca de fórum — debounce 300ms quando o CEP chega em 8 dígitos
  useEffect(() => {
    const digits = cepInput.replace(/\D/g, "");
    if (digits.length !== 8) return;
    const t = setTimeout(() => { buscarForum(digits); }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cepInput]);

  async function buscarForum(cepDigits?: string) {
    const cep = (cepDigits ?? cepInput).replace(/\D/g, "");
    if (cep.length !== 8) {
      setErroForum("Digite os 8 dígitos do CEP.");
      return;
    }
    setBuscandoForum(true);
    setErroForum("");
    try {
      const res = await fetch(`/api/forum?cep=${cep}`);
      const data = (await res.json()) as ForumInfo;
      setForum(data);
      if (!data.encontrado) {
        setErroForum(data.mensagem || "CEP não encontrado.");
      }
    } catch {
      setErroForum("Não conseguimos consultar agora. Tente de novo em instantes.");
      setForum(null);
    } finally {
      setBuscandoForum(false);
    }
  }

  async function enviar(e?: React.FormEvent, override?: string) {
    e?.preventDefault();
    const texto = (override ?? input).trim();
    if (!texto || enviando || !caso) return;

    setInput("");
    setEnviando(true);

    // Otimista — mostra mensagem do usuário imediatamente
    const tempUser: Mensagem = {
      id: `temp-${Date.now()}`,
      role: "user",
      conteudo: texto,
      created_at: new Date().toISOString(),
    };
    setMensagens((m) => [...m, tempUser]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ casoId, mensagem: texto }),
      });
      const data = await res.json();
      if (!res.ok || !data.resposta) {
        setMensagens((m) => [
          ...m,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            conteudo: "Desculpe, tive um problema pra responder agora. Tente novamente em instantes.",
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        // Recarrega do banco para pegar IDs reais
        const { data: fresh } = await supabase
          .from("mensagens")
          .select("id, role, conteudo, created_at")
          .eq("caso_id", casoId)
          .order("created_at", { ascending: true });
        setMensagens((fresh as Mensagem[] | null) ?? []);
        if (data.escalado_status === "enviado" || data.escalado_status === "falhou") {
          setEscaladoStatus(data.escalado_status);
        }
      }
    } catch {
      setMensagens((m) => [
        ...m,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          conteudo: "Erro de conexão. Verifique sua internet e tente de novo.",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  async function escalar() {
    // Envia direto passando o texto — não depende do state atualizar antes
    await enviar(undefined, "Preciso de ajuda humana");
  }

  async function marcarEmailEnviado() {
    if (!caso || atualizandoStatus) return;
    setAtualizandoStatus(true);
    try {
      const agora = new Date().toISOString();
      const { error } = await supabase
        .from("user_casos")
        .update({ status: "email_enviado", email_enviado_em: agora })
        .eq("id", casoId);
      if (error) {
        console.error("update_status_error:", error);
        return;
      }
      setCaso((prev) => (prev ? { ...prev, status: "email_enviado", email_enviado_em: agora } : prev));
    } finally {
      setAtualizandoStatus(false);
    }
  }

  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh", paddingTop: 64 }}>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(26,35,64,0.04)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/minha-conta" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </Link>
          <Link href="/minha-conta" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Meus casos</Link>
        </div>
      </nav>

      <section style={{ padding: "56px 24px 40px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {carregando && <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center" }}>Carregando…</p>}

          {erro && (
            <div style={{ background: "#FFF9ED", border: "1px solid #fcd34d", color: "#92400e", padding: "16px 20px", borderRadius: 12, fontSize: 14 }}>
              {erro}
              <div style={{ marginTop: 8 }}>
                <Link href="/minha-conta" style={{ color: "#185FA5", fontSize: 13 }}>← Voltar aos meus casos</Link>
              </div>
            </div>
          )}

          {!carregando && caso && (
            <>
              {/* Header do caso */}
              <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "20px 22px", marginBottom: 20, boxShadow: "0 6px 20px rgba(26,35,64,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 6 }}>
                  {LABEL_TIPO[caso.tipo_caso] || caso.tipo_caso}
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#1a2340", marginBottom: 6, lineHeight: 1.35 }}>
                  {caso.descricao || "Sem descrição"}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Aberto em {new Date(caso.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  {" · "}
                  <span style={{ color: caso.status === "ativo" ? "#10b981" : "#6b7280", fontWeight: 600 }}>{caso.status}</span>
                </div>
              </div>

              {/* Timeline do caso — visão de "onde estou" */}
              {(() => {
                const fmt = (iso: string | null) =>
                  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : null;
                type Etapa = { titulo: string; subtitulo?: string; concluido: boolean; data?: string | null };
                const etapas: Etapa[] = [
                  { titulo: "Caso registrado", concluido: true, data: fmt(caso.created_at) },
                  { titulo: "E-mail de notificação enviado", subtitulo: "Você envia direto do seu e-mail — a Clara só prepara o texto.", concluido: !!caso.email_enviado_em || caso.status === "email_enviado", data: fmt(caso.email_enviado_em) },
                  { titulo: "Aguardando resposta da empresa", subtitulo: "A empresa costuma responder em até 5 dias úteis.", concluido: false },
                  { titulo: "Caso resolvido", subtitulo: "Quando a empresa devolver o valor, cumprir o combinado ou o JEC decidir.", concluido: !!caso.resolvido_em, data: fmt(caso.resolvido_em) },
                ];
                return (
                  <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "22px 24px", marginBottom: 20, boxShadow: "0 6px 20px rgba(26,35,64,0.04)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 14 }}>
                      Seu caso, passo a passo
                    </div>
                    <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 0 }}>
                      {etapas.map((e, i) => (
                        <li key={i} style={{ display: "flex", gap: 14, paddingBottom: i < etapas.length - 1 ? 18 : 0, position: "relative" }}>
                          {/* Conector vertical entre etapas */}
                          {i < etapas.length - 1 && (
                            <span
                              aria-hidden="true"
                              style={{
                                position: "absolute",
                                left: 13,
                                top: 28,
                                bottom: 0,
                                width: 2,
                                background: e.concluido && etapas[i + 1].concluido ? "#6EE7B7" : "#ECEAE4",
                              }}
                            />
                          )}
                          {/* Bolinha */}
                          <span
                            aria-hidden="true"
                            style={{
                              flexShrink: 0,
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: e.concluido ? "#10b981" : "#fff",
                              border: e.concluido ? "2px solid #10b981" : "2px solid #D0CCC4",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 700,
                              zIndex: 1,
                            }}
                          >
                            {e.concluido ? "✓" : ""}
                          </span>
                          <div style={{ flex: 1, paddingTop: 2 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: e.concluido ? "#1a2340" : "#9ca3af", lineHeight: 1.4 }}>
                              {e.titulo}
                              {e.data && (
                                <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: "#6b7280" }}>· {e.data}</span>
                              )}
                            </div>
                            {e.subtitulo && (
                              <div style={{ fontSize: 12, color: e.concluido ? "#6b7280" : "#9ca3af", lineHeight: 1.55, marginTop: 3 }}>
                                {e.subtitulo}
                              </div>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })()}

              {/* Busca de fórum por CEP — sempre disponível, útil quando o caso avança pra JEC */}
              <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "22px 24px", marginBottom: 20, boxShadow: "0 6px 20px rgba(26,35,64,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>
                  Encontrar meu fórum
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.7, marginBottom: 14 }}>
                  Quando for a hora de protocolar no Juizado, você vai precisar saber o fórum responsável. Pode descobrir aqui a qualquer momento — digite o CEP <strong>da empresa</strong> (não o seu).
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cepInput}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setCepInput(v.length > 5 ? v.slice(0, 5) + "-" + v.slice(5) : v);
                      if (v.length < 8) { setForum(null); setErroForum(""); }
                    }}
                    placeholder="CEP da empresa (ex: 01310-100)"
                    style={{ flex: "1 1 220px", padding: "12px 14px", fontSize: 14, borderRadius: 10, border: "1px solid #D0CCC4", outline: "none", background: "#fff", color: "#1a2340", fontFamily: "'Montserrat', sans-serif" }}
                  />
                  <button
                    type="button"
                    onClick={() => buscarForum()}
                    disabled={buscandoForum || cepInput.replace(/\D/g, "").length !== 8}
                    style={{ background: buscandoForum || cepInput.replace(/\D/g, "").length !== 8 ? "#E0DDD6" : "#1a2340", color: buscandoForum || cepInput.replace(/\D/g, "").length !== 8 ? "#9ca3af" : "#fff", fontSize: 13, fontWeight: 700, padding: "12px 20px", borderRadius: 10, border: "none", cursor: buscandoForum || cepInput.replace(/\D/g, "").length !== 8 ? "not-allowed" : "pointer" }}
                  >
                    {buscandoForum ? "Buscando…" : "Buscar fórum"}
                  </button>
                </div>

                {erroForum && !buscandoForum && (
                  <p style={{ fontSize: 12, color: "#dc2626", marginTop: 10 }}>{erroForum}</p>
                )}

                {forum?.encontrado && (
                  <div style={{ marginTop: 14, background: "#F8F7F4", border: "1px solid #E0DDD6", borderRadius: 10, padding: "14px 16px" }}>
                    {/* Cabeçalho: nome do foro/tribunal */}
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2340", marginBottom: 6, lineHeight: 1.35 }}>
                      🏛️ {forum.foro || forum.tribunal || "Fórum"}
                    </div>

                    {/* Localização */}
                    {(forum.cidade || forum.uf || forum.bairro) && (
                      <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                        {[forum.bairro, forum.cidade, forum.uf].filter(Boolean).join(" · ")}
                      </div>
                    )}

                    {/* Endereço */}
                    {forum.endereco && (
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.55, marginBottom: 6 }}>
                        📍 {forum.endereco}
                      </div>
                    )}

                    {/* Contatos */}
                    {forum.email && (
                      <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                        ✉️ <a href={`mailto:${forum.email}`} style={{ color: "#185FA5", textDecoration: "none" }}>{forum.email}</a>
                      </div>
                    )}
                    {forum.telefone && (
                      <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                        📞 {forum.telefone}
                      </div>
                    )}
                    {forum.horario && (
                      <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                        🕐 {forum.horario}
                      </div>
                    )}

                    {/* Fallback tribunal_uf (sem foro específico) */}
                    {forum.fonte === "tribunal_uf" && forum.buscaUrl && (
                      <a
                        href={forum.buscaUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 8, fontSize: 13, color: "#185FA5", textDecoration: "none", fontWeight: 500 }}
                      >
                        Buscar o JEC da sua comarca no {forum.sigla} →
                      </a>
                    )}

                    {/* Aviso de precisão */}
                    {(forum.aviso || forum.observacoes) && (
                      <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.6, marginTop: 10 }}>
                        ⚠️ {forum.aviso || forum.observacoes}
                      </p>
                    )}

                    {/* Link à fonte oficial (quando disponível) */}
                    {forum.fonteUrl && (
                      <a
                        href={forum.fonteUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ display: "inline-block", marginTop: 4, fontSize: 11, color: "#6b7280", textDecoration: "underline" }}
                      >
                        Fonte oficial ↗
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Card de status do envio do e-mail para a empresa */}
              {caso.status === "email_enviado" ? (
                <div style={{ background: "#F0FDF9", border: "1px solid #6EE7B7", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#065f46", marginBottom: 6 }}>
                    ✅ E-mail enviado!
                  </div>
                  <p style={{ fontSize: 13, color: "#065f46", lineHeight: 1.65, marginBottom: 10 }}>
                    A empresa tem até 5 dias úteis para responder. Se não responder, veja a Etapa 2 no seu guia.
                  </p>
                  <Link href="/guia#etapa-2" style={{ display: "inline-block", fontSize: 13, fontWeight: 600, color: "#065f46", textDecoration: "underline" }}>
                    Ver Etapa 2 no guia →
                  </Link>
                </div>
              ) : respostaLembrete ? (
                <div style={{ background: "#FFF9ED", border: "1px solid #fcd34d", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                    📧 Lembre de enviar o e-mail
                  </div>
                  <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.65, marginBottom: 10 }}>
                    Envie o e-mail gerado para a empresa. Acesse sua caixa de saída ou volte para{" "}
                    <Link href="/sucesso" style={{ color: "#92400e", fontWeight: 600, textDecoration: "underline" }}>/sucesso</Link>.
                  </p>
                  <button
                    type="button"
                    onClick={() => setRespostaLembrete(false)}
                    style={{ background: "transparent", border: "none", fontSize: 12, color: "#92400e", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                  >
                    ← Voltar
                  </button>
                </div>
              ) : (
                <div style={{ background: "#F0F4FF", border: "1px solid #C7D2FE", borderRadius: 14, padding: "18px 20px", marginBottom: 20 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2340", marginBottom: 12, lineHeight: 1.35 }}>
                    Você já enviou o e-mail de notificação para a empresa?
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={marcarEmailEnviado}
                      disabled={atualizandoStatus}
                      style={{ background: atualizandoStatus ? "#9ca3af" : "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 22, border: "none", cursor: atualizandoStatus ? "not-allowed" : "pointer" }}
                    >
                      {atualizandoStatus ? "Salvando…" : "✅ Sim, já enviei"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRespostaLembrete(true)}
                      disabled={atualizandoStatus}
                      style={{ background: "#fff", color: "#92400e", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 22, border: "1px solid #fcd34d", cursor: "pointer" }}
                    >
                      ⏳ Ainda não enviei
                    </button>
                  </div>
                </div>
              )}

              {/* Chat container */}
              <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, display: "flex", flexDirection: "column", height: "min(66vh, 620px)", overflow: "hidden", boxShadow: "0 6px 20px rgba(26,35,64,0.04)" }}>

                {/* Cabeçalho do chat */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #ECEAE4", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2340" }}>Clara IA · orientação educacional</span>
                  </div>
                  {(() => {
                    const enviadoOk = escaladoStatus === "enviado";
                    const falhou = escaladoStatus === "falhou";
                    // enviadoOk trava (não permite duplicar encaminhamento).
                    // falhou libera retry — user pode clicar de novo pra tentar.
                    const disabled = enviando || enviadoOk;
                    const bg = enviadoOk ? "#F0FDF9" : falhou ? "#FEF2F2" : "#FFF9ED";
                    const border = enviadoOk ? "#6EE7B7" : falhou ? "#FCA5A5" : "#fcd34d";
                    const color = enviadoOk ? "#065f46" : falhou ? "#b91c1c" : "#92400e";
                    const label = enviadoOk
                      ? "✓ Encaminhado"
                      : falhou
                      ? "⚠ Falhou — tentar de novo"
                      : "Falar com humano";
                    return (
                      <button
                        type="button"
                        onClick={escalar}
                        disabled={disabled}
                        title={falhou ? "Se falhar de novo, escreva para claralaw.aviso@gmail.com" : undefined}
                        style={{ fontSize: 11, fontWeight: 600, color, background: bg, border: `1px solid ${border}`, padding: "6px 12px", borderRadius: 20, cursor: disabled ? "not-allowed" : "pointer" }}
                      >
                        {label}
                      </button>
                    );
                  })()}
                </div>

                {/* Lista de mensagens */}
                <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {mensagens.length === 0 && (
                    <div style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "40px 20px", lineHeight: 1.7 }}>
                      Bem-vindo(a) 👋<br />
                      Faça qualquer pergunta sobre o seu caso — a Clara responde com base no CDC e no que você já preencheu.
                    </div>
                  )}
                  {mensagens.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        background: m.role === "user" ? "#1a2340" : "#F8F7F4",
                        color: m.role === "user" ? "#fff" : "#374151",
                        padding: "12px 16px",
                        borderRadius: 14,
                        fontSize: 14,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        border: m.role === "user" ? "none" : "1px solid #E0DDD6",
                      }}
                    >
                      {m.conteudo}
                    </div>
                  ))}
                  {enviando && (
                    <div style={{ alignSelf: "flex-start", background: "#F8F7F4", border: "1px solid #E0DDD6", padding: "12px 16px", borderRadius: 14, color: "#9ca3af", fontSize: 13 }}>
                      Clara está digitando…
                    </div>
                  )}
                </div>

                {/* Input */}
                <form onSubmit={enviar} style={{ borderTop: "1px solid #ECEAE4", padding: "14px 16px", display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escreva sua pergunta…"
                    disabled={enviando}
                    style={{ flex: 1, padding: "12px 14px", fontSize: 14, borderRadius: 22, border: "1px solid #D0CCC4", outline: "none", background: "#fff", color: "#1a2340", fontFamily: "'Montserrat', sans-serif" }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || enviando}
                    style={{ background: !input.trim() || enviando ? "#E0DDD6" : "#1a2340", color: !input.trim() || enviando ? "#9ca3af" : "#fff", fontSize: 14, fontWeight: 700, padding: "12px 20px", borderRadius: 22, border: "none", cursor: !input.trim() || enviando ? "not-allowed" : "pointer" }}
                  >
                    Enviar
                  </button>
                </form>
              </div>

              <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
                ⚠️ A Clara é uma ferramenta educacional. As respostas são orientativas e não substituem consulta com advogado.
              </p>
            </>
          )}

        </div>
      </section>

    </main>
  );
}
