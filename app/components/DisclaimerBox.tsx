// Micro-disclaimers reutilizáveis pra deixar claro perto de pontos de
// decisão (CTAs, exemplos ilustrativos) que a Clara é educacional, não
// substitui advogado, e resultados variam. Complemento (não substituto) do
// disclaimer longo que fica no footer de cada página.
//
// Variantes:
//   "curto": nota de 1 linha perto de CTAs principais
//   "exemplos": nota de 1 linha antes de blocos de exemplos ilustrativos

type Variant = "curto" | "exemplos";

const TEXTO: Record<Variant, string> = {
  curto:
    "Plataforma educacional — orienta com base no CDC, não substitui advogado.",
  exemplos:
    "Situações ilustrativas, sem relação com casos reais. Cada caso é único e não há garantia de resultado.",
};

export function DisclaimerBox({
  variant,
  style,
}: {
  variant: Variant;
  style?: React.CSSProperties;
}) {
  return (
    <p
      style={{
        fontSize: 12,
        color: "#9ca3af",
        textAlign: "center",
        lineHeight: 1.6,
        margin: 0,
        fontStyle: "italic",
        ...style,
      }}
    >
      {TEXTO[variant]}
    </p>
  );
}
