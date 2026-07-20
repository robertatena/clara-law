import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagamento confirmado — Clara Law",
  description:
    "Seu pacote Clara Law está pronto. Acesse seu e-mail, crie sua conta e acompanhe cada etapa do processo.",
};

export default function SucessoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
