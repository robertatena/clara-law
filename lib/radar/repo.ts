// Repositório de acesso à tabela public.radar_edicoes (Supabase).
//
// Reutiliza EXCLUSIVAMENTE o client anon existente em `lib/supabase.ts`.
// Não cria client próprio, não usa env var nova.
//
// Segurança em profundidade:
//   1. RLS no Supabase já bloqueia rascunhos pra anon/authenticated.
//   2. Todas as queries aqui filtram explicitamente `status='publicado'`
//      — protege mesmo se a RLS for desabilitada por engano no futuro.
//
// Contrato de retorno:
//   - Sucesso → EdicaoRadar (ou lista) do JSONB armazenado.
//   - Falha de rede/query, ou nenhum resultado → `null` / `[]`.
//     NUNCA retorna dado fictício de fallback: a página deve renderizar
//     estado de indisponibilidade em vez de mostrar mock silencioso.

import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { EdicaoRadar, EdicaoResumo } from "@/app/radar/types";
import type { RadarSemanaInput } from "./schema";

const TABLE = "radar_edicoes";

/** Última edição publicada — servida em `/radar`. */
export async function buscarEdicaoMaisRecente(): Promise<EdicaoRadar | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("conteudo")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("radar/repo: falha ao buscar edição mais recente", error);
    return null;
  }
  if (!data?.conteudo) return null;
  return data.conteudo as EdicaoRadar;
}

/** Edição publicada por slug — servida em `/radar/[ano]/[mes]/[semana]`. */
export async function buscarEdicaoPorSlug(slug: string): Promise<EdicaoRadar | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("conteudo")
    .eq("status", "publicado")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("radar/repo: falha ao buscar edição por slug", slug, error);
    return null;
  }
  if (!data?.conteudo) return null;
  return data.conteudo as EdicaoRadar;
}

/**
 * Todas as edições publicadas (mais recentes primeiro), sem o `conteudo`
 * completo — só o resumo mínimo pra listagem e `generateStaticParams`.
 */
export async function listarEdicoesPublicadas(): Promise<EdicaoResumo[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, slug, ano, numero_semana, periodo_inicio, periodo_fim, publicado_em")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false });

  if (error) {
    console.error("radar/repo: falha ao listar edições publicadas", error);
    return [];
  }
  if (!data) return [];

  // Mapeia snake_case (colunas) → camelCase (tipo EdicaoResumo)
  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    ano: row.ano,
    numeroSemana: row.numero_semana,
    periodoInicio: row.periodo_inicio,
    periodoFim: row.periodo_fim,
    publicadoEm: row.publicado_em,
  }));
}

// ═════════════════════════════════════════════════════════════
//  Etapa 2A.2 — Ingest do Clara Radar
// ═════════════════════════════════════════════════════════════
//  Escreve em `radar_relatos_semanais` via `supabaseAdmin`
//  (service_role, bypass RLS — obrigatório pois RLS bloqueia
//  anon/authenticated na tabela).

const RADAR_EDICOES = "radar_edicoes";
const RADAR_RELATOS = "radar_relatos_semanais";

/**
 * Deriva (ano, numeroSemana) ISO 8601 a partir de uma data YYYY-MM-DD.
 * Algoritmo padrão ISO — semana começa na segunda, semana 1 é a que
 * contém a primeira quinta do ano.
 */
export function isoWeekOf(dateISO: string): { ano: number; numeroSemana: number } {
  const d = new Date(dateISO + "T00:00:00Z");
  // Ajusta pra quinta-feira da semana (padrão ISO 8601)
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return { ano: d.getUTCFullYear(), numeroSemana: weekNo };
}

export type EstadoEdicao = "nada" | "rascunho" | "publicado";

/** Estado de `radar_edicoes` para uma dada semana — base pra decisão do ingest. */
export async function estadoEdicaoParaSemana(
  ano: number,
  numeroSemana: number,
): Promise<EstadoEdicao> {
  const { data, error } = await supabaseAdmin
    .from(RADAR_EDICOES)
    .select("status")
    .eq("ano", ano)
    .eq("numero_semana", numeroSemana)
    .maybeSingle();

  if (error) {
    throw new Error("radar/repo: estadoEdicaoParaSemana falhou: " + error.message);
  }
  if (!data) return "nada";
  if (data.status === "rascunho") return "rascunho";
  if (data.status === "publicado") return "publicado";
  return "nada";
}

