"use client";

import Link from "next/link";

const ClaraIcon = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon
      points="20,9 31,29 9,29"
      fill="none"
      stroke="#D4AF37"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="#185FA5" strokeWidth="1.3" />
    <path d="M1 5l7 5 7-5" stroke="#185FA5" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

const SmallEmailIcon = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="3" width="14" height="10" rx="2" stroke="#A8D8F0" strokeWidth="1.4" />
    <path d="M1 5l7 5 7-5" stroke="#A8D8F0" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const situations = [
  {
    icon: "📦",
    color: "gold",
    title: "Comprei algo com defeito e a loja não quer resolver",
    desc: "Você tem direito à troca, conserto ou devolução do dinheiro. A loja é obrigada por lei.",
    badges: ["resolve por e-mail", "sem advogado"],
  },
  {
    icon: "💳",
    color: "blue",
    title: "Cobraram algo que eu não devo ou meu nome foi ao Serasa",
    desc: "Cobrança errada ou nome sujo indevido dá direito a indenização — mesmo sem ir ao fórum.",
    badges: ["resolve por e-mail", "sem advogado"],
  },
  {
    icon: "✈️",
    color: "gold",
    title: "Meu voo atrasou ou foi cancelado",
    desc: "A companhia aérea é obrigada a te dar assistência e reembolso. Muita gente não sabe que tem esse direito.",
    badges: ["resolve por e-mail", "JEC disponível"],
  },
  {
    icon: "🔧",
    color: "blue",
    title: "Paguei por um serviço que não foi entregue",
    desc: "Tem direito ao dinheiro de volta e, dependendo do caso, a uma indenização por todo transtorno.",
    badges: ["resolve por e-mail", "sem advogado"],
  },
  {
    icon: "🏠",
    color: "gold",
    title: "Meu aluguel tem cláusula abusiva",
    desc: "Algumas cláusulas de contrato de locação são ilegais — mesmo que você já tenha assinado.",
    badges: ["pode resolver por e-mail", "JEC disponível"],
  },
  {
    icon: "📱",
    color: "blue",
    title: "Meu plano de internet ou celular não funciona como prometido",
    desc: "Velocidade menor que a contratada é descumprimento de contrato. Você pode pedir desconto ou cancelamento sem multa.",
    badges: ["resolve por e-mail", "sem advogado"],
  },
];

const badgeStyle = (label: string) => {
  if (label === "resolve por e-mail" || label === "pode resolver por e-mail")
    return "bg-green-50 text-green-800 border border-green-100";
  if (label === "sem advogado")
    return "bg-blue-50 text-blue-800 border border-blue-100";
  return "bg-amber-50 text-amber-800 border border-amber-100";
};

