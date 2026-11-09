// Estado "sem edição disponível" — só é alcançado em produção
// (IS_DEMO_MODE=false), quando o Supabase falha ou ainda não há
// edição publicada. Nunca substituímos por dado fictício.

import Link from "next/link";
import { NavRadar } from "./NavRadar";

export function EdicaoIndisponivel() {
  return (
    <main
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: "#F8F7F4",
        minHeight: "100vh",
        paddingTop: 64,
      }}
    >
      <NavRadar />

      <section style={{ padding: "120px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }} aria-hidden="true">📡</div>
          <h1
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(24px, 3vw, 32px)",
              color: "#1a2340",
              lineHeight: 1.2,
              marginBottom: 14,
            }}
          >
            Nova edição em preparação
          </h1>
          <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.7, marginBottom: 32 }}>
            Estamos consolidando os dados desta semana. Volte em instantes —
            ou entre em contato com a Clara enquanto isso.
          </p>
          <Link
            href="/enviar"
            style={{
              background: "#1a2340",
              color: "#fff",
              fontSize: 15,
              fontWeight: 700,
              padding: "16px 32px",
              borderRadius: 40,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Reivindicar meus direitos
          </Link>
        </div>
      </section>
    </main>
  );
}
