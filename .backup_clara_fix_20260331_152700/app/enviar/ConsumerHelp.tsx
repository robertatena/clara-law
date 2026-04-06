"use client";

import React, { useMemo, useState } from "react";

type Props = {
  draftText?: string;
  companyName?: string;
};

function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

function Button({ children, onClick, variant = "primary" }: any) {
  const base: React.CSSProperties = {
    border: "1px solid #E6E8EC",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    background: variant === "primary" ? "#0B2A3E" : "#fff",
    color: variant === "primary" ? "#fff" : "#0B2A3E",
  };
  return (
    <button style={base} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function Card({ title, subtitle, children, right }: any) {
  return (
    <div
      style={{
        border: "1px solid #E6E8EC",
        borderRadius: 18,
        padding: 18,
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#0B2A3E" }}>{title}</div>
          {subtitle ? <div style={{ marginTop: 4, color: "#667085", fontSize: 13 }}>{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  );
}

export default function ConsumerHelp({ draftText, companyName }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const baseText = useMemo(() => {
    const who = companyName ? `Empresa/fornecedor: ${companyName}\n\n` : "";
    const body =
      draftText?.trim() ||
      "Olá! Segue minha solicitação de solução com base no contrato/análise realizada.\n\n[Descreva o problema]\n\nPeço retorno com proposta de solução e prazo.\n\nObrigada(o).";
    return `${who}${body}`.trim();
  }, [draftText, companyName]);

  const reclameaquiUrl = "https://www.reclameaqui.com.br/";
  const consumidorGovUrl = "https://www.consumidor.gov.br/";
  const proconUrl = "https://www.gov.br/pt-br/servicos/registrar-reclamacao-no-procon";

  const Section = ({ label, hint, url, templateIntro }: any) => {
    const text = `${templateIntro}\n\n${baseText}`;
    return (
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ fontSize: 13, color: "#667085" }}>{hint}</div>

        <textarea
          value={text}
          readOnly
          style={{
            width: "100%",
            minHeight: 140,
            borderRadius: 14,
            border: "1px solid #E6E8EC",
            padding: 12,
            fontFamily: "inherit",
            fontSize: 13,
            lineHeight: 1.45,
            background: "#FAFAFB",
          }}
        />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            onClick={async () => {
              await copyToClipboard(text);
              setCopied(label);
              setTimeout(() => setCopied(null), 1400);
            }}
          >
            {copied === label ? "Copiado ✅" : "Copiar texto"}
          </Button>

          <Button variant="secondary" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
            Abrir site
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: "#0B2A3E" }}>
        Resolver agora (passo a passo)
      </div>
      <div style={{ color: "#667085", fontSize: 14, lineHeight: 1.4 }}>
        Use a análise acima para registrar sua reclamação com texto pronto. Recomendação prática:
        <b> tente primeiro o fornecedor</b>, depois <b>Reclame Aqui</b> e, se necessário, <b>Consumidor.gov.br</b> ou <b>Procon</b>.
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <Card
          title="1) Reclame Aqui — texto pronto"
          subtitle="Bom para resolver rápido por reputação."
          right={<span style={{ fontSize: 12, color: "#667085" }}>~3 min</span>}
        >
          <Section
            label="ra"
            hint="O que é: plataforma pública de reputação. Empresas costumam responder para evitar nota baixa."
            url={reclameaquiUrl}
            templateIntro="Assunto: Solicitação de solução (com base no contrato)"
          />
        </Card>

        <Card
          title="2) Consumidor.gov.br — texto pronto"
          subtitle="Canal oficial do governo. Muitas empresas são obrigadas a responder."
          right={<span style={{ fontSize: 12, color: "#667085" }}>~5–8 min</span>}
        >
          <Section
            label="gov"
            hint="O que é: canal oficial de resolução de conflitos de consumo, com acompanhamento."
            url={consumidorGovUrl}
            templateIntro="Relato do problema (com base no contrato)"
          />
        </Card>

        <Card
          title="3) Procon — texto pronto"
          subtitle="Quando não resolveu antes, o Procon formaliza e orienta próximos passos."
          right={<span style={{ fontSize: 12, color: "#667085" }}>~10–15 min</span>}
        >
          <Section
            label="procon"
            hint="O que é: órgão de defesa do consumidor. Você pode precisar anexar contrato, comprovantes e conversas."
            url={proconUrl}
            templateIntro="Descrição objetiva + pedido (com base no contrato)"
          />
        </Card>
      </div>
    </div>
  );
}
