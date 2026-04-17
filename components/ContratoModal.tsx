"use client";

import { useState } from "react";
import jsPDF from "jspdf";

interface Props {
  nomePassageiro: string;
  onAceitar: (pdfBlob: Blob) => void;
  onFechar: () => void;
}

export default function ContratoModal({ nomePassageiro, onAceitar, onFechar }: Props) {
  const [aceito, setAceito] = useState(false);
  const [gerando, setGerando] = useState(false);
  const dataHoje = new Date().toLocaleDateString("pt-BR");

  function gerarPDF(): { blob: Blob; filename: string } {
    const dataHoraAceite = new Date().toLocaleString("pt-BR");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - margin * 2;
    let y = 22;

    // Header
    doc.setFontSize(10);
    doc.setTextColor(180, 140, 30);
    doc.setFont("helvetica", "bold");
    doc.text("CLARA LAW", pageWidth / 2, y, { align: "center" });
    y += 8;

    doc.setFontSize(17);
    doc.setTextColor(26, 35, 64);
    doc.text("CONTRATO DE REPRESENTACAO", pageWidth / 2, y, { align: "center" });
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text("Documento gerado eletronicamente - Aceite registrado digitalmente", pageWidth / 2, y, { align: "center" });
    y += 9;

    doc.setDrawColor(224, 221, 214);
    doc.line(margin, y, pageWidth - margin, y);
    y += 9;

    // Parties
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 35, 64);
    doc.text("PARTES", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Contratante: ${nomePassageiro || "Passageiro(a)"}`, margin, y); y += 6;
    doc.text("Contratada:  Clara Law", margin, y); y += 6;
    doc.text(`Data e hora do aceite: ${dataHoraAceite}`, margin, y); y += 12;

    // Sections
    const sections = [
      {
        title: "OBJETO",
        body:
          "A Clara Law prestara assistencia na elaboracao e envio de notificacao extrajudicial " +
          "a companhia aerea ou empresa responsavel, bem como acompanhamento das etapas subsequentes " +
          "necessarias para resolucao do caso (ANAC, PROCON, Juizado Especial Civel).",
      },
      {
        title: "HONORARIOS",
        body:
          "Os servicos sao prestados sem custo inicial. Em caso de exito (recebimento de indenizacao " +
          "ou acordo), sera devido o equivalente a 10% (dez por cento) do valor obtido a titulo de " +
          "honorarios de sucesso. Nao havendo exito, nenhum valor sera cobrado.",
      },
      {
        title: "PRAZO",
        body:
          "O contrato vigorara ate a resolucao definitiva do caso ou desistencia expressa do contratante.",
      },
      {
        title: "DECLARACAO DE ACEITE",
        body:
          `Eu, ${nomePassageiro || "Passageiro(a)"}, declaro ter lido e concordado com todos os termos ` +
          "acima, autorizando a Clara Law a enviar a notificacao em meu nome e a acompanhar meu caso " +
          `nas etapas seguintes. Aceite registrado digitalmente em: ${dataHoraAceite}.`,
      },
      {
        title: "AVISO LEGAL",
        body:
          "A Clara Law nao e um escritorio de advocacia registrado na OAB. Os servicos sao de natureza " +
          "orientativa e de gestao do caso. Para representacao judicial, um advogado parceiro podera ser indicado.",
      },
    ];

    for (const section of sections) {
      if (y > 255) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(26, 35, 64);
      doc.text(section.title, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(75, 85, 99);
      const lines = doc.splitTextToSize(section.body, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 10;
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Clara Law - Inteligencia para um mundo mais claro e justo", pageWidth / 2, 288, { align: "center" });

    const nomeLimpo = (nomePassageiro || "passageiro").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 40);
    const dataLimpa = new Date().toISOString().slice(0, 10);
    const filename = `contrato-claralaw-${nomeLimpo}-${dataLimpa}.pdf`;

    return { blob: doc.output("blob"), filename };
  }

  async function handleAceitar() {
    if (!aceito || gerando) return;
    setGerando(true);
    try {
      const { blob, filename } = gerarPDF();

      // Download automático
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      onAceitar(blob);
    } finally {
      setGerando(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, maxWidth: 560, width: "100%",
        maxHeight: "90vh", overflow: "auto", padding: "36px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.18)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>
            Clara Law
          </div>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 22, color: "#1a2340", margin: 0 }}>
            Contrato de Representação
          </h2>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>Leia com atenção antes de prosseguir</p>
        </div>

        <div style={{
          background: "#F8F7F4", border: "1px solid #E0DDD6", borderRadius: 12,
          padding: "20px 22px", marginBottom: 24, fontSize: 14, color: "#4b5563", lineHeight: 1.8,
        }}>
          <p><strong style={{ color: "#1a2340" }}>Partes:</strong></p>
          <p>
            <strong>Contratante:</strong> {nomePassageiro || "Passageiro(a)"}<br />
            <strong>Contratada:</strong> Clara Law<br />
            <strong>Data:</strong> {dataHoje}
          </p>

          <p style={{ marginTop: 16 }}><strong style={{ color: "#1a2340" }}>Objeto:</strong></p>
          <p>
            A Clara Law prestará assistência na elaboração e envio de notificação extrajudicial
            à companhia aérea, bem como acompanhamento das etapas subsequentes necessárias
            para resolução do caso (ANAC, PROCON, Juizado Especial Cível).
          </p>

          <p style={{ marginTop: 16 }}><strong style={{ color: "#1a2340" }}>Honorários:</strong></p>
          <p>
            Os serviços são prestados <strong>sem custo inicial</strong>. Em caso de êxito
            (recebimento de indenização ou acordo), será devido o equivalente a <strong>10% (dez por cento)</strong> do
            valor obtido a título de honorários de sucesso.
          </p>
          <p>
            Não havendo êxito, <strong>nenhum valor será cobrado</strong>.
          </p>

          <p style={{ marginTop: 16 }}><strong style={{ color: "#1a2340" }}>Prazo:</strong></p>
          <p>
            O contrato vigorará até a resolução definitiva do caso ou desistência expressa
            do contratante.
          </p>

          <p style={{ marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
            ⚠️ A Clara Law não é um escritório de advocacia registrado na OAB. Os serviços
            são de natureza orientativa e de gestão do caso. Para representação judicial,
            um advogado parceiro poderá ser indicado.
          </p>
        </div>

        <label style={{
          display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
          marginBottom: 16, fontSize: 14, color: "#374151", lineHeight: 1.6,
        }}>
          <input
            type="checkbox"
            checked={aceito}
            onChange={(e) => setAceito(e.target.checked)}
            style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0, accentColor: "#1a2340" }}
          />
          Li e concordo com os termos acima. Autorizo a Clara Law a enviar a notificação
          em meu nome e a acompanhar meu caso nas etapas seguintes.
        </label>

        {aceito && (
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, paddingLeft: 30 }}>
            📄 Uma cópia do contrato será baixada automaticamente para o seu dispositivo.
          </p>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={onFechar}
            style={{
              flex: 1, padding: "14px", borderRadius: 40, border: "1.5px solid #D1CCC4",
              background: "#fff", color: "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Voltar
          </button>
          <button
            onClick={handleAceitar}
            disabled={!aceito || gerando}
            style={{
              flex: 2, padding: "14px", borderRadius: 40, border: "none",
              background: aceito ? "#1a2340" : "#E0DDD6",
              color: aceito ? "#fff" : "#9ca3af",
              fontSize: 14, fontWeight: 700, cursor: aceito ? "pointer" : "not-allowed",
              transition: "all 0.2s",
            }}
          >
            {gerando ? "Gerando PDF..." : "Aceitar e continuar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