export interface RelatosSemanaSalvo {
  id: string;
  revisao_n: number;
  atualizado_em: string;
}

/**
 * UPSERT em radar_relatos_semanais.
 *
 * O trigger `tg_radar_relatos_touch` cuida da semântica de revisao_n:
 *   - INSERT novo         → revisao_n = 1 (default da coluna)
 *   - UPDATE, entrada mudou → revisao_n += 1, atualizado_em = now()
 *   - UPDATE, entrada igual → no-op (idempotente pra retries de rede)
 *
 * O `entrada` JSONB carrega o RadarSemanaInput INTEIRO (já validado
 * pelo Zod strict no route handler antes de chegar aqui).
 */
export async function salvarRelatosSemanais(
  input: RadarSemanaInput,
): Promise<RelatosSemanaSalvo> {
  const { ano, numeroSemana } = isoWeekOf(input.periodoInicio);
  const id = `${ano}-w${numeroSemana}`;

  const { data, error } = await supabaseAdmin
    .from(RADAR_RELATOS)
    .upsert(
      {
        id,
        ano,
        numero_semana: numeroSemana,
        periodo_inicio: input.periodoInicio,
        periodo_fim: input.periodoFim,
        entrada: input,
      },
      { onConflict: "ano,numero_semana" },
    )
    .select("id, revisao_n, atualizado_em")
    .single();

  if (error) {
    throw new Error("radar/repo: salvarRelatosSemanais falhou: " + error.message);
  }
  return data as RelatosSemanaSalvo;
}

// ═════════════════════════════════════════════════════════════
//  Etapa 2B — geração editorial
// ═════════════════════════════════════════════════════════════

export interface RelatosSemanaConteudo {
  entrada: RadarSemanaInput;
  revisao_n: number;
  atualizado_em: string;
}

/** Busca dados agregados de uma semana pra alimentar a geração editorial. */
export async function buscarRelatosPorSemana(
  ano: number,
  numeroSemana: number,
): Promise<RelatosSemanaConteudo | null> {
  const { data, error } = await supabaseAdmin
    .from(RADAR_RELATOS)
    .select("entrada, revisao_n, atualizado_em")
    .eq("ano", ano)
    .eq("numero_semana", numeroSemana)
    .maybeSingle();

  if (error) {
    throw new Error("radar/repo: buscarRelatosPorSemana falhou: " + error.message);
  }
  if (!data) return null;
  return {
    entrada: data.entrada as RadarSemanaInput,
    revisao_n: data.revisao_n,
    atualizado_em: data.atualizado_em,
  };
}

export interface RascunhoSalvo {
  id: string;
  criado_em: string;
  atualizado_em: string;
  input_revisao_n: number;
}

/**
 * UPSERT do rascunho editorial em radar_edicoes.
 *
 * - INSERT novo se semana ainda não tem edição.
 * - UPDATE do rascunho existente se tem (preserva id, slug, criado_em;
 *   trigger guard permite porque status='rascunho').
 * - Se semana tem 'publicado', o guard trigger dispara EXCEPTION →
 *   erro do Postgres → chamador (route handler) traduz em 500/409.
 *   O check prévio em estadoEdicaoParaSemana já retorna 409 antes.
 *
 * `input_revisao_n` marca qual revisao_n do input originou este rascunho.
 * Detecção de "rascunho desatualizado" = input_revisao_n < revisao_n atual.
 */
export async function salvarOuAtualizarRascunho(edicao: {
  id: string;
  slug: string;
  ano: number;
  numero_semana: number;
  periodo_inicio: string;
  periodo_fim: string;
  conteudo: EdicaoRadar;
  input_revisao_n: number;
}): Promise<RascunhoSalvo> {
  const row = {
    id: edicao.id,
    slug: edicao.slug,
    ano: edicao.ano,
    numero_semana: edicao.numero_semana,
    periodo_inicio: edicao.periodo_inicio,
    periodo_fim: edicao.periodo_fim,
    publicado_em: null,
    status: "rascunho" as const,
    fonte_dados: "clara_radar" as const,
    conteudo: edicao.conteudo,
    input_revisao_n: edicao.input_revisao_n,
  };

  const { data, error } = await supabaseAdmin
    .from(RADAR_EDICOES)
    .upsert(row, { onConflict: "id" })
    .select("id, criado_em, atualizado_em, input_revisao_n")
    .single();

  if (error) {
    throw new Error("radar/repo: salvarOuAtualizarRascunho falhou: " + error.message);
  }
  return data as RascunhoSalvo;
}

