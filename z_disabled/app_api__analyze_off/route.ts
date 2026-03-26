�export const runtime = "nodejs";

type User = { nome?: string; email?: string; telefone?: string; papel?: string };
type InDoc = { name: string; text: string };

function pick(s: string, max = 700) {
  const t = (s || "").replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "�&" : t;
}

function findFlags(text: string) {
  const t = (text || "").toLowerCase();

  const rules: { key: string; title: string; why: string; check: string; negotiate: string }[] = [
    {
      key: "multa",
      title: "Multa e penalidades",
      why: "Multas podem tornar a rescisão ou atraso muito caro.",
      check: "Verifique percentuais, base de cálculo (mensalidade/valor total), e se há teto.",
      negotiate: "Peça teto de multa, redução proporcional e prazo de cura (ex.: 10 dias)."
    },
    {
      key: "fidelidade",
      title: "Fidelidade / permanência mínima",
      why: "Pode prender você no contrato mesmo se o serviço não atender.",
      check: "Veja prazo, multa por saída e hipóteses de rescisão sem multa.",
      negotiate: "Inclua rescisão sem multa por descumprimento/SLA e teste inicial."
    },
    {
      key: "renov",
      title: "Renovação automática",
      why: "Você pode ficar preso sem perceber.",
      check: "Busque prazo de aviso prévio e como cancelar.",
      negotiate: "Exigir aviso por e-mail e opção de não renovação com clique."
    },
    {
      key: "reaj",
      title: "Reajuste de preço",
      why: "Reajustes podem elevar custo acima do esperado.",
      check: "Confirme índice (IPCA/IGP-M), periodicidade e gatilhos extras.",
      negotiate: "Limitar reajuste a 1x/ano e vedar reajuste cumulativo por �custos�."
    },
    {
      key: "rescis",
      title: "Rescisão e aviso prévio",
      why: "Aviso longo pode virar custo adicional.",
      check: "Avalie prazo de aviso, pagamentos devidos e devolução de valores.",
      negotiate: "Reduzir aviso e prever encerramento imediato por falha grave."
    },
    {
      key: "foro",
      title: "Foro e jurisdição",
      why: "Foro distante aumenta custo para defender seus direitos.",
      check: "Veja se o foro é obrigatório e onde fica.",
      negotiate: "Preferir foro do domicílio do contratante/consumidor."
    },
    {
      key: "lgpd",
      title: "LGPD e dados pessoais",
      why: "Risco de responsabilidade por vazamento ou uso indevido.",
      check: "Checar bases legais, segurança, suboperadores e retenção.",
      negotiate: "Cláusulas claras de segurança, notificação de incidente e DPA."
    },
    {
      key: "exclus",
      title: "Exclusividade / não concorrência",
      why: "Pode limitar seu negócio ou liberdade de contratar.",
      check: "Veja duração, território, e penalidades.",
      negotiate: "Reduzir escopo e prazo; remover se não for essencial."
    },
    {
      key: "juros",
      title: "Juros, cobrança e encargos",
      why: "Pode inflar a dívida por atrasos pequenos.",
      check: "Confirme taxa, multa moratória e correção.",
      negotiate: "Padronizar encargos (multa + juros razoáveis) e tolerância."
    }
  ];

  const hits = rules.filter(r => t.includes(r.key));
  return hits.length ? hits : rules.slice(0, 4); // se não achar, mostra �padrão útil�
}

function buildEmail(user: User, pontos: unknown[], docs: InDoc[]) {
  const nome = user?.nome ? user.nome : "Olá";
  const assunto = "Solicitação de revisão de contrato (pontos para validar/negociar)";
  const bullets = (pontos as any[]).map((p: any) => `�" ${p.title}: ${p.check}`).join("\n");
  const nomesDocs = docs.map(d => d.name).join(", ");

  const corpo =
`${nome},

Estou analisando o(s) documento(s) (${nomesDocs}) e queria validar/negociar alguns pontos antes de assinar:

${bullets}

Você poderia me orientar sobre:
1) quais ajustes são mais importantes, e
2) qual redação sugerida para os pontos acima?

Obrigada!`;

  return { assunto, corpo };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return Response.json({ ok: false, error: "Body inválido. Envie JSON com { user, documents }." }, { status: 400 });
    }

    const user: User = body.user || {};
    const documents: InDoc[] = Array.isArray(body.documents) ? body.documents : [];

    if (!documents.length) {
      return Response.json({ ok: false, error: "Nenhum texto para analisar. Envie documents: [{name,text}]." }, { status: 400 });
    }

    const merged = documents.map(d => `### ${d.name}\n${d.text}`).join("\n\n");
    const pontos = findFlags(merged);

    const resumo =
      "Essencial para decidir agora:\n" +
      "�" O que você está aceitando (obrigações)\n" +
      "�" Onde costuma dar problema (multas, prazos, renovação, rescisão, reajuste, dados)\n" +
      "�" O que perguntar/negociar antes de assinar\n\n" +
      "Trecho do contrato (amostra): " + pick(merged, 520);

    const email = buildEmail(user, pontos, documents);

    return Response.json(
      {
        ok: true,
        resumo,
        pontos,
        email
      },
      { status: 200 }
    );
  } catch (e: unknown) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Erro interno em /api/analyze" }, { status: 500 });
  }
}

export async function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}


