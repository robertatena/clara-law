// Renderiza a petição JEC (lib/gerar-peticao-jec.ts) como PDF, server-safe
// (sem DOM — nada de navigator/document/URL.createObjectURL). Reaproveita a
// paleta e os helpers visuais de componentes/ContratoModal.tsx (sep/
// sectionTitle/body), mas devolve um ArrayBuffer em vez de baixar um Blob.
//
// Simplificação deliberada: em vez de tentar colorir cada token
// "[PREENCHER: campo]" individualmente dentro do texto corrido (jsPDF não
// separa bem cores dentro de uma mesma linha quebrada automaticamente), os
// campos pendentes ficam resumidos num quadro âmbar logo no topo — mais
// visível que uma cor pontual, e o marcador no corpo do texto já é
// autoexplicativo (colchetes + nome do campo).

import jsPDF from "jspdf";
import { gerarPeticaoJec, type DadosPeticao } from "./gerar-peticao-jec";

function sep(doc: jsPDF, y: number, margin: number, color: [number, number, number] = [220, 216, 210]) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
  return y + 6;
}

function sectionTitle(doc: jsPDF, title: string, y: number, margin: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(150, 130, 40);
  doc.text(title, margin, y);
  return y + 6;
}

function body(doc: jsPDF, text: string, y: number, margin: number, maxWidth: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 65, 80);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin, y);
  return y + lines.length * 5.2 + 5;
}

function garantirEspaco(doc: jsPDF, y: number): number {
  if (y > 250) {
    doc.addPage();
    return 24;
  }
  return y;
}

export function gerarPeticaoPdf(dados: DadosPeticao): ArrayBuffer {
  const { corpo, camposFaltantes } = gerarPeticaoJec(dados);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 25;
  const pw = doc.internal.pageSize.getWidth();
  const cw = pw - margin * 2;
  let y = 24;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(180, 140, 30);
  doc.text("CLARA LAW", pw / 2, y, { align: "center" });
  y += 7;

  doc.setFontSize(16);
  doc.setTextColor(26, 35, 64);
  doc.text("PETIÇÃO INICIAL — JUIZADO ESPECIAL CÍVEL", pw / 2, y, { align: "center" });
  y += 9;
  y = sep(doc, y, margin, [180, 160, 60]);

  if (camposFaltantes.length > 0) {
    doc.setFillColor(255, 249, 237);
    const boxHeight = 10 + camposFaltantes.length * 5;
    doc.rect(margin, y, cw, boxHeight, "F");
    doc.setDrawColor(252, 211, 77);
    doc.rect(margin, y, cw, boxHeight);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14);
    doc.text("⚠ Campos pendentes de preenchimento antes de protocolar:", margin + 3, y);
    y += 5.5;
    doc.setFont("helvetica", "normal");
    for (const campo of camposFaltantes) {
      doc.text(`•  ${campo}`, margin + 5, y);
      y += 5;
    }
    y += 4;
    y = sep(doc, y, margin);
  }

  const paragrafos = corpo.split("\n\n");
  for (const paragrafo of paragrafos) {
    y = garantirEspaco(doc, y);
    const ehTituloSecao = /^(I{1,4}\.|AÇÃO DE|PETIÇÃO INICIAL)/.test(paragrafo.trim());
    if (ehTituloSecao) {
      const [titulo, ...resto] = paragrafo.split("\n");
      y = sectionTitle(doc, titulo, y, margin);
      if (resto.length > 0) y = body(doc, resto.join("\n"), y, margin, cw);
    } else {
      y = body(doc, paragrafo, y, margin, cw);
    }
    y = garantirEspaco(doc, y);
  }

  const totalPages = (doc.internal as { getNumberOfPages?: () => number }).getNumberOfPages?.() ?? 1;
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Modelo orientativo gerado eletronicamente em claralaw.com.br — revise antes de protocolar | Página ${p}/${totalPages}`,
      pw / 2, 291, { align: "center" }
    );
  }

  return doc.output("arraybuffer");
}
