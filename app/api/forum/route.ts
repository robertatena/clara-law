import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const FOROS_SP: Array<{
  ceps: [number, number][];
  foro: string;
  endereco: string;
  bairro: string;
  email: string;
  horario: string;
}> = [
  {
    ceps: [[1000000, 1999999]],
    foro: "Foro Central Cível — João Mendes Jr.",
    endereco: "Praça João Mendes, s/n — Centro",
    bairro: "Centro",
    email: "jec.central@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[2000000, 2999999]],
    foro: "Foro Regional I — Santana",
    endereco: "Av. Engenheiro Caetano Álvares, 594 — Santana",
    bairro: "Santana",
    email: "jec.santana@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[3000000, 3999999]],
    foro: "Foro Regional II — Santo Amaro",
    endereco: "Av. Adolfo Pinheiro, 1992 — Santo Amaro",
    bairro: "Santo Amaro",
    email: "jec.santoamaro@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[4000000, 4999999]],
    foro: "Foro Regional IV — Lapa",
    endereco: "Rua Guaicurus, 1000 — Lapa",
    bairro: "Lapa",
    email: "jec.lapa@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[5000000, 5399999]],
    foro: "Foro Regional VIII — Tatuapé",
    endereco: "Rua Taquari, 700 — Tatuapé",
    bairro: "Tatuapé",
    email: "jec.tatuape@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[5400000, 5599999]],
    foro: "Foro Regional VI — Penha",
    endereco: "Av. Penha de França, 432 — Penha",
    bairro: "Penha",
    email: "jec.penha@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[5600000, 5799999]],
    foro: "Foro Regional XI — Pinheiros",
    endereco: "Av. Pedroso de Morais, 1553 — Pinheiros",
    bairro: "Pinheiros",
    email: "jec.pinheiros@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[5800000, 5999999]],
    foro: "Foro Regional X — Ipiranga",
    endereco: "Rua dos Patriotas, 393 — Ipiranga",
    bairro: "Ipiranga",
    email: "jec.ipiranga@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[6000000, 6499999]],
    foro: "Foro Regional III — Jabaquara",
    endereco: "Rua Jabaquara, 1000 — Jabaquara",
    bairro: "Jabaquara",
    email: "jec.jabaquara@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[6500000, 6999999]],
    foro: "Foro Regional VII — Itaquera",
    endereco: "Av. Itaquera, 500 — Itaquera",
    bairro: "Itaquera",
    email: "jec.itaquera@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[7000000, 7999999]],
    foro: "Foro Regional V — São Miguel Paulista",
    endereco: "Av. Marechal Tito, 1900 — São Miguel Paulista",
    bairro: "São Miguel Paulista",
    email: "jec.saomiguelpaulista@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
  {
    ceps: [[8000000, 8999999]],
    foro: "Foro Regional IX — Vila Prudente",
    endereco: "Rua Arlindo Béttio, 600 — Vila Prudente",
    bairro: "Vila Prudente",
    email: "jec.vilaprudente@tjsp.jus.br",
    horario: "Seg–Sex, 9h–17h",
  },
];

function buscarForo(cepNumerico: number) {
  for (const f of FOROS_SP) {
    for (const [min, max] of f.ceps) {
      if (cepNumerico >= min && cepNumerico <= max) return f;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get("cep") ?? "";
  const cepLimpo = cep.replace(/\D/g, "");

  if (cepLimpo.length !== 8) {
    return NextResponse.json({ erro: "CEP inválido. Digite 8 números." }, { status: 400 });
  }

  const cepNum = parseInt(cepLimpo, 10);

  // Tenta API real do TJSP
  try {
    const tjspUrl = `https://esaj.tjsp.jus.br/serjus/pesquisar-foro-cep.do?cep=${cepLimpo}&dadosPesquisaComarca.radioTipoPesquisa=cep`;
    const res = await fetch(tjspUrl, {
      headers: { "User-Agent": "ClaraLaw/1.0" },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/Foro\s+[\wÀ-ÿ][^<]{2,60}/i);
      if (match) {
        const foroLocal = buscarForo(cepNum);
        return NextResponse.json({
          encontrado: true,
          fonte: "tjsp",
          foro: match[0].trim(),
          endereco: foroLocal?.endereco ?? "Consulte o site do TJSP para o endereço exato",
          email: foroLocal?.email ?? "atendimento@tjsp.jus.br",
          horario: foroLocal?.horario ?? "Seg–Sex, 9h–17h",
          cep: cepLimpo,
          aviso: "Resultado baseado no índice geográfico do TJSP. A competência pode variar conforme a matéria.",
        });
      }
    }
  } catch {
    // API do TJSP inacessível — usa mapa local
  }

  // Fallback: mapa local
  const foro = buscarForo(cepNum);

  if (!foro) {
    return NextResponse.json({
      encontrado: false,
      mensagem: "CEP fora da cobertura mapeada. Consulte diretamente o site do TJSP.",
      link: "https://esaj.tjsp.jus.br/serjus/pesquisar-foro-cep.do",
    });
  }

  return NextResponse.json({
    encontrado: true,
    fonte: "mapa_local",
    foro: foro.foro,
    endereco: foro.endereco,
    bairro: foro.bairro,
    email: foro.email,
    horario: foro.horario,
    cep: cepLimpo,
    aviso: "Resultado orientativo baseado no índice do TJSP. Confirme sempre em tjsp.jus.br.",
  });
}
