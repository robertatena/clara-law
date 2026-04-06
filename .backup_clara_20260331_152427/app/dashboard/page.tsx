export default function Dashboard() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Bem-vinda à Clara</h1>
      <p className="mt-2 text-neutral-600">
        Aqui você pode analisar contratos e acompanhar seu histórico.
      </p>
      <div className="mt-8">
        <a
          href="/analisar"
          className="inline-block rounded-xl bg-black px-6 py-3 text-white"
        >
          Nova análise
        </a>
      </div>
    </main>
  );
}
