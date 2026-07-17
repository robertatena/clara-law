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

export default function ResetPasswordPage() {
  const supabase = createBrowserSupabase();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [prontoParaTrocar, setProntoParaTrocar] = useState(false);

  // Ao chegar via link do e-mail, o Supabase seta uma session temporária de "recovery".
  // Só liberamos o form se essa session existir — evita usuário sem token abrir a URL direto.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelado) return;
      setProntoParaTrocar(!!session);
    })();

    // Também escuta o evento PASSWORD_RECOVERY que o Supabase dispara ao processar o token do link
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setProntoParaTrocar(true);
      }
    });
    return () => {
      cancelado = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  async function submeter(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (novaSenha.length < 8) {
      setErro("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }
    setEnviando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: novaSenha });
      if (error) {
        console.error("updateUser error:", error);
        setErro(`Erro: ${error.message}`);
      } else {
        setSucesso(true);
        setTimeout(() => {
          window.location.href = "/minha-conta";
        }, 2000);
      }
    } catch (err) {
      console.error("updateUser exception:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setErro(`Erro: ${msg}`);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh", paddingTop: 64 }}>

      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(26,35,64,0.04)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </Link>
          <Link href="/minha-conta" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>
            Voltar para o login
          </Link>
        </div>
      </nav>

      <section style={{ padding: "72px 24px 40px" }}>
        <div style={{ maxWidth: 460, margin: "0 auto" }}>

          <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 16, padding: "32px 28px", boxShadow: "0 6px 20px rgba(26,35,64,0.04)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12 }}>
              Recuperação de senha
            </div>
            <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3.4vw, 34px)", color: "#1a2340", marginBottom: 12, lineHeight: 1.2 }}>
              Redefinir senha
            </h1>

            {sucesso ? (
              <div style={{ background: "#F0FDF9", border: "1px solid #6EE7B7", borderRadius: 10, padding: "16px 18px", color: "#065f46" }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>✓ Senha alterada!</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>Redirecionando para sua área…</div>
              </div>
            ) : !prontoParaTrocar ? (
              <div>
                <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65, marginBottom: 16 }}>
                  Este link precisa ser aberto pelo e-mail de recuperação. Se você já clicou no link, aguarde alguns instantes ou volte e peça um novo link.
                </p>
                <Link href="/minha-conta" style={{ display: "inline-block", color: "#185FA5", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                  ← Voltar para o login
                </Link>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.65, marginBottom: 24 }}>
                  Escolha uma nova senha (mínimo 8 caracteres).
                </p>
                <form onSubmit={submeter}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Nova senha</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={novaSenha}
                    onChange={(e) => { setNovaSenha(e.target.value); setErro(""); }}
                    placeholder="Mínimo 8 caracteres"
                    style={{ width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 12, border: "1px solid #D0CCC4", outline: "none", background: "#fff", color: "#1a2340", marginBottom: 14, fontFamily: "'Montserrat', sans-serif" }}
                  />

                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirmar nova senha</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmarSenha}
                    onChange={(e) => { setConfirmarSenha(e.target.value); setErro(""); }}
                    placeholder="Digite a senha novamente"
                    style={{ width: "100%", padding: "14px 16px", fontSize: 15, borderRadius: 12, border: "1px solid #D0CCC4", outline: "none", background: "#fff", color: "#1a2340", marginBottom: 14, fontFamily: "'Montserrat', sans-serif" }}
                  />

                  {erro && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 12 }}>{erro}</p>}

                  <button
                    type="submit"
                    disabled={enviando}
                    style={{ width: "100%", background: enviando ? "#9ca3af" : "#1a2340", color: "#fff", fontSize: 15, fontWeight: 700, padding: "14px 20px", borderRadius: 40, border: "none", cursor: enviando ? "not-allowed" : "pointer" }}
                  >
                    {enviando ? "Alterando…" : "Redefinir senha"}
                  </button>
                </form>
              </>
            )}
          </div>

        </div>
      </section>

    </main>
  );
}
