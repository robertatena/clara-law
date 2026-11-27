// Wrapper único pra disparar eventos do funil. Nunca lança erro (analytics
// nunca pode quebrar a UI) e nunca manda dado pessoal, mesmo que algum call
// site passe por engano — filtro defensivo além da disciplina manual.
//
// Modo debug: ?debug_analytics=1 na URL loga no console cada tentativa de
// trackEvent — se foi capturado, descartado (e por quê) ou se alguma
// propriedade foi removida pelo filtro de PII. Existe pra investigar ao vivo
// quando um evento "desaparece" sem dar pra saber, só olhando o painel do
// PostHog, se o problema é no código (nunca chamou/foi descartado aqui) ou
// na entrega (chamou posthog.capture, mas não chegou/não apareceu lá).

import posthog from "posthog-js";
import { lerUtm } from "./utm";

const CHAVES_PII = [
  "email", "nome", "cpf", "descricao", "telefone",
  "endereco", "cnpj", "numvoo", "num_voo",
];

type EventProps = Record<string, string | number | boolean | undefined>;

function contemPii(chave: string): boolean {
  const k = chave.toLowerCase();
  return CHAVES_PII.some((p) => k.includes(p));
}

function limparPii(props?: EventProps): { limpo: EventProps; removidas: string[] } {
  if (!props) return { limpo: {}, removidas: [] };
  const limpo: EventProps = {};
  const removidas: string[] = [];
  for (const [k, v] of Object.entries(props)) {
    if (contemPii(k)) {
      removidas.push(k);
      continue;
    }
    limpo[k] = v;
  }
  return { limpo, removidas };
}

function debugAtivo(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("debug_analytics") === "1";
  } catch {
    return false;
  }
}

export function trackEvent(nome: string, props?: EventProps): void {
  const debug = typeof window !== "undefined" && debugAtivo();
  try {
    if (typeof window === "undefined") return;
    if (!posthog.has_opted_in_capturing()) {
      if (debug) console.log(`[analytics] descartado (sem consentimento ainda, ou posthog não inicializado): ${nome}`);
      return;
    }
    const { limpo, removidas } = limparPii(props);
    if (debug && removidas.length) {
      console.log(`[analytics] propriedades removidas por conter PII em "${nome}":`, removidas);
    }
    const propsFinal = { ...lerUtm(), ...limpo };
    if (debug) console.log(`[analytics] capture: ${nome}`, propsFinal);
    posthog.capture(nome, propsFinal);
  } catch (err) {
    if (debug) console.error(`[analytics] erro ao capturar ${nome}:`, err);
  }
}
