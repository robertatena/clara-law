import Link from "next/link";

const ClaraIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

type Secao = {
  titulo: string;
  paragrafos?: string[];
  itens?: string[];
};

const secoes: Secao[] = [
  {
    titulo: "1. Quem somos",
    paragrafos: [
      "A Clara Law é uma plataforma educacional de tecnologia que ajuda consumidores brasileiros a entender e exercer seus direitos.",
    ],
  },
  {
    titulo: "2. Dados que coletamos",
    itens: [
      "E-mail — para envio dos documentos e acesso à área logada.",
      "Dados do caso (situação, empresa, valores informados) — usados apenas para gerar os documentos.",
      "Dados de pagamento — processados pelo Stripe, não armazenados pela Clara Law.",
    ],
  },
  {
    titulo: "3. Como usamos seus dados",
    itens: [
      "Gerar e enviar os documentos contratados.",
      "Permitir acesso à área logada.",
      "Enviar confirmações de compra.",
      "Nunca vendemos ou compartilhamos dados com terceiros para fins comerciais.",
    ],
  },
  {
    titulo: "4. Seus direitos (LGPD)",
    itens: [
      "Acessar, corrigir ou excluir seus dados a qualquer momento.",
      "Solicitar por: contato@claralaw.com.br",
    ],
  },
  {
    titulo: "5. Contato",
    paragrafos: [
      "Dúvidas ou solicitações sobre seus dados: contato@claralaw.com.br",
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh", paddingTop: 64 }}>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(26,35,64,0.04)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Link href="/#como-funciona" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Como funciona</Link>
            <Link href="/#aprenda" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Aprenda</Link>
            <Link href="/minha-conta" className="hidden md:inline" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>Minha conta</Link>
            <Link href="/enviar" style={{ background: "#1a2340", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 22px", borderRadius: 40, textDecoration: "none" }}>
              Reivindicar meus direitos
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", padding: "72px 24px 48px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.14em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 12 }}>
            Clara Law
          </div>
          <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 800, fontSize: "clamp(32px, 4.6vw, 44px)", color: "#1a2340", lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 12 }}>
            Política de Privacidade
          </h1>
          <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
            Última atualização: julho de 2026
          </p>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section style={{ padding: "48px 24px 72px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
          {secoes.map((s) => (
            <div
              key={s.titulo}
              style={{
                background: "#fff",
                border: "1px solid #E0DDD6",
                borderRadius: 14,
                padding: "24px 24px",
                boxShadow: "0 6px 20px rgba(26,35,64,0.04)",
              }}
            >
              <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 20, color: "#1a2340", lineHeight: 1.3, marginBottom: 14 }}>
                {s.titulo}
              </h2>

              {s.paragrafos?.map((p, i) => (
                <p key={i} style={{ fontSize: 15, color: "#374151", lineHeight: 1.75, marginBottom: i < (s.paragrafos!.length - 1) ? 10 : 0 }}>
                  {p}
                </p>
              ))}

              {s.itens && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  {s.itens.map((it, i) => (
                    <li key={i} style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, paddingLeft: 22, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, top: 0, color: "#D4AF37", fontWeight: 700 }}>•</span>
                      {it}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", lineHeight: 1.7, marginTop: 8 }}>
            Dúvidas?{" "}
            <a href="mailto:contato@claralaw.com.br" style={{ color: "#185FA5", textDecoration: "none", fontWeight: 500 }}>
              contato@claralaw.com.br
            </a>
          </p>
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
            <Link href="/#como-funciona" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>Como funciona</Link>
            <Link href="/#aprenda" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>Aprenda</Link>
            <Link href="/privacidade" style={{ fontSize: 12, color: "rgba(168,216,240,0.4)", textDecoration: "none" }}>Privacidade</Link>
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "12px auto 0", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: 11, color: "rgba(168,216,240,0.25)", textAlign: "center", lineHeight: 1.7 }}>
            ⚠️ A Clara não é um escritório de advocacia. As análises são orientativas e não substituem a consulta com um advogado. Todos os documentos gerados são para uso pelo próprio usuário.
          </p>
        </div>
      </footer>
    </main>
  );
}
