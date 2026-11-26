"use client";

// Limpa a escolha de consentimento salva — o ConsentBanner volta a aparecer
// no próximo carregamento da página. Único jeito de "mudar de ideia" depois
// de já ter aceitado ou recusado analytics.

export function CookiePreferenceButton() {
  function limpar() {
    try {
      localStorage.removeItem("clara_consent_analytics");
    } catch {
      // nada a fazer — localStorage indisponível
    }
    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={limpar}
      style={{
        background: "transparent", border: "1px solid #C8C3BA", color: "#1a2340",
        fontSize: 13, fontWeight: 600, padding: "10px 18px", borderRadius: 40,
        cursor: "pointer",
      }}
    >
      Alterar minhas preferências de cookies
    </button>
  );
}