// ═════════════════════════════════════════════════════════════
//  Etapa 3 — revisão e publicação admin
// ═════════════════════════════════════════════════════════════

export interface EdicaoAdminRow {
  id: string;
  slug: string;
  ano: number;
  numero_semana: number;
  periodo_inicio: string;
  periodo_fim: string;
  publicado_em: string | null;
  status: "rascunho" | "publicado";
  fonte_dados: "clara_radar" | "mock";
  input_revisao_n: number | null;
  criado_em: string;
  atualizado_em: string;
  conteudo: EdicaoRadar;
}

/**
 * Lê edição por id via service_role (inclui rascunhos). Uso admin apenas.
 * NÃO expor pro público — a rota chamadora deve validar cookie/token antes.
 */
export async function buscarEdicaoPorId(id: string): Promise<EdicaoAdminRow | null> {
  const { data, error } = await supabaseAdmin
    .from(RADAR_EDICOES)
    .select(
      "id, slug, ano, numero_semana, periodo_inicio, periodo_fim, publicado_em, status, fonte_dados, input_revisao_n, criado_em, atualizado_em, conteudo",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("radar/repo: buscarEdicaoPorId falhou: " + error.message);
  }
  if (!data) return null;
  return data as EdicaoAdminRow;
}

export type PublicarResultado =
  | { ok: true; publicado_em: string; slug: string }
  | { ok: false; motivo: "nao_existe" | "nao_e_rascunho" | "rascunho_desatualizado"; detalhe?: string };

/**
 * Publica um rascunho.
 *
 * Regras aplicadas antes do UPDATE:
 *   1. Row existe                                     — senão 'nao_existe'
 *   2. status atual === 'rascunho'                    — senão 'nao_e_rascunho'
 *   3. input_revisao_n do rascunho >= revisao_n atual — senão 'rascunho_desatualizado'
 *      (NULL em input_revisao_n = edição sem input rastreável — permite publicar.
 *      Isso cobre os mocks históricos w32/w33 gravados antes da Etapa 2B.)
 *
 * Se todas as regras OK: UPDATE com WHERE ... AND status='rascunho' pra evitar
 * race condition. Se rowsAffected = 0, degrada pra 'nao_e_rascunho'.
 *
 * Guard trigger no banco também protege: se OLD.status='publicado' (race),
 * RAISE EXCEPTION aborta e o supabase-js devolve erro.
 */
export async function publicarEdicao(id: string): Promise<PublicarResultado> {
  const edicao = await buscarEdicaoPorId(id);
  if (!edicao) return { ok: false, motivo: "nao_existe" };
  if (edicao.status !== "rascunho") return { ok: false, motivo: "nao_e_rascunho" };

  // Check de rascunho desatualizado (proteção A da Etapa 3)
  if (edicao.input_revisao_n !== null) {
    const relatos = await buscarRelatosPorSemana(edicao.ano, edicao.numero_semana);
    if (relatos && relatos.revisao_n > edicao.input_revisao_n) {
      return {
        ok: false,
        motivo: "rascunho_desatualizado",
        detalhe: `rascunho foi gerado a partir da revisão ${edicao.input_revisao_n}; input atual está na revisão ${relatos.revisao_n}. Regenere o rascunho antes de publicar.`,
      };
    }
  }

  // Executa UPDATE
  const nowIso = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from(RADAR_EDICOES)
    .update({ status: "publicado", publicado_em: nowIso })
    .eq("id", id)
    .eq("status", "rascunho") // guarda idempotência
    .select("id, slug, publicado_em")
    .maybeSingle();

  if (error) {
    // Guard trigger dispara EXCEPTION se OLD.status='publicado' (race)
    throw new Error("radar/repo: publicarEdicao falhou no UPDATE: " + error.message);
  }
  if (!data) {
    // WHERE não bateu — mudou pra publicado entre buscarEdicaoPorId e UPDATE
    return { ok: false, motivo: "nao_e_rascunho" };
  }

  return {
    ok: true,
    publicado_em: data.publicado_em as string,
    slug: data.slug as string,
  };
}
