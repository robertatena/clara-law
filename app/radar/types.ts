// Tipos do Radar do Consumidor — formato editorial semanal.
//
// Cada `EdicaoRadar` é uma publicação fechada da semana. Depois de
// publicada é IMUTÁVEL: correção vira nova edição, pra o histórico
// nunca perder rastro do que foi mostrado ao público naquele momento.
//
// O contrato aqui é também o formato que a API do Clara Radar precisa
// devolver na fase 2 (via `service.ts`).

export type Tendencia = "em_alta" | "crescendo" | "estavel";

/**
 * Contexto da variacaoPct — quando NÃO é "comparavel", o número
 * armazenado em variacaoPct é apenas compatibilidade estrutural
 * (tipicamente 0) e não deve ser exibido como percentual real.
 */
export type ContextoVariacao =
  | "comparavel"
  | "sem_base_anterior"
  | "primeira_ocorrencia";

export type StatusEdicao = "rascunho" | "publicado" | "arquivado";

export interface Noticia {
  titulo: string;
  veiculo: string;              // ex: "Folha de S.Paulo"
  url: string;                  // https:// obrigatório
  dataPublicacao: string;       // ISO
  resumoCurto: string;          // 1–2 frases próprias, não copiar deck
}

export interface TemaSemanal {
  slug: string;                 // ex: "cobranca-indevida"
  titulo: string;               // ex: "Cobrança indevida"
  chapeu: string;               // ex: "ganhou força nesta semana"
  relatos: number;
  variacaoPct: number;          // pode ser 0 ou negativo
  tendencia: Tendencia;
  textoEditorial: string;       // 1–2 parágrafos (200–600 chars)
  padroes: string[];            // 3–4 bullets, texto pronto e agregado
  noticiaRelacionada?: Noticia; // opcional — só se realmente relevante
  contexto_variacao?: ContextoVariacao;
}

export interface OutroTema {
  titulo: string;
  relatos: number;
  variacaoPct: number;
  contexto_variacao?: ContextoVariacao;
}

export interface EdicaoRadar {
  id: string;                   // ex: "2026-w33"
  slug: string;                 // ex: "2026/08/semana-33" — URL histórica
  ano: number;
  numeroSemana: number;
  periodoInicio: string;        // ISO date (segunda-feira)
  periodoFim: string;           // ISO date (domingo)
  publicadoEm: string | null;   // ISO datetime, null enquanto rascunho
  status: StatusEdicao;

  // Sinalização de origem/veracidade — a UI usa isso pra decidir se
  // mostra ou não o banner de "Prévia demonstrativa".
  fonteDados: "clara_radar" | "mock";
  isDemoData: boolean;

  resumoSemana: string;         // 2–3 frases: o fio condutor da semana
  temas: TemaSemanal[];         // 3–5, ordenados por relevância
  outrosTemas?: OutroTema[];    // opcional, até ~6 menções curtas
}

/** Item mínimo pra listagem de edições anteriores. */
export interface EdicaoResumo {
  id: string;
  slug: string;
  ano: number;
  numeroSemana: number;
  periodoInicio: string;
  periodoFim: string;
  publicadoEm: string | null;
}
