"use client";

import React from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
};

function hasAccount(): boolean {
  if (typeof window === "undefined") return false;
  // Ajuste aqui se você já tiver um nome de token/session específico
  return !!(localStorage.getItem("clara_token") || localStorage.getItem("clara_user") || localStorage.getItem("token"));
}

export default function ResultGate({
  children,
  title = "Para ver o resultado completo, faça seu cadastro",
  subtitle = "Você pode enviar o PDF e gerar a análise, mas o relatório final fica disponível após criar sua conta."
}: Props) {
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    setOk(hasAccount());
  }, []);

  if (ok) return <>{children}</>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/cadastro" className="rounded-lg bg-black px-4 py-2 text-white">
            Criar conta
          </Link>
          <Link href="/login" className="rounded-lg border px-4 py-2">
            Já tenho conta
          </Link>
        </div>

        <div className="mt-6 rounded-xl border bg-slate-50 p-4">
          <p className="text-sm text-slate-600">
            Prévia: você verá o relatório completo (resumo, pontuação e pontos de atenção) após o cadastro.
          </p>
          <div className="mt-4 select-none pointer-events-none blur-sm opacity-70">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
