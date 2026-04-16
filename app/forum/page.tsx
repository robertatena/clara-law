"use client";

import Link from "next/link";
import { ForumBuscador } from "@/components/ForumBuscador";

const ClaraIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

const documentos = [
  { icon: "🪪", nome: "RG ou CNH", detalhe: "Documento de identidade com foto. Original e uma cópia.", obrigatorio: true },
  { icon: "📄", nome: "CPF", detalhe: "Pode estar no próprio RG ou CNH. Se não, leve separado.", obrigatorio: true },
  { icon: "🏠", nome: "Comprovante de residência", detalhe: "Conta de luz, água ou telefone. Original e cópia. Máximo 90 dias.", obrigatorio: true },
  { icon: "📋", nome: "Formulário de reclamação", detalhe: "O próprio fórum fornece, mas você pode levar preenchido. A Clara gera o seu.", obrigatorio: true },
  { icon: "🧾", nome: "Nota fiscal ou comprovante de compra", detalhe: "Qualquer prova da relação com a empresa: recibo, pedido, boleto.", obrigatorio: false },
  { icon: "💬", nome: "Prints de conversa ou e-mails", detalhe: "Tentativas de resolver antes. Quanto mais provas, melhor.", obrigatorio: false },
  { icon: "📸", nome: "Fotos do problema", detalhe: "Se for produto com defeito, foto do defeito. Imprime ou mostra pelo celular.", obrigatorio: false },
  { icon: "📧", nome: "E-mail de notificação enviado", detalhe: "Se você já tentou resolver por e-mail, leve a cópia. Mostra boa-fé.", obrigatorio: false },
];

const etapas = [
  { n: "1", titulo: "Você chega ao fórum", desc: "Vá ao balcão de triagem do Juizado Especial Cível (JEC). Diga que quer registrar uma reclamação. O atendente vai orientar." },
  { n: "2", titulo: "Você conta o que aconteceu", desc: "Em linguagem simples, você explica o problema. O atendente pode ajudar a preencher o formulário se precisar." },
  { n: "3", titulo: "Protocolo da ação", desc: "A ação é registrada. Você recebe um número de processo. A empresa é notificada pelo próprio fórum." },
  { n: "4", titulo: "Audiência de conciliação", desc: "Um conciliador reúne você e a empresa para tentar um acordo. A maioria dos casos termina aqui — em 2 a 6 meses." },
  { n: "5", titulo: "Se não houver acordo", desc: "O juiz decide. A sentença é emitida e a empresa é obrigada a cumprir. Nessa fase, para causas acima de R$28 mil, você precisará de advogado." },
];

