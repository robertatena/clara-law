"use client";

// Inicializa o PostHog uma única vez (sem autocapture/pageview — só os
// eventos nomeados do funil, disparados via lib/analytics/track.ts) e
// renderiza o banner de consentimento. Sem NEXT_PUBLIC_POSTHOG_KEY/HOST
// configurados, segue sem rastrear nada (posthog.init nunca é chamado).

import { useEffect } from "react";
import posthog from "posthog-js";
import { capturarUtmDaUrl } from "@/lib/analytics/utm";
import { ConsentBanner } from "@/app/components/ConsentBanner";

let inicializado = false;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    capturarUtmDaUrl();

    if (inicializado) return;
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || !host) return;
    inicializado = true;

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
  }, []);

  return (
    <>
      {children}
      <ConsentBanner />
    </>
  );
}
