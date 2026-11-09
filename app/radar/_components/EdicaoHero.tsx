// Hero editorial de uma edição semanal.
// Recebe a edição inteira. Prop `isHistorico` acrescenta um chip
// discreto sinalizando que aquela é uma edição arquivada (não a atual).

import type { EdicaoRadar } from "../types";
import { formatarPeriodo } from "../lib/formatarPeriodo";

export function EdicaoHero({
  edicao,
  isHistorico = false,
}: {
  edicao: EdicaoRadar;
  isHistorico?: boolean;
}) {
  const { numeroSemana, periodoInicio, periodoFim, resumoSemana } = edicao;

  return (
    <section
      style={{
        background: "#fff",
        borderBottom: "1px solid #ECEAE4",
        padding: "88px 24px 56px",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* Chip: Radar do Consumidor + (opcional) Arquivada */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#F0FDF9",
              border: "1px solid #6EE7B7",
              borderRadius: 40,
              padding: "6px 18px",
              fontSize: 12,
              color: "#065f46",
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            Radar do Consumidor
          </span>
          {isHistorico && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#F0EDE8",
                border: "1px solid #E0DDD6",
                borderRadius: 40,
                padding: "6px 14px",
                fontSize: 12,
                color: "#6b7280",
                fontWeight: 500,
              }}
            >
              Edição anterior
            </span>
          )}
        </div>

        {/* Título editorial */}
        <h1
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 48px)",
            lineHeight: 1.15,
            color: "#1a2340",
            marginBottom: 14,
            letterSpacing: "-0.02em",
            textAlign: "center",
          }}
        >
          Semana {numeroSemana}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: "#9ca3af",
            marginBottom: 28,
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          {formatarPeriodo(periodoInicio, periodoFim)}
        </p>

        {/* Sub-título editorial — contexto fixo da edição */}
        <p
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 600,
            fontSize: "clamp(17px, 2.2vw, 20px)",
            color: "#1a2340",
            lineHeight: 1.35,
            textAlign: "center",
            marginBottom: 22,
          }}
        >
          O que mais mobilizou consumidores nesta semana
        </p>

        {/* Resumo editorial da semana — sem itálico, corpo jornalístico */}
        <p
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: "clamp(16px, 2vw, 18px)",
            lineHeight: 1.75,
            color: "#374151",
            textAlign: "center",
            fontWeight: 400,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          {resumoSemana}
        </p>
      </div>
    </section>
  );
}
