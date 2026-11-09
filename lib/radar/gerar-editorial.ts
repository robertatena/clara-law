// Geração editorial do Radar do Consumidor — MODO TEMPLATE (V1).
//
// 100% programático, custo operacional zero, sem chamada a nenhuma
// API de LLM (Anthropic, Groq, Gemini, OpenAI, etc.).
//
// Determinismo: seleção de cada peça (chapéu, abertura, conector,
// fechamento, resumo) via hash DJB2 de (ano, semana, slug, categoria).
// Mesmo input sempre produz exatamente o mesmo output.
//
// Guardrails estruturais garantidos pela arquitetura:
//   - `padroes` são preservados LITERALMENTE do input (o gerador só
//     insere no template — não transforma)
//   - nenhum número factual é introduzido além de {relatos, variacaoPct}
//     do próprio input (ambos são plotados só no schema/UI, não no texto)
//   - nenhuma marca, generalização, causalidade ou legislação nova
//     pode aparecer porque o texto só concatena elementos pré-aprovados
//   - filtragem dinâmica evita repetição lexical ("nesta semana" 3×,
//     "relatos" excessivo quando chapéu já contém)
//
// Extensibilidade futura (Opção C — provider LLM opcional):
//   - `RADAR_EDITORIAL_MODE` (env) escolhe o modo. Default: "template".
//   - Outros valores futuros ("groq", "gemini") entrariam via dispatch
//     abaixo do check `if (MODE !== "template")`. Nada da API paga é
//     ligado nesta V1.

import {
  TemaEditorialGeradoSchema,
  ResumoSemanalGeradoSchema,
  type RadarSemanaInput,
} from "./schema";
import { isoWeekOf } from "./repo";
import type { OutroTema, TemaSemanal, Tendencia } from "@/app/radar/types";

const MODE = process.env.RADAR_EDITORIAL_MODE || "template";

// ═════════════════════════════════════════════════════════════
//  Pools de templates — aprovados após v2 refine
// ═════════════════════════════════════════════════════════════

const CHAPEUS_ALTA_FORTE = [
  "ganhou força nesta semana",
  "avançou entre os relatos analisados",
  "apareceu mais nesta semana",
  "teve alta em relação à semana anterior",
];
const CHAPEUS_ALTA_MODERADA = [
  "seguiu em alta nesta semana",
  "cresceu em relação à semana anterior",
  "apareceu mais entre os relatos analisados",
  "manteve movimento de alta",
];
const CHAPEUS_LEVE_ALTA = [
  "teve leve alta nesta semana",
  "avançou discretamente na semana",
  "apareceu um pouco mais nesta semana",
  "registrou leve avanço entre os relatos analisados",
];
const CHAPEUS_ESTAVEL = [
  "manteve-se estável",
  "teve volume semelhante ao da semana anterior",
  "permaneceu praticamente no mesmo nível",
  "teve pouca variação nesta semana",
];
const CHAPEUS_QUEDA = [
  "recuou nesta semana",
  "apareceu menos que na semana anterior",
  "teve queda em relação à semana passada",
  "perdeu força nesta semana",
];

// Pool específico: tema NOVO (não existia na semana anterior).
const CHAPEUS_PRIMEIRA_OCORRENCIA = [
  "apareceu pela primeira vez no radar",
  "estreia no radar desta semana",
  "surgiu como tema novo entre os relatos analisados",
  "entrou no radar nesta semana",
];

// Pool específico: tema JÁ EXISTIA na semana anterior mas com 0 relatos
// (ou não temos base comparável). Não é novo, mas não podemos comparar.
// Voz neutra, sem sugestão de alta/queda nem de "estreia".
const CHAPEUS_SEM_BASE = [
  "esteve entre os temas observados nesta semana",
  "apareceu entre os relatos analisados",
  "foi observado nesta edição do radar",
  "esteve presente entre os relatos desta semana",
];

const ABERTURAS = [
  "Entre os relatos analisados nesta semana, {titulo} {chapeu}.",  // 0 — tem "relatos"
  "Nos relatos observados nesta semana, {titulo} {chapeu}.",       // 1 — tem "relatos"
  "Esta semana, {titulo} {chapeu}.",                                // 2 — sem "relatos"
  "No Radar desta semana, {titulo} {chapeu}.",                      // 3 — sem "relatos"
];

const CONECTORES_3 = [
  "Apareceram principalmente situações envolvendo {p1}, {p2} e {p3}.",
  "Entre as situações observadas estavam {p1}, {p2} e {p3}.",
  "Os relatos incluíram {p1}, {p2} e {p3}.",
  "Nos padrões observados apareceram {p1}, {p2} e {p3}.",
];
const CONECTORES_2 = [
  "Apareceram principalmente situações envolvendo {p1} e {p2}.",
  "Entre as situações observadas estavam {p1} e {p2}.",
  "Os relatos incluíram {p1} e {p2}.",
  "Nos padrões observados apareceram {p1} e {p2}.",
];

