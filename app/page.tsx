"use client";

import Link from "next/link";

const ClaraIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7.5" fill="#D4F7E8" />
    <path d="M4.5 8l2.5 2.5 4.5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function Home() {
  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClaraIcon size={30} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.15em", color: "#A8D8F0" }}>CLARA LAW</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#como-funciona" className="hidden md:block" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Como funciona</a>
            <a href="#aprenda" className="hidden md:block" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Aprenda</a>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 22px", borderRadius: 40, textDecoration: "none" }}>
              Analisar meu contrato
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECEAE4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 56px" }}>

          {/* Badge de prova social */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#FBF8EF", border: "1px solid #EAD98A", borderRadius: 40, padding: "6px 16px", marginBottom: 28 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#92700A", fontWeight: 500 }}>Inteligência jurídica para quem não tem advogado</span>
          </div>

          {/* Headline + card lado a lado no desktop */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, alignItems: "center" }} className="md:grid-cols-hero">
            <div style={{ maxWidth: 600 }}>
              <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: "clamp(36px, 5vw, 54px)", lineHeight: 1.1, color: "#1a2340", marginBottom: 20, letterSpacing: "-0.02em" }}>
                Você tem direitos.<br />
                <span style={{ color: "#D4AF37" }}>A Clara</span> te ajuda<br />
                <span style={{ color: "#A8D8F0" }}>a fazer valer.</span>
              </h1>

              <p style={{ fontSize: "clamp(15px, 2vw, 17px)", lineHeight: 1.75, color: "#4b5563", fontWeight: 400, marginBottom: 28, maxWidth: 500 }}>
                Analise seu contrato, descubra brechas e saiba exatamente o que fazer —
                tudo em minutos, <strong style={{ color: "#1a2340", fontWeight: 600 }}>sem juridiquês e sem advogado.</strong>
              </p>

              {/* Trust signal inline */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: "#EBF6FD", border: "1px solid #BAE0F7", borderRadius: 14, padding: "14px 18px", marginBottom: 32, maxWidth: 480 }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="#185FA5" strokeWidth="1.3" />
                  <path d="M1 5l7 5 7-5" stroke="#185FA5" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: 14, color: "#185FA5", lineHeight: 1.6 }}>
                  <strong style={{ fontWeight: 600 }}>Muitos casos se resolvem por e-mail</strong>
                  {" "}— a Clara escreve para você, com a lei certa.
                </span>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 15, fontWeight: 600, padding: "15px 32px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
                  Analisar meu contrato
                </Link>
                <a href="#aprenda" style={{ fontSize: 14, color: "#1a2340", padding: "14px 24px", borderRadius: 40, border: "1.5px solid #D1CCC4", textDecoration: "none", background: "transparent", display: "inline-block" }}>
                  Ver meus direitos
                </a>
              </div>

              <p style={{ fontSize: 12, color: "#aaa", marginTop: 14 }}>Sem cartão · Sem cadastro · Resultado em minutos</p>
            </div>

            {/* Card demo — visível em desktop */}
            <div className="hidden lg:block" style={{ maxWidth: 380, marginLeft: "auto" }}>
              <div style={{ background: "#F8F7F4", border: "1px solid #E0DDD6", borderRadius: 20, padding: 24, boxShadow: "0 8px 32px rgba(26,35,64,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <ClaraIcon size={18} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#1a2340", textTransform: "uppercase" }}>Clara analisou seu caso</span>
                </div>

                <div style={{ background: "#fff", border: "1px solid #E8E4DA", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#1a2340", fontWeight: 500 }}>
                  📦 Produto com defeito — loja recusou a troca
                </div>

                <div style={{ background: "#fff", border: "1px solid #E8E4DA", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#D4AF37", marginBottom: 12, textTransform: "uppercase" }}>O que a Clara encontrou</div>
                  {[
                    "Direito à troca garantido pelo CDC art. 18",
                    "E-mail de notificação pronto — resolve em 48h na maioria dos casos",
                    "Se não resolver: fórum correto gerado pelo seu CEP",
                  ].map((t, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: "#374151", lineHeight: 1.6, marginBottom: i < 2 ? 10 : 0 }}>
                      <CheckIcon />
                      <span>{t}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, background: "#F0FDF4", color: "#166534", border: "1px solid #bbf7d0", padding: "4px 12px", borderRadius: 20, fontWeight: 500 }}>resolve por e-mail</span>
                  <span style={{ fontSize: 11, background: "#EBF6FD", color: "#185FA5", border: "1px solid #bae6fd", padding: "4px 12px", borderRadius: 20, fontWeight: 500 }}>sem advogado</span>
                  <span style={{ fontSize: 10, color: "#ccc", marginLeft: "auto", alignSelf: "center" }}>orientativo</span>
                </div>
              </div>

              {/* 3 mini stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                {[
                  { num: "É de graça", lbl: "Juizado Especial" },
                  { num: "Sem advogado", lbl: "Até R$28 mil" },
                  { num: "2–6 meses", lbl: "Prazo com acordo" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "#1a2340", borderRadius: 12, padding: "12px 10px" }}>
                    <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 11, color: "#D4AF37", marginBottom: 3, lineHeight: 1.2 }}>{s.num}</div>
                    <div style={{ fontSize: 10, color: "rgba(168,216,240,0.55)", lineHeight: 1.4, fontWeight: 300 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats — visíveis em mobile (abaixo dos CTAs) */}
          <div className="lg:hidden" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 36 }}>
            {[
              { num: "De graça", lbl: "Juizado Especial" },
              { num: "Sem advogado", lbl: "Até R$28 mil" },
              { num: "2–6 meses", lbl: "Com acordo" },
            ].map((s, i) => (
              <div key={i} style={{ background: "#1a2340", borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 12, color: "#D4AF37", marginBottom: 3 }}>{s.num}</div>
                <div style={{ fontSize: 10, color: "rgba(168,216,240,0.55)" }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>como funciona</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 3vw, 32px)", color: "#1a2340", marginBottom: 36, lineHeight: 1.2 }}>
            Simples assim.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2, background: "#ECEAE4", borderRadius: 16, overflow: "hidden" }} className="md:grid-cols-4-equal">
            {[
              { n: "1", t: "Conta o que aconteceu", d: "Ou envie o contrato em PDF. Sem formulário complicado." },
              { n: "2", t: "Clara analisa", d: "Explica os riscos, cita a lei e mostra o que você pode fazer." },
              { n: "3", t: "E-mail pronto pra enviar", d: "Notificação gerada. Muitos casos se encerram aqui mesmo." },
              { n: "4", t: "Se precisar: o fórum certo", d: "Digite o CEP. Clara mostra onde ir, e-mail e o que levar." },
            ].map((s, i) => (
              <div key={i} style={{ background: "#fff", padding: "28px 22px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", border: "1.5px solid #D4AF37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#D4AF37", marginBottom: 16 }}>{s.n}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2340", marginBottom: 8, lineHeight: 1.3 }}>{s.t}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O CAMINHO CERTO — e-mail antes do fórum */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECEAE4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 48, alignItems: "center" }} className="lg:grid-cols-2-equal">
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>o caminho certo</p>
              <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: "#1a2340", lineHeight: 1.25, marginBottom: 16 }}>
                Primeiro o e-mail.<br />O fórum é o último recurso.
              </h2>
              <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 28 }}>
                Antes de ir ao fórum, tente resolver por e-mail. Muitas empresas atendem imediatamente ao receber uma notificação bem feita.{" "}
                <strong style={{ color: "#1a2340", fontWeight: 600 }}>A Clara escreve esse e-mail pra você.</strong>
              </p>
              <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 14, fontWeight: 600, padding: "14px 28px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
                Gerar meu e-mail agora
              </Link>
            </div>

            {/* Mock e-mail */}
            <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 16, padding: 24, boxShadow: "0 4px 20px rgba(26,35,64,0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid #F0EDE8" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1a2340" }}>Notificação — produto com defeito</span>
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>juridico@empresa.com.br</span>
              </div>
              <div style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.8 }}>
                <strong style={{ color: "#1a2340", fontWeight: 600, display: "block", marginBottom: 8 }}>Prezados,</strong>
                Adquiri o produto X em 10/03/2025 (NF 4821). O item apresentou defeito dentro
                da garantia e as tentativas de resolução foram ignoradas.
                <br /><br />
                Nos termos do{" "}
                <strong style={{ color: "#1a2340", fontWeight: 600 }}>art. 18 do CDC</strong>, solicito troca ou
                reembolso em até 5 dias úteis, sob pena de ingresso no Juizado Especial com pedido de dano moral.
                <br />
                <span style={{ display: "inline-block", marginTop: 12, fontSize: 11, background: "#EBF6FD", color: "#185FA5", padding: "4px 12px", borderRadius: 20, fontWeight: 500 }}>
                  Gerado pela Clara · orientativo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* APRENDA */}
      <section id="aprenda" style={{ background: "#F8F7F4", borderBottom: "1px solid #ECEAE4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>aprenda</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: "#1a2340", lineHeight: 1.25, marginBottom: 8 }}>
            Você tem mais direitos do que imagina.
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", marginBottom: 32 }}>Guias por situação. Linguagem simples. O que fazer, passo a passo.</p>

          {/* Destaque */}
          <div style={{ background: "#1a2340", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", gap: 24, marginBottom: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", lineHeight: 1.4, marginBottom: 8 }}>
                Sabia que você pode resolver muita coisa sem sair de casa?
              </h3>
              <p style={{ fontSize: 14, color: "rgba(168,216,240,0.75)", lineHeight: 1.7 }}>
                E-mail bem escrito, com a lei certa — é o que resolve a maioria dos casos. Sem fila, sem fórum, sem advogado.
              </p>
            </div>
            <Link href="/enviar" style={{ background: "#D4AF37", color: "#1a2340", fontSize: 13, fontWeight: 700, padding: "13px 24px", borderRadius: 40, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}>
              Quero resolver o meu →
            </Link>
          </div>

          {/* Grid situações */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {[
              { icon: "📦", color: "#FBF5E6", title: "Comprei algo com defeito e a loja não quer resolver", desc: "Você tem direito à troca, conserto ou devolução. A loja é obrigada por lei.", badges: ["resolve por e-mail", "sem advogado"] },
              { icon: "💳", color: "#EBF6FD", title: "Cobraram algo que eu não devo ou meu nome foi ao Serasa", desc: "Cobrança errada dá direito a indenização — mesmo sem ir ao fórum.", badges: ["resolve por e-mail", "sem advogado"] },
              { icon: "✈️", color: "#FBF5E6", title: "Meu voo atrasou ou foi cancelado", desc: "A companhia é obrigada a dar assistência e reembolso.", badges: ["resolve por e-mail", "JEC disponível"] },
              { icon: "🔧", color: "#EBF6FD", title: "Paguei por um serviço que não foi entregue", desc: "Tem direito ao dinheiro de volta e possivelmente a uma indenização.", badges: ["resolve por e-mail", "sem advogado"] },
              { icon: "🏠", color: "#FBF5E6", title: "Meu aluguel tem cláusula abusiva", desc: "Algumas cláusulas são ilegais — mesmo que você já tenha assinado.", badges: ["pode resolver por e-mail", "JEC disponível"] },
              { icon: "📱", color: "#EBF6FD", title: "Meu plano de internet não funciona como prometido", desc: "Velocidade menor que a contratada é descumprimento. Pode cancelar sem multa.", badges: ["resolve por e-mail", "sem advogado"] },
            ].map((sit, i) => (
              <Link href="/enviar" key={i} style={{ background: "#fff", border: "1px solid #E8E4DA", borderRadius: 16, padding: 18, textDecoration: "none", display: "block", transition: "border-color .2s" }}
                className="hover:border-[#A8D8F0]">
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, background: sit.color }}>
                    {sit.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2340", lineHeight: 1.4, marginBottom: 5 }}>{sit.title}</div>
                    <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6 }}>{sit.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, borderTop: "1px solid #F0EDE8", paddingTop: 12, flexWrap: "wrap" }}>
                  {sit.badges.map((b) => (
                    <span key={b} style={{ fontSize: 11, fontWeight: 500, padding: "3px 10px", borderRadius: 20,
                      background: b === "resolve por e-mail" || b === "pode resolver por e-mail" ? "#F0FDF4" : b === "sem advogado" ? "#EBF6FD" : "#FBF5E6",
                      color: b === "resolve por e-mail" || b === "pode resolver por e-mail" ? "#166534" : b === "sem advogado" ? "#185FA5" : "#92700A",
                      border: `1px solid ${b === "resolve por e-mail" || b === "pode resolver por e-mail" ? "#bbf7d0" : b === "sem advogado" ? "#bae6fd" : "#EAD98A"}`
                    }}>{b}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ANÁLISE DE CONTRATO */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECEAE4" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 24px" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>análise de contrato</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: "#1a2340", lineHeight: 1.25, marginBottom: 12 }}>
            Vai assinar algo? Deixa a Clara ler primeiro.
          </h2>
          <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.75, marginBottom: 28, maxWidth: 520 }}>
            Envie o PDF e a Clara destaca cláusulas abusivas, riscos reais e o que você deve negociar antes de assinar.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
            {["Multas e fidelidade", "Prazos e vigência", "Renovação automática", "Rescisão e aviso prévio", "Reajustes e valores", "Responsabilidades", "LGPD e dados pessoais", "Cláusulas abusivas"].map((item) => (
              <span key={item} style={{ border: "1px solid #E0DDD6", background: "#F8F7F4", padding: "8px 16px", borderRadius: 10, fontSize: 13, color: "#4b5563" }}>{item}</span>
            ))}
          </div>
          <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 14, fontWeight: 600, padding: "15px 32px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
            Analisar meu contrato
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: "#1a2340" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <ClaraIcon size={48} />
          </div>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 4vw, 38px)", color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>
            Clareza é o começo<br />de qualquer <span style={{ color: "#D4AF37" }}>justiça.</span>
          </h2>
          <p style={{ fontSize: 16, color: "rgba(168,216,240,0.7)", lineHeight: 1.7, marginBottom: 36, maxWidth: 440, margin: "0 auto 36px" }}>
            Sem medo, sem juridiquês, sem enrolação.<br />Entenda seus direitos e saiba o que fazer — agora.
          </p>
          <Link href="/enviar" style={{ background: "#D4AF37", color: "#1a2340", fontSize: 16, fontWeight: 700, padding: "18px 44px", borderRadius: 40, textDecoration: "none", display: "inline-block" }}>
            Começar gratuitamente
          </Link>
          <p style={{ fontSize: 12, color: "rgba(168,216,240,0.35)", marginTop: 16 }}>Sem cartão · Sem cadastro obrigatório</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#111827", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: "#A8D8F0" }}>CLARA LAW</div>
            <div style={{ fontSize: 11, color: "rgba(168,216,240,0.3)", marginTop: 3 }}>Inteligência para um mundo mais claro.</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Como funciona", "Aprenda", "Privacidade"].map((l) => (
              <a key={l} href="#" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @media (min-width: 1024px) {
          .md\\:grid-cols-hero { grid-template-columns: 1fr 420px !important; }
          .lg\\:grid-cols-2-equal { grid-template-columns: 1fr 1fr !important; }
        }
        @media (min-width: 768px) {
          .md\\:grid-cols-4-equal { grid-template-columns: repeat(4, 1fr) !important; }
        }
      `}</style>
    </main>
  );
}
