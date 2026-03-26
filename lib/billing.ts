export const PRICE_PER_ANALYSIS_CENTS = 500; // R$ 5,00
export const CURRENCY = "brl";

export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3470").replace(/\/$/, "");
}
