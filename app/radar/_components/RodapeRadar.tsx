// Rodapé completo da edição:
//   1. CTA global pra /enviar
//   2. Metodologia (accordion, discreto)
//   3. Edições anteriores (links pra páginas históricas)
//   4. Footer com disclaimer legal

import Link from "next/link";
import type { EdicaoResumo } from "../types";
import { MetodologiaBox } from "./MetodologiaBox";
import { formatarPeriodo } from "../lib/formatarPeriodo";

const ClaraIcon = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export function RodapeRadar({
  edicoesAnteriores,
  edicaoAtualId,
}: {
  edicoesAnteriores: EdicaoResumo[];
  /** id da edição sendo mostrada, pra excluir da lista de "outras" */
  edicaoAtualId: string;
}) {
  const outrasEdicoes = edicoesAnteriores.filter((e) => e.id !== edicaoAtualId);

  return (
    <>
      {/* CTA global */}
      <section style={{ background: "#1a2340", padding: "80px 24px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <ClaraIcon size={48} />
          </div>
          <h2
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(26px, 4vw, 40px)",
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: 16,
              letterSpacing: "-0.02em",
            }}
          >
            Está passando por um
            <br />
            problema <span style={{ color: "#D4AF37" }}>parecido?</span>
          </h2>
          <p
            style={{
              fontSize: 15,
              color: "rgba(168,216,240,0.75)",
              lineHeight: 1.75,
              marginBottom: 36,
            }}
          >
            A Clara te ajuda a entender seus direitos e os próximos passos — sem juridiquês, sem burocracia.
          </p>
          <Link
            href="/enviar"
            style={{
              background: "#D4AF37",
              color: "#1a2340",
              fontSize: 16,
              fontWeight: 800,
              padding: "18px 40px",
              borderRadius: 40,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Reivindicar meus direitos
          </Link>
          <p style={{ fontSize: 12, color: "rgba(168,216,240,0.5)", marginTop: 16 }}>
            Plataforma educacional — orienta com base no CDC, não substitui advogado.
          </p>
        </div>
      </section>

      {/* Metodologia */}
      <section style={{ background: "#F8F7F4", padding: "48px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <MetodologiaBox />
        </div>
      </section>

      {/* Edições anteriores */}
      {outrasEdicoes.length > 0 && (
        <section style={{ background: "#fff", borderTop: "1px solid #ECEAE4", padding: "48px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                color: "#D4AF37",
                textTransform: "uppercase",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              edições anteriores
            </p>
            <ul
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                margin: 0,
                padding: 0,
                listStyle: "none",
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {outrasEdicoes.map((e) => (
                <li key={e.id}>
                  <Link
                    href={"/radar/" + e.slug}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      border: "1px solid #E0DDD6",
                      borderRadius: 12,
                      textDecoration: "none",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#1a2340" }}>
                      Semana {e.numeroSemana}
                    </span>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>
                      {formatarPeriodo(e.periodoInicio, e.periodoFim)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer
        style={{
          background: "#111827",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Raleway', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.12em",
                color: "#A8D8F0",
              }}
            >
              CLARA LAW
            </div>
            <div style={{ fontSize: 11, color: "rgba(168,216,240,0.55)", marginTop: 3 }}>
              Inteligência para um mundo mais claro e justo.
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Link href="/" style={{ fontSize: 12, color: "rgba(168,216,240,0.7)", textDecoration: "none" }}>
              Voltar ao site
            </Link>
            <Link
              href="/privacidade"
              style={{ fontSize: 12, color: "rgba(168,216,240,0.7)", textDecoration: "none" }}
            >
              Privacidade
            </Link>
          </div>
        </div>
        <div
          style={{
            maxWidth: 1100,
            margin: "12px auto 0",
            paddingTop: 12,
            borderTop: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "rgba(168,216,240,0.6)",
              textAlign: "center",
              lineHeight: 1.7,
            }}
          >
            ⚠️ A Clara não é um escritório de advocacia. As análises são orientativas e não substituem a
            consulta com um advogado.
          </p>
        </div>
      </footer>
    </>
  );
}
