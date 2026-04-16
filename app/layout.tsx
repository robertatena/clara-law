import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clara Law — Inteligência para um mundo mais claro.",
  description:
    "Analise contratos, descubra seus direitos e saiba o que fazer — sem juridiquês e sem advogado.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;600;700&family=Montserrat:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
