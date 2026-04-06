import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "CLARA LAW",
  description: "Inteligência para um mundo mais claro.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
