import Link from "next/link";
export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-clara-bg text-clara-ink">
      <header className="w-full border-b border-clara-ink/5 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-clara-ink">
            Clara Law
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/dashboard"
              className="text-clara-ink/60 hover:text-clara-ink"
            >
              Início
            </Link>
            <Link
              href="/dashboard/contratos"
              className="text-clara-ink/60 hover:text-clara-ink"
            >
              Contratos
            </Link>
            <Link
              href="/dashboard/contratos/novo"
              className="text-clara-ink/60 hover:text-clara-ink"
            >
              Novo
            </Link>
            <Link
              href="/dashboard/historico"
              className="text-clara-ink/60 hover:text-clara-ink"
            >
              Histórico
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
