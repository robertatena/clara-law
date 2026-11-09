// Bloco "O que aconteceu nesta semana" — contexto de notícia real,
// SEMPRE secundário ao tema principal. Só renderiza se houver notícia
// que passou todos os filtros da fase 2 (URL válida, veículo identificado,
// relevância confirmada). Aqui na V1, é o mock direto.

import type { Noticia } from "../types";

const MESES_CURTOS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function formatarDataCurta(iso: string): string {
  const [ymd] = iso.split("T");
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MESES_CURTOS[m - 1]} ${y}`;
}

export function NoticiaBox({ noticia }: { noticia: Noticia }) {
  const { titulo, veiculo, url, dataPublicacao, resumoCurto } = noticia;

  return (
    <aside
      style={{
        background: "#F8F7F4",
        borderLeft: "3px solid #D4AF37",
        borderRadius: "0 12px 12px 0",
        padding: "20px 24px",
        marginTop: 8,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          color: "#92700a",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        O que aconteceu nesta semana
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2340", lineHeight: 1.4, marginBottom: 8 }}>
        {titulo}
      </div>

      <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.7, margin: "0 0 12px" }}>
        {resumoCurto}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>
          {veiculo}
        </span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>·</span>
        <span style={{ fontSize: 12, color: "#9ca3af" }}>
          {formatarDataCurta(dataPublicacao)}
        </span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "#185FA5",
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Ler na fonte →
        </a>
      </div>
    </aside>
  );
}
