// Cliente Supabase Auth — factories para Server Components, Route Handlers e Browser.
// Usa @supabase/ssr para persistir sessão em cookies HTTP-only compatível com App Router.

import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

// Browser (Client Components) — session persistida em cookies pelo Supabase SDK
export function createBrowserSupabase() {
  return createBrowserClient(URL, KEY);
}

// Server (Route Handlers) — recebe o cookieStore do next/headers
// Uso: const cookieStore = await cookies(); const supabase = createRouteSupabase(cookieStore);
type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  set?: (name: string, value: string, options?: CookieOptions) => void;
};

export function createRouteSupabase(cookieStore: CookieStore) {
  return createServerClient(URL, KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set?.(name, value, options);
        } catch {
          // Server Components não podem escrever cookies — silenciar.
          // Route Handlers e middleware podem, então funciona lá.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set?.(name, "", { ...options, maxAge: 0 });
        } catch {
          // idem
        }
      },
    },
  });
}
