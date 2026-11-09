// Máscara de moeda BRL estilo "centavos": cada dígito digitado empurra da
// direita, os 2 últimos dígitos são sempre os centavos (ex.: digitar "30000"
// resulta em "300,00"). Recebe o valor bruto do input (com ou sem formatação
// prévia) e devolve só a parte numérica formatada, sem o prefixo "R$ ".
export function maskBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const comCentavos = digits.padStart(3, "0");
  const reais = comCentavos.slice(0, -2).replace(/^0+(?=\d)/, "");
  const centavos = comCentavos.slice(-2);
  const reaisFormatado = reais.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${reaisFormatado},${centavos}`;
}
