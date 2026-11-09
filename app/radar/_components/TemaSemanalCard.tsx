// Bloco editorial de um tema da semana.
// Layout: número + chapéu + título + métricas + parágrafo(s) editorial(is)
// + principais situações + notícia relacionada (se houver).
//
// SEM CTA local — o CTA é global no fim da edição, pra não poluir o corpo.

import type { TemaSemanal } from "../types";
import { TendenciaIndicador } from "./TendenciaIndicador";
import { NoticiaBox } from "./NoticiaBox";

export function TemaSemanalCard({
  tema,
  posicao,
}: {
  tema: TemaSemanal;
  posicao: number;
}) {
  const {
    titulo, chapeu, relatos, variacaoPct, tendencia,
    textoEditorial, padroes, noticiaRelacionada, contexto_variacao,
  } = tema;

  // Só mostramos "% vs. semana anterior" quando temos base comparável.
  // Em "sem_base_anterior" e "primeira_ocorrencia" o variacaoPct guardado
  // é 0 apenas por compatibilidade — não representa "estável".
  const isComparavel = !contexto_variacao || contexto_variacao === "comparavel";
  const isPrimeira = contexto_variacao === "primeira_ocorrencia";

  const deltaLabel =
    !isComparavel ? null :
    variacaoPct > 0 ? "+" + variacaoPct + "%" :
    variacaoPct < 0 ? variacaoPct + "%" :
    null;

  return (
    <article style={{ marginBottom: 56 }}>
      {/* Cabeçalho: número editorial + tendência */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
          <span
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 800,
              fontSize: 24,
              color: "#D4AF37",
              lineHeight: 1,
            }}
          >
            {posicao}.
          </span>
          <span style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic" }}>
            {chapeu}
          </span>
        </div>
        {/* TendenciaIndicador só faz sentido quando temos base comparável.
            Em contexto=primeira_ocorrencia ou sem_base_anterior, variacaoPct=0
            é apenas compatibilidade estrutural — mostrar "→ Estável" seria
            enganoso. */}
        {isComparavel && <TendenciaIndicador tendencia={tendencia} />}
      </div>

      {/* Título do tema */}
      <h2
        style={{
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 700,
          fontSize: "clamp(24px, 3vw, 32px)",
          color: "#1a2340",
          lineHeight: 1.2,
          margin: "0 0 12px",
          letterSpacing: "-0.015em",
        }}
      >
        {titulo}
      </h2>

      {/* Métrica de destaque */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 24,
          paddingBottom: 20,
          borderBottom: "1px solid #E0DDD6",
        }}
      >
        <span
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: "#1a2340",
            lineHeight: 1,
          }}
        >
          {relatos}
        </span>
        <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
          relatos
        </span>
        {deltaLabel && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: variacaoPct > 0 ? "#065f46" : "#6b7280",
              background: variacaoPct > 0 ? "#F0FDF9" : "#F0EDE8",
              border: "1px solid " + (variacaoPct > 0 ? "#6EE7B7" : "#E0DDD6"),
              padding: "3px 10px",
              borderRadius: 20,
              whiteSpace: "nowrap",
            }}
          >
            {deltaLabel} vs. semana anterior
          </span>
        )}
        {/* Chip NOVO: só pra primeira_ocorrencia.
            Visual NEUTRO (bege/dourado/azul-marinho) — não verde, porque
            "novo" é informativo, não positivo.
            Em sem_base_anterior: silêncio total (nem chip nem —). */}
        {isPrimeira && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#1a2340",
              background: "#F8F7F4",
              border: "1px solid #D4AF37",
              padding: "3px 10px",
              borderRadius: 20,
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}
          >
            NOVO
          </span>
        )}
      </div>

      {/* Texto editorial — protagonista */}
      <p
        style={{
          fontSize: 16,
          color: "#374151",
          lineHeight: 1.8,
          margin: "0 0 28px",
          fontFamily: "'Raleway', sans-serif",
          fontWeight: 400,
        }}
      >
        {textoEditorial}
      </p>

      {/* Principais situações */}
      {padroes.length > 0 && (
        <div style={{ marginBottom: noticiaRelacionada ? 24 : 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#9ca3af",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Principais situações
          </div>
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {padroes.map((p) => (
              <li
                key={p}
                style={{
                  fontSize: 14,
                  color: "#4b5563",
                  lineHeight: 1.6,
                  paddingLeft: 18,
                  position: "relative",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 9,
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#D4AF37",
                  }}
                />
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Notícia relacionada (opcional) */}
      {noticiaRelacionada && <NoticiaBox noticia={noticiaRelacionada} />}
    </article>
  );
}
