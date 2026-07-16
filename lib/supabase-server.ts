// Cliente Supabase server-side com SERVICE_ROLE_KEY.
// Bypassa RLS — usar APENAS em API routes / server actions / webhooks,
// NUNCA em Client Components (a chave nunca deve ir pro browser).

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não configurada");
}
if (!serviceKey) {
  // Não travamos o import — em dev local sem service key, o cliente ainda
  // é criado (as chamadas vão falhar com 401). Assim evitamos crash no build.
  console.warn("SUPABASE_SERVICE_ROLE_KEY não configurada — operações admin vão falhar");
}

export const supabaseAdmin = createClient(url, serviceKey ?? "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
