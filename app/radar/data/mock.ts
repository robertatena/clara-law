// ─────────────────────────────────────────────────────────────
//  EDIÇÕES DEMONSTRATIVAS DO RADAR DO CONSUMIDOR
// ─────────────────────────────────────────────────────────────
//
//  ESTES DADOS NÃO SÃO REAIS. São conteúdo de calibragem enquanto a
//  automação (Clara Radar → geração editorial → aprovação humana)
//  não está ativa. A UI exibe banner de "Prévia" enquanto
//  `isDemoData: true`.
//
//  Como editar:
//   - alterar os campos dentro dos objetos abaixo
//   - manter `isDemoData: true` até termos edição real publicada
//   - a edição mais recente (primeira no array) é servida em `/radar`
//   - as demais aparecem em `/radar/{ano}/{mes}/semana-{n}`
//
//  Como adicionar nova edição de teste:
//   - copiar um objeto existente
//   - inserir NO INÍCIO do array `MOCK_EDICOES` (mais recente primeiro)
//   - ajustar `id`, `slug`, `ano`, `numeroSemana`, `periodoInicio/Fim`
//
//  Quando conectar Supabase/API real:
//   - ver `service.ts` (fase 2)
//   - este arquivo continua existindo como referência de contrato de dados
//
// ─────────────────────────────────────────────────────────────

import type { EdicaoRadar } from "../types";

export const IS_DEMO_DATA = true;

