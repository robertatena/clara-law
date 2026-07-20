import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resolva seu caso — Clara Law",
  description:
    "Resolva seu problema de consumidor — voo atrasado, cobrança indevida, produto com defeito e mais. A Clara prepara tudo, você age.",
};

export default function EnviarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