export default function Home() {
  return (
    <main className="bg-[#F8F7F4] min-h-screen font-montserrat">

      {/* — NAV — */}
      <nav className="bg-white border-b border-[#ECE9E2] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-8 h-[62px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClaraIcon size={34} />
            <span className="font-raleway font-bold text-sm tracking-[0.14em] text-[#A8D8F0]">
              CLARA LAW
            </span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            <a href="#como-funciona" className="text-xs text-[#999] hover:text-[#1a2340] transition-colors">
              Como funciona
            </a>
            <a href="#aprenda" className="text-xs text-[#999] hover:text-[#1a2340] transition-colors">
              Aprenda
            </a>
            <a href="#forum" className="text-xs text-[#999] hover:text-[#1a2340] transition-colors">
              Encontrar fórum
            </a>
            <Link
              href="/enviar"
              className="bg-[#1a2340] text-white text-xs font-medium px-5 py-2 rounded-full hover:bg-[#253056] transition-colors"
            >
              Analisar meu caso →
            </Link>
          </div>
        </div>
      </nav>

      {/* — HERO — */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-8 py-20">
          <div className="inline-flex items-center gap-2 border border-[#E8E4DA] px-4 py-1.5 rounded-full text-[11px] tracking-wider text-[#999] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] inline-block" />
            Inteligência jurídica para todos
          </div>

          <h1 className="font-raleway font-bold text-[42px] leading-[1.18] text-[#1a2340] mb-5 tracking-tight">
            Você tem direitos.<br />
            A <span className="text-[#D4AF37]">Clara</span> te ajuda<br />
            a <span className="text-[#A8D8F0]">fazer valer.</span>
          </h1>

          <p className="text-[15px] leading-relaxed text-[#6b7280] font-light mb-5 max-w-lg">
            Analise contratos, descubra seus direitos e saiba exatamente o que
            fazer — tudo em minutos,{" "}
            <strong className="text-[#1a2340] font-medium">sem juridiquês.</strong>
          </p>

          <div className="inline-flex items-center gap-2 bg-blue-50 border border-[#A8D8F0] rounded-xl px-4 py-2.5 text-[13px] text-blue-800 mb-8">
            <EmailIcon />
            <span>
              <strong className="font-medium">Muitos casos se resolvem por e-mail</strong>{" "}
              — sem precisar sair de casa.
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/enviar"
              className="bg-[#1a2340] text-white text-[13px] font-medium px-7 py-3.5 rounded-full hover:bg-[#253056] transition-colors"
            >
              Analisar meu contrato
            </Link>
            <a
              href="#aprenda"
              className="text-[13px] text-[#1a2340] px-6 py-3.5 rounded-full border border-[#C8C3BA] hover:bg-[#F8F7F4] transition-colors"
            >
              Aprenda seus direitos
            </a>
          </div>
          <p className="text-[11px] text-[#bbb] mt-4 tracking-wide">
            Sem cartão · Sem cadastro obrigatório · Resultado em minutos
          </p>
        </div>
      </section>

      {/* — STATS — */}
      <div className="bg-[#1a2340]">
        <div className="max-w-5xl mx-auto px-8 py-7 grid grid-cols-1 md:grid-cols-3 gap-px">
          {[
            { num: "É de graça", lbl: "Abrir uma ação no Juizado Especial não custa nada" },
            { num: "Sem advogado", lbl: "Para causas até R$28 mil, você mesmo pode entrar com a ação" },
            { num: "Resolve em meses", lbl: "A maioria dos casos tem resultado em 2 a 6 meses, com acordo" },
          ].map((s, i) => (
            <div key={i} className="px-6 first:pl-0 last:pr-0 border-r border-white/[0.07] last:border-none">
              <div className="font-raleway font-bold text-[19px] text-[#D4AF37] mb-1.5 leading-tight">{s.num}</div>
              <div className="text-[12px] text-[#A8D8F0]/60 font-light leading-snug">{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* — E-MAIL ANTES DO FÓRUM — */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <p className="text-[10px] font-medium tracking-[0.1em] text-[#D4AF37] uppercase mb-2">o caminho certo</p>
          <h2 className="font-raleway font-bold text-[26px] text-[#1a2340] leading-snug mb-3">
            Primeiro o e-mail.<br />O fórum é o último recurso.
          </h2>
          <p className="text-[14px] text-[#6b7280] font-light leading-relaxed mb-10 max-w-md">
            Antes de ir ao fórum, tente resolver por e-mail. Muitas empresas
            atendem na hora que recebem uma notificação bem feita. A Clara gera
            esse e-mail pra você.
          </p>

          <div className="bg-[#F8F7F4] border border-[#E0DDD6] rounded-2xl p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-raleway font-bold text-[19px] text-[#1a2340] leading-snug mb-3">
                E-mail de notificação pronto — com fundamento legal
              </h3>
              <p className="text-[13px] text-[#6b7280] font-light leading-relaxed mb-6">
                Você conta o que aconteceu. A Clara gera um e-mail com a
                linguagem certa, o artigo de lei correto e o tom que faz a
                empresa levar a sério.
              </p>
              <Link
                href="/enviar"
                className="inline-block bg-[#1a2340] text-white text-[12px] font-medium px-5 py-2.5 rounded-full hover:bg-[#253056] transition-colors"
              >
                Gerar meu e-mail agora
              </Link>
            </div>

            {/* Mock de e-mail */}
            <div className="bg-white border border-[#E0DDD6] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F0EDE8]">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
                <span className="text-[11px] font-medium text-[#1a2340]">Notificação — produto com defeito</span>
                <span className="text-[10px] text-[#aaa] ml-auto">juridico@empresa.com.br</span>
              </div>
              <div className="text-[11px] text-[#6b7280] leading-relaxed">
                <strong className="text-[#1a2340] font-medium block mb-1">Prezados,</strong>
                Adquiri o produto X em 10/03/2025 (NF 4821). O item apresentou
                defeito dentro da garantia e as tentativas de resolução foram ignoradas.
                <br /><br />
                Nos termos do{" "}
                <strong className="text-[#1a2340] font-medium">art. 18 do CDC</strong>
                , solicito troca ou reembolso em até 5 dias úteis, sob pena de
                ingresso no Juizado Especial com pedido de dano moral.
                <br />
                <span className="inline-block mt-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  Gerado pela Clara · orientativo
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* — COMO FUNCIONA — */}
      <section id="como-funciona" className="bg-[#F8F7F4]">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <p className="text-[10px] font-medium tracking-[0.1em] text-[#D4AF37] uppercase mb-2">como funciona</p>
          <h2 className="font-raleway font-bold text-[26px] text-[#1a2340] mb-8">Simples assim.</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 border border-[#E8E4DA] rounded-2xl overflow-hidden bg-white">
            {[
              { n: "1", t: "Conta o que aconteceu", d: "Ou envie o contrato em PDF. Sem formulário complicado." },
              { n: "2", t: "Clara analisa", d: "Explica os riscos, cita a lei e mostra o que você pode fazer." },
              { n: "3", t: "E-mail pronto pra enviar", d: "Notificação gerada. Muitos casos se encerram aqui mesmo." },
              { n: "4", t: "Se precisar: o fórum certo", d: "Digite o CEP. Clara mostra onde ir, e-mail e o que levar." },
            ].map((s, i) => (
              <div key={i} className="p-6 border-r border-[#F0EDE8] last:border-none">
                <div className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-[11px] font-medium text-[#D4AF37] mb-4">
                  {s.n}
                </div>
                <div className="text-[13px] font-medium text-[#1a2340] mb-2">{s.t}</div>
                <div className="text-[12px] text-[#9ca3af] leading-relaxed font-light">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* — APRENDA — */}
      <section id="aprenda" className="bg-white">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[10px] font-medium tracking-[0.1em] text-[#D4AF37] uppercase mb-2">aprenda</p>
              <h2 className="font-raleway font-bold text-[26px] text-[#1a2340] leading-snug">
                Você tem mais direitos<br />do que imagina.
              </h2>
              <p className="text-[14px] text-[#6b7280] font-light mt-2">
                Guias por situação. Linguagem simples. O que fazer, passo a passo.
              </p>
            </div>
            <Link href="/enviar" className="text-[12px] text-[#A8D8F0] font-medium whitespace-nowrap hidden md:block">
              Ver todos os guias →
            </Link>
          </div>

          <div className="bg-[#1a2340] rounded-2xl p-7 flex items-center justify-between gap-6 mb-4">
            <div>
              <h3 className="font-raleway font-bold text-[17px] text-white leading-snug mb-2">
                Sabia que você pode resolver muita coisa sem sair de casa?
              </h3>
              <p className="text-[13px] text-[#A8D8F0]/70 font-light leading-relaxed">
                E-mail bem escrito, com a lei certa — é o que resolve a maioria
                dos casos de consumidor. Sem fila, sem fórum, sem advogado. A
                Clara escreve esse e-mail com você.
              </p>
            </div>
            <span className="font-raleway font-bold text-[64px] text-[#D4AF37]/10 leading-none flex-shrink-0 hidden md:block">!</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {situations.map((sit, i) => (
              <Link
                href="/enviar"
                key={i}
                className="bg-[#F8F7F4] border border-[#E8E4DA] rounded-2xl p-5 hover:border-[#A8D8F0] transition-colors group block"
              >
                <div className="flex gap-3 items-start mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0 ${sit.color === "gold" ? "bg-amber-50" : "bg-blue-50"}`}>
                    {sit.icon}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-[#1a2340] leading-snug mb-1">{sit.title}</div>
                    <div className="text-[11px] text-[#9ca3af] leading-relaxed font-light">{sit.desc}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-[#F0EDE8] pt-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {sit.badges.map((b) => (
                      <span key={b} className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${badgeStyle(b)}`}>{b}</span>
                    ))}
                  </div>
                  <span className="text-[#ccc] text-sm group-hover:text-[#A8D8F0] transition-colors">→</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/enviar" className="text-[13px] text-[#A8D8F0] font-medium">
              Ver todos os guias de direitos →
            </Link>
          </div>
        </div>
      </section>

      {/* — MÓDULO FÓRUM — */}
      <section id="forum" className="bg-[#F8F7F4]">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <p className="text-[10px] font-medium tracking-[0.1em] text-[#D4AF37] uppercase mb-2">módulo fórum</p>
          <h2 className="font-raleway font-bold text-[26px] text-[#1a2340] leading-snug mb-3">
            Se precisar ir ao fórum,<br />a Clara te leva pela mão.
          </h2>
          <p className="text-[14px] text-[#6b7280] font-light leading-relaxed mb-8 max-w-md">
            Digite o CEP da empresa ou pessoa — a Clara mostra onde fica o
            fórum, o e-mail do cartório e tudo que você precisa levar.
          </p>

          <div className="bg-[#1a2340] rounded-2xl p-9 grid grid-cols-1 md:grid-cols-2 gap-9 items-center">
            <div>
              <h3 className="font-raleway font-bold text-[20px] text-white leading-snug mb-3">
                CEP → fórum certo<br />em segundos.
              </h3>
              <p className="text-[13px] text-[#A8D8F0]/70 font-light leading-relaxed mb-6">
                Sem precisar pesquisar, ligar ou se perder. A Clara encontra o
                fórum correto para o seu caso, com endereço, e-mail e horário
                de atendimento.
              </p>
              <Link
                href="/enviar"
                className="inline-block bg-white text-[#1a2340] text-[12px] font-medium px-5 py-2.5 rounded-full hover:bg-[#F8F7F4] transition-colors"
              >
                Encontrar meu fórum
              </Link>
            </div>

            <div className="bg-white/5 border border-[#A8D8F0]/20 rounded-xl p-5">
              <div className="text-[10px] tracking-[0.08em] text-[#A8D8F0]/40 font-medium mb-3 uppercase">CEP da empresa ou pessoa</div>
              <div className="bg-white/7 border border-[#A8D8F0]/20 rounded-lg px-4 py-3 text-[13px] text-white font-light mb-4 flex items-center gap-1.5">
                05673-030
                <span className="w-[1.5px] h-3.5 bg-[#D4AF37] inline-block" />
              </div>
              <div className="border-t border-[#A8D8F0]/10 pt-4">
                <div className="text-[10px] tracking-[0.07em] text-[#A8D8F0]/35 mb-2 uppercase">Resultado</div>
                <div className="text-[14px] font-medium text-white mb-1">Foro de Pinheiros</div>
                <div className="text-[11px] text-[#A8D8F0]/50 leading-relaxed">
                  Av. Pedroso de Morais, 1553 — Pinheiros<br />
                  Seg–Sex, 9h–17h · atendimento presencial e online
                </div>
                <div className="flex items-center gap-2 mt-2 text-[11px] text-[#A8D8F0]">
                  <SmallEmailIcon />
                  <strong className="font-medium">jec.pinheiros@tjsp.jus.br</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* — ANALISAR CONTRATO — */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-8 py-16">
          <p className="text-[10px] font-medium tracking-[0.1em] text-[#D4AF37] uppercase mb-2">análise de contrato</p>
          <h2 className="font-raleway font-bold text-[26px] text-[#1a2340] leading-snug mb-3">
            Vai assinar algo?<br />Deixa a Clara ler primeiro.
          </h2>
          <p className="text-[14px] text-[#6b7280] font-light leading-relaxed mb-8 max-w-md">
            Envie o PDF do contrato e a Clara destaca cláusulas abusivas, riscos
            reais e o que você deve negociar antes de assinar.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              "Multas e fidelidade", "Prazos e vigência", "Renovação automática", "Rescisão e aviso prévio",
              "Reajustes e valores", "Responsabilidades", "LGPD e dados pessoais", "Cláusulas abusivas",
            ].map((item) => (
              <span key={item} className="rounded-xl border border-[#E8E4DA] bg-[#F8F7F4] px-4 py-2.5 text-[12px] text-[#6b7280] font-light">
                {item}
              </span>
            ))}
          </div>

          <Link
            href="/enviar"
            className="inline-block bg-[#1a2340] text-white text-[13px] font-medium px-7 py-3.5 rounded-full hover:bg-[#253056] transition-colors"
          >
            Analisar meu contrato
          </Link>
          <p className="text-[11px] text-[#bbb] mt-3">Sem cartão · Sem cadastro obrigatório</p>
        </div>
      </section>

      {/* — CTA FINAL — */}
      <section className="bg-[#F8F7F4]">
        <div className="max-w-5xl mx-auto px-8 py-20 text-center">
          <div className="flex justify-center mb-6">
            <ClaraIcon size={52} />
          </div>
          <h2 className="font-raleway font-bold text-[30px] text-[#1a2340] leading-snug mb-4">
            Clareza é o começo<br />
            de qualquer <span className="text-[#D4AF37]">justiça.</span>
          </h2>
          <p className="text-[14px] text-[#6b7280] font-light leading-relaxed mb-8">
            Sem medo, sem juridiquês, sem enrolação.<br />
            Entenda seus direitos e saiba o que fazer — agora.
          </p>
          <Link
            href="/enviar"
            className="inline-block bg-[#1a2340] text-white text-[14px] font-medium px-9 py-4 rounded-full hover:bg-[#253056] transition-colors"
          >
            Começar gratuitamente
          </Link>
          <p className="text-[11px] text-[#bbb] mt-4 tracking-wide">Sem cartão · Sem cadastro obrigatório</p>
        </div>
      </section>

      {/* — FOOTER — */}
      <footer className="bg-[#1a2340]">
        <div className="max-w-5xl mx-auto px-8 py-7 flex items-center justify-between">
          <div>
            <div className="font-raleway font-bold text-[13px] tracking-[0.12em] text-[#A8D8F0]">CLARA LAW</div>
            <div className="text-[11px] text-[#A8D8F0]/35 mt-1 font-light">Inteligência para um mundo mais claro.</div>
          </div>
          <div className="flex gap-6">
            {["Como funciona", "Aprenda", "Fórum", "Privacidade"].map((l) => (
              <a key={l} href="#" className="text-[11px] text-[#A8D8F0]/40 hover:text-[#A8D8F0] transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
