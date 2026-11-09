// ─────────────────────────────────────────────────────────────
//  Fonte única de dados do Radar do Consumidor.
// ─────────────────────────────────────────────────────────────
//
//  Etapa 1.5 (atual): as três funções abaixo delegam ao repositório
//  Supabase (`lib/radar/repo.ts`), que reutiliza o client anon já
//  existente em `lib/supabase.ts`. Zero env var nova, zero cliente
//  paralelo.
//
//  Regra crítica — nunca cair silenciosamente em MOCK:
//   - Se o Supabase falha ou não há edição publicada → repo retorna
//     `null` / `[]`.
//   - A página então renderiza `<EdicaoIndisponivel />` ("Nova edição
//     em preparação"). Não substituímos dado real por dado fictício.
//
//  O aviso "Prévia demonstrativa" continua saindo quando o próprio
//  dado do banco carrega `isDemoData=true` no `conteudo` (garantido
//  no schema pela constraint `mock_deve_ser_demo`).
//
//  O `mock.ts` permanece no repositório apenas como referência de
//  contrato de dados — nunca é importado ou consultado em runtime.
//
// ─────────────────────────────────────────────────────────────

import type { EdicaoRadar, EdicaoResumo } from "../types";
import {
  buscarEdicaoMaisRecente,
  buscarEdicaoPorSlug,
  listarEdicoesPublicadas as listarPubRepo,
} from "@/lib/radar/repo";

/** Edição servida em `/radar`. */
export async function getEdicaoAtual(): Promise<EdicaoRadar | null> {
  return buscarEdicaoMaisRecente();
}

/** Edição servida em `/radar/[ano]/[mes]/[semana]`. */
export async function getEdicaoPorSlug(slug: string): Promise<EdicaoRadar | null> {
  return buscarEdicaoPorSlug(slug);
}

/**
 * Todas as edições publicadas — usado por `generateStaticParams` e
 * pela listagem de "edições anteriores" no rodapé.
 */
export async function listarEdicoesPublicadas(): Promise<EdicaoResumo[]> {
  return listarPubRepo();
}
