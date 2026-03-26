export function generateLawyerEmail(attentionPoints: string[]) {
  return `
Olá,
Estou encaminhando este contrato para sua revisão jurídica final.
Antes disso, fiz uma leitura prévia com apoio de uma ferramenta de organização contratual, apenas para estruturar os principais pontos de atenção e facilitar nossa análise conjunta — sem substituir a avaliação jurídica.
Os pontos que gostaria que você analisasse com mais cuidado são:
${attentionPoints.map((p) => `- ${p}`).join("\n")}
Se você achar pertinente, peço também que valide: (i) clareza das obrigações de cada parte; (ii) equilíbrio de riscos; e (iii) condições que possam gerar surpresa ou insegurança na execução.
Fico à disposição para complementar com contexto do negócio e objetivo do contrato.
Obrigada,
Roberta
`.trim();
}
