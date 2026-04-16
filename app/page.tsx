"use client";

import Link from "next/link";
import { ForumBuscador } from "@/components/ForumBuscador";

const ClaraIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const situations = [
  { icon: "📦", bg: "#FBF5E6", title: "Comprei algo com defeito e a loja não quer resolver", desc: "Direito à troca, conserto ou devolução. A loja é obrigada por lei.", badges: ["resolve por e-mail", "sem advogado"] },
  { icon: "💳", bg: "#EBF6FD", title: "Cobraram algo que eu não devo ou meu nome foi ao Serasa", desc: "Cobrança errada dá direito a indenização — sem precisar ir ao fórum.", badges: ["resolve por e-mail", "sem advogado"] },
  { icon: "✈️", bg: "#FBF5E6", title: "Meu voo atrasou ou foi cancelado", desc: "A companhia é obrigada a dar assistência e reembolso.", badges: ["resolve por e-mail", "JEC disponível"] },
  { icon: "🔧", bg: "#EBF6FD", title: "Paguei por um serviço que não foi entregue", desc: "Direito ao dinheiro de volta e, dependendo do caso, a uma indenização.", badges: ["resolve por e-mail", "sem advogado"] },
  { icon: "🏠", bg: "#FBF5E6", title: "Meu aluguel tem cláusula abusiva", desc: "Algumas cláusulas são ilegais — mesmo que você já tenha assinado.", badges: ["pode resolver por e-mail", "JEC disponível"] },
  { icon: "📱", bg: "#EBF6FD", title: "Meu plano de internet não funciona como prometido", desc: "Velocidade menor que a contratada é descumprimento. Pode cancelar sem multa.", badges: ["resolve por e-mail", "sem advogado"] },
];

