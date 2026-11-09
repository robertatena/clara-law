// "Outros temas observados" — menções compactas dos temas menores.
// Não têm CTA nem texto editorial próprio, só sinalizam presença
// no radar da semana.

import type { OutroTema } from "../types";

export function OutrosTemasLista({ temas }: { temas: OutroTema[] }) {
  if (temas.length === 0) return null;

  return (
    <section
      style={{
        background: "#F8F7F4",
        borderTop: "1px solid #ECEAE4",
        borderBottom: "1px solid #ECEAE4",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            color: "#D4AF37",
            textTransform: "uppercase",
            marginBottom: 20,
            textAlign: "center",
          }}
        >
          outros temas observados
        </p>

        <ul
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "center",
            margin: 0,
            padding: 0,
            listStyle: "none",
          }}
        >
          {temas.map((t) => {
            const delta =
              t.variacaoPct > 0 ? " · +" + t.variacaoPct + "%" :
              t.variacaoPct < 0 ? " · " + t.variacaoPct + "%" :
              "";
            return (
              <li
                key={t.titulo}
                style={{
                  background: "#fff",
                  border: "1px solid #E0DDD6",
                  borderRadius: 24,
                  padding: "8px 16px",
                  fontSize: 13,
                  color: "#4b5563",
                }}
              >
                <span style={{ fontWeight: 600, color: "#1a2340" }}>{t.titulo}</span>
                <span style={{ color: "#9ca3af" }}>
                  {" · "}
                  {t.relatos} relatos
                  {delta}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
