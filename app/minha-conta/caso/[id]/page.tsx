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
  dados_json: Record<string, unknown> | null;
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
  const [escaladoOk, setEscaladoOk] = useState(false);
  const [respostaLembrete, setRespostaLembrete] = useState(false);
  const [atualizandoStatus, setAtualizandoStatus] = useState(false);

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
        .select("id, tipo_caso, descricao, status, created_at, dados_json")
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
        if (data.escalado) setEscaladoOk(true);
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
      const { error } = await supabase
        .from("user_casos")
        .update({ status: "email_enviado" })
        .eq("id", casoId);
      if (error) {
        console.error("update_status_error:", error);
        return;
      }
      setCaso((prev) => (prev ? { ...prev, status: "email_enviado" } : prev));
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
                  <button
                    type="button"
                    onClick={escalar}
                    disabled={enviando || escaladoOk}
                    style={{ fontSize: 11, fontWeight: 600, color: "#92400e", background: "#FFF9ED", border: "1px solid #fcd34d", padding: "6px 12px", borderRadius: 20, cursor: enviando || escaladoOk ? "not-allowed" : "pointer" }}
                  >
                    {escaladoOk ? "✓ Encaminhado" : "Falar com humano"}
                  </button>
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
