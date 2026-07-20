"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EmailGerado = {
  assunto: string;
  corpo: string;
  para: string;
  geradoEm: string;
};

const ClaraIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const passos = [
  "Verifique seu e-mail — os documentos chegam em até 5 minutos.",
  "Salve o e-mail enviado como comprovante.",
  "Quando precisar, acesse seu guia do processo.",
];

export default function SucessoPage() {
  const [emailGerado, setEmailGerado] = useState<EmailGerado | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("clara_email_gerado");
      if (raw) {
        const parsed = JSON.parse(raw) as EmailGerado;
        if (parsed && parsed.corpo) {
          setEmailGerado(parsed);
          sessionStorage.removeItem("clara_email_gerado");
        }
      }
    } catch {
      // sessionStorage indisponível ou JSON inválido — ignorar
    }
  }, []);

  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh", paddingTop: 64 }}>

      {/* NAV — mesmo padrão das outras páginas */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(26,35,64,0.04)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/problema" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Por que a Clara</Link>
            <Link href="/#como-funciona" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Como funciona</Link>
            <Link href="/#forum" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Encontrar fórum</Link>
            <Link href="/#aprenda" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Aprenda</Link>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 22px", borderRadius: 40, textDecoration: "none" }}>
              Reivindicar meus direitos
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO de sucesso */}
      <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "96px 24px 64px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>

          {/* Ícone ✓ grande em verde */}
          <div
            role="img"
            aria-label="Pagamento confirmado"
            style={{
              width: 96, height: 96, borderRadius: "50%",
              background: "#F0FDF9",
              border: "2px solid #6EE7B7",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 28px",
              boxShadow: "0 12px 32px rgba(16,185,129,0.18)",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
              <path d="M14 27 L22 35 L38 17" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 48px)",
            lineHeight: 1.15,
            color: "#1a2340",
            marginBottom: 18,
            letterSpacing: "-0.025em",
          }}>
            Tudo pronto. <span style={{ color: "#5BA8D4" }}>Agora é com você.</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.75, color: "#4b5563", maxWidth: 540, margin: "0 auto" }}>
            Seus documentos foram gerados. Você recebe tudo por e-mail em instantes.
          </p>
        </div>
      </section>

      {/* SEU E-MAIL ESTÁ PRONTO — só aparece se veio do /enviar via sessionStorage */}
      {emailGerado && (
        <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "56px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
              Seu e-mail está pronto
            </p>
            <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(20px, 3vw, 26px)", color: "#1a2340", lineHeight: 1.25, marginBottom: 8, textAlign: "center" }}>
              Copie o texto abaixo
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, textAlign: "center", marginBottom: 24 }}>
              Envie do seu próprio e-mail para a empresa.
            </p>

            {/* Metadados: Para + Assunto */}
            <div style={{ background: "#F0F4FF", border: "1px solid #C7D2FE", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#3730a3", lineHeight: 1.7 }}>
              <div><strong>Para:</strong> {emailGerado.para}</div>
              <div style={{ marginTop: 4 }}><strong>Assunto:</strong> {emailGerado.assunto}</div>
            </div>

            {/* Corpo do e-mail — monospace, selecionável, scroll */}
            <div style={{
              background: "#F8F7F4", border: "1px solid #E0DDD6", borderRadius: 12,
              padding: "16px 18px", marginBottom: 16,
              fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
              fontSize: 13, color: "#374151", lineHeight: 1.65,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
              maxHeight: 300, overflow: "auto",
              userSelect: "text",
            }}>
              {emailGerado.corpo}
            </div>

            {/* Botão Copiar */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(emailGerado.corpo);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                } catch {
                  alert("Não foi possível copiar automaticamente. Selecione o texto e use Ctrl+C.");
                }
              }}
              style={{
                width: "100%",
                padding: "14px 20px", borderRadius: 40, border: "none",
                background: copiado ? "#10b981" : "#1a2340",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {copiado ? "✓ Copiado!" : "📋 Copiar e-mail"}
            </button>

            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7, textAlign: "center", marginTop: 14 }}>
              Depois de enviar, guarde o comprovante — você vai precisar.
            </p>
          </div>
        </section>
      )}

      {/* ACOMPANHE SEU CASO — CTA para área logada */}
      <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "40px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ background: "#F0F4FF", border: "1px solid #C7D2FE", borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 20, color: "#1a2340", marginBottom: 8, lineHeight: 1.3 }}>
              Acompanhe seu caso
            </h2>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, marginBottom: 16 }}>
              Crie sua conta gratuita para acessar seu histórico, tirar dúvidas com a Clara e acompanhar cada etapa do processo.
            </p>
            <Link
              href="/minha-conta"
              style={{ display: "inline-block", background: "#1a2340", color: "#fff", fontSize: 14, fontWeight: 700, padding: "12px 24px", borderRadius: 40, textDecoration: "none" }}
            >
              Criar minha conta →
            </Link>
          </div>
        </div>
      </section>

      {/* PRÓXIMOS PASSOS */}
      <section className="reveal" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4", padding: "64px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 24, textAlign: "center" }}>
            Próximos passos
          </p>

          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
            {passos.map((texto, i) => (
              <li
                key={i}
                style={{
                  background: "#fff",
                  border: "1px solid #E0DDD6",
                  borderRadius: 14,
                  padding: "18px 22px",
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  boxShadow: "0 6px 20px rgba(26,35,64,0.04)",
                }}
              >
                <span style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#1a2340",
                  color: "#D4AF37",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 800, fontSize: 14,
                  flexShrink: 0,
                }}>{i + 1}</span>
                <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.65, paddingTop: 4 }}>
                  {texto}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTAs */}
      <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "56px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
            <Link
              href="/guia"
              style={{ background: "#1a2340", color: "#fff", fontSize: 15, fontWeight: 700, padding: "16px 32px", borderRadius: 40, textDecoration: "none" }}
            >
              Ver meu guia do processo →
            </Link>
            <Link
              href="/"
              style={{ border: "1.5px solid #C8C3BA", color: "#1a2340", fontSize: 15, fontWeight: 500, padding: "15px 28px", borderRadius: 40, textDecoration: "none" }}
            >
              Voltar para a home
            </Link>
          </div>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>
            Dúvidas? <a href="mailto:contato@claralaw.com.br" style={{ color: "#185FA5", textDecoration: "none" }}>contato@claralaw.com.br</a>
          </p>
        </div>
      </section>

      {/* FOOTER — mesmo padrão das outras páginas */}
      <footer style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: "#A8D8F0" }}>CLARA LAW</div>
            <div style={{ fontSize: 11, color: "rgba(168,216,240,0.3)", marginTop: 3 }}>Inteligência para um mundo mais claro e justo.</div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Link href="/problema" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>Por que a Clara</Link>
            <Link href="/#como-funciona" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>Como funciona</Link>
            <Link href="/#aprenda" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>Aprenda</Link>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "12px auto 0", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: 11, color: "rgba(168,216,240,0.25)", textAlign: "center", lineHeight: 1.7 }}>
            ⚠️ A Clara não é um escritório de advocacia. As análises são orientativas e não substituem a consulta com um advogado. Todos os documentos gerados são para uso pelo próprio usuário.
          </p>
        </div>
      </footer>

      <style>{`
        .reveal {
          opacity: 0;
          transform: translateY(14px);
          animation: claraReveal 0.7s ease-out forwards;
        }
        .reveal:nth-of-type(1) { animation-delay: 0.02s; }
        .reveal:nth-of-type(2) { animation-delay: 0.10s; }
        .reveal:nth-of-type(3) { animation-delay: 0.18s; }

        @keyframes claraReveal {
          to { opacity: 1; transform: translateY(0); }
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1; transform: none; animation: none; }
        }
      `}</style>
    </main>
  );
}
