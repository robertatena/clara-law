// /radar — sempre a edição mais recente publicada.
//
// Server component. Só decide QUAL edição buscar; toda a composição
// visual mora em <EdicaoView />.

import { getEdicaoAtual, listarEdicoesPublicadas } from "./data/service";
import { EdicaoView } from "./_components/EdicaoView";
import { EdicaoIndisponivel } from "./_components/EdicaoIndisponivel";

// Fallback de cache: revalida a cada 1h. Publicação via
// /api/radar/publicar chama revalidatePath imediato, isso aqui
// é rede de segurança pra casos onde o revalidatePath não roda
// (ex: publicação via SQL manual direto no Supabase Dashboard).
export const revalidate = 3600;

export default async function RadarPage() {
  const [edicao, edicoesAnteriores] = await Promise.all([
    getEdicaoAtual(),
    listarEdicoesPublicadas(),
  ]);

  if (!edicao) {
    // Este caminho só é alcançado em produção (IS_DEMO_MODE=false)
    // se o Supabase falhar ou não houver edição publicada.
    // Na V1 (demo) o mock sempre devolve edição — este é um safety net.
    return <EdicaoIndisponivel />;
  }

  return <EdicaoView edicao={edicao} edicoesAnteriores={edicoesAnteriores} />;
}
