// Inicialização do PostHog — roda no escopo do módulo (não num useEffect).
//
// Bug real encontrado: app/page.tsx disparava landing_view num useEffect no
// mount do Home, que é FILHO de AnalyticsProvider na árvore. Effects de
// componente filho rodam antes dos do pai no React, então landing_view
// tentava capturar ANTES do PostHog ter sido inicializado/ter restaurado o
// opt-in — sempre descartado, mesmo pra quem já tinha consentido numa visita
// anterior. Rodar a inicialização aqui, no carregamento do módulo (que
// acontece antes de qualquer commit/efeito do React), elimina essa corrida.
import posthog from "posthog-js";
import { capturarUtmDaUrl } from "./utm";

let inicializado = false;

export function initAnalytics(): void {
  if (inicializado) return;
  if (typeof window === "undefined") return;
  inicializado = true;

  capturarUtmDaUrl();

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;

  posthog.init(key, {
    api_host: host,
    persistence: "localStorage",
    autocapture: false,
    capture_pageview: false,
    opt_out_capturing_by_default: true,
  });

  try {
    if (localStorage.getItem("clara_consent_analytics") === "granted") {
      posthog.opt_in_capturing();
    }
  } catch {
    // localStorage indisponível — segue sem opt-in
  }
}

initAnalytics();
