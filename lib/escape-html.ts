// Escape de HTML único — usar em QUALQUER valor vindo do usuário (ou
// derivado dele) antes de interpolar em um template HTML de e-mail.
export function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
