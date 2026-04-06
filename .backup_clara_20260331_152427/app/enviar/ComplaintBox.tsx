"use client";

type Props = {
  companyName?: string;
  contractType?: string;
  summary?: string;
  points?: any[];
  email?: string;
};

function safe(s?: string) {
  return (s || "").trim();
}

export default function ComplaintBox(props: Props) {
  const company = safe(props.companyName) || "a empresa";
  const contractType = safe(props.contractType) || "contrato";
  const summary = safe(props.summary) || "";
  const bullets = (props.points || []).slice(0, 6).map((p: any) => {
    const t = p?.title || p?.name || p?.headline || "";
    const w = p?.whyItMatters || p?.why || "";
    const a = p?.whatToDo || p?.action || "";
    return { t: String(t), w: String(w), a: String(a) };
  });

  const raText =
`Olá, estou registrando esta reclamação contra ${company}.

Contexto:
- Tipo: ${contractType}
- Motivo: divergência/condições do contrato (resumo abaixo)

Resumo do problema:
${summary || "(preencha aqui em 1-2 frases o que ocorreu)"}

Pontos para alinhar:
${bullets.length ? bullets.map((b, i) => `- ${b.t}${b.w ? ` (por que importa: ${b.w})` : ""}${b.a ? ` (o que fazer: ${b.a})` : ""}`).join("\n") : "- (adicione aqui os principais pontos)"}

O que eu peço:
- Correção/ajuste das condições contratuais, com confirmação por escrito
- Prazo para resposta e solução

Anexos:
- Contrato (PDF) e evidências (prints/e-mails), se aplicável.

Aguardo retorno.
`;

  const proconText =
`Ao PROCON,

Venho relatar possível prática abusiva/conduta inadequada envolvendo ${company}.

1) Identificação do consumidor:
- Nome: (preencher)
- CPF: (preencher)
- Contato: (preencher)

2) Fornecedor reclamado:
- Empresa: ${company}
- CNPJ/endereço: (se souber, preencher)

3) Relato objetivo:
${summary || "(descreva o que aconteceu, datas e o que foi prometido vs entregue)"}

4) Pontos principais:
${bullets.length ? bullets.map((b) => `- ${b.t}`).join("\n") : "- (adicione pontos)"}

5) Pedido:
- Intermediação para solução/adequação do contrato
- Cancelamento/ressarcimento/ajuste (conforme o caso)
- Registro formal de resposta

Anexos:
- Contrato, comprovantes, conversas, e-mails, prints.
`;

  async function copy(txt: string) {
    await navigator.clipboard.writeText(txt);
    alert("Texto copiado ✅");
  }

  return (
    <div style={{ border: "1px solid #E6E8EC", borderRadius: 18, padding: 16, background: "#fff" }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Resolver isso agora</h3>
      <p style={{ marginTop: 8, color: "#475467" }}>
        Abaixo você tem <b>textos prontos</b> para registrar sua reclamação. (A Clara não é advogada — é apoio para organizar.)
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ border: "1px solid #EEF2F6", borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>Reclame Aqui</div>
          <div style={{ color: "#667085", fontSize: 13, marginTop: 6 }}>
            Plataforma pública onde consumidores registram reclamações e empresas respondem.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <a href="https://www.reclameaqui.com.br/" target="_blank" rel="noreferrer">Abrir Reclame Aqui</a>
            <button onClick={() => copy(raText)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #D0D5DD", background: "#fff" }}>
              Copiar texto pronto
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #EEF2F6", borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>PROCON</div>
          <div style={{ color: "#667085", fontSize: 13, marginTop: 6 }}>
            Órgão de defesa do consumidor. Em SP, você pode iniciar online e anexar documentos.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <a href="https://www.procon.sp.gov.br/" target="_blank" rel="noreferrer">Abrir Procon-SP</a>
            <button onClick={() => copy(proconText)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #D0D5DD", background: "#fff" }}>
              Copiar texto pronto
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #EEF2F6", borderRadius: 14, padding: 12 }}>
          <div style={{ fontWeight: 700 }}>Consumidor.gov.br</div>
          <div style={{ color: "#667085", fontSize: 13, marginTop: 6 }}>
            Canal oficial para registrar reclamações com empresas participantes.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <a href="https://www.consumidor.gov.br/" target="_blank" rel="noreferrer">Abrir Consumidor.gov.br</a>
          </div>
        </div>
      </div>
    </div>
  );
}
