// Aviso "confira também sua caixa de spam" — mesma cópia e paleta do
// bloco equivalente no e-mail de confirmação (lib/checkout-fulfillment.ts).
// Colocado em /sucesso e /minha-conta pra quem não abre e-mail na hora.
//
// Ícone SVG inline (não usa /icons/inbox.svg servido) — evita 1 HTTP extra
// e garante que a cor bata com o tema mesmo se o arquivo mudar.

export function SpamAvisoBox({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#F8F7F4",
        border: "1px solid #E0DDD6",
        borderRadius: 10,
        padding: "12px 16px",
        ...style,
      }}
    >
      <p style={{ color: "#6b7280", fontSize: 12, lineHeight: 1.65, margin: 0, display: "flex", alignItems: "flex-start", gap: 8 }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#6b7280"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginTop: 2 }}
          aria-hidden="true"
        >
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </svg>
        <span>
          <strong style={{ color: "#374151" }}>Não encontrou algum e-mail nosso?</strong>{" "}
          Confira também sua caixa de <strong>spam</strong> ou <strong>lixo eletrônico</strong> —
          às vezes o primeiro contato cai lá.
        </span>
      </p>
    </div>
  );
}
