// Indicador visual da tendência de uma categoria.
// Monocromático dourado (padrão da marca) — sem semáforo colorido,
// pra evitar leitura de "alarme".

import type { Tendencia } from "../types";

const CONFIG: Record<Tendencia, { icon: string; label: string; color: string }> = {
  em_alta:   { icon: "🔥", label: "Em alta",   color: "#D4AF37" },
  crescendo: { icon: "↗",  label: "Crescendo", color: "#D4AF37" },
  estavel:   { icon: "→",  label: "Estável",   color: "#9ca3af" },
};

export function TendenciaIndicador({ tendencia }: { tendencia: Tendencia }) {
  const cfg = CONFIG[tendencia];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: cfg.color,
        lineHeight: 1,
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, lineHeight: 1 }}>
        {cfg.icon}
      </span>
      {cfg.label}
    </span>
  );
}
