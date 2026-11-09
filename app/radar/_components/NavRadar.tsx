// Nav minimal do Radar. Autocontida — não altera nem depende da
// navbar principal do site. Só logo (link pra home) + CTA.

import Link from "next/link";

const ClaraIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export function NavRadar() {
  return (
    <nav
      style={{
        background: "#fff",
        borderBottom: "1px solid #ECEAE4",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px rgba(26,35,64,0.04)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <ClaraIcon size={32} />
          <span
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "0.14em",
              color: "#A8D8F0",
            }}
          >
            CLARA LAW
          </span>
        </Link>
        <Link
          href="/enviar"
          style={{
            background: "#1a2340",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 22px",
            borderRadius: 40,
            textDecoration: "none",
          }}
        >
          Reivindicar meus direitos
        </Link>
      </div>
    </nav>
  );
}
