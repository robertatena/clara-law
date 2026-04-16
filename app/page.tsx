"use client";

import Link from "next/link";

const ClaraIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const situations = [
  { icon: "📦", color: "gold", title: "Comprei algo com defeito e a loja não quer resolver", desc: "Você tem direito à troca, conserto ou devolução do dinheiro. A loja é obrigada por lei.", badges: ["resolve por e-mail", "sem advogado"] },
  { icon: "💳", color: "blue", title: "Cobraram algo que eu não devo ou meu nome foi ao Serasa", desc: "Cobrança errada ou nome sujo indevido dá direito a indenização — mesmo sem ir ao fórum.", badges: ["resolve por e-mail", "sem advogado"] },
  { icon: "✈️", color: "gold", title: "Meu voo atrasou ou foi cancelado", desc: "A companhia é obrigada a te dar assistência e reembolso. Muita gente não sabe desse direito.", badges: ["resolve por e-mail", "JEC disponível"] },
  { icon: "🔧", color: "blue", title: "Paguei por um serviço que não foi entregue", desc: "Tem direito ao dinheiro de volta e, dependendo do caso, a uma indenização.", badges: ["resolve por e-mail", "sem advogado"] },
  { icon: "🏠", color: "gold", title: "Meu aluguel tem cláusula abusiva", desc: "Algumas cláusulas são ilegais — mesmo que você já tenha assinado.", badges: ["pode resolver por e-mail", "JEC disponível"] },
  { icon: "📱", color: "blue", title: "Meu plano de internet não funciona como prometido", desc: "Velocidade menor que a contratada é descumprimento. Você pode pedir cancelamento sem multa.", badges: ["resolve por e-mail", "sem advogado"] },
];

const badgeCls = (l: string) =>
  l === "resolve por e-mail" || l === "pode resolver por e-mail"
    ? "bg-green-50 text-green-800 border border-green-100"
    : l === "sem advogado"
    ? "bg-blue-50 text-blue-800 border border-blue-100"
    : "bg-amber-50 text-amber-800 border border-amber-100";