const FECHAMENTOS = [
  " Esses foram alguns dos padrões observados no tema.",
  " Essas foram algumas das situações observadas no tema nesta semana.",
  " O conjunto ajuda a mostrar como o tema apareceu nos relatos analisados.",
  " São situações que apareceram nos relatos analisados nesta edição.",
];

const RESUMOS = [
  "Entre os temas acompanhados nesta edição estão {titulos}. {destaque_titulo} {destaque_chapeu}.",
  "Nesta edição do Radar aparecem, entre outros, {titulos}. {destaque_titulo} {destaque_chapeu}.",
  "Os temas em destaque nesta edição incluem {titulos}. Entre eles, {destaque_titulo} {destaque_chapeu}.",
];

// ═════════════════════════════════════════════════════════════
//  Hash determinístico (DJB2) + pickBySeed
// ═════════════════════════════════════════════════════════════

function hashSeed(...parts: Array<string | number>): number {
  const s = parts.join("|");
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function pickBySeed<T>(pool: T[], ...seedParts: Array<string | number>): T {
  return pool[hashSeed(...seedParts) % pool.length]!;
}

// ═════════════════════════════════════════════════════════════
//  Helpers
// ═════════════════════════════════════════════════════════════

function poolChapeu(variacaoPct: number, contexto?: string): string[] {
  // Pools baseados em contexto têm prioridade sobre variacaoPct.
  // Quando contexto ≠ "comparavel", o variacaoPct armazenado é apenas
  // compatibilidade estrutural (tipicamente 0) e NÃO deve escolher chapéu.
  if (contexto === "primeira_ocorrencia") return CHAPEUS_PRIMEIRA_OCORRENCIA;
  if (contexto === "sem_base_anterior") return CHAPEUS_SEM_BASE;

  // Contexto ausente ou "comparavel" → decide pelo variacaoPct.
  if (variacaoPct >= 30) return CHAPEUS_ALTA_FORTE;
  if (variacaoPct >= 15) return CHAPEUS_ALTA_MODERADA;
  if (variacaoPct > 0) return CHAPEUS_LEVE_ALTA;
  if (variacaoPct === 0) return CHAPEUS_ESTAVEL;
  return CHAPEUS_QUEDA;
}

function derivarTendencia(variacaoPct: number): Tendencia {
  if (variacaoPct >= 20) return "em_alta";
  if (variacaoPct > 0) return "crescendo";
  return "estavel";
}

/** "A, B e C" (com "e" antes do último) */
function listaNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  return items.slice(0, -1).join(", ") + " e " + items[items.length - 1];
}

// ═════════════════════════════════════════════════════════════
//  Gerador de UM tema editorial
// ═════════════════════════════════════════════════════════════

function gerarTemaEditorial(
  ano: number,
  semana: number,
  tema: RadarSemanaInput["temas"][number],
): TemaSemanal {
  const chapeu = pickBySeed(
    poolChapeu(tema.variacaoPct, tema.contexto_variacao),
    ano, semana, tema.slug, "chapeu",
  );

  // Filtragem #1: se chapéu tem "relatos", evita aberturas com "relatos"
  const chapeuTemRelatos = chapeu.toLowerCase().includes("relatos");
  const aberturasDisponiveis = chapeuTemRelatos
    ? ABERTURAS.filter((a) => !a.toLowerCase().includes("relatos"))
    : ABERTURAS;
  const aberturaRaw = pickBySeed(aberturasDisponiveis, ano, semana, tema.slug, "abertura");
  const aberturaTexto = aberturaRaw
    .replace("{titulo}", tema.titulo)
    .replace("{chapeu}", chapeu);

  // Conector — pool depende de ter ≥3 padrões (usa 3 primeiros) ou apenas 2
  const conectorPool = tema.padroes.length >= 3 ? CONECTORES_3 : CONECTORES_2;
  const conectorRaw = pickBySeed(conectorPool, ano, semana, tema.slug, "conector");
  const [p1, p2, p3] = tema.padroes;
  let conectorTexto = conectorRaw.replace("{p1}", p1!).replace("{p2}", p2!);
  if (tema.padroes.length >= 3) conectorTexto = conectorTexto.replace("{p3}", p3!);

  // Filtragem #2: se abertura+chapéu já tem "nesta semana", evita fechamento com
  const preTexto = aberturaTexto + " " + conectorTexto;
  const jaTemNestaSemana = preTexto.toLowerCase().includes("nesta semana");
  const fechamentosDisponiveis = jaTemNestaSemana
    ? FECHAMENTOS.filter((f) => !f.toLowerCase().includes("nesta semana"))
    : FECHAMENTOS;
  const fechamento = pickBySeed(fechamentosDisponiveis, ano, semana, tema.slug, "fechamento");

  const textoEditorial = preTexto + fechamento;

  return {
    slug: tema.slug,
    titulo: tema.titulo,
    chapeu,
    relatos: tema.relatos,
    variacaoPct: tema.variacaoPct,
    tendencia: derivarTendencia(tema.variacaoPct),
    textoEditorial,
    // padrões PRESERVADOS LITERALMENTE do input — cópia direta
    padroes: [...tema.padroes],
    // Propaga contexto pra o frontend decidir renderização (chip NOVO / silêncio)
    ...(tema.contexto_variacao ? { contexto_variacao: tema.contexto_variacao } : {}),
  };
}

