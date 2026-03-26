"use client";
import Link from "next/link";
export function BrandHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          {/* Troque por sua imagem depois se quiser */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border">
            <span className="text-clara-gold font-semibold">△</span>
          </div>
          <div className="leading-tight">
            <div className="text-lg font-semibold tracking-wide" style={{ fontFamily: "var(--font-raleway)" }}>
              CLARA LAW
            </div>
            <div className="text-xs text-slate-500">
              Inteligência para um mundo mais claro.
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm hover:bg-slate-50">
            Entrar
          </Link>
          <Link
            href="/dashboard/contratos/novo"
            className="rounded-full bg-clara-sky px-4 py-2 text-sm font-medium text-slate-900 hover:opacity-90"
          >
            Analisar contrato
          </Link>
        </nav>
      </div>
    </header>
  );
}
export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { className = "", ...rest } = props;
  return (
    <button
      {...rest}
      className={`rounded-full bg-clara-sky px-5 py-2.5 text-sm font-medium text-slate-900 hover:opacity-90 disabled:opacity-50 ${className}`}
    />
  );
}
export function GoldAccent({ children }: { children: React.ReactNode }) {
  return (
    <span className="clara-badge bg-amber-50 text-amber-800">
      {children}
    </span>
  );
}