export default function Home() {
  return (
    <main className="bg-[#F8F7F4] min-h-screen" style={{ fontFamily: "'Montserrat', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "0.5px solid #ECE9E2" }} className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between" style={{ height: 64 }}>
          <div className="flex items-center gap-3">
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em", color: "#A8D8F0" }}>
              CLARA LAW
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {[["#como-funciona", "Como funciona"], ["#aprenda", "Aprenda"], ["#forum", "Encontrar fórum"]].map(([href, label]) => (
              <a key={label} href={href} style={{ fontSize: 12, color: "#999", textDecoration: "none" }}
                className="hover:text-[#1a2340] transition-colors">{label}</a>
            ))}
            <Link href="/enviar"
              style={{ background: "#1a2340", color: "#fff", fontSize: 12, fontWeight: 500, padding: "9px 22px", borderRadius: 32, textDecoration: "none" }}
              className="hover:bg-[#253056] transition-colors">
              Analisar meu caso →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO — duas colunas */}
      <section style={{ background: "#fff", borderBottom: "0.5px solid #ECE9E2" }}>
        <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Esquerda */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6"
              style={{ border: "0.5px solid #E8E4DA", padding: "6px 16px", borderRadius: 24, fontSize: 11, color: "#999", letterSpacing: "0.05em" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
              Inteligência jurídica para todos
            </div>

            <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, lineHeight: 1.15, color: "#1a2340", marginBottom: 20, letterSpacing: "-0.01em" }}
              className="text-[38px] lg:text-[46px]">
              Você tem direitos.{" "}
              <span style={{ color: "#D4AF37" }}>A Clara</span>{" "}
              te ajuda{" "}
              <span style={{ color: "#A8D8F0" }}>a fazer valer.</span>
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#6b7280", fontWeight: 300, marginBottom: 20, maxWidth: 440 }}>
              Analise contratos, descubra seus direitos e saiba exatamente o que
              fazer — tudo em minutos,{" "}
              <strong style={{ color: "#1a2340", fontWeight: 500 }}>sem juridiquês.</strong>
            </p>

            <div className="flex items-start gap-3 mb-8 p-4 rounded-xl"
              style={{ background: "#EBF6FD", border: "0.5px solid #A8D8F0", maxWidth: 440 }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="#185FA5" strokeWidth="1.3" />
                <path d="M1 5l7 5 7-5" stroke="#185FA5" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 13, color: "#185FA5", lineHeight: 1.6 }}>
                <strong style={{ fontWeight: 600 }}>Muitos casos se resolvem por e-mail</strong>
                {" "}— sem precisar sair de casa ou contratar advogado.
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link href="/enviar"
                style={{ background: "#1a2340", color: "#fff", fontSize: 14, fontWeight: 500, padding: "14px 30px", borderRadius: 32, textDecoration: "none" }}
                className="hover:bg-[#253056] transition-colors">
                Analisar meu contrato
              </Link>
              <a href="#aprenda"
                style={{ fontSize: 14, color: "#1a2340", padding: "13px 24px", borderRadius: 32, border: "0.5px solid #C8C3BA", textDecoration: "none" }}
                className="hover:bg-[#F8F7F4] transition-colors">
                Ver meus direitos
              </a>
            </div>
            <p style={{ fontSize: 11, color: "#bbb", marginTop: 14 }}>
              Sem cartão · Sem cadastro obrigatório · Resultado em minutos
            </p>
          </div>

          {/* Direita — card da Clara em ação */}
          <div className="hidden lg:block">
            <div style={{ background: "#F8F7F4", border: "0.5px solid #E0DDD6", borderRadius: 20, padding: 28 }}>
              <div className="flex items-center gap-2 mb-5">
                <ClaraIcon size={20} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", color: "#1a2340" }}>CLARA ANALISOU SEU CASO</span>
              </div>

              <div style={{ background: "#fff", border: "0.5px solid #E8E4DA", borderRadius: 10, padding: "11px 14px", marginBottom: 10, fontSize: 13, color: "#1a2340", fontWeight: 500 }}>
                📦 Produto com defeito — loja recusou a troca
              </div>

              <div style={{ background: "#fff", border: "0.5px solid #E8E4DA", borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "#D4AF37", marginBottom: 10, textTransform: "uppercase" }}>
                  O que a Clara encontrou
                </div>
                {[
                  { icon: "✅", text: "Direito à troca garantido pelo CDC art. 18" },
                  { icon: "✅", text: "E-mail de notificação gerado — resolve em 48h na maioria dos casos" },
                  { icon: "🏛️", text: "Se não resolver: Foro de Pinheiros · jec.pinheiros@tjsp.jus.br" },
                ].map((r, i) => (
                  <div key={i} className="flex gap-2 items-start"
                    style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: i < 2 ? 8 : 0, fontWeight: 300 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{r.icon}</span>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ fontSize: 11, background: "#F0FDF4", color: "#166534", border: "0.5px solid #bbf7d0", padding: "4px 12px", borderRadius: 20, fontWeight: 500 }}>
                  resolve por e-mail
                </span>
                <span style={{ fontSize: 11, background: "#EBF6FD", color: "#185FA5", border: "0.5px solid #bae6fd", padding: "4px 12px", borderRadius: 20, fontWeight: 500 }}>
                  sem advogado
                </span>
                <span style={{ fontSize: 10, color: "#ccc", marginLeft: "auto" }}>orientativo</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { num: "É de graça", lbl: "Abrir ação no Juizado Especial" },
                { num: "Sem advogado", lbl: "Para causas até R$28 mil" },
                { num: "2–6 meses", lbl: "Prazo médio com acordo" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#1a2340", borderRadius: 12, padding: "14px 12px" }}>
                  <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 12, color: "#D4AF37", marginBottom: 4, lineHeight: 1.2 }}>{s.num}</div>
                  <div style={{ fontSize: 10, color: "rgba(168,216,240,0.5)", lineHeight: 1.45, fontWeight: 300 }}>{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* E-MAIL ANTES DO FÓRUM */}
      <section style={{ background: "#fff", borderBottom: "0.5px solid #ECE9E2" }}>
        <div className="max-w-6xl mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>o caminho certo</p>
            <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 27, color: "#1a2340", lineHeight: 1.25, marginBottom: 14 }}>
              Primeiro o e-mail.<br />O fórum é o último recurso.
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 300, lineHeight: 1.8, marginBottom: 24 }}>
              Antes de ir ao fórum, tente resolver por e-mail. Muitas empresas
              atendem na hora que recebem uma notificação bem feita.{" "}
              <strong style={{ color: "#1a2340", fontWeight: 500 }}>A Clara gera esse e-mail pra você.</strong>
            </p>
            <Link href="/enviar"
              style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 500, padding: "13px 26px", borderRadius: 32, textDecoration: "none", display: "inline-block" }}
              className="hover:bg-[#253056] transition-colors">
              Gerar meu e-mail agora
            </Link>
          </div>

          <div style={{ background: "#fff", border: "0.5px solid #E0DDD6", borderRadius: 16, padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: "0.5px solid #F0EDE8" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: "#1a2340" }}>Notificação — produto com defeito</span>
              <span style={{ fontSize: 10, color: "#aaa", marginLeft: "auto" }}>juridico@empresa.com.br</span>
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.75 }}>
              <strong style={{ color: "#1a2340", fontWeight: 500, display: "block", marginBottom: 6 }}>Prezados,</strong>
              Adquiri o produto X em 10/03/2025 (NF 4821). O item apresentou defeito dentro
              da garantia e as tentativas de resolução foram ignoradas.
              <br /><br />
              Nos termos do{" "}
              <strong style={{ color: "#1a2340", fontWeight: 500 }}>art. 18 do CDC</strong>, solicito troca ou
              reembolso em até 5 dias úteis, sob pena de ingresso no Juizado Especial com
              pedido de dano moral.
              <br />
              <span style={{ display: "inline-block", marginTop: 10, fontSize: 10, background: "#EBF6FD", color: "#185FA5", padding: "3px 10px", borderRadius: 20, fontWeight: 500 }}>
                Gerado pela Clara · orientativo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{ background: "#F8F7F4", borderBottom: "0.5px solid #ECE9E2" }}>
        <div className="max-w-6xl mx-auto px-8 py-14">
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>como funciona</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 26, color: "#1a2340", marginBottom: 28 }}>Simples assim.</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4"
            style={{ border: "0.5px solid #E8E4DA", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
            {[
              { n: "1", t: "Conta o que aconteceu", d: "Ou envie o contrato em PDF. Sem formulário complicado." },
              { n: "2", t: "Clara analisa", d: "Explica os riscos, cita a lei e mostra o que você pode fazer." },
              { n: "3", t: "E-mail pronto pra enviar", d: "Notificação gerada. Muitos casos se encerram aqui mesmo." },
              { n: "4", t: "Se precisar: o fórum certo", d: "Digite o CEP. Clara mostra onde ir, e-mail e o que levar." },
            ].map((s, i) => (
              <div key={i} style={{ padding: "22px 20px", borderRight: i < 3 ? "0.5px solid #F0EDE8" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", border: "0.5px solid #D4AF37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500, color: "#D4AF37", marginBottom: 14 }}>{s.n}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2340", marginBottom: 6 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.6, fontWeight: 300 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APRENDA */}
      <section id="aprenda" style={{ background: "#fff", borderBottom: "0.5px solid #ECE9E2" }}>
        <div className="max-w-6xl mx-auto px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>aprenda</p>
              <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 26, color: "#1a2340", lineHeight: 1.25, marginBottom: 6 }}>
                Você tem mais direitos<br />do que imagina.
              </h2>
              <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 300 }}>Guias por situação. Linguagem simples. O que fazer, passo a passo.</p>
            </div>
          </div>

          <div style={{ background: "#1a2340", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, marginBottom: 14 }}>
            <div>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 17, color: "#fff", lineHeight: 1.35, marginBottom: 8 }}>
                Sabia que você pode resolver muita coisa sem sair de casa?
              </h3>
              <p style={{ fontSize: 13, color: "rgba(168,216,240,0.7)", fontWeight: 300, lineHeight: 1.65 }}>
                E-mail bem escrito, com a lei certa — é o que resolve a maioria dos casos de consumidor. Sem fila, sem fórum, sem advogado.
              </p>
            </div>
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 64, color: "rgba(212,175,55,0.12)", lineHeight: 1, flexShrink: 0 }} className="hidden md:block">!</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {situations.map((sit, i) => (
              <Link href="/enviar" key={i}
                style={{ background: "#F8F7F4", border: "0.5px solid #E8E4DA", borderRadius: 16, padding: 18, textDecoration: "none", display: "block" }}
                className="hover:border-[#A8D8F0] transition-colors group">
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, background: sit.color === "gold" ? "#FBF5E6" : "#EBF6FD" }}>
                    {sit.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#1a2340", lineHeight: 1.35, marginBottom: 4 }}>{sit.title}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.55, fontWeight: 300 }}>{sit.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.5px solid #F0EDE8", paddingTop: 10 }}>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {sit.badges.map((b) => (
                      <span key={b} className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${badgeCls(b)}`}>{b}</span>
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: "#ccc" }} className="group-hover:text-[#A8D8F0] transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <Link href="/enviar" style={{ fontSize: 13, color: "#A8D8F0", fontWeight: 500, textDecoration: "none" }}>
              Ver todos os guias de direitos →
            </Link>
          </div>
        </div>
      </section>

      {/* FÓRUM */}
      <section id="forum" style={{ background: "#F8F7F4", borderBottom: "0.5px solid #ECE9E2" }}>
        <div className="max-w-6xl mx-auto px-8 py-16">
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>módulo fórum</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 26, color: "#1a2340", lineHeight: 1.25, marginBottom: 10 }}>
            Se precisar ir ao fórum,<br />a Clara te leva pela mão.
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 300, lineHeight: 1.7, marginBottom: 28, maxWidth: 440 }}>
            Digite o CEP da empresa ou pessoa — a Clara mostra o fórum competente, o e-mail do cartório e tudo que você precisa levar.
          </p>

          <div style={{ background: "#1a2340", borderRadius: 20, padding: 36 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", lineHeight: 1.3, marginBottom: 12 }}>
                CEP → fórum certo<br />em segundos.
              </h3>
              <p style={{ fontSize: 13, color: "rgba(168,216,240,0.7)", fontWeight: 300, lineHeight: 1.75, marginBottom: 24 }}>
                Sem precisar pesquisar ou ligar. A Clara encontra o fórum correto, com endereço, e-mail e horário de atendimento.
              </p>
              <Link href="/enviar"
                style={{ background: "#fff", color: "#1a2340", fontSize: 12, fontWeight: 500, padding: "11px 22px", borderRadius: 32, textDecoration: "none", display: "inline-block" }}
                className="hover:bg-[#F8F7F4] transition-colors">
                Encontrar meu fórum
              </Link>
            </div>

            <div style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(168,216,240,0.18)", borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "rgba(168,216,240,0.4)", fontWeight: 500, marginBottom: 10, textTransform: "uppercase" }}>CEP da empresa ou pessoa</div>
              <div style={{ background: "rgba(255,255,255,0.07)", border: "0.5px solid rgba(168,216,240,0.2)", borderRadius: 8, padding: "11px 14px", fontSize: 13, color: "#fff", display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                05673-030 <span style={{ width: 1.5, height: 14, background: "#D4AF37", display: "inline-block" }} />
              </div>
              <div style={{ borderTop: "0.5px solid rgba(168,216,240,0.1)", paddingTop: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.07em", color: "rgba(168,216,240,0.35)", marginBottom: 8, textTransform: "uppercase" }}>Resultado</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#fff", marginBottom: 4 }}>Foro de Pinheiros</div>
                <div style={{ fontSize: 11, color: "rgba(168,216,240,0.5)", lineHeight: 1.65 }}>
                  Av. Pedroso de Morais, 1553 — Pinheiros<br />Seg–Sex, 9h–17h
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 11, color: "#A8D8F0", fontWeight: 500 }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="10" rx="2" stroke="#A8D8F0" strokeWidth="1.4" />
                    <path d="M1 5l7 5 7-5" stroke="#A8D8F0" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  jec.pinheiros@tjsp.jus.br
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANÁLISE DE CONTRATO */}
      <section style={{ background: "#fff", borderBottom: "0.5px solid #ECE9E2" }}>
        <div className="max-w-6xl mx-auto px-8 py-16">
          <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.1em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>análise de contrato</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 26, color: "#1a2340", lineHeight: 1.25, marginBottom: 10 }}>
            Vai assinar algo?<br />Deixa a Clara ler primeiro.
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 300, lineHeight: 1.7, marginBottom: 24, maxWidth: 440 }}>
            Envie o PDF e a Clara destaca cláusulas abusivas, riscos reais e o que você deve negociar antes de assinar.
          </p>
          <div className="flex flex-wrap gap-2 mb-8">
            {["Multas e fidelidade", "Prazos e vigência", "Renovação automática", "Rescisão e aviso prévio", "Reajustes e valores", "Responsabilidades", "LGPD e dados pessoais", "Cláusulas abusivas"].map((item) => (
              <span key={item} style={{ border: "0.5px solid #E8E4DA", background: "#F8F7F4", padding: "8px 16px", borderRadius: 10, fontSize: 12, color: "#6b7280", fontWeight: 300 }}>
                {item}
              </span>
            ))}
          </div>
          <Link href="/enviar"
            style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 500, padding: "13px 28px", borderRadius: 32, textDecoration: "none", display: "inline-block" }}
            className="hover:bg-[#253056] transition-colors">
            Analisar meu contrato
          </Link>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: "#F8F7F4" }}>
        <div className="max-w-6xl mx-auto px-8 py-20 text-center">
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <ClaraIcon size={52} />
          </div>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 30, color: "#1a2340", lineHeight: 1.25, marginBottom: 14 }}>
            Clareza é o começo<br />de qualquer{" "}
            <span style={{ color: "#D4AF37" }}>justiça.</span>
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 300, lineHeight: 1.7, marginBottom: 32 }}>
            Sem medo, sem juridiquês, sem enrolação.<br />
            Entenda seus direitos e saiba o que fazer — agora.
          </p>
          <Link href="/enviar"
            style={{ background: "#1a2340", color: "#fff", fontSize: 14, fontWeight: 500, padding: "16px 40px", borderRadius: 32, textDecoration: "none", display: "inline-block" }}
            className="hover:bg-[#253056] transition-colors">
            Começar gratuitamente
          </Link>
          <p style={{ fontSize: 11, color: "#bbb", marginTop: 14 }}>
            Sem cartão · Sem cadastro obrigatório
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a2340" }}>
        <div className="max-w-6xl mx-auto px-8 py-7 flex items-center justify-between">
          <div>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: "#A8D8F0" }}>CLARA LAW</div>
            <div style={{ fontSize: 11, color: "rgba(168,216,240,0.35)", marginTop: 3, fontWeight: 300 }}>Inteligência para um mundo mais claro.</div>
          </div>
          <div style={{ display: "flex", gap: 24 }}>
            {["Como funciona", "Aprenda", "Fórum", "Privacidade"].map((l) => (
              <a key={l} href="#" style={{ fontSize: 11, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}
                className="hover:text-[#A8D8F0] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