export default function ForumPage() {
  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ECE9E2", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <ClaraIcon size={30} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/#aprenda" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }} className="hidden md:inline">Aprenda</Link>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 600, padding: "9px 20px", borderRadius: 24, textDecoration: "none" }}>
              Analisar meu caso →
            </Link>
          </div>
        </div>
      </nav>

      {/* AVISO */}
      <div style={{ background: "#FBF8EF", borderBottom: "1px solid #EAD98A", padding: "10px 24px", textAlign: "center" }}>
        <span style={{ fontSize: 12, color: "#92700A" }}>
          ⚠️ <strong style={{ fontWeight: 600 }}>A Clara não é um escritório de advocacia.</strong>
          {" "}As informações são orientativas e não substituem a consulta com um advogado.
        </span>
      </div>

      {/* HERO + BUSCADOR */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECE9E2", padding: "60px 24px 52px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>módulo fórum</p>
          <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(28px, 4vw, 40px)", color: "#1a2340", lineHeight: 1.2, marginBottom: 14 }}>
            Encontre o fórum certo<br />e saiba o que fazer.
          </h1>
          <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.75, marginBottom: 36, maxWidth: 520 }}>
            Digite o CEP da empresa ou pessoa que causou o problema. A Clara encontra o fórum competente, o e-mail do cartório e o que você precisa levar.
          </p>
          <ForumBuscador />
        </div>
      </section>

      {/* TENTE ANTES O E-MAIL */}
      <section style={{ background: "#1a2340", padding: "36px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>antes de ir ao fórum</p>
            <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 20, color: "#fff", lineHeight: 1.3, marginBottom: 8 }}>
              Já tentou resolver por e-mail?
            </h2>
            <p style={{ fontSize: 14, color: "rgba(168,216,240,0.7)", lineHeight: 1.7, maxWidth: 440 }}>
              Muitos casos se resolvem sem precisar ir ao fórum. Um e-mail bem escrito, com a lei certa, faz a empresa agir em horas. A Clara gera esse e-mail pra você — de graça.
            </p>
          </div>
          <Link href="/enviar" style={{ background: "#fff", color: "#1a2340", fontSize: 13, fontWeight: 600, padding: "13px 26px", borderRadius: 32, textDecoration: "none", flexShrink: 0 }}>
            ✉️ Gerar e-mail de notificação
          </Link>
        </div>
      </section>

      {/* O QUE LEVAR */}
      <section style={{ background: "#F8F7F4", borderBottom: "1px solid #ECE9E2", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>documentos necessários</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: "#1a2340", marginBottom: 8 }}>
            O que levar no dia do fórum
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>
            Itens obrigatórios garantem que sua ação seja protocolada. Os opcionais fortalecem muito o seu caso.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12, marginBottom: 28 }}>
            {documentos.map((doc, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{doc.icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a2340" }}>{doc.nome}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 9px", borderRadius: 20, fontWeight: 500,
                      background: doc.obrigatorio ? "#FEF3C7" : "#F0F9FF",
                      color: doc.obrigatorio ? "#92400E" : "#185FA5",
                      border: `1px solid ${doc.obrigatorio ? "#fcd34d" : "#bae6fd"}`,
                    }}>
                      {doc.obrigatorio ? "obrigatório" : "recomendado"}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{doc.detalhe}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#1a2340", borderRadius: 16, padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>formulário JEC</p>
              <h3 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 8, lineHeight: 1.3 }}>
                A Clara preenche o formulário por você
              </h3>
              <p style={{ fontSize: 14, color: "rgba(168,216,240,0.7)", lineHeight: 1.65, maxWidth: 400 }}>
                Você conta o que aconteceu e a Clara gera a petição no formato aceito pelo Juizado Especial.
              </p>
            </div>
            <Link href="/enviar" style={{ background: "#fff", color: "#1a2340", fontSize: 13, fontWeight: 600, padding: "12px 22px", borderRadius: 28, textDecoration: "none", flexShrink: 0 }}>
              Gerar minha petição →
            </Link>
          </div>
        </div>
      </section>

      {/* PASSO A PASSO */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECE9E2", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>o que esperar</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: "#1a2340", marginBottom: 8 }}>
            Como funciona o dia no fórum
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
            Sem surpresas. Veja o que acontece desde a chegada até a resolução do caso.
          </p>

          <div style={{ maxWidth: 560 }}>
            {etapas.map((e, i) => (
              <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start", position: "relative" }}>
                {i < etapas.length - 1 && (
                  <div style={{ position: "absolute", left: 15, top: 32, width: 1, height: "calc(100% + 0px)", background: "#E8E4DA" }} />
                )}
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "1.5px solid #D4AF37", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#D4AF37", flexShrink: 0, zIndex: 1, position: "relative" }}>
                  {e.n}
                </div>
                <div style={{ paddingBottom: 28 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2340", marginBottom: 6 }}>{e.titulo}</div>
                  <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DICAS */}
      <section style={{ background: "#F8F7F4", borderBottom: "1px solid #ECE9E2", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>dicas importantes</p>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 28px)", color: "#1a2340", marginBottom: 28 }}>
            Antes de ir — leia isso.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {[
              { icon: "⏰", titulo: "Chegue cedo", desc: "O atendimento costuma ser por ordem de chegada. Vá de manhã, preferencialmente no início do expediente." },
              { icon: "📱", titulo: "Leve o celular carregado", desc: "Você pode precisar mostrar prints, e-mails ou fotos. Baixe os documentos antes, por segurança." },
              { icon: "🔧", titulo: "Seja objetivo", desc: "Na triagem e na audiência, fale de forma clara e cronológica: o que aconteceu, quando, e o que você quer." },
              { icon: "💡", titulo: "Saiba o que você quer pedir", desc: "Você precisa informar o valor da causa. Some o dano material + um valor para dano moral, se houver." },
              { icon: "📧", titulo: "Mostre que tentou resolver antes", desc: "Levar o e-mail de notificação enviado mostra boa-fé e pode acelerar o acordo." },
              { icon: "🎁", titulo: "É de graça até o final", desc: "Você não paga nada até a sentença. Só paga custas se recorrer e perder." },
            ].map((d, i) => (
              <div key={i} style={{ background: "#fff", border: "1px solid #E8E4DA", borderRadius: 14, padding: "18px 18px" }}>
                <span style={{ fontSize: 22, display: "block", marginBottom: 10 }}>{d.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2340", marginBottom: 6 }}>{d.titulo}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.65 }}>{d.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ background: "#fff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: "#1a2340", lineHeight: 1.25, marginBottom: 14 }}>
            Pronto para agir?
          </h2>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>
            Comece pelo e-mail — é mais rápido e resolve a maioria dos casos.<br />
            Se não resolver, a Clara te leva pelo fórum passo a passo.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 14, fontWeight: 700, padding: "14px 28px", borderRadius: 32, textDecoration: "none" }}>
              ✉️ Gerar meu e-mail agora
            </Link>
            <Link href="/enviar" style={{ border: "1.5px solid #C8C3BA", color: "#1a2340", fontSize: 14, padding: "13px 24px", borderRadius: 32, textDecoration: "none" }}>
              📋 Gerar minha petição JEC
            </Link>
          </div>
          <p style={{ fontSize: 12, color: "#bbb", marginTop: 16 }}>Sem cartão · Sem cadastro obrigatório</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#1a2340", padding: "24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: "0.12em", color: "#A8D8F0" }}>CLARA LAW</div>
            <div style={{ fontSize: 11, color: "rgba(168,216,240,0.35)", marginTop: 3 }}>Inteligência para um mundo mais claro.</div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {([["/" , "Início"], ["/forum", "Fórum"], ["/enviar", "Analisar caso"]] as [string, string][]).map(([href, label]) => (
              <Link key={label} href={href} style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
