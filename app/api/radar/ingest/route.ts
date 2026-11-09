// POST /api/radar/ingest
//
// Recebe RadarSemanaInput (dados agregados semanais) da extensão
// Clara Radar e grava em `radar_relatos_semanais` como camada
// intermediária consumida pela geração editorial (Etapa 2B).
//
// Regras estruturais que NÃO PODEM regredir:
//   1. Auth Bearer com timing-safe compare (RADAR_INGEST_SECRET, server-side)
//   2. Zod .strict() bloqueia PII / posts / usernames / keywords / scores
//   3. Sem fallback silencioso: falha do Supabase → 500 explícito
//   4. Nunca loga token nem trecho do Authorization header
//   5. Rate limit por IP (defesa complementar; auth é a defesa principal)
//   6. Regra 409: edição publicada é intocável (guard trigger + este check)
//
// ─── AUTH — NOTA V1 ─────────────────────────────────────────────
//  Bearer secret armazenado em chrome.storage.local da extensão.
//  ISSO É SOLUÇÃO TRANSITÓRIA porque:
//   - a extensão é hoje de uso privado (uma pessoa)
//   - se um dia for distribuída publicamente, TODO usuário poderia
//     extrair o segredo por DevTools da extensão
//  Migração futura: identidade (OAuth Google via chrome.identity)
//  ou tokens individuais revogáveis por usuário. Não implementar
//  publicação até essa migração se a extensão passar a ser pública.
// ────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { RadarSemanaInputSchema } from "@/lib/radar/schema";
import {
  isoWeekOf,
  estadoEdicaoParaSemana,
  salvarRelatosSemanais,
} from "@/lib/radar/repo";

// ─── Rate limit in-memory ───────────────────────────────────────
//  10 requests / 60s / IP. Suficiente pra proteção complementar V1.
//  Perde estado entre cold starts (aceitável — auth é a proteção principal).
const RL_MAX = 10;
const RL_WINDOW_MS = 60_000;
const rlBucket = new Map<string, { count: number; resetAt: number }>();

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const cur = rlBucket.get(ip);
  if (!cur || cur.resetAt < now) {
    rlBucket.set(ip, { count: 1, resetAt: now + RL_WINDOW_MS });
    return true;
  }
  if (cur.count >= RL_MAX) return false;
  cur.count++;
  return true;
}

// ─── Timing-safe compare ─────────────────────────────────────────
function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const ip = getIp(req);
  const path = new URL(req.url).pathname;
  const ts = new Date().toISOString();

  // 1) Rate limit
  if (!rateLimitOk(ip)) {
    console.warn("radar/ingest: rate_limited", { ip, path, ts });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // 2) Auth Bearer timing-safe
  const secret = process.env.RADAR_INGEST_SECRET;
  if (!secret) {
    // Config faltando no server → tratamos como 401 (não vaza a diferença)
    console.error("radar/ingest: RADAR_INGEST_SECRET não configurado no servidor", { ts });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const providedToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!timingSafeStringEqual(providedToken, secret)) {
    console.warn("radar/ingest: unauthorized", { ip, path, ts });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 3) Parse JSON
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // 4) Validação Zod .strict() — rejeita PII e chaves não declaradas
  const parsed = RadarSemanaInputSchema.safeParse(rawBody);
  if (!parsed.success) {
    // Não ecoa o body. Só devolve caminho + regra que falhou.
    return NextResponse.json(
      {
        error: "invalid_payload",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // 5) Deriva ano/semana + consulta radar_edicoes pra decidir 409
  const { ano, numeroSemana } = isoWeekOf(input.periodoInicio);

  let estado: Awaited<ReturnType<typeof estadoEdicaoParaSemana>>;
  try {
    estado = await estadoEdicaoParaSemana(ano, numeroSemana);
  } catch (err) {
    console.error("radar/ingest: falha em estadoEdicaoParaSemana", {
      ip, path, ts, ano, numeroSemana, err: String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  if (estado === "publicado") {
    return NextResponse.json(
      {
        error: "edicao_publicada",
        message:
          `Semana ${ano}-w${numeroSemana} já tem edição publicada. ` +
          `Ingest bloqueado — edições publicadas são imutáveis.`,
      },
      { status: 409 },
    );
  }

  // Dry-run: rodou rate limit + auth + parse + Zod + regra 409.
  // Curto-circuita ANTES de qualquer UPSERT. Zero escrita em qualquer tabela.
  // Útil pra extensão validar payload sem gravar (ver spec V2 item 10).
  const isDryRun = new URL(req.url).searchParams.get("dry_run") === "true";
  if (isDryRun) {
    return NextResponse.json(
      {
        dry_run: true,
        would_save: {
          id: `${ano}-w${numeroSemana}`,
          ano,
          numero_semana: numeroSemana,
          temas_count: input.temas.length,
          outros_temas_count: input.outrosTemas?.length ?? 0,
        },
        edicao_pendente: estado === "rascunho" ? "rascunho" : null,
      },
      { status: 200 },
    );
  }

  // 6) UPSERT via service_role (trigger cuida da revisao_n)
  let salvo;
  try {
    salvo = await salvarRelatosSemanais(input);
  } catch (err) {
    console.error("radar/ingest: falha em salvarRelatosSemanais", {
      ip, path, ts, ano, numeroSemana, err: String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  // 7) Resposta 200
  return NextResponse.json(
    {
      id: salvo.id,
      ano,
      numero_semana: numeroSemana,
      revisao_n: salvo.revisao_n,
      atualizado_em: salvo.atualizado_em,
      edicao_pendente: estado === "rascunho" ? "rascunho" : null,
    },
    { status: 200 },
  );
}
