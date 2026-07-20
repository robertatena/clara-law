import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minha conta — Clara Law",
  description:
    "Acesse sua área na Clara Law — acompanhe seus casos, tire dúvidas e receba orientação educacional sobre seus direitos.",
};

export default function MinhaContaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
