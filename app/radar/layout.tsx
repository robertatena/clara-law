// Layout server-side do /radar — centraliza metadata SEO/OG.
// Vale pra `/radar` e pra páginas históricas `/radar/[ano]/[mes]/[semana]`.
//
// Páginas históricas podem sobrescrever com `generateMetadata` próprio
// (planejado — hoje herdam esta metadata como base).

import type { Metadata } from "next";

const TITLE = "Radar do Consumidor — Clara Law";
const DESCRIPTION =
  "Publicação semanal com os problemas que estão mobilizando consumidores agora — padrões, tendências e o que você pode fazer em cada situação.";
const CANONICAL = "https://www.claralaw.com.br/radar";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    siteName: "Clara Law",
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RadarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
