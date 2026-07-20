import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guia do processo — Clara Law",
  description:
    "Guia completo do processo no Juizado Especial Cível — o que fazer em cada etapa, como se comportar na audiência e o que significa receber uma intimação.",
};

export default function GuiaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
