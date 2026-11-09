// Página histórica: /radar/2026/08/semana-33
//
// - `generateStaticParams` pré-gera as edições publicadas em build time.
// - `generateMetadata` faz título/OG específicos da edição arquivada.
// - Se o slug não existir → 404 nativo do Next.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getEdicaoPorSlug,
  listarEdicoesPublicadas,
} from "../../../data/service";
import { EdicaoView } from "../../../_components/EdicaoView";
import { formatarPeriodo } from "../../../lib/formatarPeriodo";

// Fallback de cache: revalida a cada 1h. Publicação via
// /api/radar/publicar chama revalidatePath imediato.
export const revalidate = 3600;

interface Params {
  ano: string;
  mes: string;
  semana: string;
}

function montarSlug(p: Params): string {
  return `${p.ano}/${p.mes}/${p.semana}`;
}

export async function generateStaticParams(): Promise<Params[]> {
  const edicoes = await listarEdicoesPublicadas();
  return edicoes.map((e) => {
    const [ano, mes, semana] = e.slug.split("/");
    return { ano, mes, semana };
  });
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const p = await params;
  const edicao = await getEdicaoPorSlug(montarSlug(p));
  if (!edicao) return {};

  const periodo = formatarPeriodo(edicao.periodoInicio, edicao.periodoFim);
  const title = `Radar do Consumidor — Semana ${edicao.numeroSemana} · ${periodo} — Clara Law`;
  const description = edicao.resumoSemana;
  const canonical = `https://www.claralaw.com.br/radar/${edicao.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Clara Law",
      type: "article",
      locale: "pt_BR",
      publishedTime: edicao.publicadoEm ?? undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EdicaoHistoricaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const p = await params;
  const slug = montarSlug(p);

  const [edicao, edicoesAnteriores] = await Promise.all([
    getEdicaoPorSlug(slug),
    listarEdicoesPublicadas(),
  ]);

  if (!edicao) notFound();

  return (
    <EdicaoView
      edicao={edicao}
      edicoesAnteriores={edicoesAnteriores}
      isHistorico
    />
  );
}
