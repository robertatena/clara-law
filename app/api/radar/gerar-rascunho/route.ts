// POST /api/radar/gerar-rascunho
//
// Gera rascunho editorial de uma semana específica a partir dos
// dados agregados em `radar_relatos_semanais`.
//
// Body: { ano: number, numero_semana: number }
// Auth: Bearer RADAR_INTERNAL_SECRET (server-to-server; separado do ingest)
//
// Nunca publica. Sempre grava como status='rascunho'. Se semana já
// tem edição publicada, retorna 409 (guard trigger também protege).
// Se input mudar depois, `input_revisao_n` do rascunho permite
// detectar que ficou desatualizado.
//
// ─── AUTH ─────────────────────────────────────────────────────
//  Bearer distinto do RADAR_INGEST_SECRET propositalmente:
//  papéis diferentes (interno server-to-server × extensão client),
//  rotação independente, blast radius menor.

import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { GerarRascunhoBodySchema } from "@/lib/radar/schema";
import {
  buscarRelatosPorSemana,
  estadoEdicaoParaSemana,
  salvarOuAtualizarRascunho,
} from "@/lib/radar/repo";
import { gerarRascunhoEditorial } from "@/lib/radar/gerar-editorial";
import type { EdicaoRadar } from "@/app/radar/types";

// ─── Rate limit in-memory (mais restritivo — cada geração é cara) ─
const RL_MAX = 5;
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
    console.warn("radar/gerar-rascunho: rate_limited", { ip, path, ts });
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // 2) Auth
  const secret = process.env.RADAR_INTERNAL_SECRET;
  if (!secret) {
    console.error("radar/gerar-rascunho: RADAR_INTERNAL_SECRET não configurado", { ts });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const providedToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!timingSafeStringEqual(providedToken, secret)) {
    console.warn("radar/gerar-rascunho: unauthorized", { ip, path, ts });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 3) Parse body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsedBody = GerarRascunhoBodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        issues: parsedBody.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }
  const { ano, numero_semana } = parsedBody.data;

  // 4) Estado editorial — 409 se publicado
  let estado;
  try {
    estado = await estadoEdicaoParaSemana(ano, numero_semana);
  } catch (err) {
    console.error("radar/gerar-rascunho: falha em estadoEdicaoParaSemana", {
      ip, ts, ano, numero_semana, err: String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  if (estado === "publicado") {
    return NextResponse.json(
      {
        error: "edicao_publicada",
        message:
          `Semana ${ano}-w${numero_semana} já tem edição publicada. ` +
          `Rascunho não pode substituir edição publicada.`,
      },
      { status: 409 },
    );
  }

  // 5) Busca dados agregados
  let relatos;
  try {
    relatos = await buscarRelatosPorSemana(ano, numero_semana);
  } catch (err) {
    console.error("radar/gerar-rascunho: falha em buscarRelatosPorSemana", {
      ip, ts, ano, numero_semana, err: String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  if (!relatos) {
    return NextResponse.json(
      {
        error: "sem_relatos",
        message: `Nenhum dado agregado em radar_relatos_semanais para ${ano}-w${numero_semana}.`,
      },
      { status: 404 },
    );
  }

  // 6) Geração editorial (Claude + 3 camadas de validação)
  const resultado = await gerarRascunhoEditorial(relatos.entrada);

  if (!resultado.ok || !resultado.dados) {
    return NextResponse.json(
      {
        error: "geracao_falhou",
        motivo: resultado.erro_geral,
        temas_gerados: resultado.temas_gerados,
        temas_descartados: resultado.temas_descartados,
        motivos_descarte: resultado.motivos_descarte,
      },
      { status: 422 },
    );
  }

  // 7) Monta EdicaoRadar completo
  const id = `${ano}-w${numero_semana}`;
  const mes = relatos.entrada.periodoInicio.slice(5, 7);
  const slug = `${ano}/${mes}/semana-${numero_semana}`;

  const edicao: EdicaoRadar = {
    id,
    slug,
    ano,
    numeroSemana: numero_semana,
    periodoInicio: relatos.entrada.periodoInicio,
    periodoFim: relatos.entrada.periodoFim,
    publicadoEm: null,
    status: "rascunho",
    fonteDados: "clara_radar",
    isDemoData: false,
    resumoSemana: resultado.dados.resumoSemana,
    temas: resultado.dados.temas,
    outrosTemas: resultado.dados.outrosTemas,
  };

  // 8) Upsert (preserva id + criado_em; trigger guard cobre publicado)
  let salvo;
  try {
    salvo = await salvarOuAtualizarRascunho({
      id,
      slug,
      ano,
      numero_semana,
      periodo_inicio: relatos.entrada.periodoInicio,
      periodo_fim: relatos.entrada.periodoFim,
      conteudo: edicao,
      input_revisao_n: relatos.revisao_n,
    });
  } catch (err) {
    console.error("radar/gerar-rascunho: falha em salvarOuAtualizarRascunho", {
      ip, ts, ano, numero_semana, err: String(err),
    });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  // 9) 200
  return NextResponse.json(
    {
      id: salvo.id,
      slug,
      criado_em: salvo.criado_em,
      atualizado_em: salvo.atualizado_em,
      input_revisao_n: salvo.input_revisao_n,
      temas_gerados: resultado.temas_gerados,
      temas_descartados: resultado.temas_descartados,
      motivos_descarte: resultado.motivos_descarte,
    },
    { status: 200 },
  );
}
