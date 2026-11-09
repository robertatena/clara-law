// Composição completa de uma edição. Reutilizada por:
//   - /radar             (edição atual)
//   - /radar/[ano]/[mes]/[semana]  (edições históricas — isHistorico=true)
//
// Toda a estrutura visual do Radar mora aqui. As pages são thin
// wrappers que só decidem QUAL edição buscar.

import type { EdicaoRadar, EdicaoResumo } from "../types";
import { NavRadar } from "./NavRadar";
import { EdicaoHero } from "./EdicaoHero";
import { TemaSemanalCard } from "./TemaSemanalCard";
import { OutrosTemasLista } from "./OutrosTemasLista";
import { RodapeRadar } from "./RodapeRadar";

export function EdicaoView({
  edicao,
  edicoesAnteriores,
  isHistorico = false,
}: {
  edicao: EdicaoRadar;
  edicoesAnteriores: EdicaoResumo[];
  isHistorico?: boolean;
}) {
  return (
    <main
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: "#F8F7F4",
        minHeight: "100vh",
        paddingTop: 64,
      }}
    >
      <NavRadar />

      {/* Banner "Prévia" — enquanto qualquer dado for demonstrativo */}
      {edicao.isDemoData && (
        <div
          style={{
            background: "#FEF3C7",
            borderBottom: "1px solid #FCD34D",
            padding: "12px 24px",
          }}
        >
          <p
            style={{
              maxWidth: 900,
              margin: "0 auto",
              textAlign: "center",
              fontSize: 13,
              color: "#92400e",
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            🧪 <strong>Prévia do Radar</strong> · Dados demonstrativos enquanto calibramos a ferramenta.
          </p>
        </div>
      )}

      <EdicaoHero edicao={edicao} isHistorico={isHistorico} />

      {/* Corpo editorial — temas numerados */}
      <section
        style={{
          background: "#fff",
          borderTop: "1px solid #ECEAE4",
          borderBottom: "1px solid #ECEAE4",
          padding: "64px 24px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {edicao.temas.map((tema, i) => (
            <TemaSemanalCard key={tema.slug} tema={tema} posicao={i + 1} />
          ))}
        </div>
      </section>

      {/* Outros temas observados */}
      {edicao.outrosTemas && edicao.outrosTemas.length > 0 && (
        <OutrosTemasLista temas={edicao.outrosTemas} />
      )}

      <RodapeRadar edicoesAnteriores={edicoesAnteriores} edicaoAtualId={edicao.id} />

      {/* CSS específico — só afeta <details> dentro desta árvore */}
      <style>{`
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
    </main>
  );
}
