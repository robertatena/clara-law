"use client";

import Link from "next/link";

const ClaraIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const stats = [
  {
    num: "80,6 milhões",
    lbl: "de processos pendentes no Judiciário brasileiro",
  },
  {
    num: "4 anos",
    lbl: "é o tempo médio que um processo leva para tramitar",
  },
  {
    num: "4.300 casos",
    lbl: "é a carga média de cada juiz — contra 145 na Europa",
  },
];

export default function ProblemaPage() {
  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh", paddingTop: 64 }}>

      {/* NAV — fixo no topo, mesmo padrão do site */}
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
      <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "88px 24px 80px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F0FDF9", border: "1px solid #6EE7B7", borderRadius: 40, padding: "6px 18px", marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#065f46", fontWeight: 500 }}>O problema que ninguém te conta</span>
          </div>

          <h1 style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 5.5vw, 58px)",
            lineHeight: 1.1,
            color: "#1a2340",
            marginBottom: 26,
            letterSpacing: "-0.025em",
          }}>
            Você desiste antes de tentar.<br />
            <span style={{ color: "#D4AF37" }}>E é exatamente isso</span><br />
            <span style={{ color: "#5BA8D4" }}>que esperam de você.</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.75, color: "#4b5563", maxWidth: 580, margin: "0 auto" }}>
            Cobrança indevida, voo atrasado, produto com defeito. Você sente que tem razão —
            mas acha que correr atrás <em style={{ fontStyle: "italic", color: "#1a2340" }}>&ldquo;não vale a dor de cabeça&rdquo;</em>.
            A Clara existe para mudar essa conta.
          </p>
        </div>
      </section>

      {/* SEÇÃO 1 — O problema é real, e é seu */}
      <section className="reveal" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4", padding: "72px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12 }}>o problema é real, e é seu</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3.2vw, 36px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 28 }}>
            Quase todo brasileiro já passou por isso.
          </h2>
          <div style={{ fontSize: 17, color: "#374151", lineHeight: 1.85 }}>
            <p style={{ marginBottom: 20 }}>
              Uma cobrança que você não reconhece. Um serviço que não funcionou como prometido. Uma empresa que simplesmente ignorou.
              A reação mais comum não é brigar — é desistir: <em style={{ color: "#1a2340" }}>&ldquo;vou perder tempo&rdquo;</em>,
              <em style={{ color: "#1a2340" }}> &ldquo;vai dar mais trabalho que o prejuízo&rdquo;</em>,
              <em style={{ color: "#1a2340" }}> &ldquo;sem advogado não tem como&rdquo;</em>.
            </p>
            <p style={{ marginBottom: 0 }}>
              Essa desistência tem nome e tem custo: é <strong style={{ color: "#1a2340" }}>dinheiro seu que fica no bolso de quem errou</strong>.
              E não é coincidência — quanto mais difícil parece reivindicar um direito, mais barato sai para a empresa ignorar você.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2 — Por que parece impossível (dados do CNJ) */}
      <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ maxWidth: 720, marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12 }}>por que parece impossível</p>
            <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3.2vw, 36px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 18 }}>
              A sensação de que &ldquo;não tem jeito&rdquo; não é exagero seu.
            </h2>
            <p style={{ fontSize: 17, color: "#4b5563", lineHeight: 1.8 }}>
              O sistema de Justiça brasileiro está realmente sobrecarregado.
            </p>
          </div>

          <div style={{ display: "grid", gap: 16 }} className="grid-stats">
            {stats.map((s, i) => (
              <div key={i} style={{
                background: "#1a2340",
                borderRadius: 18,
                padding: "36px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minHeight: 180,
              }}>
                <div style={{
                  fontFamily: "'Raleway', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(34px, 4.5vw, 48px)",
                  color: "#D4AF37",
                  lineHeight: 1.05,
                  letterSpacing: "-0.02em",
                }}>
                  {s.num}
                </div>
                <div style={{ fontSize: 15, color: "rgba(168,216,240,0.85)", lineHeight: 1.55 }}>
                  {s.lbl}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 22, lineHeight: 1.6 }}>
            Fonte: Relatório <em>Justiça em Números 2025</em>, Conselho Nacional de Justiça (dados de 2024).
          </p>

          <div style={{ marginTop: 48, maxWidth: 720 }}>
            <p style={{ fontSize: 17, color: "#374151", lineHeight: 1.85 }}>
              Diante desses números, é natural concluir que ir atrás dos seus direitos pela via judicial é inviável.
              <strong style={{ color: "#1a2340" }}> Mas existe um caminho que a maioria das pessoas não conhece.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3 — A maioria dos casos não vira processo */}
      <section className="reveal" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12 }}>o que poucos contam</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3.2vw, 36px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 28 }}>
            A maioria dos casos não vira processo.
          </h2>

          <div style={{ fontSize: 17, color: "#374151", lineHeight: 1.85, marginBottom: 32 }}>
            <p style={{ marginBottom: 20 }}>
              A maior parte dos conflitos de consumo se resolve <strong style={{ color: "#1a2340" }}>antes de chegar ao fórum</strong>.
              Uma notificação bem escrita, citando a lei certa e o prazo certo, costuma ser suficiente para a empresa resolver —
              porque ela sabe exatamente o que vem depois.
            </p>
            <p style={{ marginBottom: 0 }}>
              Você não precisa de advogado para isso. Não precisa de fórum. Não precisa esperar anos.
              Precisa saber <strong style={{ color: "#1a2340" }}>o que pedir e como pedir</strong> — e é aí que a Clara entra.
            </p>
          </div>

          {/* Mini card visual reforçando a ideia */}
          <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 18, padding: 26, boxShadow: "0 6px 24px rgba(26,35,64,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #F0EDE8" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2340" }}>Notificação — cobrança indevida</span>
              <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>sac@empresa.com.br</span>
            </div>
            <div style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.85 }}>
              <strong style={{ color: "#1a2340", fontWeight: 700, display: "block", marginBottom: 8 }}>Prezados,</strong>
              Identifiquei cobrança indevida no valor de R$ X em meu cadastro. Nos termos do{" "}
              <strong style={{ color: "#1a2340" }}>art. 42, parágrafo único, do CDC</strong>, solicito o estorno em dobro
              no prazo de 5 dias úteis, sob pena de ingresso no Juizado Especial.
              <span style={{ display: "inline-block", marginTop: 14, fontSize: 12, background: "#EBF6FD", color: "#185FA5", padding: "5px 14px", borderRadius: 20, fontWeight: 500 }}>
                Gerado pela Clara · orientativo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 4 — Por que a Clara é educacional */}
      <section className="reveal" style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12 }}>por que a clara é educacional</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3.2vw, 36px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 28 }}>
            A Clara não age no seu lugar.<br />
            <span style={{ color: "#5BA8D4" }}>Ela te ensina e te equipa</span> para agir.
          </h2>

          <div style={{ fontSize: 17, color: "#374151", lineHeight: 1.85, marginBottom: 36 }}>
            <p style={{ marginBottom: 20 }}>
              A Clara traduz o juridiquês, mostra quais são os seus direitos naquela situação específica, e te entrega
              a notificação pronta — escrita com a lei certa — para <strong style={{ color: "#1a2340" }}>você enviar, no seu nome</strong>.
              Você entende o que está acontecendo, decide, e age com autonomia.
            </p>
            <p style={{ marginBottom: 0 }}>
              Isso é <strong style={{ color: "#1a2340" }}>letramento jurídico</strong>: transformar quem não sabia
              que tinha direitos em alguém capaz de exercê-los. Não é dependência — é poder.
              Quem entende seus direitos uma vez, entende para a vida toda.
            </p>
          </div>

          {/* Três pilares visuais */}
          <div style={{ display: "grid", gap: 14 }} className="grid-pillars">
            {[
              { t: "Traduz o juridiquês", d: "Lei, prazo e direito — em linguagem clara." },
              { t: "Entrega a notificação", d: "Pronta e fundamentada para você enviar." },
              { t: "Te coloca no controle", d: "Você decide, você age. Sem terceirizar seu caso." },
            ].map((p) => (
              <div key={p.t} style={{ background: "#F8F7F4", border: "1px solid #E8E4DA", borderRadius: 14, padding: "20px 22px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a2340", marginBottom: 6 }}>{p.t}</div>
                <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="reveal" style={{ background: "#1a2340", padding: "88px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ClaraIcon size={52} />
          </div>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 44px)", color: "#fff", lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.02em" }}>
            Seu direito não precisa<br />virar <span style={{ color: "#D4AF37" }}>processo.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(168,216,240,0.75)", lineHeight: 1.75, marginBottom: 40 }}>
            Descubra, em minutos, o que você pode resolver hoje —<br />
            sem fórum, sem advogado, sem juridiquês.
          </p>
          <Link href="/enviar" style={{ background: "#D4AF37", color: "#1a2340", fontSize: 17, fontWeight: 800, padding: "20px 48px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
            Descobrir meus direitos →
          </Link>
          <p style={{ fontSize: 12, color: "rgba(168,216,240,0.35)", marginTop: 18 }}>Sem cartão · Sem cadastro · Resultado em minutos</p>
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
            A Clara não é um escritório de advocacia. As análises são orientativas e não substituem a consulta com um advogado.
          </p>
        </div>
      </footer>

      <style>{`
        @media (min-width: 900px) {
          .grid-stats { grid-template-columns: repeat(3, 1fr) !important; }
          .grid-pillars { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (max-width: 899px) {
          .grid-stats { grid-template-columns: 1fr !important; }
          .grid-pillars { grid-template-columns: 1fr !important; }
        }

        /* Fade/slide-in suave, respeitando reduced-motion */
        .reveal {
          opacity: 0;
          transform: translateY(14px);
          animation: claraReveal 0.7s ease-out forwards;
        }
        .reveal:nth-of-type(1) { animation-delay: 0.02s; }
        .reveal:nth-of-type(2) { animation-delay: 0.08s; }
        .reveal:nth-of-type(3) { animation-delay: 0.14s; }
        .reveal:nth-of-type(4) { animation-delay: 0.20s; }
        .reveal:nth-of-type(5) { animation-delay: 0.26s; }
        .reveal:nth-of-type(6) { animation-delay: 0.32s; }

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