// Ordem: mais recente primeiro. A primeira é a servida em `/radar`.
export const MOCK_EDICOES: EdicaoRadar[] = [
  {
    id: "2026-w33",
    slug: "2026/08/semana-33",
    ano: 2026,
    numeroSemana: 33,
    periodoInicio: "2026-08-10",
    periodoFim: "2026-08-16",
    publicadoEm: "2026-08-17T09:00:00.000Z",
    status: "publicado",
    fonteDados: "mock",
    isDemoData: IS_DEMO_DATA,

    resumoSemana:
      "A semana foi marcada pelo avanço de relatos envolvendo cobranças que persistem depois de cancelamentos e negativações que aparecem sem aviso prévio. Bloqueios bancários por análise de segurança também seguem entre as reclamações mais frequentes.",

    temas: [
      {
        slug: "cobranca-indevida",
        titulo: "Cobrança indevida",
        chapeu: "ganhou força nesta semana",
        relatos: 47,
        variacaoPct: 32,
        tendencia: "em_alta",
        textoEditorial:
          "Cobranças que continuam aparecendo mesmo depois de pedidos formais de cancelamento marcaram a semana — em especial em assinaturas de streaming, academias e serviços contínuos. Em vários relatos, o valor volta a ser debitado no cartão semanas depois, sem novo aviso ou justificativa clara. O padrão aponta pra falhas no processamento do próprio cancelamento. Nesses casos, guardar protocolo e comprovante costuma ser o primeiro passo pra reverter.",
        padroes: [
          "cobrança após cancelamento confirmado por protocolo",
          "débito desconhecido aparecendo na fatura",
          "renovação automática não autorizada",
          "dificuldade em obter estorno mesmo com comprovação",
        ],
        noticiaRelacionada: {
          titulo: "Procon-SP registra alta em queixas de assinaturas digitais no 1º semestre",
          veiculo: "Procon-SP",
          url: "https://www.procon.sp.gov.br/",
          dataPublicacao: "2026-08-12",
          resumoCurto:
            "Órgão de defesa do consumidor de São Paulo aponta crescimento de reclamações contra plataformas de streaming e serviços por assinatura no primeiro semestre.",
        },
      },
      {
        slug: "negativacao-indevida",
        titulo: "Negativação indevida",
        chapeu: "seguiu em ritmo crescente",
        relatos: 31,
        variacaoPct: 21,
        tendencia: "crescendo",
        textoEditorial:
          "Nomes incluídos em órgãos de proteção ao crédito por dívidas já quitadas ou nunca contraídas aparecem com frequência entre os relatos da semana — em muitos casos sem qualquer notificação prévia ao consumidor. Também aparecem situações em que a dívida foi paga há meses e a marca não foi retirada. Quando o aviso prévio não ocorreu, há base pra pedir a retirada imediata e, eventualmente, reparação.",
        padroes: [
          "negativação sem notificação prévia por escrito",
          "dívida já paga há meses ainda registrada",
          "score baixo sem justificativa aparente",
          "dificuldade em obter comprovação da origem da dívida",
        ],
      },
      {
        slug: "conta-bancaria-bloqueada",
        titulo: "Conta bancária bloqueada",
        chapeu: "manteve alta relevância",
        relatos: 24,
        variacaoPct: 18,
        tendencia: "crescendo",
        textoEditorial:
          "Bloqueios unilaterais de contas por suspeita de fraude ou análise de segurança seguem entre os relatos frequentes, com prazo indefinido pra resolução e canais de atendimento limitados. A situação atinge principalmente contas digitais e afeta o pagamento de compromissos essenciais. Nesses casos, o banco tem obrigação de dar prazo razoável e justificativa clara — canais como Banco Central e Procon podem ser acionados quando isso não acontece.",
        padroes: [
          "bloqueio sem aviso prévio ao titular",
          "análise de segurança prolongada por mais de 30 dias",
          "dificuldade de contato humano com o banco",
          "impacto no pagamento de contas essenciais",
        ],
      },
      {
        slug: "golpe-pix",
        titulo: "Golpe / Pix",
        chapeu: "continuou em crescimento",
        relatos: 21,
        variacaoPct: 12,
        tendencia: "crescendo",
        textoEditorial:
          "Transferências Pix feitas sob engano ou coação continuam entre os relatos frequentes da semana. Os padrões incluem falsos atendentes de banco por telefone e compras em lojas falsas nas redes sociais. Bancos costumam alegar autorização válida do titular, o que dificulta o estorno automático — o mecanismo de devolução previsto pelo Banco Central pode ser ativado em casos comprovados de fraude, quando há boletim de ocorrência registrado.",
        padroes: [
          "engenharia social via mensagens em aplicativos",
          "falso atendente do banco por telefone",
          "compra em loja falsa em redes sociais",
          "dificuldade em obter estorno mesmo com BO registrado",
        ],
      },
      {
        slug: "cancelamento-voo",
        titulo: "Cancelamento de voo",
        chapeu: "manteve-se estável",
        relatos: 17,
        variacaoPct: 0,
        tendencia: "estavel",
        textoEditorial:
          "Atrasos e cancelamentos com assistência insuficiente ou reembolso demorado seguem entre os relatos recorrentes — com casos frequentes de passageiros sem hospedagem em atrasos noturnos e de reacomodação em voos com escalas ou dias distantes. A resolução 400 da Anac define o que a companhia deve oferecer em cada faixa de atraso, e o descumprimento é um dos caminhos concretos pra reparação.",
        padroes: [
          "sem hospedagem oferecida em atrasos noturnos",
          "reembolso em prazo muito longo",
          "reacomodação em voo com escalas ou dia distante",
          "dificuldade em contato com atendimento após o incidente",
        ],
      },
    ],

    outrosTemas: [
      { titulo: "Telefonia e internet", relatos: 12, variacaoPct: 4 },
      { titulo: "Marketplace / entrega", relatos: 9, variacaoPct: -8 },
      { titulo: "Plano de saúde", relatos: 7, variacaoPct: 15 },
      { titulo: "Energia elétrica", relatos: 5, variacaoPct: -12 },
    ],
  },

  // ─── Edição anterior (histórica) ────────────────────────────
  {
    id: "2026-w32",
    slug: "2026/08/semana-32",
    ano: 2026,
    numeroSemana: 32,
    periodoInicio: "2026-08-03",
    periodoFim: "2026-08-09",
    publicadoEm: "2026-08-10T09:00:00.000Z",
    status: "publicado",
    fonteDados: "mock",
    isDemoData: IS_DEMO_DATA,

    resumoSemana:
      "Semana com forte presença de relatos sobre atrasos e cancelamentos aéreos e cobranças indevidas em serviços por assinatura. Golpes envolvendo Pix voltaram a aparecer com frequência.",

    temas: [
      {
        slug: "cancelamento-voo",
        titulo: "Cancelamento de voo",
        chapeu: "liderou os relatos da semana",
        relatos: 42,
        variacaoPct: 55,
        tendencia: "em_alta",
        textoEditorial:
          "Uma onda de atrasos e cancelamentos concentrou o volume de relatos da semana. Passageiros descreveram falta de assistência, reacomodação distante da rota original e dificuldade de reembolso. A resolução 400 da Anac prevê deveres específicos da companhia em cada faixa de atraso — e o não cumprimento é um caminho concreto pra reparação no Juizado Especial.",
        padroes: [
          "atrasos superiores a 4 horas sem alimentação oferecida",
          "cancelamentos noturnos sem hospedagem",
          "reembolso em prazo superior a 30 dias",
          "reacomodação em voo com múltiplas escalas",
        ],
      },
      {
        slug: "cobranca-indevida",
        titulo: "Cobrança indevida",
        chapeu: "continuou entre os temas mais citados",
        relatos: 36,
        variacaoPct: 10,
        tendencia: "crescendo",
        textoEditorial:
          "Assinaturas que voltam a cobrar após cancelamento formal e débitos desconhecidos em fatura seguem entre os padrões observados da semana. Em vários relatos, os valores voltam a ser debitados semanas depois do cancelamento confirmado. Guardar protocolo e prints do atendimento costuma ser o passo mais efetivo pra reverter.",
        padroes: [
          "cobrança após cancelamento confirmado",
          "débito desconhecido na fatura",
          "renovação automática não autorizada",
        ],
      },
      {
        slug: "golpe-pix",
        titulo: "Golpe / Pix",
        chapeu: "voltou ao radar",
        relatos: 19,
        variacaoPct: 8,
        tendencia: "crescendo",
        textoEditorial:
          "Golpes com transferência Pix voltaram a aparecer com frequência, principalmente envolvendo falsos atendentes de banco por telefone. Também aparecem relatos de compras em lojas falsas nas redes sociais. Nesses casos, registrar BO imediatamente é passo importante pra ativar o mecanismo de devolução previsto pelo Banco Central.",
        padroes: [
          "falso atendente do banco por telefone",
          "engenharia social via aplicativos de mensagem",
          "compra em loja falsa nas redes sociais",
        ],
      },
    ],

    outrosTemas: [
      { titulo: "Negativação indevida", relatos: 15, variacaoPct: -6 },
      { titulo: "Conta bancária bloqueada", relatos: 11, variacaoPct: 2 },
      { titulo: "Telefonia e internet", relatos: 9, variacaoPct: -3 },
    ],
  },
];
