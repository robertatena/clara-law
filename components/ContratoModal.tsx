"use client";

import { useState } from "react";
import jsPDF from "jspdf";

interface Props {
  nomePassageiro: string;
  tipoLabel?: string;
  ciaNome?: string;
  numVoo?: string;
  dataVoo?: string;
  onAceitar: (pdfBlob: Blob) => void;
  onFechar: () => void;
}

function contratoNum() {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
    : Math.random().toString(36).substr(2, 8).toUpperCase();
  return `CL-${new Date().getFullYear()}-${rand}`;
}

function sep(doc: jsPDF, y: number, margin: number, color = [220, 216, 210] as [number, number, number]) {
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

export default function ContratoModal({
  nomePassageiro, tipoLabel, ciaNome, numVoo, dataVoo,
  onAceitar, onFechar,
}: Props) {
  const [aceito, setAceito] = useState(false);
  const [gerando, setGerando] = useState(false);
  const dataHoje = new Date().toLocaleDateString("pt-BR");
  const numContrato = useState(() => contratoNum())[0];

  async function gerarPDF(): Promise<{ blob: Blob; filename: string }> {
    const dataHoraAceite = new Date().toLocaleString("pt-BR");
    const dispositivo = navigator.userAgent.slice(0, 120);
    let ip = "Nao disponivel";
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      ip = (await r.json()).ip;
    } catch {}

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const margin = 25;
    const pw = doc.internal.pageSize.getWidth();
    const cw = pw - margin * 2;
    let y = 24;

    // ── HEADER ──────────────────────────────────────────────
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 140, 30);
    doc.text("CLARA LAW", pw / 2, y, { align: "center" });
    y += 7;

    doc.setFontSize(16);
    doc.setTextColor(26, 35, 64);
    doc.text("CONTRATO DE REPRESENTACAO", pw / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 160);
    doc.text("Aceite eletronico com validade juridica — claralaw.com.br", pw / 2, y, { align: "center" });
    y += 5;

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(`Contrato no ${numContrato}`, pw / 2, y, { align: "center" });
    y += 9;
    y = sep(doc, y, margin, [180, 160, 60]);

    // ── PARTES ──────────────────────────────────────────────
    y = sectionTitle(doc, "PARTES", y, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 65, 80);
    doc.text(`Contratante : ${nomePassageiro || "Passageiro(a)"}`, margin, y); y += 6;
    doc.text(`Contratada  : Clara Law (claralaw.com.br)`, margin, y); y += 6;
    doc.text(`Data        : ${dataHoje}`, margin, y); y += 10;
    y = sep(doc, y, margin);

    // ── DADOS DO CASO ────────────────────────────────────────
    if (tipoLabel || ciaNome || numVoo || dataVoo) {
      y = sectionTitle(doc, "DADOS DO CASO", y, margin);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 65, 80);
      if (tipoLabel) { doc.text(`Tipo do problema : ${tipoLabel}`, margin, y); y += 6; }
      if (ciaNome)   { doc.text(`Companhia aerea  : ${ciaNome}`, margin, y); y += 6; }
      if (numVoo)    { doc.text(`Numero do voo    : ${numVoo}`, margin, y); y += 6; }
      if (dataVoo)   { doc.text(`Data do voo      : ${dataVoo}`, margin, y); y += 6; }
      y += 4;
      y = sep(doc, y, margin);
    }

    // ── OBJETO ───────────────────────────────────────────────
    y = sectionTitle(doc, "OBJETO", y, margin);
    y = body(doc,
      "A Clara Law prestara assistencia na elaboracao e envio de notificacao " +
      "extrajudicial a companhia aerea ou empresa responsavel, bem como " +
      "acompanhamento das etapas subsequentes para resolucao do caso " +
      "(ANAC, PROCON, Juizado Especial Civel).",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── HONORÁRIOS ───────────────────────────────────────────
    y = sectionTitle(doc, "HONORARIOS", y, margin);
    y = body(doc,
      "Os servicos sao prestados sem custo inicial. Em caso de exito " +
      "(recebimento de indenizacao ou acordo), sera devido honorario de " +
      "sucesso equivalente a 10% (dez por cento) do valor obtido. " +
      "Nao havendo exito, nenhum valor sera cobrado.",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── PRAZO ────────────────────────────────────────────────
    y = sectionTitle(doc, "PRAZO", y, margin);
    y = body(doc,
      "O contrato vigorara ate a resolucao definitiva do caso ou " +
      "desistencia expressa do contratante, mediante comunicacao escrita.",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── DECLARAÇÃO DE ACEITE ─────────────────────────────────
    if (y > 220) { doc.addPage(); y = 24; }
    y = sectionTitle(doc, "DECLARACAO DE ACEITE ELETRONICO", y, margin);
    y = body(doc,
      `Eu, ${nomePassageiro || "o(a) contratante"}, declaro ter lido e ` +
      "concordado integralmente com os termos acima, autorizando a Clara Law " +
      "a enviar a notificacao em meu nome e a acompanhar meu caso. " +
      `Aceite registrado em: ${dataHoraAceite}.`,
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── RASTREABILIDADE ──────────────────────────────────────
    y = sectionTitle(doc, "RASTREABILIDADE JURIDICA", y, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data/hora do aceite : ${dataHoraAceite}`, margin, y); y += 5.5;
    doc.text(`IP do aceite        : ${ip}`, margin, y); y += 5.5;
    const dispLines = doc.splitTextToSize(`Dispositivo         : ${dispositivo}`, cw);
    doc.text(dispLines, margin, y); y += dispLines.length * 5 + 5;
    y = sep(doc, y, margin);

    // ── AVISO LEGAL ──────────────────────────────────────────
    y = sectionTitle(doc, "AVISO LEGAL", y, margin);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    const aviso = doc.splitTextToSize(
      "A Clara Law nao e um escritorio de advocacia registrado na OAB. " +
      "Os servicos sao de natureza orientativa e de gestao do caso. " +
      "Para representacao judicial, um advogado parceiro podera ser indicado.",
      cw);
    doc.text(aviso, margin, y);

    // ── FOOTER ───────────────────────────────────────────────
    const totalPages = (doc.internal as any).getNumberOfPages?.() ?? 1;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `Documento gerado eletronicamente em claralaw.com.br  |  Contrato no ${numContrato}  |  Pagina ${p}/${totalPages}`,
        pw / 2, 291, { align: "center" }
      );
    }

    const nomeLimpo = (nomePassageiro || "passageiro").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 35);
    const dataLimpa = new Date().toISOString().slice(0, 10);
    const filename = `contrato-claralaw-${nomeLimpo}-${dataLimpa}.pdf`;

    return { blob: doc.output("blob"), filename };
  }

  async function handleAceitar() {
    if (!aceito || gerando) return;
    setGerando(true);
    try {
      const { blob, filename } = await gerarPDF();

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
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, maxWidth: 560, width: "100%",
        maxHeight: "90vh", overflow: "auto", padding: "36px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 6 }}>
            Clara Law
          </div>
          <h2 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 22, color: "#1a2340", margin: 0 }}>
            Contrato de Representação
          </h2>
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>
            Contrato nº <strong style={{ color: "#6b7280" }}>{numContrato}</strong>
          </p>
        </div>

        {(tipoLabel || ciaNome || numVoo) && (
          <div style={{ background: "#F0F4FF", border: "1px solid #C7D2FE", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#3730a3" }}>
            {tipoLabel && <div><strong>Caso:</strong> {tipoLabel}</div>}
            {ciaNome  && <div><strong>Companhia:</strong> {ciaNome}</div>}
            {numVoo   && <div><strong>Voo:</strong> {numVoo}{dataVoo ? ` em ${dataVoo}` : ""}</div>}
          </div>
        )}

        <div style={{
          background: "#F8F7F4", border: "1px solid #E0DDD6", borderRadius: 12,
          padding: "20px 22px", marginBottom: 20, fontSize: 14, color: "#4b5563", lineHeight: 1.8,
        }}>
          <p><strong style={{ color: "#1a2340" }}>Partes:</strong></p>
          <p>
            <strong>Contratante:</strong> {nomePassageiro || "Passageiro(a)"}<br />
            <strong>Contratada:</strong> Clara Law<br />
            <strong>Data:</strong> {dataHoje}
          </p>

          <p style={{ marginTop: 14 }}><strong style={{ color: "#1a2340" }}>Objeto:</strong></p>
          <p>
            A Clara Law prestará assistência na elaboração e envio de notificação extrajudicial,
            bem como acompanhamento das etapas subsequentes (ANAC, PROCON, Juizado Especial Cível).
          </p>

          <p style={{ marginTop: 14 }}><strong style={{ color: "#1a2340" }}>Honorários:</strong></p>
          <p>
            <strong>Sem custo inicial.</strong> Em caso de êxito, 10% do valor obtido.
            Não havendo êxito, <strong>nenhum valor é cobrado</strong>.
          </p>

          <p style={{ marginTop: 14, fontSize: 12, color: "#9ca3af" }}>
            ⚠️ A Clara Law não é um escritório de advocacia registrado na OAB.
            Os serviços são de natureza orientativa e de gestão do caso.
          </p>
        </div>

        <label style={{
          display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
          marginBottom: 12, fontSize: 14, color: "#374151", lineHeight: 1.6,
        }}>
          <input
            type="checkbox"
            checked={aceito}
            onChange={(e) => setAceito(e.target.checked)}
            style={{ marginTop: 3, width: 18, height: 18, flexShrink: 0, accentColor: "#1a2340" }}
          />
          Li e concordo com os termos. Autorizo a Clara Law a enviar a notificação
          em meu nome e acompanhar meu caso.
        </label>

        {aceito && (
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, paddingLeft: 30 }}>
            📄 Uma cópia PDF do contrato será baixada para o seu dispositivo.
          </p>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onFechar} style={{
            flex: 1, padding: "14px", borderRadius: 40, border: "1.5px solid #D1CCC4",
            background: "#fff", color: "#6b7280", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            Voltar
          </button>
          <button onClick={handleAceitar} disabled={!aceito || gerando} style={{
            flex: 2, padding: "14px", borderRadius: 40, border: "none",
            background: aceito ? "#1a2340" : "#E0DDD6",
            color: aceito ? "#fff" : "#9ca3af",
            fontSize: 14, fontWeight: 700, cursor: aceito ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}>
            {gerando ? "Gerando PDF..." : "Aceitar e continuar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
