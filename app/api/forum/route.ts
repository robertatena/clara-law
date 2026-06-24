import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ─── MAPA RICO: SP CAPITAL ─────────────────────────────────────────────────────
// Foros regionais cíveis da capital paulista, por faixa de CEP.
// Dados curados manualmente — endereço/email confirmados em tjsp.jus.br.
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

// ─── MAPA NACIONAL: UF → TRIBUNAL DE JUSTIÇA ──────────────────────────────────
// Para qualquer CEP brasileiro fora de SP capital, devolvemos o tribunal
// competente da UF e o link oficial onde o cidadão pode encontrar o JEC da
// sua comarca. Não chumbamos endereço/email de JECs locais que não foram
// verificados — informação jurídica errada é pior que ausência de info.
const TRIBUNAIS_BR: Record<string, { tribunal: string; sigla: string; buscaUrl: string; estado: string }> = {
  AC: { estado: "Acre",                tribunal: "Tribunal de Justiça do Acre",                sigla: "TJAC", buscaUrl: "https://www.tjac.jus.br/" },
  AL: { estado: "Alagoas",             tribunal: "Tribunal de Justiça de Alagoas",             sigla: "TJAL", buscaUrl: "https://www.tjal.jus.br/" },
  AM: { estado: "Amazonas",            tribunal: "Tribunal de Justiça do Amazonas",            sigla: "TJAM", buscaUrl: "https://www.tjam.jus.br/" },
  AP: { estado: "Amapá",               tribunal: "Tribunal de Justiça do Amapá",               sigla: "TJAP", buscaUrl: "https://www.tjap.jus.br/" },
  BA: { estado: "Bahia",               tribunal: "Tribunal de Justiça da Bahia",               sigla: "TJBA", buscaUrl: "https://www.tjba.jus.br/" },
  CE: { estado: "Ceará",               tribunal: "Tribunal de Justiça do Ceará",               sigla: "TJCE", buscaUrl: "https://www.tjce.jus.br/" },
  DF: { estado: "Distrito Federal",    tribunal: "Tribunal de Justiça do Distrito Federal e Territórios", sigla: "TJDFT", buscaUrl: "https://www.tjdft.jus.br/" },
  ES: { estado: "Espírito Santo",      tribunal: "Tribunal de Justiça do Espírito Santo",      sigla: "TJES", buscaUrl: "https://www.tjes.jus.br/" },
  GO: { estado: "Goiás",               tribunal: "Tribunal de Justiça de Goiás",               sigla: "TJGO", buscaUrl: "https://www.tjgo.jus.br/" },
  MA: { estado: "Maranhão",            tribunal: "Tribunal de Justiça do Maranhão",            sigla: "TJMA", buscaUrl: "https://www.tjma.jus.br/" },
  MG: { estado: "Minas Gerais",        tribunal: "Tribunal de Justiça de Minas Gerais",        sigla: "TJMG", buscaUrl: "https://www.tjmg.jus.br/" },
  MS: { estado: "Mato Grosso do Sul",  tribunal: "Tribunal de Justiça de Mato Grosso do Sul",  sigla: "TJMS", buscaUrl: "https://www.tjms.jus.br/" },
  MT: { estado: "Mato Grosso",         tribunal: "Tribunal de Justiça de Mato Grosso",         sigla: "TJMT", buscaUrl: "https://www.tjmt.jus.br/" },
  PA: { estado: "Pará",                tribunal: "Tribunal de Justiça do Pará",                sigla: "TJPA", buscaUrl: "https://www.tjpa.jus.br/" },
  PB: { estado: "Paraíba",             tribunal: "Tribunal de Justiça da Paraíba",             sigla: "TJPB", buscaUrl: "https://www.tjpb.jus.br/" },
  PE: { estado: "Pernambuco",          tribunal: "Tribunal de Justiça de Pernambuco",          sigla: "TJPE", buscaUrl: "https://www.tjpe.jus.br/" },
  PI: { estado: "Piauí",               tribunal: "Tribunal de Justiça do Piauí",               sigla: "TJPI", buscaUrl: "https://www.tjpi.jus.br/" },
  PR: { estado: "Paraná",              tribunal: "Tribunal de Justiça do Paraná",              sigla: "TJPR", buscaUrl: "https://www.tjpr.jus.br/" },
  RJ: { estado: "Rio de Janeiro",      tribunal: "Tribunal de Justiça do Rio de Janeiro",      sigla: "TJRJ", buscaUrl: "https://www.tjrj.jus.br/" },
  RN: { estado: "Rio Grande do Norte", tribunal: "Tribunal de Justiça do Rio Grande do Norte", sigla: "TJRN", buscaUrl: "https://www.tjrn.jus.br/" },
  RO: { estado: "Rondônia",            tribunal: "Tribunal de Justiça de Rondônia",            sigla: "TJRO", buscaUrl: "https://www.tjro.jus.br/" },
  RR: { estado: "Roraima",             tribunal: "Tribunal de Justiça de Roraima",             sigla: "TJRR", buscaUrl: "https://www.tjrr.jus.br/" },
  RS: { estado: "Rio Grande do Sul",   tribunal: "Tribunal de Justiça do Rio Grande do Sul",   sigla: "TJRS", buscaUrl: "https://www.tjrs.jus.br/" },
  SC: { estado: "Santa Catarina",      tribunal: "Tribunal de Justiça de Santa Catarina",      sigla: "TJSC", buscaUrl: "https://www.tjsc.jus.br/" },
  SE: { estado: "Sergipe",             tribunal: "Tribunal de Justiça de Sergipe",             sigla: "TJSE", buscaUrl: "https://www.tjse.jus.br/" },
  SP: { estado: "São Paulo",           tribunal: "Tribunal de Justiça de São Paulo",           sigla: "TJSP", buscaUrl: "https://esaj.tjsp.jus.br/serjus/pesquisar-foro-cep.do" },
  TO: { estado: "Tocantins",           tribunal: "Tribunal de Justiça do Tocantins",           sigla: "TJTO", buscaUrl: "https://www.tjto.jus.br/" },
};

