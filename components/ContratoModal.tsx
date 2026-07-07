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

function referenciaAceite() {
  const rand = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()
    : Math.random().toString(36).slice(2, 14).toUpperCase();
  return `REF-${rand}`;
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
  const refAceite = useState(() => referenciaAceite())[0];

  async function gerarPDF(): Promise<{ blob: Blob; filename: string }> {
    const dataHoraAceite = new Date().toLocaleString("pt-BR");
    const dispositivo = navigator.userAgent.slice(0, 120);

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
    doc.text("TERMOS DE USO — CLARA LAW", pw / 2, y, { align: "center" });
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Documento de aceite — ${dataHoje}  |  Ref: ${refAceite}`, pw / 2, y, { align: "center" });
    y += 9;
    y = sep(doc, y, margin, [180, 160, 60]);

    // ── DADOS DO CASO (opcional, só se tiver dado de voo) ────
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

    // ── SEÇÃO 1 — O QUE A CLARA LAW É ────────────────────────
    y = sectionTitle(doc, "1. O QUE A CLARA LAW E", y, margin);
    y = body(doc,
      "A Clara Law e uma plataforma educacional de tecnologia que gera " +
      "documentos orientativos para consumidores. Nao e um escritorio de " +
      "advocacia e nao representa o usuario.",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── SEÇÃO 2 — O QUE VOCÊ RECEBE ──────────────────────────
    y = sectionTitle(doc, "2. O QUE VOCE RECEBE", y, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 65, 80);
    const itens = [
      "E-mail de notificacao formatado com a legislacao aplicavel",
      "Peticao para o Juizado Especial Civel pronta para protocolar",
      "Guia de acompanhamento com as etapas do processo",
    ];
    for (const item of itens) {
      const lines = doc.splitTextToSize(`•  ${item}`, cw - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 5.2;
    }
    y += 5;
    y = sep(doc, y, margin);

    // ── SEÇÃO 3 — RESPONSABILIDADE DO USUÁRIO ───────────────
    if (y > 220) { doc.addPage(); y = 24; }
    y = sectionTitle(doc, "3. RESPONSABILIDADE DO USUARIO", y, margin);
    y = body(doc,
      "O usuario e o unico responsavel pelo envio do e-mail, pelo protocolo " +
      "da peticao e pelo comparecimento a audiencia. A Clara Law fornece " +
      "ferramentas educacionais — a acao e inteiramente do usuario.",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── SEÇÃO 4 — PAGAMENTO ─────────────────────────────────
    y = sectionTitle(doc, "4. PAGAMENTO", y, margin);
    y = body(doc,
      "R$ 49,90 por caso — pagamento unico. Sem taxa de exito. " +
      "Sem cobranca adicional.",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── SEÇÃO 5 — AVISO LEGAL ───────────────────────────────
    if (y > 220) { doc.addPage(); y = 24; }
    y = sectionTitle(doc, "5. AVISO LEGAL", y, margin);
    y = body(doc,
      "A Clara Law nao e um escritorio de advocacia registrado na OAB e " +
      "nao presta servicos juridicos. Os documentos gerados sao de natureza " +
      "educacional e orientativa. Para casos complexos, consulte um advogado " +
      "habilitado.",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── ACEITE ──────────────────────────────────────────────
    if (y > 230) { doc.addPage(); y = 24; }
    y = sectionTitle(doc, "ACEITE", y, margin);
    y = body(doc,
      "O usuario declara ter lido e concordado com os presentes termos, " +
      "ciente de que age em seu proprio nome.",
      y, margin, cw);
    y = sep(doc, y, margin);

    // ── REGISTRO DO ACEITE ──────────────────────────────────
    y = sectionTitle(doc, "REGISTRO DO ACEITE", y, margin);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Data/hora           : ${dataHoraAceite}`, margin, y); y += 5.5;
    doc.text(`Referencia          : ${refAceite}`, margin, y); y += 5.5;
    const dispLines = doc.splitTextToSize(`Dispositivo         : ${dispositivo}`, cw);
    doc.text(dispLines, margin, y); y += dispLines.length * 5 + 2;

    // ── FOOTER ───────────────────────────────────────────────
    const totalPages = (doc.internal as { getNumberOfPages?: () => number }).getNumberOfPages?.() ?? 1;
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `Documento gerado eletronicamente em claralaw.com.br  |  Ref ${refAceite}  |  Pagina ${p}/${totalPages}`,
        pw / 2, 291, { align: "center" }
      );
    }

    const nomeLimpo = (nomePassageiro || "usuario").replace(/[^a-zA-Z0-9]/g, "-").toLowerCase().slice(0, 35);
    const dataLimpa = new Date().toISOString().slice(0, 10);
    const filename = `termos-clara-law-${nomeLimpo}-${dataLimpa}.pdf`;

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
            Termos de uso — Clara Law
          </h2>
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
          <p><strong style={{ color: "#1a2340" }}>O que a Clara Law é:</strong></p>
          <p>
            A Clara Law é uma plataforma educacional de tecnologia que gera documentos
            orientativos para consumidores. Não somos um escritório de advocacia e não
            representamos usuários.
          </p>

          <p style={{ marginTop: 14 }}><strong style={{ color: "#1a2340" }}>O que você recebe:</strong></p>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            <li>E-mail de notificação formatado com a legislação aplicável</li>
            <li>Petição para o Juizado Especial Cível pronta para protocolar</li>
            <li>Guia de acompanhamento com as etapas do processo</li>
          </ul>

          <p style={{ marginTop: 14 }}><strong style={{ color: "#1a2340" }}>O que é você quem faz:</strong></p>
          <p>
            Você envia o e-mail do seu próprio endereço. Você assina e protocola a petição.
            Você comparece à audiência. A Clara te arma com informação — a ação é
            inteiramente sua.
          </p>

          <p style={{ marginTop: 14 }}><strong style={{ color: "#1a2340" }}>Pagamento:</strong></p>
          <p>
            R$49,90 por caso — pagamento único. Sem taxa de êxito. Sem cobrança adicional.
          </p>

          <p style={{
            marginTop: 14,
            fontSize: 12,
            color: "#92400e",
            background: "#FFF9ED",
            border: "1px solid #fcd34d",
            borderRadius: 10,
            padding: "14px 16px",
          }}>
            ⚠️ A Clara Law não é um escritório de advocacia e não representa o usuário.
            Os documentos gerados são orientativos e para uso exclusivo do próprio usuário.
            Para casos complexos, consulte um advogado.
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
          Li e concordo. Entendo que a Clara Law é uma ferramenta educacional e
          que sou eu quem age em meu nome.
        </label>

        {aceito && (
          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 14, paddingLeft: 30 }}>
            📄 Uma cópia PDF dos termos será baixada para o seu dispositivo.
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