export default function Home() {
  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="#como-funciona" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Como funciona</a>
            <a href="#forum" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Encontrar fórum</a>
            <a href="#aprenda" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Aprenda</a>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 22px", borderRadius: 40, textDecoration: "none" }}>
              Reivindicar meus direitos
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "80px 24px 72px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#F0FDF9", border: "1px solid #6EE7B7", borderRadius: 40, padding: "6px 18px", marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#065f46", fontWeight: 500 }}>Inteligência para um mundo mais claro e justo</span>
          </div>

          <h1 style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(40px, 6vw, 64px)",
            lineHeight: 1.1,
            color: "#1a2340",
            marginBottom: 24,
            letterSpacing: "-0.025em",
          }}>
            Você tem direitos.<br />
            <span style={{ color: "#D4AF37" }}>A Clara</span> te ajuda<br />
            <span style={{ color: "#5BA8D4" }}>a fazer valer.</span>
          </h1>

          <p style={{ fontSize: "clamp(16px, 2vw, 19px)", lineHeight: 1.75, color: "#4b5563", marginBottom: 16, maxWidth: 540, margin: "0 auto 16px" }}>
            Analise seu contrato, descubra brechas e saiba exatamente o que fazer —
            tudo em minutos, <strong style={{ color: "#1a2340" }}>sem juridiquês.</strong>
          </p>

          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 40, lineHeight: 1.6 }}>
            📧 Muitos casos se resolvem com um simples e-mail — a Clara escreve pra você, com a lei certa.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 16, fontWeight: 700, padding: "18px 40px", borderRadius: 40, textDecoration: "none" }}>
              Reivindicar meus direitos
            </Link>
            <a href="#aprenda" style={{ fontSize: 15, color: "#1a2340", fontWeight: 500, padding: "17px 30px", borderRadius: 40, border: "1.5px solid #D1CCC4", textDecoration: "none" }}>
              Ver meus casos →
            </a>
          </div>

          <p style={{ fontSize: 12, color: "#bbb" }}>Sem cartão · Sem cadastro · Resultado em minutos</p>

          {/* 3 stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, maxWidth: 520, margin: "40px auto 0" }}>
            {[
              { num: "É de graça", lbl: "Abrir ação no Juizado Especial" },
              { num: "Sem advogado", lbl: "Para causas até R$28 mil" },
              { num: "2–6 meses", lbl: "Prazo médio com acordo" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#1a2340", borderRadius: 14, padding: "16px 12px" }}>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, color: "#D4AF37", marginBottom: 4, lineHeight: 1.2 }}>{s.num}</div>
                <div style={{ fontSize: 11, color: "rgba(168,216,240,0.6)", lineHeight: 1.45 }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>como funciona</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3vw, 36px)", color: "#1a2340", marginBottom: 40, lineHeight: 1.2 }}>
            Simples assim.
          </h2>
          <div style={{ display: "grid", gap: 2, background: "#E0DDD6", borderRadius: 18, overflow: "hidden" }}
            className="grid-steps">
            {[
              { n: "1", t: "Conta o que aconteceu", d: "Ou envie o contrato em PDF. Sem formulário complicado." },
              { n: "2", t: "Clara analisa", d: "Explica os riscos, cita a lei e mostra o que você pode fazer." },
              { n: "3", t: "E-mail pronto para enviar", d: "Notificação gerada. Muitos casos se encerram aqui mesmo." },
              { n: "4", t: "Se precisar: o fórum certo", d: "Digite o CEP. Clara mostra onde ir, e-mail e o que levar." },
            ].map((s, i) => (
              <div key={i} style={{ background: "#fff", padding: "32px 26px" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", border: "1.5px solid #D4AF37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#D4AF37", marginBottom: 18 }}>{s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1a2340", marginBottom: 10, lineHeight: 1.3 }}>{s.t}</div>
                <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MÓDULO FÓRUM */}
      <section id="forum" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: 48, alignItems: "flex-start" }} className="grid-2col">
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>módulo fórum</p>
              <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3vw, 34px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 12 }}>
                Precisa ir ao fórum?<br />Digite o CEP e<br />a Clara te mostra onde ir.
              </h2>
              <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.75, marginBottom: 20, maxWidth: 420 }}>
                Juizado Especial Cível é gratuito e não exige advogado para causas até R$28 mil. A Clara mostra o fórum certo, o e-mail do cartório e o que você precisa levar.
              </p>
              <Link href="/forum" style={{ fontSize: 13, color: "#185FA5", fontWeight: 500, textDecoration: "none" }}>
                Ver guia completo: como funciona a audiência →
              </Link>
            </div>
            <div>
              <ForumBuscador compact />
            </div>
          </div>
        </div>
      </section>

      {/* E-MAIL ANTES DO FÓRUM */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 56, alignItems: "center" }} className="grid-2col">
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>o caminho certo</p>
            <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3vw, 34px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 18 }}>
              Primeiro o e-mail.<br />O fórum é o último recurso.
            </h2>
            <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.8, marginBottom: 32 }}>
              Antes de ir ao fórum, tente resolver por e-mail. Muitas empresas atendem imediatamente ao receber uma notificação bem feita.{" "}
              <strong style={{ color: "#1a2340" }}>A Clara gera esse e-mail pra você.</strong>
            </p>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 15, fontWeight: 700, padding: "16px 32px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
              Gerar meu e-mail agora
            </Link>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 18, padding: 28, boxShadow: "0 6px 24px rgba(26,35,64,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid #F0EDE8" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2340" }}>Notificação — produto com defeito</span>
              <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>juridico@empresa.com.br</span>
            </div>
            <div style={{ fontSize: 14, color: "#4b5563", lineHeight: 1.85 }}>
              <strong style={{ color: "#1a2340", fontWeight: 700, display: "block", marginBottom: 10 }}>Prezados,</strong>
              Adquiri o produto X em 10/03/2025 (NF 4821). O item apresentou defeito dentro da garantia e as tentativas de resolução foram ignoradas.
              <br /><br />
              Nos termos do <strong style={{ color: "#1a2340" }}>art. 18 do CDC</strong>, solicito troca ou reembolso em até 5 dias úteis, sob pena de ingresso no Juizado Especial com pedido de dano moral.
              <br />
              <span style={{ display: "inline-block", marginTop: 14, fontSize: 12, background: "#EBF6FD", color: "#185FA5", padding: "5px 14px", borderRadius: 20, fontWeight: 500 }}>
                Gerado pela Clara · orientativo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* APRENDA */}
      <section id="aprenda" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>aprenda</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3vw, 34px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 10 }}>
            Você tem mais direitos do que imagina.
          </h2>
          <p style={{ fontSize: 16, color: "#6b7280", marginBottom: 36, lineHeight: 1.6 }}>
            Guias por situação. Linguagem simples. O que fazer, passo a passo.
          </p>

          <div style={{ background: "#1a2340", borderRadius: 18, padding: "28px 32px", display: "flex", alignItems: "center", gap: 28, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", lineHeight: 1.4, marginBottom: 10 }}>
                Sabia que você pode resolver muita coisa sem sair de casa?
              </h3>
              <p style={{ fontSize: 15, color: "rgba(168,216,240,0.75)", lineHeight: 1.7 }}>
                E-mail bem escrito, com a lei certa — é o que resolve a maioria dos casos. Sem fila, sem fórum, sem advogado.
              </p>
            </div>
            <Link href="/enviar" style={{ background: "#D4AF37", color: "#1a2340", fontSize: 14, fontWeight: 700, padding: "14px 26px", borderRadius: 40, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}>
              Quero resolver o meu →
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
            {situations.map((sit, i) => (
              <Link href="/enviar" key={i} style={{ background: "#fff", border: "1px solid #E8E4DA", borderRadius: 16, padding: 22, textDecoration: "none", display: "block" }}
                className="hover:border-[#A8D8F0]">
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, background: sit.bg }}>
                    {sit.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2340", lineHeight: 1.4, marginBottom: 6 }}>{sit.title}</div>
                    <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{sit.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, borderTop: "1px solid #F0EDE8", paddingTop: 14, flexWrap: "wrap" }}>
                  {sit.badges.map((b) => (
                    <span key={b} style={{
                      fontSize: 12, fontWeight: 500, padding: "4px 12px", borderRadius: 20,
                      background: b.includes("e-mail") ? "#F0FDF4" : b === "sem advogado" ? "#EBF6FD" : "#FBF8EF",
                      color: b.includes("e-mail") ? "#166534" : b === "sem advogado" ? "#185FA5" : "#92700A",
                      border: `1px solid ${b.includes("e-mail") ? "#bbf7d0" : b === "sem advogado" ? "#bae6fd" : "#EAD98A"}`
                    }}>{b}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ANÁLISE DE CONTRATO */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "72px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>análise de contrato</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3vw, 34px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 14 }}>
            Vai assinar algo? Deixa a Clara ler primeiro.
          </h2>
          <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.75, marginBottom: 30, maxWidth: 560 }}>
            Envie o PDF e a Clara destaca cláusulas abusivas, riscos reais e o que você deve negociar antes de assinar.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
            {["Multas e fidelidade", "Prazos e vigência", "Renovação automática", "Rescisão e aviso prévio", "Reajustes e valores", "Responsabilidades", "LGPD e dados pessoais", "Cláusulas abusivas"].map((item) => (
              <span key={item} style={{ border: "1px solid #E0DDD6", background: "#F8F7F4", padding: "10px 18px", borderRadius: 10, fontSize: 13, color: "#4b5563", fontWeight: 500 }}>{item}</span>
            ))}
          </div>
          <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 15, fontWeight: 700, padding: "16px 36px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
            Reivindicar meus direitos
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: "#1a2340", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ClaraIcon size={52} />
          </div>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: "clamp(28px, 4vw, 42px)", color: "#fff", lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.02em" }}>
            Clareza é o começo<br />de qualquer <span style={{ color: "#D4AF37" }}>justiça.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(168,216,240,0.7)", lineHeight: 1.75, marginBottom: 40 }}>
            Sem medo, sem juridiquês, sem enrolação.<br />Entenda seus direitos e saiba o que fazer — agora.
          </p>
          <Link href="/enviar" style={{ background: "#D4AF37", color: "#1a2340", fontSize: 17, fontWeight: 800, padding: "20px 48px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
            Começar gratuitamente
          </Link>
          <p style={{ fontSize: 12, color: "rgba(168,216,240,0.3)", marginTop: 16 }}>Sem cartão · Sem cadastro obrigatório</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: "#A8D8F0" }}>CLARA LAW</div>
            <div style={{ fontSize: 11, color: "rgba(168,216,240,0.3)", marginTop: 3 }}>Inteligência para um mundo mais claro e justo.</div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {["Como funciona", "Aprenda", "Privacidade"].map((l) => (
              <a key={l} href="#" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "12px auto 0", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: 11, color: "rgba(168,216,240,0.25)", textAlign: "center", lineHeight: 1.7 }}>
            ⚠️ A Clara não é um escritório de advocacia. As análises são orientativas e não substituem a consulta com um advogado.
          </p>
        </div>
      </footer>

      <style>{`
        @media (min-width: 900px) {
          .grid-2col { grid-template-columns: 1fr 1fr !important; }
          .grid-steps { grid-template-columns: repeat(4, 1fr) !important; }
        }
        @media (max-width: 899px) {
          .grid-steps { grid-template-columns: repeat(2, 1fr) !important; }
          .grid-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}
