"use client";

import React, { useMemo, useState } from "react";
import type { FindingLite } from "@/lib/complaints";
import { templateReclameAqui, templateConsumidorGov, templateProcon } from "@/lib/complaints";

type Props = {
  consumerName?: string;
  consumerEmail?: string;
  consumerPhone?: string;
  companyName?: string;
  contractType?: string;
  role?: string;
  summary?: string;
  selectedFindings: FindingLite[];
  onClear?: () => void;
};

type TabKey = "reclame" | "gov" | "procon";

export default function ComplaintActions(props: Props) {
  const [tab, setTab] = useState<TabKey>("reclame");

  const text = useMemo(() => {
    const ctx = {
      consumerName: props.consumerName,
      consumerEmail: props.consumerEmail,
      consumerPhone: props.consumerPhone,
      companyName: props.companyName,
      contractType: props.contractType,
      role: props.role,
      summary: props.summary,
      selectedFindings: props.selectedFindings || [],
    };
    if (tab === "gov") return templateConsumidorGov(ctx);
    if (tab === "procon") return templateProcon(ctx);
    return templateReclameAqui(ctx);
  }, [tab, props.consumerName, props.consumerEmail, props.consumerPhone, props.companyName, props.contractType, props.role, props.summary, props.selectedFindings]);

  function copy() {
    navigator.clipboard.writeText(text);
  }

  const links = {
    reclame: "https://www.reclameaqui.com.br/",
    gov: "https://www.consumidor.gov.br/",
    procon: "https://www.gov.br/mj/pt-br/assuntos/seus-direitos/consumidor/procons",
  };

  const header = tab === "reclame"
    ? { title: "Reclame Aqui", desc: "Útil para resolver rápido por reputação. Copie o texto e cole na reclamação." }
    : tab === "gov"
      ? { title: "Consumidor.gov.br", desc: "Canal oficial do governo. Bom para registro formal e tratativa com empresa cadastrada." }
      : { title: "Procon", desc: "Órgão de defesa do consumidor. Bom quando você precisa formalizar e anexar documentos." };

  return (
    <div style={{ border: "1px solid #E6E8EC", borderRadius: 20, padding: 18, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{header.title} — texto pronto</div>
          <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>{header.desc}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <a href={tab === "reclame" ? links.reclame : tab === "gov" ? links.gov : links.procon} target="_blank" rel="noreferrer"
             style={{ padding: "10px 12px", borderRadius: 999, border: "1px solid #E6E8EC", textDecoration: "none" }}>
            Abrir
          </a>
          <button onClick={copy}
            style={{ padding: "10px 12px", borderRadius: 999, border: "1px solid #0B2B4B", background: "#0B2B4B", color: "white", fontWeight: 700 }}>
            Copiar texto
          </button>
          {props.onClear ? (
            <button onClick={props.onClear}
              style={{ padding: "10px 12px", borderRadius: 999, border: "1px solid #E6E8EC", background: "white" }}>
              Limpar seleção
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => setTab("reclame")}
          style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #E6E8EC", background: tab === "reclame" ? "#F2F4F7" : "white" }}>
          Reclame Aqui
        </button>
        <button onClick={() => setTab("gov")}
          style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #E6E8EC", background: tab === "gov" ? "#F2F4F7" : "white" }}>
          Consumidor.gov.br
        </button>
        <button onClick={() => setTab("procon")}
          style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #E6E8EC", background: tab === "procon" ? "#F2F4F7" : "white" }}>
          Procon
        </button>
      </div>

      <textarea
        value={text}
        onChange={() => {}}
        readOnly
        style={{
          width: "100%",
          minHeight: 220,
          borderRadius: 14,
          border: "1px solid #E6E8EC",
          padding: 12,
          fontSize: 13,
          lineHeight: 1.4,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
        }}
      />

      <div style={{ marginTop: 10, fontSize: 12, color: "#667085" }}>
        Dica: selecione pontos clicando em “Adicionar à reclamação” em cada item. O texto acima se ajusta automaticamente.
      </div>
    </div>
  );
}
