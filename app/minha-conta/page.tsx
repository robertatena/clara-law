"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
};

const LABEL_TIPO: Record<string, string> = {
  voo_atrasado: "Voo atrasado",
  voo_cancelado: "Voo cancelado",
  cobranca_indevida: "Cobrança indevida",
  produto_defeito: "Produto com defeito",
  analise_contrato: "Análise de contrato",
  desconhecido: "Caso",
};

type Modo = "login" | "cadastro";

export default function MinhaContaPage() {
  const supabase = createBrowserSupabase();
  const [carregando, setCarregando] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [casos, setCasos] = useState<Caso[]>([]);

  // Formulário auth (login/cadastro)
  const [modo, setModo] = useState<Modo>("login");
  const [emailForm, setEmailForm] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelado) return;
      if (session?.user?.email) {
        setEmail(session.user.email);
        // Buscar casos (RLS garante que só retorna os do próprio usuário)
        const { data, error } = await supabase
          .from("user_casos")
          .select("id, tipo_caso, descricao, status, created_at")
          .order("created_at", { ascending: false });
        if (!cancelado) {
          if (error) console.error("erro_carregar_casos", error.message);
          setCasos((data as Caso[] | null) ?? []);
        }
      }
      if (!cancelado) setCarregando(false);
    })();
    return () => { cancelado = true; };
  }, [supabase]);

  function trocarModo(novoModo: Modo) {
    setModo(novoModo);
    setErro("");
    setSucesso("");
    setSenha("");
    setConfirmarSenha("");
  }

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    const emailLimpo = emailForm.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      setErro("Digite um e-mail válido.");
      return;
    }
    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (modo === "cadastro" && senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailLimpo,
          password: senha,
        });
        if (error) {
          console.error("signInWithPassword error:", error);
          if (error.message === "Invalid login credentials") {
            setErro("E-mail ou senha incorretos.");
          } else {
            setErro("Erro ao entrar. Tente novamente.");
          }
        } else {
          // Sucesso — recarrega pra pegar session e casos
          window.location.reload();
        }
      } else {
        // Cadastro
        const { error } = await supabase.auth.signUp({
          email: emailLimpo,
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/minha-conta`,
          },
        });
        if (error) {
          console.error("signUp error:", error);
          if (error.message.toLowerCase().includes("already registered")) {
            setErro("Este e-mail já tem conta. Faça login.");
          } else {
            setErro(`Erro: ${error.message}`);
          }
        } else {
          setSucesso("Conta criada! Verifique seu e-mail para confirmar o cadastro.");
        }
      }
    } catch (err) {
      console.error("auth exception:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErro(`Erro: ${msg}`);
    } finally {
      setEnviando(false);
    }
  }

  async function sair() {
    await supabase.auth.signOut();
    setEmail(null);
    setCasos([]);
    setSenha("");
    setConfirmarSenha("");
    setSucesso("");
  }

  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh", paddingTop: 64 }}>

      {/* NAV — mesmo padrão do site */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(26,35,64,0.04)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/guia" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Guia</Link>
            {email ? (
              <button onClick={sair} style={{ background: "transparent", color: "#6b7280", fontSize: 13, fontWeight: 500, border: "1px solid #D1CCC4", padding: "9px 18px", borderRadius: 40, cursor: "pointer" }}>
                Sair
              </button>
            ) : (
              <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 22px", borderRadius: 40, textDecoration: "none" }}>
                Reivindicar meus direitos
              </Link>
            )}
          </div>
        </div>
      </nav>

      <section style={{ padding: "72px 24px 40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>

          {carregando && (
            <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center" }}>Carregando…</p>
          )}

          {/* ── ESTADO A: não logado — formulário login/cadastro ── */}
          {!carregando && !email && (
            <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 16, padding: "32px 28px", boxShadow: "0 6px 20px rgba(26,35,64,0.04)", maxWidth: 460, margin: "0 auto" }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12 }}>
                Área do cliente
              </div>
              <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3.4vw, 34px)", color: "#1a2340", marginBottom: 12, lineHeight: 1.2 }}>
                {modo === "login" ? "Acesse sua área" : "Criar sua conta"}
              </h1>
              <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65, marginBottom: 24 }}>
                {modo === "login" ? "Entre com seu e-mail e senha." : "Crie sua conta para acompanhar seus casos."}
              </p>

              {sucesso && (
                <div style={{ background: "#F0FDF9", border: "1px solid #6EE7B7", borderRadius: 10, padding: "16px 18px", color: "#065f46", marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>✓ Sucesso</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>{sucesso}</div>
                </div>
              )}

              <form onSubmit={submeter}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>E-mail</label>
                <input
                  type="email"
                  required
                  value={emailForm}
                  onChange={(e) => { setEmailForm(e.target.value); setErro(""); }}
                  placeholder="voce@email.com"
                  style={{ width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 12, border: "1px solid #D0CCC4", outline: "none", background: "#fff", color: "#1a2340", marginBottom: 14, fontFamily: "'Montserrat', sans-serif" }}
                />

                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Senha</label>
                <input
                  type="password"
                  required
                  minLength={modo === "cadastro" ? 8 : undefined}
                  value={senha}
                  onChange={(e) => { setSenha(e.target.value); setErro(""); }}
                  placeholder={modo === "cadastro" ? "Mínimo 8 caracteres" : "Sua senha"}
                  style={{ width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 12, border: "1px solid #D0CCC4", outline: "none", background: "#fff", color: "#1a2340", marginBottom: 14, fontFamily: "'Montserrat', sans-serif" }}
                />

                {modo === "cadastro" && (
                  <>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirmar senha</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={confirmarSenha}
                      onChange={(e) => { setConfirmarSenha(e.target.value); setErro(""); }}
                      placeholder="Digite a senha novamente"
                      style={{ width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 12, border: "1px solid #D0CCC4", outline: "none", background: "#fff", color: "#1a2340", marginBottom: 14, fontFamily: "'Montserrat', sans-serif" }}
                    />
                  </>
                )}

                {erro && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 12 }}>{erro}</p>}

                <button
                  type="submit"
                  disabled={enviando}
                  style={{ width: "100%", background: enviando ? "#9ca3af" : "#1a2340", color: "#fff", fontSize: 15, fontWeight: 700, padding: "14px 20px", borderRadius: 40, border: "none", cursor: enviando ? "not-allowed" : "pointer" }}
                >
                  {enviando
                    ? (modo === "login" ? "Entrando…" : "Criando conta…")
                    : (modo === "login" ? "Entrar" : "Criar conta")}
                </button>
              </form>

              <div style={{ marginTop: 18, textAlign: "center" }}>
                {modo === "login" ? (
                  <button
                    type="button"
                    onClick={() => trocarModo("cadastro")}
                    style={{ background: "transparent", border: "none", color: "#185FA5", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 }}
                  >
                    Primeira vez? Criar conta →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => trocarModo("login")}
                    style={{ background: "transparent", border: "none", color: "#185FA5", fontSize: 13, fontWeight: 500, cursor: "pointer", padding: 0 }}
                  >
                    Já tem conta? Entrar →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── ESTADO B: logado — histórico de casos ── */}
          {!carregando && email && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>
                  Minha conta
                </div>
                <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3.6vw, 36px)", color: "#1a2340", marginBottom: 8, lineHeight: 1.2 }}>
                  Olá, <span style={{ color: "#5BA8D4" }}>{email.split("@")[0]}</span>
                </h1>
                <p style={{ fontSize: 14, color: "#6b7280" }}>{email}</p>
              </div>

              <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 20, color: "#1a2340", marginBottom: 16 }}>
                Seus casos
              </h2>

              {casos.length === 0 ? (
                <div style={{ background: "#fff", border: "1px dashed #D1CCC4", borderRadius: 14, padding: "36px 24px", textAlign: "center" }}>
                  <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>Você ainda não tem casos registrados.</p>
                  <Link href="/enviar" style={{ display: "inline-block", background: "#1a2340", color: "#fff", fontSize: 14, fontWeight: 600, padding: "12px 24px", borderRadius: 40, textDecoration: "none" }}>
                    Reivindicar meus direitos →
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {casos.map((c) => (
                    <Link
                      key={c.id}
                      href={`/minha-conta/caso/${c.id}`}
                      style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "18px 22px", textDecoration: "none", display: "block", boxShadow: "0 6px 20px rgba(26,35,64,0.04)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 4 }}>
                            {LABEL_TIPO[c.tipo_caso] || c.tipo_caso}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2340", marginBottom: 4 }}>
                            {c.descricao || "Sem descrição"}
                          </div>
                          <div style={{ fontSize: 12, color: "#9ca3af" }}>
                            {new Date(c.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                            {" · "}
                            <span style={{ color: c.status === "ativo" ? "#10b981" : "#6b7280", fontWeight: 600 }}>{c.status}</span>
                          </div>
                        </div>
                        <span style={{ color: "#1a2340", fontSize: 13, fontWeight: 600 }}>Ver detalhes →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

    </main>
  );
}
