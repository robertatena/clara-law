// Formata período semanal em português por extenso.
// Ex: "2026-08-10", "2026-08-16"  →  "10 a 16 de agosto de 2026"
//     "2026-08-29", "2026-09-04"  →  "29 de agosto a 4 de setembro de 2026"

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function parseISO(isoDate: string): { d: number; m: number; y: number } {
  // Aceita "2026-08-10" ou ISO datetime.
  const [ymd] = isoDate.split("T");
  const [y, m, d] = ymd.split("-").map(Number);
  return { d, m, y };
}

export function formatarPeriodo(inicioISO: string, fimISO: string): string {
  const a = parseISO(inicioISO);
  const b = parseISO(fimISO);

  if (a.m === b.m && a.y === b.y) {
    return `${a.d} a ${b.d} de ${MESES[a.m - 1]} de ${a.y}`;
  }

  if (a.y === b.y) {
    return `${a.d} de ${MESES[a.m - 1]} a ${b.d} de ${MESES[b.m - 1]} de ${a.y}`;
  }

  return `${a.d} de ${MESES[a.m - 1]} de ${a.y} a ${b.d} de ${MESES[b.m - 1]} de ${b.y}`;
}
