"use client";

// A inicialização em si (posthog.init + captura de UTM + restaurar opt-in)
// roda em lib/analytics/init.ts, no carregamento do módulo — não aqui num
// useEffect (ver comentário lá: evita a corrida em que o landing_view de um
// componente filho disparava antes do PostHog existir). Este componente só
// renderiza o banner de consentimento.

import "@/lib/analytics/init";
import { ConsentBanner } from "@/app/components/ConsentBanner";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ConsentBanner />
    </>
  );
}
