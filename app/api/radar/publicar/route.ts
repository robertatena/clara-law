// POST /api/radar/publicar
//
// Body: { id: string }  // ex: "2026-w34"
// Auth: cookie httpOnly `radar_admin` (setado por /api/radar/admin/login)
//
// Fluxo:
//   1. Valida cookie via isAdmin() — sem cookie ou HMAC inválido → 401
//   2. publicarEdicao(id):
//      - 'nao_existe'           → 404
//      - 'nao_e_rascunho'       → 409
//      - 'rascunho_desatualizado' → 409 com mensagem clara
//      - ok                     → segue
//   3. revalidatePath('/radar')                            — imediato
//      revalidatePath('/radar/' + slug)                    — histórica
//   4. 200 { publicado_em, slug }
//
// Nunca publica automaticamente sem esta rota (não há dispatch em outro
// lugar). Sempre exige o cookie admin + ação HTTP explícita do preview.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/radar/admin-auth";
import { publicarEdicao } from "@/lib/radar/repo";

export async function POST(req: Request) {
  const ts = new Date().toISOString();

  // 1) Auth via cookie
  const cookieStore = await cookies();
  if (!isAdmin(cookieStore)) {
    console.warn("radar/publicar: unauthorized (cookie ausente/inválido)", { ts });
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2) Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const id =
    body && typeof body === "object" && "id" in body && typeof (body as { id: unknown }).id === "string"
      ? (body as { id: string }).id.trim()
      : "";
  if (!id) {
    return NextResponse.json({ error: "id_requerido" }, { status: 400 });
  }

  // 3) Publicação (com check de rascunho desatualizado embutido)
  let resultado;
  try {
    resultado = await publicarEdicao(id);
  } catch (err) {
    console.error("radar/publicar: erro no repo", { ts, id, err: String(err) });
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  if (!resultado.ok) {
    if (resultado.motivo === "nao_existe") {
      return NextResponse.json({ error: "nao_existe" }, { status: 404 });
    }
    if (resultado.motivo === "nao_e_rascunho") {
      return NextResponse.json(
        { error: "nao_e_rascunho", message: "Edição não está em rascunho (ou já foi publicada)." },
        { status: 409 },
      );
    }
    if (resultado.motivo === "rascunho_desatualizado") {
      return NextResponse.json(
        {
          error: "rascunho_desatualizado",
          message:
            "O rascunho foi gerado a partir de uma revisão antiga do input. Regenere o rascunho antes de publicar.",
          detalhe: resultado.detalhe,
        },
        { status: 409 },
      );
    }
  }

  // 4) Revalida caches — /radar (edição atual) + histórica dessa semana
  const okResult = resultado as { ok: true; publicado_em: string; slug: string };
  try {
    revalidatePath("/radar");
    revalidatePath("/radar/" + okResult.slug);
  } catch (err) {
    // Não bloqueia resposta — publicação já ocorreu, cache atualiza no fallback
    // (export const revalidate = 3600 nas pages).
    console.error("radar/publicar: revalidatePath falhou (não bloqueia)", { ts, id, err: String(err) });
  }

  return NextResponse.json(
    {
      id,
      slug: okResult.slug,
      publicado_em: okResult.publicado_em,
      status: "publicado",
    },
    { status: 200 },
  );
}
