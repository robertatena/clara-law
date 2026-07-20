"use client";

import Link from "next/link";

const ClaraIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

type Etapa = {
  icon: string;
  titulo: string;
  texto: string;
  acoes: string[];
  destaque?: { icon: string; titulo: string; texto: string };
};

const etapas: Etapa[] = [
  {
    icon: "📧",
    titulo: "Você enviou o e-mail. E agora?",
    texto: "A empresa tem até 5 dias úteis para responder. Guarde o comprovante de envio — você vai precisar depois.",
    acoes: [
      "Salve o e-mail enviado (print ou PDF).",
      "Se não responderem em 5 dias → vá para a Etapa 2.",
      "Se oferecerem solução ruim → vá para a Etapa 2 também.",
    ],
  },
  {
    icon: "⚖️",
    titulo: "Hora do Juizado Especial",
    texto: "O JEC é gratuito, não precisa de advogado para causas até 20 salários mínimos, e a empresa é obrigada a comparecer.",
    acoes: [
      "Se você contratou o Pacote Ação, pegue a petição que a Clara gerou. Caso contrário, o próprio JEC pode ajudar a formalizar a reclamação no balcão.",
      "Leve ao fórum do CEP que você consultou — confira em claralaw.com.br/#forum.",
      "Documentos para levar: RG ou CPF, comprovante de residência, print do e-mail enviado, nota fiscal ou contrato, petição impressa.",
    ],
  },
  {
    icon: "📬",
    titulo: "Recebi um documento do JEC. É assustador?",
    texto: "Intimação significa que sua ação foi aceita e a audiência foi marcada. Não é processo criminal. Não afeta seu CPF. Não vai na sua ficha. É só uma convocação — como um e-mail formal da Justiça.",
    acoes: [
      "Leia a data e o horário da audiência.",
      "Confirme presença (geralmente por e-mail ou portal do TJ).",
      "Separe todos os documentos do caso.",
      "Anote o número do processo.",
    ],
    destaque: {
      icon: "📬",
      titulo: "Recebeu uma intimação? Isso é boa notícia.",
      texto: "Significa que sua ação foi aceita.",
    },
  },
  {
    icon: "🎙️",
    titulo: "Como me comportar na audiência",
    texto: "A audiência de conciliação é informal. O juiz vai ouvir os dois lados e tentar um acordo. Você não precisa ser advogado para se defender bem.",
    acoes: [
      "Chegue 15 minutos antes.",
      "Leve todos os documentos organizados.",
      "Fale com calma: \"Comprei X, aconteceu Y, pedi Z, não fui atendido.\"",
      "Não precisa usar termos jurídicos — fale o que aconteceu.",
    ],
    destaque: {
      icon: "💡",
      titulo: "Você fala diretamente com o juiz.",
      texto: "A empresa vai mandar um preposto (funcionário). Você vai falar diretamente com o juiz. Isso é uma vantagem sua.",
    },
  },
  {
    icon: "🤝",
    titulo: "Me ofereceram um acordo. Aceito?",
    texto: "Na audiência ou depois, a empresa pode propor um valor. Você decide na hora — sem pressa do juiz.",
    acoes: [
      "Regra prática: menos de 60% do valor que você pediu → pense bem.",
      "Mais de 70% → geralmente vale aceitar e evitar mais 2–4 meses.",
      "Acordo homologado pelo juiz tem força de sentença — é seguro aceitar.",
      "Se não quiser aceitar: diga \"não aceito, quero que o juiz decida.\"",
    ],
  },
];

const cenariosResultado = [
  {
    titulo: "Você ganhou. Como receber?",
    acoes: [
      "A empresa tem prazo para pagar (geralmente 30 dias após a sentença).",
      "Se não pagar: volte ao fórum e peça execução da sentença.",
      "O fórum pode bloquear conta bancária da empresa (penhora online).",
    ],
    cor: "#10b981",
    bg: "#F0FDF9",
    border: "#6EE7B7",
  },
  {
    titulo: "Não foi dessa vez.",
    acoes: [
      "Em 90% dos casos de consumidor, não vale recorrer (custo × benefício).",
      "Se achar que houve erro grave do juiz: tem 10 dias para recorrer.",
      "Próximo passo: converse com um advogado antes de recorrer.",
    ],
    cor: "#92400e",
    bg: "#FFF9ED",
    border: "#fcd34d",
  },
];

