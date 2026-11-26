// Limites de competência do Juizado Especial Cível (Lei 9.099/95).
// SALARIO_MINIMO precisa ser atualizado todo ano — o reajuste geralmente
// sai em janeiro (Decreto federal). Valor vigente usado aqui: 2026.
export const SALARIO_MINIMO = 1518;

// Art. 9º, §1º — acima de 20 salários mínimos, a assistência por advogado é obrigatória.
export const LIMITE_SEM_ADVOGADO = SALARIO_MINIMO * 20;

// Art. 3º, I — teto de competência do Juizado Especial.
export const LIMITE_TETO_JEC = SALARIO_MINIMO * 40;

export type AvisoValorCausa = {
  nivel: "advogado_obrigatorio" | "acima_teto";
  mensagem: string;
};

// Nunca bloqueia — só orienta. Quem decide se segue, reduz o pedido ou
// busca um advogado é o usuário.
export function avaliarValorCausa(valorNumerico: number): AvisoValorCausa | null {
  if (!valorNumerico || valorNumerico <= 0) return null;

  if (valorNumerico > LIMITE_TETO_JEC) {
    return {
      nivel: "acima_teto",
      mensagem:
        `Esse valor passa do teto do Juizado Especial (40 salários mínimos — art. 3º, I, da Lei 9.099/95). ` +
        `Pode ser necessário reduzir o pedido até o teto ou buscar a Justiça Comum.`,
    };
  }

  if (valorNumerico > LIMITE_SEM_ADVOGADO) {
    return {
      nivel: "advogado_obrigatorio",
      mensagem: `Acima de 20 salários mínimos, é obrigatório ter advogado no Juizado (art. 9º da Lei 9.099/95).`,
    };
  }

  return null;
}
