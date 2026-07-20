import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Clara Law",
  description:
    "Como a Clara Law coleta, usa e protege seus dados pessoais em conformidade com a LGPD.",
};

export default function PrivacidadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
