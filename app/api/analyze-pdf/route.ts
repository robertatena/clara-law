import { NextResponse } from "next/server";

export const runtime = "nodejs";

function safeJson(data: any, status = 200) {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function GET() {
  return safeJson({ ok: true, route: "analyze-pdf" });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const contractType = String(formData.get("contractType") || "");
    const papel = String(formData.get("papelNoContrato") || "");
    const parte = String(formData.get("parteImportante") || "");
    const contexto = String(formData.get("contextoExtra") || "");

    const resposta = {
      nota_geral: 6.8,
grafico_risco: {
  financeiro: 68,
  saida: 82,
  obrigacoes: 63
},
      resumo: `Análise inicial do contrato de "${contractType}".`,
      riscos_principais: [
        {
          titulo: "Multa e penalidades",
          linguagem_simples: "Pode existir um custo inesperado se você quiser sair do contrato ou descumprir alguma regra.",
          risco: "medio"
        },
        {
          titulo: "Cancelamento e saída",
          linguagem_simples: "Vale entender como você pode encerrar o contrato e se existe aviso prévio ou cobrança.",
          risco: "alto"
        },
        {
          titulo: "Responsabilidades",
          linguagem_simples: "O contrato pode jogar para você obrigações ou prejuízos que nem sempre ficam claros na primeira leitura.",
          risco: "medio"
        }
      ],
      pontos_atencao: [
        {
          titulo: "Multa e penalidades",
          explicacao: "Verifique quando a multa pode ser aplicada, qual é o valor e se ela é proporcional.",
          risco: "medio",
          por_que_importa: "Pode gerar custo inesperado."
        },
        {
          titulo: "Rescisão e cancelamento",
          explicacao: "Veja se existe aviso prévio, prazo mínimo ou cobrança para encerrar a relação.",
          risco: "alto",
          por_que_importa: "Afeta sua liberdade de sair do contrato."
        },
        {
          titulo: "Distribuição de responsabilidades",
          explicacao: "Revise quais situações ficam sob sua responsabilidade e quais ficam com a outra parte.",
          risco: "medio",
          por_que_importa: "Isso pode afetar custos, obrigações e disputas futuras."
        }
      ],
      perguntas_para_negociar: [
        "Posso cancelar sem multa? Em quais situações?",
        "Existe reajuste? Como ele será calculado?",
        "Quais obrigações ficam comigo e quais ficam com a outra parte?",
        parte ? `Podemos revisar especificamente este ponto: ${parte}?` : "Qual ponto merece mais atenção?"
      ],
      base_legal: [
  {
    titulo: "Código Civil",
    fundamento: "As relações contratuais em geral seguem regras do Código Civil, especialmente sobre validade do contrato, boa-fé, obrigações, inadimplemento e rescisão."
  },
  {
    titulo: "Código de Defesa do Consumidor",
    fundamento: "Quando houver relação de consumo, cláusulas que criem desvantagem exagerada ou informação pouco clara podem exigir revisão mais cuidadosa."
  }
],

analise_completa: {
        leitura_detalhada: [
          "O contrato pede atenção especial para regras de saída, cobrança e responsabilidades.",
          `Como você se identificou como "${papel || "parte do contrato"}", vale olhar com cuidado cláusulas que criem obrigação financeira ou operacional.`,
          "Mesmo quando a redação parece simples, pontos de multa, prazo e cancelamento costumam concentrar mais risco."
        ],
        recomendacoes: [
          "Peça confirmação por escrito sobre cancelamento, multa e reajuste.",
          "Evite assinar sem entender exatamente as hipóteses de cobrança.",
          "Se houver custo relevante, tente negociar linguagem mais objetiva."
        ]
      },
      email_pronto: {
        assunto: "Pontos para revisar no contrato",
        corpo:
`Olá,

Fiz uma leitura inicial do contrato e identifiquei alguns pontos que gostaria de revisar antes de seguir:

1. Multa e penalidades
Quero entender em quais situações a multa pode ser aplicada, como ela é calculada e se existe proporcionalidade.

2. Cancelamento / rescisão
Gostaria de confirmar quais são as regras para encerrar o contrato, incluindo aviso prévio, prazos e possíveis cobranças.

3. Responsabilidades
Quero esclarecer quais obrigações ficam sob minha responsabilidade e quais ficam com a outra parte.

4. ${parte || "Ponto principal de atenção"}
Peço também uma revisão específica desse ponto, para garantir que a redação esteja clara.

Podemos alinhar esses itens antes da assinatura?

Obrigada.`
      },
      orientacao_final:
        "Use esta análise como mapa inicial. Se houver custo alto, prazo longo ou obrigação pouco clara, vale revisar com cuidado antes de assinar.",
      paywall: {
        locked: true,
        cta: "Veja a análise completa",
        subtexto: "Disponível após o pagamento"
      }
    };

    return safeJson(resposta);
  } catch (err: any) {
    return safeJson(
      {
        error: "Erro controlado",
        detalhe: err?.message || "desconhecido"
      },
      500
    );
  }
}

