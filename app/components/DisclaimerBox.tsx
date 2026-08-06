// Micro-disclaimers reutilizáveis pra deixar claro perto de pontos de
// decisão (CTAs, depoimentos) que a Clara é educacional, não substitui
// advogado, e resultados variam. Complemento (não substituto) do
// disclaimer longo que fica no footer de cada página.
//
// Variantes:
//   "curto": nota de 1 linha perto de CTAs principais
//   "depoimentos": nota de 1 linha antes de blocos de depoimento/resultado

type Variant = "curto" | "depoimentos";

const TEXTO: Record<Variant, string> = {
  curto:
    "Plataforma educacional — orienta com base no CDC, não substitui advogado.",
  depoimentos:
    "Cada caso é único. Os relatos abaixo são experiências pessoais, não garantia de resultado.",
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
