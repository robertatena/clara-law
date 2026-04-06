"use client";

import React from "react";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
  // passe true quando você já tiver o resultado pronto (ex: analysisDone/resultReady)
  resultReady: boolean;
  title?: string;
  subtitle?: string;
};

function isRegistered(): boolean {
  if (typeof window === "undefined") return false;
  // ajuste aqui para a chave real do seu cadastro
  return !!(
    localStorage.getItem("clara_token") ||
    localStorage.getItem("clara_user") ||
    localStorage.getItem("token") ||
    localStorage.getItem("leadEmail") // (caso você use isso hoje)
  );
}

export default function PreResultGate({
  children,
  resultReady,
  title = "Para receber o resultado, faça seu cadastro",
  subtitle = "É rapidinho. A gente salva seu relatório e melhora as recomendações para você."
}: Props) {
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    setOk(isRegistered());
  }, []);

  // Se ainda não tem resultado, deixa o usuário usar a página (upload/analisar etc.)
  if (!resultReady) return <>{children}</>;

  // Se tem resultado mas não está cadastrado: bloqueia e pede cadastro
  if (!ok) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/cadastro" className="rounded-lg bg-black px-4 py-2 text-white">
              Fazer cadastro
            </Link>
            <Link href="/login" className="rounded-lg border px-4 py-2">
              Já tenho conta
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            Seus dados ficam só para contato e melhoria da análise.
          </p>
        </div>
      </div>
    );
  }

  // cadastrado: mostra o resultado
  return <>{children}</>;
}
