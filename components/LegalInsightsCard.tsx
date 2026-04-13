type PontoItem = {
  titulo?: string
  explicacao?: string
  por_que_importa?: string
  risco?: string
}

type Props = {
  contractType?: string | null
  pontos?: PontoItem[]
}

const FALLBACK_PONTOS: PontoItem[] = [
  {
    titulo: "Rescisão e cancelamento",
    explicacao: "Pode existir cobrança, aviso prévio ou barreira para encerrar a relação.",
    risco: "alto",
  },
  {
    titulo: "Responsabilidades",
    explicacao: "Algumas obrigações podem estar mal distribuídas e merecem revisão.",
    risco: "médio",
  },
]

function RiskPill({ risco }: { risco?: string }) {
  const r = (risco || "").toLowerCase()
  let cls = "border-[#dfe8ff] bg-[#f5f8ff] text-[#355cff]"
  if (r === "alto") cls = "border-red-200 bg-red-100 text-red-700"
  else if (r === "medio" || r === "médio") cls = "border-amber-200 bg-amber-100 text-amber-700"
  else if (r === "baixo") cls = "border-green-200 bg-green-100 text-green-700"
  return (
    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
      Risco {risco}
    </span>
  )
}

export default function LegalInsightsCard({ contractType, pontos }: Props) {
  const items = pontos && pontos.length > 0 ? pontos.slice(0, 2) : FALLBACK_PONTOS

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#e7edf6] bg-white">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="px-6 py-7 md:px-8 md:py-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#73839a]">
            Prévia estratégica
          </p>

          <h2 className="mt-3 text-[30px] font-bold leading-[1.1] text-[#0e2b50] md:text-[34px]">
            Os 2 pontos que mais podem te prejudicar neste contrato
          </h2>

          <p className="mt-4 max-w-[680px] text-[16px] leading-7 text-[#425466]">
            A Clara resumiu os sinais mais importantes para você entender rapidamente onde está o maior risco.
          </p>

          <div className="mt-7 grid gap-4">
            {items.map((item, idx) => (
              <article key={idx} className="rounded-[22px] border border-[#edf2f8] bg-[#fbfcff] px-5 py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h3 className="text-[22px] font-bold leading-tight text-[#0e2b50]">
                    {item.titulo || `Ponto ${idx + 1}`}
                  </h3>
                  {item.risco && <RiskPill risco={item.risco} />}
                </div>

                {item.explicacao && (
                  <p className="mt-3 text-[16px] leading-7 text-[#425466]">{item.explicacao}</p>
                )}

                {item.por_que_importa && (
                  <div className="mt-3 rounded-[10px] bg-white px-4 py-3">
                    <span className="text-sm font-semibold text-[#0e2b50]">Por que importa: </span>
                    <span className="text-sm text-[#425466]">{item.por_que_importa}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="border-t border-[#eef3f8] bg-[#f8fbff] px-6 py-7 md:px-8 md:py-8 lg:border-l lg:border-t-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#73839a]">
            Próximo passo
          </p>

          <h3 className="mt-3 text-[30px] font-bold leading-[1.1] text-[#0e2b50]">
            Desbloqueie a análise completa
          </h3>

          <p className="mt-4 text-[16px] leading-7 text-[#425466]">
            Veja cláusula por cláusula, riscos, recomendações práticas e o que vale negociar antes de assinar.
          </p>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#0e2b50]" />
              <p className="text-[15px] leading-6 text-[#425466]">Leitura completa do contrato</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#0e2b50]" />
              <p className="text-[15px] leading-6 text-[#425466]">Pontos de negociação mais sensíveis</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#0e2b50]" />
              <p className="text-[15px] leading-6 text-[#425466]">Orientação mais prática para agir</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
