// Zod schemas do Radar do Consumidor.
//
// Contrato de dados entre a extensão Clara Radar (fonte agregada) e
// o endpoint POST /api/radar/ingest (destino).
//
// A garantia estrutural anti-vazamento é o `.strict()` em cada objeto:
// campos NÃO declarados aqui (posts, usernames, urls, keywords, scores,
// empresas, etc.) são REJEITADOS no parse com "Unrecognized key(s)".
// Não é regra de prompt — é regra de tipo enforçada pelo Zod.

import { z } from "zod";

// String sem whitespace-only — trim é aplicado antes de validar tamanho.
const trimmed = (min: number, max: number) =>
  z.string().trim().min(min).max(max);

// Formato slug: lowercase-kebab (a-z, 0-9, hifens separando segmentos).
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// V2 metodológica — contexto da variação:
//   - comparavel:          temos base pra comparar (variacaoPct real)
//   - sem_base_anterior:   tema existia mas com 0 relatos na semana anterior
//                          (variacaoPct=0 é compatibilidade estrutural; UI silencia)
//   - primeira_ocorrencia: tema não existia na semana anterior (novo no radar)
const ContextoVariacaoSchema = z
  .enum(["comparavel", "sem_base_anterior", "primeira_ocorrencia"])
  .optional();

const TemaSchema = z
  .object({
    slug: trimmed(3, 60).regex(SLUG_RE, "slug precisa ser lowercase-kebab"),
    titulo: trimmed(3, 80),
    relatos: z.number().int().nonnegative().max(1_000_000),
    variacaoPct: z.number().int().min(-100).max(10_000),
    padroes: z
      .array(trimmed(5, 140))
      .min(2)
      .max(6)
      .refine(
        (arr) => new Set(arr).size === arr.length,
        { message: "padroes contém itens duplicados" }
      ),
    contexto_variacao: ContextoVariacaoSchema,
  })
  .strict(); // ← bloqueia posts, usernames, urls, keywords, scores...

const OutroTemaSchema = z
  .object({
    titulo: trimmed(3, 80),
    relatos: z.number().int().nonnegative().max(1_000_000),
    variacaoPct: z.number().int().min(-100).max(10_000),
    contexto_variacao: ContextoVariacaoSchema,
  })
  .strict();

export const RadarSemanaInputSchema = z
  .object({
    // z.iso.date() (Zod 4): valida formato "YYYY-MM-DD" E data real
    // (rejeita "2026-13-40" ou "2026-02-31").
    periodoInicio: z.iso.date(),
    periodoFim: z.iso.date(),

    temas: z
      .array(TemaSchema)
      .min(1)
      .max(10)
      .refine(
        (arr) => new Set(arr.map((t) => t.slug)).size === arr.length,
        { message: "slugs duplicados dentro de temas" }
      ),

    outrosTemas: z.array(OutroTemaSchema).max(20).optional(),
  })
  .strict()
  .refine(
    (v) => v.periodoFim >= v.periodoInicio,
    { message: "periodoFim < periodoInicio", path: ["periodoFim"] }
  );

export type RadarSemanaInput = z.infer<typeof RadarSemanaInputSchema>;

// ═════════════════════════════════════════════════════════════
//  Etapa 2B — geração editorial (saídas do Claude)
// ═════════════════════════════════════════════════════════════
//
// Estes schemas validam O QUE O MODELO DEVOLVEU antes de qualquer
// gravação. `.strict()` bloqueia campos extras. Se o modelo devolver
// algo fora do formato, o tema é DESCARTADO em `gerar-editorial.ts`.

/**
 * Output do gerador de tema editorial (V1 = modo template).
 *
 * Ajustado pra alinhar com o input: `padroes` do output usa o mesmo
 * intervalo do input (min 2, max 6, 5-140 chars por item) porque o
 * modo template preserva os padrões literalmente do input.
 */
export const TemaEditorialGeradoSchema = z
  .object({
    chapeu: trimmed(3, 80),
    textoEditorial: trimmed(200, 500),
    padroes: z
      .array(trimmed(5, 140))
      .min(2)
      .max(6)
      .refine(
        (arr) => new Set(arr).size === arr.length,
        { message: "padrões duplicados no output" },
      ),
  })
  .strict();

export type TemaEditorialGerado = z.infer<typeof TemaEditorialGeradoSchema>;

/** Saída do tool `salvar_resumo_semana` — resumo editorial do hero. */
export const ResumoSemanalGeradoSchema = z
  .object({
    resumoSemana: trimmed(150, 400),
  })
  .strict();

export type ResumoSemanalGerado = z.infer<typeof ResumoSemanalGeradoSchema>;

// ═════════════════════════════════════════════════════════════
//  Body do endpoint POST /api/radar/gerar-rascunho
// ═════════════════════════════════════════════════════════════

export const GerarRascunhoBodySchema = z
  .object({
    ano: z.number().int().min(2020).max(2100),
    numero_semana: z.number().int().min(1).max(53),
  })
  .strict();

export type GerarRascunhoBody = z.infer<typeof GerarRascunhoBodySchema>;
