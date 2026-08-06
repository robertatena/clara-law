// Persiste o resultado de uma análise de contrato em user_casos.
//
// Chamado pelo client /enviar após analisar() completar com unlock (paywall
// passado por pagamento OU reanálise grátis). Dois modos, decididos pelo
// body:
//
//   1) parent_caso_id presente → REANÁLISE
//      Cria novo user_casos com reanalise_de = parent_caso_id, tipo_caso =
//      "analise_contrato", payment_method = null (não passou por checkout),
//      status = "ativo". Ownership validado via RLS.
//
//   2) parent_caso_id ausente → PRIMEIRA ANÁLISE PAGA
//      Busca o user_casos mais recente do user (tipo_caso = analise_contrato,
//      dados_json ainda sem 'resultado'). Atualiza dados_json fundido com
//      { resultado, contractType }. Idempotente: se já tem resultado, no-op.
//
// Isolamento: rota nunca é chamada por fluxo de disputa. Coluna
// reanalise_de é nullable — nenhum código de disputa lê ou escreve.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabase } from "@/lib/supabase-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

type ResultadoJson = Record<string, unknown>;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parentCasoId = typeof body.parent_caso_id === "string" ? body.parent_caso_id.trim() : "";
    const contractType = typeof body.contractType === "string" ? body.contractType : "";
    const resultado = body.resultado as ResultadoJson | undefined;

    if (!resultado || typeof resultado !== "object") {
      return NextResponse.json({ error: "missing_resultado" }, { status: 400 });
    }

    // Auth obrigatório
    const cookieStore = await cookies();
    const supabase = createRouteSupabase(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ── Modo 1: REANÁLISE ────────────────────────────────────────────────
    if (parentCasoId) {
      // Valida ownership do pai via RLS + tipo_caso obrigatório
      const { data: parent, error: parentErr } = await supabase
        .from("user_casos")
        .select("id, tipo_caso, email")
        .eq("id", parentCasoId)
        .eq("tipo_caso", "analise_contrato")
        .maybeSingle();
      if (parentErr || !parent) {
        return NextResponse.json({ error: "parent_not_found_or_forbidden" }, { status: 404 });
      }

      // Cria novo caso filho via service role (bypassa RLS pra insert,
      // mas ownership já foi validada acima)
      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from("user_casos")
        .insert({
          user_id: user.id,
          email: parent.email,
          tipo_caso: "analise_contrato",
          descricao: contractType ? `Reanálise — ${contractType}` : "Reanálise",
          dados_json: { contractType, resultado, reanalise: true },
          status: "ativo",
          payment_method: null,
          reanalise_de: parentCasoId,
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("salvar_reanalise_insert_error", insertErr.message);
        return NextResponse.json({ error: "insert_failed" }, { status: 500 });
      }
      console.log("salvar_resultado_reanalise_ok", { parent: parentCasoId, novo: inserted?.id });
      return NextResponse.json({ ok: true, mode: "reanalise", caso_id: inserted?.id });
    }

    // ── Modo 2: PRIMEIRA ANÁLISE PAGA ───────────────────────────────────
    // Busca o caso mais recente desse user, tipo_caso = analise_contrato,
    // que ainda não tem resultado salvo em dados_json. Idempotente.
    const { data: candidatos, error: findErr } = await supabase
      .from("user_casos")
      .select("id, dados_json")
      .eq("tipo_caso", "analise_contrato")
      .is("reanalise_de", null)
      .order("created_at", { ascending: false })
      .limit(5);

    if (findErr) {
      console.error("salvar_resultado_find_error", findErr.message);
      return NextResponse.json({ error: "find_failed" }, { status: 500 });
    }
    const target = (candidatos ?? []).find((c) => {
      const dj = c.dados_json as Record<string, unknown> | null;
      return !dj || !dj.resultado;
    });
    if (!target) {
      // Todos os casos recentes já têm resultado — no-op. Aceitável.
      console.log("salvar_resultado_noop_todos_tem_resultado");
      return NextResponse.json({ ok: true, mode: "noop_already_saved" });
    }

    const dadosMerged: Record<string, unknown> = {
      ...((target.dados_json as Record<string, unknown> | null) ?? {}),
      contractType,
      resultado,
    };

    const { error: updateErr } = await supabaseAdmin
      .from("user_casos")
      .update({ dados_json: dadosMerged })
      .eq("id", target.id);

    if (updateErr) {
      console.error("salvar_resultado_update_error", updateErr.message);
      return NextResponse.json({ error: "update_failed" }, { status: 500 });
    }
    console.log("salvar_resultado_primeira_ok", { caso_id: target.id });
    return NextResponse.json({ ok: true, mode: "primeira", caso_id: target.id });
  } catch (err) {
    console.error("salvar_resultado_route_error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
