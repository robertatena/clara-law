// Orientação de onde registrar reclamação (ANAC/Procon/consumidor.gov.br/
// Banco Central/Reclame Aqui) por tipo de caso — com links reais e passo a
// passo. Extraído de app/enviar/page.tsx (Passo 2 do resultado grátis) pra
// poder ser reaproveitado também na página persistente do caso
// (/caso/[id]), já que antes esse conteúdo só existia na tela de resultado
// grátis, efêmera (estado React, sem link pra voltar depois).

type Tipo = "voo_atrasado" | "voo_cancelado" | "bagagem" | "produto_defeito" | "servico_nao_entregue" | "cobranca_indevida";

export default function OrientacaoOrgaos({ tipoCaso, numVoo }: { tipoCaso: Tipo; numVoo?: string }) {
  const isVoo = tipoCaso === "voo_atrasado" || tipoCaso === "voo_cancelado" || tipoCaso === "bagagem";

  return (
    <div className="space-y-4">
      {isVoo && (
        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-slate-700">ANAC — Agência Nacional de Aviação Civil</div>
              <div className="text-xs text-slate-500 mt-0.5">Órgão regulador das companhias aéreas. Tel: 163 (gratuito)</div>
            </div>
            <a href="https://www.gov.br/anac/pt-br/assuntos/passageiros" target="_blank" rel="noreferrer"
              className="rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold px-4 py-1.5 whitespace-nowrap">
              Abrir →
            </a>
          </div>
          <div className="space-y-1.5">
            {[
              "Acesse o site ou ligue 163 (gratuito, seg–sex 8h–20h)",
              `Informe: voo ${numVoo || "[número]"}, data e companhia`,
              "Anexe: boarding pass + protocolo de atendimento da companhia",
              "Guarde o protocolo ANAC — apresente no JEC se precisar",
            ].map((s, i) => (
              <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isVoo && (
        <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold text-slate-700">Procon</div>
              <div className="text-xs text-slate-500 mt-0.5">Órgão de proteção ao consumidor do seu estado/cidade.</div>
            </div>
            <a href="https://www.consumidor.gov.br/pages/conteudo/publico/procons" target="_blank" rel="noreferrer"
              className="rounded-full border border-slate-300 bg-white text-slate-700 text-xs font-semibold px-4 py-1.5 whitespace-nowrap">
              Encontrar →
            </a>
          </div>
          <div className="space-y-1.5">
            {[
              "Encontre o Procon da sua cidade ou estado",
              "Registre a reclamação com o e-mail que você já enviou",
              "O Procon pode notificar a empresa e mediar o acordo",
            ].map((s, i) => (
              <div key={i} className="flex gap-2 items-start text-xs text-slate-600">
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[14px] border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-amber-800">
            {tipoCaso === "cobranca_indevida" ? "Banco Central (se instituição financeira)" :
             tipoCaso === "produto_defeito" ? "Reclame Aqui" :
             "consumidor.gov.br"}
          </div>
          <a href={
            tipoCaso === "cobranca_indevida" ? "https://www.bcb.gov.br/acessoinformacao/registrar_reclamacao" :
            tipoCaso === "produto_defeito" ? "https://www.reclameaqui.com.br" :
            "https://www.consumidor.gov.br"
          } target="_blank" rel="noreferrer"
            className="rounded-full bg-amber-700 text-white text-xs font-semibold px-4 py-1.5">
            Abrir →
          </a>
        </div>
        <div className="space-y-1.5">
          {[
            'Clique em "Registrar reclamação" e busque a empresa',
            "Descreva o problema — pode colar o e-mail que você já enviou",
            "Envie e aguarde: a empresa tem 10 dias para responder",
            "Avalie a resposta: isso impacta o índice público da empresa",
          ].map((s, i) => (
            <div key={i} className="flex gap-2 items-start text-xs text-amber-800">
              <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
