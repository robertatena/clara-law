// Box de metodologia — accordion nativo com <details>.
// Zero JavaScript, funciona com leitor de tela e sem JS ativo.

const ITENS = [
  "Análise de relatos públicos disponíveis na internet.",
  "Agrupamento automático por tipo de problema.",
  "Identificação de frequência e tendências ao longo do tempo.",
  "Dados apresentados de maneira agregada — sem expor autores ou postagens individuais.",
  "Os números refletem o volume observado nas fontes analisadas e não representam necessariamente todo o mercado brasileiro.",
];

export function MetodologiaBox() {
  return (
    <details
      style={{
        background: "#fff",
        border: "1px solid #E0DDD6",
        borderRadius: 14,
        padding: "20px 24px",
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <summary
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "#1a2340",
          cursor: "pointer",
          listStyle: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        Como funciona o Radar do Consumidor
        <span
          aria-hidden="true"
          style={{
            fontSize: 22,
            color: "#D4AF37",
            fontWeight: 300,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          +
        </span>
      </summary>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #F0EDE8" }}>
        <ul style={{ display: "flex", flexDirection: "column", gap: 10, margin: 0, padding: 0, listStyle: "none" }}>
          {ITENS.map((item) => (
            <li
              key={item}
              style={{
                fontSize: 13,
                color: "#4b5563",
                lineHeight: 1.7,
                paddingLeft: 16,
                position: "relative",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: 0,
                  top: 8,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "#D4AF37",
                }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