// ═════════════════════════════════════════════════════════════
//  Gerador do resumo semanal
// ═════════════════════════════════════════════════════════════

function gerarResumoSemanal(ano: number, semana: number, temas: TemaSemanal[]): string {
  const template = pickBySeed(RESUMOS, ano, semana, "resumo");
  return template
    .replace("{titulos}", listaNatural(temas.map((t) => t.titulo)))
    .replace("{destaque_titulo}", temas[0]!.titulo)
    .replace("{destaque_chapeu}", temas[0]!.chapeu);
}

// ═════════════════════════════════════════════════════════════
//  Orquestrador exposto ao route handler
// ═════════════════════════════════════════════════════════════

export interface DadosGerados {
  resumoSemana: string;
  temas: TemaSemanal[];
  outrosTemas: OutroTema[];
}

export interface ResultadoGeracao {
  ok: boolean;
  dados: DadosGerados | null;
  temas_gerados: number;
  temas_descartados: number;
  motivos_descarte: Array<{ slug: string; motivo: string }>;
  erro_geral?: string;
}

const MIN_TEMAS = 3;

// gerarRascunhoEditorial devolve dados prontos pra o route handler montar
// EdicaoRadar completo. Função async pra manter contrato compatível com
// futuros providers que serão I/O-bound (rede/HTTP).
export async function gerarRascunhoEditorial(
  entrada: RadarSemanaInput,
): Promise<ResultadoGeracao> {
  if (MODE !== "template") {
    // Placeholder pra Opção C futura. Nesta V1, único modo suportado.
    throw new Error(
      `RADAR_EDITORIAL_MODE="${MODE}" não implementado. Use "template" (default V1).`,
    );
  }

  const { ano, numeroSemana } = isoWeekOf(entrada.periodoInicio);

  const temasFinais: TemaSemanal[] = [];
  const motivos_descarte: Array<{ slug: string; motivo: string }> = [];

  for (const temaInput of entrada.temas) {
    const gerado = gerarTemaEditorial(ano, numeroSemana, temaInput);

    // Validação estrutural do output do template (belt-and-suspenders):
    // no modo template, o output é determinístico e conhecido — mas
    // validar garante que qualquer mudança futura nos pools que quebre
    // o schema (ex: chapéu longo demais) é detectada antes de gravar.
    const parsed = TemaEditorialGeradoSchema.safeParse({
      chapeu: gerado.chapeu,
      textoEditorial: gerado.textoEditorial,
      padroes: gerado.padroes,
    });
    if (!parsed.success) {
      motivos_descarte.push({
        slug: temaInput.slug,
        motivo:
          "schema: " +
          parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "),
      });
      continue;
    }

    temasFinais.push(gerado);
  }

  // Regra de mínimo
  if (temasFinais.length < MIN_TEMAS) {
    return {
      ok: false,
      dados: null,
      temas_gerados: temasFinais.length,
      temas_descartados: motivos_descarte.length,
      motivos_descarte,
      erro_geral: `apenas ${temasFinais.length} tema(s) passaram; mínimo é ${MIN_TEMAS}`,
    };
  }

  // Resumo semanal — determinístico, sempre gera se tem >= 3 temas
  const resumoSemana = gerarResumoSemanal(ano, numeroSemana, temasFinais);

  const parsedResumo = ResumoSemanalGeradoSchema.safeParse({ resumoSemana });
  if (!parsedResumo.success) {
    return {
      ok: false,
      dados: null,
      temas_gerados: temasFinais.length,
      temas_descartados: motivos_descarte.length,
      motivos_descarte: [
        ...motivos_descarte,
        {
          slug: "__resumo__",
          motivo:
            "schema: " +
            parsedResumo.error.issues.map((i) => i.message).join("; "),
        },
      ],
      erro_geral: "resumo semanal falhou validação de schema",
    };
  }

  return {
    ok: true,
    dados: {
      resumoSemana,
      temas: temasFinais,
      outrosTemas: entrada.outrosTemas ?? [],
    },
    temas_gerados: temasFinais.length,
    temas_descartados: motivos_descarte.length,
    motivos_descarte,
  };
}
