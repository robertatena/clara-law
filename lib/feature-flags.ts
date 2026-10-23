// Área logada (login, histórico de casos, chat, reanálise vinculada, magic
// link no e-mail) depende do Supabase, que foi pausado por decisão de custo
// — não tinha retorno financeiro suficiente pra justificar.
//
// Desligado até decidirmos reativar (ex: quando o volume de clientes
// justificar). O pipeline de pagamento (Stripe/Pix) e o envio do kit por
// e-mail não dependem disso e continuam funcionando normalmente.
export const AREA_LOGADA_ATIVA = false;
