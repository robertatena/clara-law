import Link from "next/link";
export default function AssinaturaPage() {
  return (
    <main className="min-h-screen bg-clara-white text-clara-ink">
      <header className="border-b border-clara-ink/10 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-clara-ink/60">
              Clara Law
            </div>
            <div className="text-lg font-medium">Clara Pro (em breve)</div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs text-clara-ink/60 hover:text-clara-sky"
          >
            Voltar ao painel
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-sm">
        <div className="rounded-3xl border border-clara-ink/10 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <h1 className="text-xl font-semibold text-clara-ink">
            Assinatura Clara Pro
          </h1>
          <p className="mt-2 text-sm text-clara-ink/70">
            Visão: ser o <strong>DonotPay brasileiro</strong> para contratos 
            começando por empreendedores e pequenas empresas.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-clara-ink/60">
                O que você teria
              </h2>
              <ul className="mt-2 space-y-1 text-xs text-clara-ink/75">
                <li>⬢ Análises ilimitadas de contratos por mês</li>
                <li>⬢ Modelos prontos para notificação, distrato, aditivo</li>
                <li>⬢ Histórico organizado por cliente/fornecedor</li>
                <li>⬢ E-mails prontos para jurídico e contraparte</li>
                <li>⬢ Em breve: geração automática de minutas</li>
              </ul>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-clara-ink/60">
                Pagamento (versão futura)
              </h2>
              <p className="mt-2 text-xs text-clara-ink/75">
                Aqui vamos integrar com{" "}
                <strong>Stripe / Apple Pay / cartão</strong> para assinatura
                mensal simples, no estilo:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-clara-ink/75">
                <li>⬢ Plano mensal Clara Pro</li>
                <li>⬢ Cancelamento a qualquer momento</li>
                <li>⬢ Recibos automáticos para a empresa</li>
              </ul>
              <button
                disabled
                className="mt-4 w-full rounded-full bg-clara-gray px-4 py-2 text-xs font-medium text-clara-ink/50"
              >
                Em breve: Quero assinar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