// ─── MAPA NACIONAL: CAPITAIS + GRANDES CIDADES ─────────────────────────────────
// Curadoria manual a partir dos portais oficiais dos TJs estaduais (junho/2026).
// Princípios:
//  - Só registramos dado citado em fonte (TJ oficial ou snippet que aponta para a)
//  - `verificado` indica nível de confiança:
//      "tj_oficial_fetch" → confirmamos lendo a página oficial diretamente
//      "busca_oficial"    → snippet de busca cita o TJ oficial com dados coerentes
//      "parcial"          → faltam campos relevantes (ver `observacoes`)
//  - Campos ausentes (email/horário) são INTENCIONAIS: preferimos lacuna a chumbo errado
// Chave: `${UF}|${cidadeNormalizada}` (lowercase sem acento)
type ForoNacional = {
  cidade: string;
  uf: string;
  foro: string;
  endereco: string;
  email?: string;
  telefone?: string;
  horario?: string;
  fonte: string;
  verificado: "tj_oficial_fetch" | "busca_oficial" | "parcial";
  verificadoEm: string; // ISO 8601 (YYYY-MM-DD) — para auditoria e revalidação periódica
  observacoes?: string;
};

const FOROS_NACIONAIS: Record<string, ForoNacional> = {
  "AC|rio branco": {
    cidade: "Rio Branco", uf: "AC",
    foro: "Núcleo do 1º Juizado Especial Cível (FAAO)",
    endereco: "Estrada Dias Martins, 894, Jardim Primavera, Rio Branco/AC, CEP 69912-470",
    email: "jetra1rb@tjac.jus.br",
    telefone: "(68) 3226-3412",
    fonte: "https://www.tjac.jus.br/adm/juizados-especiais/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
  },
  "AL|maceio": {
    cidade: "Maceió", uf: "AL",
    foro: "1º Juizado Especial Cível da Capital",
    endereco: "Rua Jussara, Benedito Bentes, Maceió/AL, CEP 57084-800",
    email: "gab1jecc@tjal.jus.br",
    horario: "Seg–Sex, 7h30–13h30",
    fonte: "https://tjal.jus.br/juizado/juizados-capital",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Recomendado confirmar antes de comparecer pessoalmente.",
  },
  "AM|manaus": {
    cidade: "Manaus", uf: "AM",
    foro: "Fórum Central — Juizados Especiais Cíveis da Capital",
    endereco: "Rua Alexandre Amorim, 285, Aparecida, Manaus/AM, CEP 69010-300",
    horario: "Seg–Sex, 8h–14h",
    fonte: "https://juizados.tjam.jus.br/juizados/index.php/unidades-de-atendimento/unidades-de-atendimento-capital",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail específico não confirmado em fonte oficial.",
  },
  "AP|macapa": {
    cidade: "Macapá", uf: "AP",
    foro: "1ª Vara do Juizado Especial Cível Central",
    endereco: "Rua Odilardo Silva, s/n, Centro, Macapá/AP, CEP 68901-017",
    email: "jciv1.mcp@tjap.jus.br",
    telefone: "(96) 3312-3400",
    fonte: "https://www.tjap.jus.br/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
  },
  "BA|salvador": {
    cidade: "Salvador", uf: "BA",
    foro: "Central dos Juizados — Fórum Min. Adhemar Raymundo da Silva (1ª Vara)",
    endereco: "Rua Padre Casimiro Quiroga, Loteamento Rio das Pedras, Quadra 01, Lotes 1–10, Imbuí, Salvador/BA, CEP 41720-400",
    email: "ssa-1vsje-comuns@tjba.jus.br",
    telefone: "(71) 3372-7346",
    horario: "Seg–Sex, 7h–13h",
    fonte: "https://www.tjba.jus.br/juizadosespeciais/enderecos-e-telefones-capital/",
    verificado: "tj_oficial_fetch",
    verificadoEm: "2026-06-23",
  },
  "CE|fortaleza": {
    cidade: "Fortaleza", uf: "CE",
    foro: "1ª Unidade do Juizado Especial Cível",
    endereco: "Rua Dr. João Guilherme, 257, Antônio Bezerra, Fortaleza/CE, CEP 60356-770",
    email: "for.1jecc@tjce.jus.br",
    telefone: "(85) 3492-8325",
    horario: "Seg–Sex, 8h–18h (horário geral do TJCE — varia por unidade)",
    fonte: "https://www.tjce.jus.br/juizados-especiais/juizados-especiais/",
    verificado: "tj_oficial_fetch",
    verificadoEm: "2026-06-23",
    observacoes: "Fortaleza tem 20 unidades cíveis. Use o sistema SBJE do TJCE para a unidade exata por CEP: https://sbje.tjce.jus.br/sbje-web/pages/localiza_juizado.jsf",
  },
  "DF|brasilia": {
    cidade: "Brasília", uf: "DF",
    foro: "Fórum Des. José Júlio Leal Fagundes — Juizados Especiais Cíveis",
    endereco: "SMAS Trecho 4, Lotes 6/4, Bloco 4, 1º andar, Brasília/DF, CEP 70610-906",
    telefone: "(61) 3103-1776",
    fonte: "https://www.tjdft.jus.br/informacoes/juizados-especiais",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail das varas em tjdft.jus.br/funcionamento/enderecos-e-telefones-old/lista-de-emails-das-varas-e-juizados",
  },
  "ES|vitoria": {
    cidade: "Vitória", uf: "ES",
    foro: "Central de Reclamação e Distribuição dos Juizados Especiais",
    endereco: "Rua Juiz Alexandre Martins Castro Filho, 130, Santa Luíza, Vitória/ES, CEP 29045-250",
    telefone: "(27) 3357-4885",
    fonte: "http://www.tjes.jus.br/institucional/coordenadorias/institucionalcoordenadoriasjuizados-especiais-civeis-e-criminais/enderecos-e-telefones-uteis/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail específico não confirmado em fonte oficial.",
  },
  "GO|goiania": {
    cidade: "Goiânia", uf: "GO",
    foro: "Juizado Especial Cível — Fórum Cível (Sala T12, Térreo)",
    endereco: "Avenida Olinda esq. Rua PL-03, Quadra G, Lote 04, Park Lozandes, Goiânia/GO, CEP 74884-120 — Fórum Cível, Sala T12, Térreo",
    telefone: "(62) 3018-6000",
    fonte: "https://cdcivel.com.br/telefones/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Portal TJGO (www.tjgo.jus.br) bloqueia crawlers via Cloudflare (HTTP 403). Endereço confirmado via Cartório Distribuidor Cível (cdcivel.com.br) — órgão oficial vinculado ao TJGO. E-mail não publicado em fonte aberta.",
  },
  "MA|sao luis": {
    cidade: "São Luís", uf: "MA",
    foro: "1º Juizado Especial Cível e das Relações de Consumo",
    endereco: "Rua do Egito, 139, Centro, São Luís/MA, CEP 65010-913",
    telefone: "(98) 2055-2460",
    fonte: "https://www.tjma.jus.br/primeiro-grau/cgj/juizados-especiais/nome-juizado/1",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail específico não localizado.",
  },
  "MG|belo horizonte": {
    cidade: "Belo Horizonte", uf: "MG",
    foro: "Juizado Especial Cível Central / Central de Atermação",
    endereco: "Rua Francisco Sales, 1.446, Santa Efigênia, Belo Horizonte/MG, CEP 30130-090",
    telefone: "(31) 3289-9300",
    horario: "Seg–Sex, 7h30–18h30",
    fonte: "https://www.tjmg.jus.br/portal-tjmg/institucional/juizados-especiais/unidades-e-enderecos-dos-juizados-especiais-da-capital.htm",
    verificado: "tj_oficial_fetch",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail específico não localizado no portal TJMG.",
  },
  "MS|campo grande": {
    cidade: "Campo Grande", uf: "MS",
    foro: "Departamento de Apoio às Turmas Recursais e Juizados Especiais",
    endereco: "Av. Mato Grosso, Bloco 13, Parque dos Poderes, Campo Grande/MS, CEP 79031-902",
    email: "juizados.scsm@tjms.jus.br",
    telefone: "(67) 3314-1300",
    horario: "Seg–Sex, 12h–19h",
    fonte: "https://www.tjms.jus.br/juizados/endereco.php",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
  },
  "MT|cuiaba": {
    cidade: "Cuiabá", uf: "MT",
    foro: "1º Juizado Especial Cível — Complexo Maruanã",
    endereco: "Avenida Historiador Rubens de Mendonça, 1894, Ed. Maruanã, Bosque da Saúde, Cuiabá/MT, CEP 78050-000",
    email: "primeiro.jec.cuiaba@tjmt.jus.br",
    telefone: "(65) 3313-8000",
    fonte: "https://corregedoria.tjmt.jus.br/pagina/125",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
  },
  "PA|belem": {
    cidade: "Belém", uf: "PA",
    foro: "1ª Vara do Juizado Especial Cível",
    endereco: "Rua Dom Romualdo de Seixas, 1278, Umarizal, Belém/PA, CEP 66055-200",
    email: "1jecivelbelem@tjpa.jus.br",
    horario: "Seg–Sex, 8h–14h",
    fonte: "https://www.tjpa.jus.br/PortalExterno/institucional/Juizados-Especiais/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Atendimento remoto também via cad.belem@tjpa.jus.br ou (91) 3131-1620.",
  },
  "PB|joao pessoa": {
    cidade: "João Pessoa", uf: "PB",
    foro: "Fórum Cível de João Pessoa — Juizados Especiais",
    endereco: "Avenida João Machado, 510, Centro, João Pessoa/PB, CEP 58013-520",
    horario: "Seg–Sex, 7h–13h",
    fonte: "https://www.tjpb.jus.br/institucional/juizados-especiais/enderecos-e-horarios-de-funcionamento",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail das unidades em tjpb.jus.br/e-mails-das-unidades.",
  },
  "PE|recife": {
    cidade: "Recife", uf: "PE",
    foro: "Fórum Des. Benildes de Souza Ribeiro — Juizados Especiais",
    endereco: "Av. Marechal Mascarenhas de Morais, 1919, Imbiribeira, Recife/PE, CEP 51170-001",
    telefone: "(81) 3183-1650",
    horario: "Seg–Sex, 7h–19h",
    fonte: "https://portal.tjpe.jus.br/web/juizados-especiais",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Planilha completa de e-mails em portal.tjpe.jus.br/documents/2482251/2851602/PLANILHA+E-MAILS+UNIDADES-TJPE.ods.",
  },
  "PI|teresina": {
    cidade: "Teresina", uf: "PI",
    foro: "Juizado Especial Cível Zona Centro 1 (Sede)",
    endereco: "Rua Mato Grosso, 210/Norte, Cabral, Teresina/PI, CEP 64000-710",
    email: "jecc.centro1@tjpi.jus.br",
    telefone: "(86) 3215-4100",
    fonte: "https://www.tjpi.jus.br/portaltjpi/juizados-especiais/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
  },
  "PR|curitiba": {
    cidade: "Curitiba", uf: "PR",
    foro: "Fórum dos Juizados Especiais — Juizado Especial Cível, Criminal e Fazenda Pública",
    endereco: "Avenida Presidente Getúlio Vargas, 2826, Água Verde, Curitiba/PR, CEP 80240-040",
    telefone: "(41) 3312-6000 (Geral) / (41) 3312-6049 (Triagem) / (41) 3312-6048 (NAP)",
    fonte: "https://feccompar.com.br/wp-content/uploads/2023/08/comarcasdoparana.pdf",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Doc oficial 'Comarcas do Paraná' reproduzido em feccompar.com.br (portal TJPR bloqueia crawl direto). Ramais por vara: 1º JEC Matéria Bancária -6001, 2º JEC Cível/Criminal/Fazenda -6002, 3º JEC Telecomunicações -6003, 4º -6004, 5º -6005, etc. E-mail por unidade não publicado em fonte aberta.",
  },
  "RJ|rio de janeiro": {
    cidade: "Rio de Janeiro", uf: "RJ",
    foro: "I Juizado Especial Cível do Foro Central da Capital",
    endereco: "Avenida Erasmo Braga, 115, Corredor D, Sala 121, Lâmina I, Centro, Rio de Janeiro/RJ, CEP 20020-903",
    email: "cap01jeciv@tjrj.jus.br",
    telefone: "(21) 3133-3991",
    horario: "Seg–Sex, 10h–18h",
    fonte: "https://www3.tjrj.jus.br/novoconsultaportal/api/Comarca/listServentiaComarca?codComarca=406&codAtribuicao=56&tipoServentia=J",
    verificado: "tj_oficial_fetch",
    verificadoEm: "2026-06-23",
    observacoes: "Capital tem 12 Juizados Especiais Cíveis (I a XII), todos na Av. Erasmo Braga, 115. O I JEC é a referência primária; demais varas em cap02jeciv@tjrj.jus.br até cap12jeciv@tjrj.jus.br.",
  },
  "RN|natal": {
    cidade: "Natal", uf: "RN",
    foro: "Fórum Prof. Jalles Costa — Juizados Especiais Cíveis (1º a 13º)",
    endereco: "Praça André de Albuquerque, 534, Cidade Alta, Natal/RN, CEP 59025-580",
    fonte: "https://www.tjrn.jus.br/unidades/1-juizado-especial-civel-da-comarca-de-natal/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Todos os JECs de Natal funcionam no mesmo Fórum. E-mail por vara em tjrn.jus.br/unidades.",
  },
  "RO|porto velho": {
    cidade: "Porto Velho", uf: "RO",
    foro: "1º Juizado Especial Cível de Porto Velho",
    endereco: "Avenida Pinheiro Machado, 777, Olaria, Porto Velho/RO",
    email: "pvh1jespcivel@tjro.jus.br",
    telefone: "(69) 3309-7125",
    fonte: "https://www.tjro.jus.br/rhtransparente/telefones",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
  },
  "RR|boa vista": {
    cidade: "Boa Vista", uf: "RR",
    foro: "Secretaria Unificada dos Juizados Especiais Cíveis de Boa Vista",
    endereco: "Praça do Centro Cívico, Centro, Boa Vista/RR, CEP 69300-000",
    email: "jespcvsu@tjrr.jus.br",
    fonte: "https://www.tjrr.jus.br/index.php/cartorio-unificado-dos-juizados-civeis",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
  },
  "RS|porto alegre": {
    cidade: "Porto Alegre", uf: "RS",
    foro: "Foro Central de Porto Alegre — Juizados Especiais Cíveis (Prédio I)",
    endereco: "Rua Márcio Luiz Veras Vidor, 10, Praia de Belas, Porto Alegre/RS, CEP 90110-160 (Prédio I) — Prédio II: Rua Manoelito de Ornellas, 50, CEP 90110-230",
    telefone: "(51) 3210-6500 (PABX/DDR)",
    horario: "Seg–Sex, 9h–18h",
    fonte: "https://www.tjrs.jus.br/novo/comunicacao/fale-conosco/enderecos-e-informacoes/primeiro-grau/",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Endereço e telefone confirmados via meta og:description da página oficial do TJRS. E-mail por unidade não publicado no portal — consulte (51) 3210-6500 para a vara específica.",
  },
  "SC|florianopolis": {
    cidade: "Florianópolis", uf: "SC",
    foro: "Comarca da Capital — Juizado Especial Cível",
    endereco: "Rua Álvaro Millen da Silveira, 208, Centro, Florianópolis/SC, CEP 88020-901",
    email: "capital.jecregional@tjsc.jus.br",
    telefone: "(48) 3287-1000",
    horario: "Seg–Sex, 12h–19h",
    fonte: "https://www.tjsc.jus.br/comarcas/capital",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail é da Divisão de Tramitação Remota dos JECs da Região Metropolitana — não exclusivo do balcão presencial de Florianópolis.",
  },
  "SE|aracaju": {
    cidade: "Aracaju", uf: "SE",
    foro: "3º Juizado Especial Cível — Fórum Gumercindo Bessa (Palácio da Justiça Tobias Barreto)",
    endereco: "Praça Fausto Cardoso, 112, Centro, Aracaju/SE",
    email: "3jec.aracaju@tjse.jus.br",
    fonte: "https://www.tjse.jus.br/portal/poder-judiciario/lista-de-e-mails/1-circunscricao",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "Aracaju tem 8 JECs distribuídos em 4 fóruns: 1º e 8º (FI II), 2º/4º/5º (FI III), 7º (FI IV), 3º no Fórum Gumercindo Bessa (sede). Emails seguem padrão <N>jec.aracaju@tjse.jus.br (decodificado do Joomla cloak: 1jec.aracaju, 2jec.aracaju, 3jec.aracaju, etc.). Fazenda Pública: jefaz.aracaju@tjse.jus.br e 2jefaz.aracaju@tjse.jus.br.",
  },
  "TO|palmas": {
    cidade: "Palmas", uf: "TO",
    foro: "Juizados Especiais — Fórum Marques São João da Palma",
    endereco: "Avenida Teotônio Segurado, Fórum Marques São João da Palma, Palmas/TO, CEP 77020-002",
    telefone: "(63) 3612-7126",
    fonte: "https://www.tjto.jus.br/comunicacao/noticias/juizados-especiais-de-palmas-divulgam-telefones-oficiais-para-atendimento-ao-publico",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mail não localizado em fonte oficial.",
  },
  // ─── INTERIOR (cidades grandes com dado verificado) ────────────────────────
  "SP|campinas": {
    cidade: "Campinas", uf: "SP",
    foro: "Fórum de Campinas — Juizado Especial Cível (1ª, 2ª e 3ª Varas)",
    endereco: "Av. Francisco Xavier de Arruda Camargo, 300, Jd. Santana, Campinas/SP, CEP 13089-530",
    telefone: "(19) 2101-3268",
    horario: "Seg–Sex, 9h–17h (atendimento 13h–17h)",
    fonte: "https://www.tjsp.jus.br/Download/Corregedoria/JuizadosEspeciais/JuizadosEspeciaisCiveisSeusAnexosInterior.pdf",
    verificado: "busca_oficial",
    verificadoEm: "2026-06-23",
    observacoes: "E-mails de Campinas em oabcampinas.org.br/tjsp-confira-lista-de-e-mails-institucionais-na-comarca-de-campinas.",
  },
};

