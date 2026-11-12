// Renderiza a petição JEC (lib/gerar-peticao-jec.ts) como DOCX editável,
// server-safe. Mesma simplificação de lib/gerar-peticao-pdf.ts: campos
// pendentes resumidos num quadro destacado (highlight amarelo nativo do
// Word) no topo, em vez de tentar colorir cada marcador individualmente
// dentro do texto corrido.

import { Document, Packer, Paragraph, TextRun, BorderStyle, AlignmentType } from "docx";
import { gerarPeticaoJec, type DadosPeticao } from "./gerar-peticao-jec";

const COR_DOURADA = "B48C1E";
const COR_NAVY = "1A2340";
const COR_AVISO = "92400E";

export async function gerarPeticaoDocx(dados: DadosPeticao): Promise<Buffer> {
  const { corpo, camposFaltantes } = gerarPeticaoJec(dados);

  const paragrafos: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "CLARA LAW", bold: true, color: COR_DOURADA, size: 18 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({ text: "PETIÇÃO INICIAL — JUIZADO ESPECIAL CÍVEL", bold: true, color: COR_NAVY, size: 32 })],
    }),
  ];

  if (camposFaltantes.length > 0) {
    paragrafos.push(
      new Paragraph({
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: "FCD34D" },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: "FCD34D" },
          left: { style: BorderStyle.SINGLE, size: 6, color: "FCD34D" },
          right: { style: BorderStyle.SINGLE, size: 6, color: "FCD34D" },
        },
        spacing: { before: 100, after: 100 },
        children: [
          new TextRun({
            text: "⚠ Campos pendentes de preenchimento antes de protocolar:",
            bold: true,
            color: COR_AVISO,
            highlight: "yellow",
          }),
        ],
      }),
      ...camposFaltantes.map(
        (campo) =>
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: campo, color: COR_AVISO })],
          })
      ),
      new Paragraph({ text: "", spacing: { after: 200 } })
    );
  }

  for (const bloco of corpo.split("\n\n")) {
    const ehTituloSecao = /^(I{1,4}\.|AÇÃO DE|PETIÇÃO INICIAL)/.test(bloco.trim());
    const linhas = bloco.split("\n");
    for (const linha of linhas) {
      if (!linha.trim()) continue;
      const temPreencher = linha.includes("[PREENCHER:");
      if (temPreencher) {
        // Realça só o(s) trecho(s) "[PREENCHER: ...]" dentro da linha —
        // o resto da linha segue no estilo normal/título conforme o caso.
        const partes = linha.split(/(\[PREENCHER:[^\]]*\])/g);
        paragrafos.push(
          new Paragraph({
            spacing: { after: 160 },
            children: partes.map((parte) =>
              new TextRun({
                text: parte,
                bold: ehTituloSecao,
                color: ehTituloSecao ? COR_DOURADA : undefined,
                highlight: parte.startsWith("[PREENCHER:") ? "yellow" : undefined,
              })
            ),
          })
        );
      } else {
        paragrafos.push(
          new Paragraph({
            spacing: { after: 160 },
            children: [new TextRun({ text: linha, bold: ehTituloSecao, color: ehTituloSecao ? COR_DOURADA : undefined })],
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ children: paragrafos }],
  });

  return Packer.toBuffer(doc);
}