export default function GuiaPage() {
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

      {/* HERO */}
      <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "80px 24px 64px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F0FDF9", border: "1px solid #6EE7B7", borderRadius: 40, padding: "6px 18px", marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#065f46", fontWeight: 500 }}>Guia de acompanhamento</span>
          </div>

          <h1 style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 5vw, 52px)",
            lineHeight: 1.1,
            color: "#1a2340",
            marginBottom: 18,
            letterSpacing: "-0.025em",
          }}>
            Seu guia do processo
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.75, color: "#4b5563", maxWidth: 600 }}>
            A Clara já fez a parte difícil. Agora é com você — <strong style={{ color: "#1a2340" }}>e você consegue</strong>.
          </p>
        </div>
      </section>

      {/* ETAPAS 1-5 */}
      {etapas.map((e, i) => (
        <section
          key={i}
          className="reveal"
          style={{
            background: i % 2 === 0 ? "#F8F7F4" : "#fff",
            borderBottom: "1px solid #ECEAE4",
            padding: "64px 24px",
          }}
        >
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase" }}>Etapa {i + 1}</span>
              <div style={{ height: 1, flex: 1, background: "#E0DDD6" }} />
            </div>

            <h2 style={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(24px, 3vw, 32px)",
              color: "#1a2340",
              lineHeight: 1.2,
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: 36 }} aria-hidden="true">{e.icon}</span>
              {e.titulo}
            </h2>

            <p style={{ fontSize: 16, color: "#374151", lineHeight: 1.85, marginBottom: 24 }}>
              {e.texto}
            </p>

            {e.destaque && (
              <div style={{ background: "#FFF9ED", border: "1px solid #fcd34d", borderRadius: 12, padding: "16px 20px", marginBottom: 24, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }} aria-hidden="true">{e.destaque.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>{e.destaque.titulo}</div>
                  <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>{e.destaque.texto}</div>
                </div>
              </div>
            )}

            <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "20px 24px", boxShadow: "0 6px 24px rgba(26,35,64,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#1a2340", textTransform: "uppercase", marginBottom: 14 }}>O que fazer</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {e.acoes.map((a, j) => (
                  <li key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#F0FDF9", border: "1px solid #6EE7B7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#10b981", flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      ))}

      {/* ETAPA 6 — Resultado (cenários duplos) */}
      <section className="reveal" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4", padding: "64px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase" }}>Etapa 6</span>
            <div style={{ height: 1, flex: 1, background: "#E0DDD6" }} />
          </div>

          <h2 style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(24px, 3vw, 32px)",
            color: "#1a2340",
            lineHeight: 1.2,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 36 }} aria-hidden="true">🏆</span>
            Resultado: e agora?
          </h2>

          <div style={{ display: "grid", gap: 16 }} className="grid-2col">
            {cenariosResultado.map((c) => (
              <div key={c.titulo} style={{
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: "22px 24px",
              }}>
                <h3 style={{ fontFamily: "'Raleway', sans-serif", fontSize: 18, fontWeight: 700, color: c.cor, marginTop: 0, marginBottom: 14, lineHeight: 1.3 }}>
                  {c.titulo}
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {c.acoes.map((a, j) => (
                    <li key={j} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>
                      <span style={{ color: c.cor, fontWeight: 700, flexShrink: 0 }}>→</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — voltar pra home */}
      <section className="reveal" style={{ background: "#1a2340", padding: "56px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: "clamp(22px, 3vw, 30px)", color: "#fff", lineHeight: 1.2, marginBottom: 14 }}>
            Precisa começar do zero ou tirar mais dúvidas?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(168,216,240,0.75)", lineHeight: 1.7, marginBottom: 28 }}>
            A Clara está aqui sempre que você precisar entender seus direitos.
          </p>
          <Link href="/" style={{ background: "#D4AF37", color: "#1a2340", fontSize: 15, fontWeight: 800, padding: "16px 32px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
            ← Voltar para a home
          </Link>
        </div>
      </section>

      {/* FOOTER — mesmo padrão da home */}
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
            ⚠️ Este guia é orientativo e não substitui aconselhamento jurídico. Para casos complexos, consulte um advogado. Todos os documentos gerados são para uso pelo próprio usuário.
          </p>
        </div>
      </footer>

      <style>{`
        @media (min-width: 900px) {
          .grid-2col { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 899px) {
          .grid-2col { grid-template-columns: 1fr !important; }
        }

        .reveal {
          opacity: 0;
          transform: translateY(14px);
          animation: claraReveal 0.7s ease-out forwards;
        }
        .reveal:nth-of-type(1) { animation-delay: 0.02s; }
        .reveal:nth-of-type(2) { animation-delay: 0.06s; }
        .reveal:nth-of-type(3) { animation-delay: 0.10s; }
        .reveal:nth-of-type(4) { animation-delay: 0.14s; }
        .reveal:nth-of-type(5) { animation-delay: 0.18s; }
        .reveal:nth-of-type(6) { animation-delay: 0.22s; }
        .reveal:nth-of-type(7) { animation-delay: 0.26s; }
        .reveal:nth-of-type(8) { animation-delay: 0.30s; }

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
