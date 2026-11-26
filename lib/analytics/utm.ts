// Captura de UTM na primeira visita (first-touch). Guardado no localStorage
// (não cookie) e anexado a todo evento de analytics via lib/analytics/track.ts.
// Nunca sobrescreve um UTM já salvo — sessões depois do primeiro clique num
// anúncio não devem "roubar" a atribuição original.

const CHAVE = "clara_utm";

export type Utm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

export function capturarUtmDaUrl(): void {
  try {
    if (localStorage.getItem(CHAVE)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Utm = {};
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const campaign = params.get("utm_campaign");
    if (source) utm.utm_source = source;
    if (medium) utm.utm_medium = medium;
    if (campaign) utm.utm_campaign = campaign;
    if (Object.keys(utm).length > 0) {
      localStorage.setItem(CHAVE, JSON.stringify(utm));
    }
  } catch {
    // localStorage indisponível (modo privado, bloqueio) — segue sem UTM
  }
}

export function lerUtm(): Utm {
  try {
    const raw = localStorage.getItem(CHAVE);
    if (!raw) return {};
    return JSON.parse(raw) as Utm;
  } catch {
    return {};
  }
}
