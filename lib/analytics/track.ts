// Wrapper único pra disparar eventos do funil. Nunca lança erro (analytics
// nunca pode quebrar a UI) e nunca manda dado pessoal, mesmo que algum call
// site passe por engano — filtro defensivo além da disciplina manual.

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

function limparPii(props?: EventProps): EventProps {
  if (!props) return {};
  const limpo: EventProps = {};
  for (const [k, v] of Object.entries(props)) {
    if (contemPii(k)) continue;
    limpo[k] = v;
  }
  return limpo;
}

export function trackEvent(nome: string, props?: EventProps): void {
  try {
    if (typeof window === "undefined") return;
    if (!posthog.has_opted_in_capturing()) return; // sem consentimento ainda, ou nunca inicializou (sem env configurada)
    posthog.capture(nome, { ...lerUtm(), ...limparPii(props) });
  } catch {
    // nunca deixa analytics quebrar a UI
  }
}
