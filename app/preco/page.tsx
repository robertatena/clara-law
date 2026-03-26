"use client";
import Link from "next/link";
import Image from "next/image";
const COLORS = {
  gold: "#D4AF37",
  sky: "#A8D8F0",
  white: "#FFFFFF",
  gray: "#F2F2F2",
  ink: "#0A2540",
  text: "#425466",
  muted: "#6B7C93",
};
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
      style={{
        background: "rgba(168,216,240,.32)",
        border: "1px solid rgba(168,216,240,.65)",
        color: COLORS.ink,
      }}
    >
      {children}
    </span>
  );
}
function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: COLORS.white, border: "1px solid rgba(10,37,64,.08)" }}
    >
      <div className="font-semibold" style={{ color: COLORS.ink }}>{title}</div>
      <div className="mt-1 text-sm" style={{ color: COLORS.text }}>{desc}</div>
    </div>
  );
}
export default function PrecoLanding() {
  return (
    <main
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${COLORS.white} 0%, ${COLORS.gray} 100%)`,
      }}
    >
      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="relative w-10 h-10 rounded-full overflow-hidden"
            style={{ border: "1px solid rgba(10,37,64,.10)" }}
          >
            {/* coloque seu logo em /public/logo.png */}
            <Image src="/brand/clara-logo.png" alt="Clara Law" fill className="object-cover" priority />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: COLORS.ink, letterSpacing: ".06em" }}>
              CLARA LAW
            </div>
            <div className="text-xs" style={{ color: COLORS.muted }}>
              Inteligência para um mundo mais claro.
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <span
            className="text-xs rounded-full px-3 py-1"
            style={{ background: "rgba(212,175,55,.12)", border: "1px solid rgba(212,175,55,.35)", color: COLORS.ink }}
          >
            ⚠️ Não é advogado
          </span>
        </div>
      </header>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div
          className="rounded-3xl p-8 md:p-12 shadow-sm"
          style={{ background: COLORS.white, border: "1px solid rgba(10,37,64,.08)" }}
        >
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Texto */}
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                <Pill>Sem juridiquês</Pill>
                <Pill>PDF + fotos</Pill>
                <Pill>Vários contratos</Pill>
                <Pill>E-mail automático</Pill>
              </div>
              <h1 className="text-3xl md:text-5xl font-semibold leading-tight" style={{ color: COLORS.ink }}>
                Assinar sem entender <span style={{ color: COLORS.gold }}>é caro.</span>
                <br />
                Entender antes <span style={{ color: COLORS.gold }}>é poder.</span>
              </h1>
              <p className="text-base md:text-lg" style={{ color: COLORS.text }}>
                A Clara é uma assistente de leitura contratual: ela organiza o que importa, explica as cláusulas
                em linguagem humana e aponta pontos de atenção — para você decidir com mais segurança.
              </p>
              {/* Aviso claro logo no início */}
              <div
                className="rounded-2xl p-4 text-sm"
                style={{
                  background: "rgba(168,216,240,.20)",
                  border: "1px solid rgba(168,216,240,.55)",
                  color: COLORS.ink,
                }}
              >
                <b>Transparência:</b> a Clara <b>não é um advogado</b> e não substitui orientação jurídica.
                Ela é uma ferramenta de apoio para você entender melhor e conversar com um profissional com clareza.
              </div>
              {/* Dores */}
              <div className="space-y-3">
                <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                  O tipo de problema que a Clara resolve
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl p-4" style={{ background: COLORS.gray, border: "1px solid rgba(10,37,64,.06)" }}>
                    <div className="font-medium" style={{ color: COLORS.ink }}>“Eu só percebi a multa depois.”</div>
                    <div className="text-sm" style={{ color: COLORS.muted }}>A Clara te mostra onde estão multas, prazos e condições de rescisão.</div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: COLORS.gray, border: "1px solid rgba(10,37,64,.06)" }}>
                    <div className="font-medium" style={{ color: COLORS.ink }}>“Renovou sozinho e eu não vi.”</div>
                    <div className="text-sm" style={{ color: COLORS.muted }}>A Clara destaca renovação automática e o que fazer para cancelar no prazo certo.</div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: COLORS.gray, border: "1px solid rgba(10,37,64,.06)" }}>
                    <div className="font-medium" style={{ color: COLORS.ink }}>“Isso aqui tá em juridiquês.”</div>
                    <div className="text-sm" style={{ color: COLORS.muted }}>A Clara traduz cláusulas para linguagem simples e prática.</div>
                  </div>
                </div>
              </div>
              {/* Para quem é */}
              <div className="space-y-3">
                <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>Para quem é</div>
                <div className="grid gap-3">
                  <div className="rounded-2xl p-4" style={{ background: COLORS.gray, border: "1px solid rgba(10,37,64,.06)" }}>
                    <div className="font-medium" style={{ color: COLORS.ink }}>Consumidores</div>
                    <div className="text-sm" style={{ color: COLORS.muted }}>Aluguel, curso, serviços, assinatura, compra, empréstimo — antes de assinar.</div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: COLORS.gray, border: "1px solid rgba(10,37,64,.06)" }}>
                    <div className="font-medium" style={{ color: COLORS.ink }}>MEIs e pequenas empresas</div>
                    <div className="text-sm" style={{ color: COLORS.muted }}>Contratos com fornecedores, softwares, plataformas, franquias, prestação de serviços.</div>
                  </div>
                  <div className="rounded-2xl p-4" style={{ background: COLORS.gray, border: "1px solid rgba(10,37,64,.06)" }}>
                    <div className="font-medium" style={{ color: COLORS.ink }}>Quem quer falar com advogado com clareza</div>
                    <div className="text-sm" style={{ color: COLORS.muted }}>A Clara prepara um e-mail pronto e perguntas objetivas para validação.</div>
                  </div>
                </div>
              </div>
              {/* CTA Único */}
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl px-7 py-4 text-base font-semibold transition"
                  style={{ background: COLORS.ink, color: COLORS.white }}
                >
                  Começar análise
                </Link>
                <div className="mt-3 text-xs" style={{ color: COLORS.muted }}>
                  Você pode enviar <b>vários contratos</b> e até <b>fotos</b>. Se o PDF estiver escaneado, a Clara usa OCR.
                </div>
              </div>
            </div>
            {/* Painel “o que você recebe” */}
            <div
              className="rounded-3xl p-6 md:p-8"
              style={{
                background: `linear-gradient(180deg, rgba(168,216,240,.35) 0%, rgba(212,175,55,.10) 100%)`,
                border: "1px solid rgba(10,37,64,.08)",
              }}
            >
              <div className="space-y-4">
                <div className="text-sm font-semibold" style={{ color: COLORS.ink }}>
                  O que você recebe em minutos
                </div>
                <Card
                  title="Resumo que dá para confiar"
                  desc="O que o contrato realmente exige de você — sem interpretação confusa."
                />
                <Card
                  title="Pontos de atenção explicados"
                  desc="Por que aquilo importa e o que você precisa conferir antes de assinar."
                />
                <Card
                  title="Base legal quando fizer sentido"
                  desc="Referências para orientar sua conversa (sem prometer “parecer jurídico”)."
                />
                <Card
                  title="E-mail automático para advogado"
                  desc="Assunto + corpo do e-mail prontos com perguntas certas e trechos organizados."
                />
                <div className="text-xs pt-2" style={{ color: COLORS.muted }}>
                  Clara = clareza + serenidade racional (azul) + sabedoria aplicada (dourado).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer className="mx-auto max-w-6xl px-6 pb-10 text-xs" style={{ color: COLORS.muted }}>
        © {new Date().getFullYear()} Clara Law — A Clara não substitui aconselhamento jurídico profissional.
      </footer>
    </main>
  );
}
