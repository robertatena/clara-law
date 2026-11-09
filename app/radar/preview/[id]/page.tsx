// /radar/preview/[id] — rota admin de preview.
//
// - Server component.
// - Autenticação via cookie httpOnly `radar_admin` (setado por /api/radar/admin/login).
// - Sem cookie válido → notFound() (não vaza existência de rota admin).
// - Renderiza o MESMO <EdicaoView /> da página pública — fidelidade visual 1:1.
// - Banner PREVIEW / JÁ PUBLICADA fica FORA do EdicaoView (não vaza pro conteúdo salvo).
// - Botão "Publicar" só aparece se status = 'rascunho'.
//
// Não expõe rascunhos publicamente (proteção em profundidade):
//   1. Cookie admin obrigatório aqui
//   2. RLS do Supabase bloqueia leitura de rascunhos pra anon/authenticated
//      (esta rota usa supabaseAdmin com service_role via buscarEdicaoPorId)

import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/radar/admin-auth";
import { buscarEdicaoPorId, listarEdicoesPublicadas } from "@/lib/radar/repo";
import { EdicaoView } from "@/app/radar/_components/EdicaoView";
import { BannerPreview } from "./_components/BannerPreview";
import { PublicarButton } from "./_components/PublicarButton";
import { LogoutButton } from "./_components/LogoutButton";

// Preview é sempre dinâmica — nunca cacheia
export const dynamic = "force-dynamic";

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    notFound();
  }

  const { id } = await params;
  const edicao = await buscarEdicaoPorId(id);
  if (!edicao) {
    notFound();
  }

  // Só rascunho e publicado são valores possíveis do check da tabela.
  // TypeScript não sabe disso da união larga, então garantimos aqui.
  const status: "rascunho" | "publicado" =
    edicao.status === "publicado" ? "publicado" : "rascunho";

  const edicoesAnteriores = await listarEdicoesPublicadas();

  return (
    <>
      <BannerPreview status={status} />
      <LogoutButton />
      <EdicaoView edicao={edicao.conteudo} edicoesAnteriores={edicoesAnteriores} />
      {status === "rascunho" && <PublicarButton id={id} />}
    </>
  );
}
