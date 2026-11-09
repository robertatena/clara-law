// Banner PREVIEW / JÁ PUBLICADA — só aparece no ambiente admin.
// NÃO faz parte do `conteudo` gravado em radar_edicoes.conteudo.
// Fica FIXED no topo, z-index alto pra sobrepor a nav do EdicaoView.
// A nav do EdicaoView continua visível abaixo do banner (44px de altura).

export function BannerPreview({ status }: { status: "rascunho" | "publicado" }) {
  const isRascunho = status === "rascunho";
  const label = isRascunho
    ? "🚧 PREVIEW · rascunho — ainda não publicado"
    : "✅ JÁ PUBLICADA · essa edição já está no ar";
  const bg = isRascunho ? "#FEF3C7" : "#F0FDF9";
  const border = isRascunho ? "#FCD34D" : "#6EE7B7";
  const color = isRascunho ? "#92400e" : "#065f46";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: bg,
        borderBottom: "2px solid " + border,
        padding: "10px 24px",
        textAlign: "center",
        fontSize: 13,
        fontWeight: 600,
        color,
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {label}
    </div>
  );
}
