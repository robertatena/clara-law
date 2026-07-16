// Callback do Supabase Auth após clicar no magic link.
// Troca o `code` da URL por uma session e seta cookies HTTP-only.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteSupabase } from "@/lib/supabase-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/minha-conta";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteSupabase(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("auth_callback_exchange_failed", error.message);
      return NextResponse.redirect(new URL(`/minha-conta?erro=auth`, request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