function normalizarCidade(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function buscarForoNacional(uf: string, cidade: string): ForoNacional | null {
  const chave = `${uf}|${normalizarCidade(cidade)}`;
  return FOROS_NACIONAIS[chave] ?? null;
}

function buscarForoSP(cepNumerico: number) {
  for (const f of FOROS_SP) {
    for (const [min, max] of f.ceps) {
      if (cepNumerico >= min && cepNumerico <= max) return f;
    }
  }
  return null;
}

type ViaCepResponse = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

async function consultarViaCep(cepLimpo: string): Promise<ViaCepResponse | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      signal: AbortSignal.timeout(3000),
      headers: { "User-Agent": "ClaraLaw/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}

// ─── FALLBACK: dedução de UF por range de CEP (Correios) ──────────────────────
// Usado quando ViaCEP timeouta/falha. Não dá a cidade, mas permite continuar
// com tribunal_uf em vez de erro genérico.
// Fonte: Manual de CEPs dos Correios. Ranges aproximados — alguns CEPs em
// fronteira de UF podem cair na UF vizinha, mas suficiente para fallback.
const CEP_UF_RANGES: Array<[number, number, string]> = [
  [1000000,  19999999, "SP"],
  [20000000, 28999999, "RJ"],
  [29000000, 29999999, "ES"],
  [30000000, 39999999, "MG"],
  [40000000, 48999999, "BA"],
  [49000000, 49999999, "SE"],
  [50000000, 56999999, "PE"],
  [57000000, 57999999, "AL"],
  [58000000, 58999999, "PB"],
  [59000000, 59999999, "RN"],
  [60000000, 63999999, "CE"],
  [64000000, 64999999, "PI"],
  [65000000, 65999999, "MA"],
  [66000000, 68899999, "PA"],
  [68900000, 68999999, "AP"],
  [69000000, 69299999, "AM"],
  [69300000, 69399999, "RR"],
  [69400000, 69899999, "AM"],
  [69900000, 69999999, "AC"],
  [70000000, 72799999, "DF"],
  [72800000, 72999999, "GO"],
  [73000000, 73699999, "DF"],
  [73700000, 76799999, "GO"],
  [76800000, 76999999, "RO"],
  [77000000, 77999999, "TO"],
  [78000000, 78899999, "MT"],
  [78900000, 78999999, "RO"],
  [79000000, 79999999, "MS"],
  [80000000, 87999999, "PR"],
  [88000000, 89999999, "SC"],
  [90000000, 99999999, "RS"],
];

function deduzirUfPorCep(cepNumerico: number): string | null {
  for (const [min, max, uf] of CEP_UF_RANGES) {
    if (cepNumerico >= min && cepNumerico <= max) return uf;
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

  // 1) Descobre UF/cidade via ViaCEP (funciona para QUALQUER CEP brasileiro)
  const viacep = await consultarViaCep(cepLimpo);

  // 2) Se for SP capital, devolve mapa rico (foro/endereço/email específicos)
  if (viacep?.uf === "SP") {
    const foro = buscarForoSP(cepNum);
    if (foro) {
      return NextResponse.json({
        encontrado: true,
        fonte: "mapa_local_sp",
        foro: foro.foro,
        endereco: foro.endereco,
        bairro: foro.bairro,
        cidade: viacep.localidade ?? "São Paulo",
        uf: "SP",
        email: foro.email,
        horario: foro.horario,
        cep: cepLimpo,
        aviso: "Resultado orientativo baseado no índice do TJSP. Confirme sempre em tjsp.jus.br.",
      });
    }
    // CEP de SP mas fora da capital (interior) — cai para FOROS_NACIONAIS ou tribunal_uf abaixo
  }

  // 3) Capital (ou cidade grande verificada): devolve foro específico do FOROS_NACIONAIS
  if (viacep?.uf && viacep.localidade) {
    const foroNacional = buscarForoNacional(viacep.uf, viacep.localidade);
    if (foroNacional) {
      return NextResponse.json({
        encontrado: true,
        fonte: "mapa_nacional",
        foro: foroNacional.foro,
        endereco: foroNacional.endereco,
        email: foroNacional.email,
        telefone: foroNacional.telefone,
        horario: foroNacional.horario,
        cidade: foroNacional.cidade,
        bairro: viacep.bairro ?? null,
        uf: foroNacional.uf,
        verificado: foroNacional.verificado,
        fonteUrl: foroNacional.fonte,
        observacoes: foroNacional.observacoes,
        cep: cepLimpo,
        aviso: foroNacional.verificado === "parcial"
          ? "Dados parcialmente verificados. Confirme no site do tribunal antes de comparecer."
          : "Dados curados do site oficial do tribunal. Confirme antes de comparecer.",
      });
    }
  }

  // 4) Qualquer outra UF (ou interior sem mapeamento): devolve tribunal competente
  if (viacep?.uf && TRIBUNAIS_BR[viacep.uf]) {
    const t = TRIBUNAIS_BR[viacep.uf];
    return NextResponse.json({
      encontrado: true,
      fonte: "tribunal_uf",
      tribunal: t.tribunal,
      sigla: t.sigla,
      cidade: viacep.localidade ?? null,
      bairro: viacep.bairro ?? null,
      uf: viacep.uf,
      estado: t.estado,
      buscaUrl: t.buscaUrl,
      cep: cepLimpo,
      mensagem: `Sua comarca é em ${viacep.localidade ?? "sua cidade"}/${viacep.uf}. O tribunal competente é o ${t.sigla}.`,
      aviso: "Ainda não mapeamos o cartório específico desta comarca. Use o link oficial do tribunal para encontrar o Juizado Especial Cível mais próximo.",
    });
  }

  // 4b) ViaCEP timeout/falhou — fallback por dedução de UF via range de CEP (Correios)
  if (!viacep) {
    const ufDeduzida = deduzirUfPorCep(cepNum);
    if (ufDeduzida && TRIBUNAIS_BR[ufDeduzida]) {
      const t = TRIBUNAIS_BR[ufDeduzida];
      return NextResponse.json({
        encontrado: true,
        fonte: "tribunal_uf",
        tribunal: t.tribunal,
        sigla: t.sigla,
        cidade: null,
        bairro: null,
        uf: ufDeduzida,
        estado: t.estado,
        buscaUrl: t.buscaUrl,
        cep: cepLimpo,
        mensagem: `Não conseguimos consultar o CEP em tempo real, mas pelo prefixo é em ${t.estado}. O tribunal competente é o ${t.sigla}.`,
        aviso: "Dados parciais (consulta ao ViaCEP indisponível). Use o link oficial do tribunal para encontrar o Juizado Especial Cível mais próximo.",
      });
    }
  }

  // 5) CEP inexistente, fora dos ranges Correios ou erro irreversível
  return NextResponse.json({
    encontrado: false,
    mensagem: viacep === null
      ? "Não conseguimos consultar o CEP agora. Tente novamente em instantes."
      : "CEP não encontrado. Confira os 8 dígitos.",
    link: "https://buscacepinter.correios.com.br/app/endereco/index.php",
  });
}
