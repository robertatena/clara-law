// Callback do Supabase Auth após clicar no magic link.
// Padrão canônico: cookies escritos DIRETO na NextResponse (não no cookieStore).

import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/minha-conta";

  console.log("auth_callback:", {
    hasCode: !!code,
    url: request.url,
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_KEY,
  });

  if (code) {
    // Next 15+/16: cookies() é async
    const cookieStore = await cookies();
    const redirectUrl = new URL(next, request.url);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("auth_callback_error:", error.message);
      return NextResponse.redirect(new URL("/minha-conta?erro=auth", request.url));
    }

    console.log("auth_callback_success: session set, redirecting to", next);
    return response;
  }

  // Sem code — redireciona para /minha-conta
  console.log("auth_callback: no code found");
  return NextResponse.redirect(new URL("/minha-conta", request.url));
}
