"use client";

import Link from "next/link";

export default function PreResultGateBlock() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Para receber o resultado, faça seu cadastro</h2>
        <p className="mt-2 text-sm text-slate-600">
          É rapidinho. Assim você salva seu relatório e a Clara melhora as recomendações para você.
        </p>

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
