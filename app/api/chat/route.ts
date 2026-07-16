// Chat da Clara IA com contexto do caso.
// - Autenticado via Supabase Auth (usuário só conversa sobre casos próprios)
// - Persiste user + assistant messages em `mensagens`
// - Escalação: se detectar pedido de ajuda humana, dispara e-mail pra Roberta

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import nodemailer from "nodemailer";
import { createRouteSupabase } from "@/lib/supabase-auth";
import { supabaseAdmin } from "@/lib/supabase-server";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT_BASE = `Você é a Clara, assistente educacional da plataforma Clara Law. Você ajuda consumidores brasileiros a entender seus direitos e o que fazer em cada etapa do processo. Você é calma, empática e usa linguagem simples — sem juridiquês.

IMPORTANTE:
- Você NÃO é advogada e NÃO dá consultoria jurídica.
- Você educa e orienta com base em informações públicas sobre o CDC (Código de Defesa do Consumidor) e direitos do consumidor.
- Sempre lembre que resultados dependem do caso concreto e do juiz.
- Se o usuário pedir para conversar com um humano ou algo escapar do seu escopo educacional, sugira que ele clique no botão "Falar com humano" no topo do chat.

Responda de forma curta e objetiva (máximo 4-5 parágrafos curtos). Use quebras de linha para facilitar leitura em mobile.`;

// Transporter do Gmail (mesma config do webhook/enviar-email)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const PALAVRAS_ESCALADA = [
  "preciso de ajuda humana",
  "quero falar com humano",
  "falar com uma pessoa",
  "falar com um advogado",
  "quero um humano",
  "atendimento humano",
];

function detectaEscalada(texto: string): boolean {
  const t = texto.toLowerCase();
  return PALAVRAS_ESCALADA.some((p) => t.includes(p));
}

type CasoRow = {
  id: string;
  user_id: string;
  email: string;
  tipo_caso: string;
  descricao: string | null;
  dados_json: Record<string, unknown> | null;
};

type MsgRow = { role: string; conteudo: string };

async function enviarEmailEscalada(caso: CasoRow, ultimaMensagem: string): Promise<void> {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) return;
  const linhas = [
    `<p>Um usuário pediu ajuda humana no chat da Clara.</p>`,
    `<p><strong>Email:</strong> ${caso.email}</p>`,
    `<p><strong>Caso ID:</strong> ${caso.id}</p>`,
    `<p><strong>Tipo:</strong> ${caso.tipo_caso}</p>`,
    `<p><strong>Descrição:</strong> ${caso.descricao || "(sem descrição)"}</p>`,
    `<p><strong>Última mensagem do usuário:</strong></p>`,
    `<blockquote style="border-left:3px solid #D4AF37;margin:0;padding:8px 16px;color:#374151;">${ultimaMensagem}</blockquote>`,
    caso.dados_json
      ? `<details><summary>Dados completos do caso (JSON)</summary><pre style="font-size:11px;background:#F8F7F4;padding:12px;border-radius:8px;overflow:auto;">${JSON.stringify(caso.dados_json, null, 2)}</pre></details>`
      : "",
  ].join("\n");

  await transporter.sendMail({
    from: `"Clara Law" <${process.env.GMAIL_USER}>`,
    to: "contato@claralaw.com.br",
    replyTo: caso.email,
    subject: `[ESCALADA] Ajuda humana solicitada — ${caso.tipo_caso}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;">${linhas}</div>`,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const casoId = String(body.casoId || "").trim();
    const mensagem = String(body.mensagem || "").trim();

    if (!casoId || !mensagem) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // 1. Autenticação — usuário só pode conversar sobre casos próprios
    const cookieStore = await cookies();
    const supabase = createRouteSupabase(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // 2. Buscar caso (RLS garante que só retorna se for do usuário)
    const { data: caso, error: casoErr } = await supabase
      .from("user_casos")
      .select("id, user_id, email, tipo_caso, descricao, dados_json")
      .eq("id", casoId)
      .maybeSingle();
    if (casoErr || !caso) {
      return NextResponse.json({ error: "caso_not_found" }, { status: 404 });
    }
    const casoTyped = caso as CasoRow;

    // 3. Buscar histórico da conversa (últimas 20 pra não estourar contexto)
    const { data: msgsPrev } = await supabase
      .from("mensagens")
      .select("role, conteudo")
      .eq("caso_id", casoId)
      .order("created_at", { ascending: true })
      .limit(20);

    // 4. Salvar mensagem do usuário
    const { error: insertUserErr } = await supabaseAdmin.from("mensagens").insert({
      caso_id: casoId,
      user_id: user.id,
      role: "user",
      conteudo: mensagem,
    });
    if (insertUserErr) {
      console.error("chat_insert_user_error", insertUserErr.message);
    }

    // 5. Escalada — se detectada, dispara e-mail em paralelo (não bloqueia resposta IA)
    const escalado = detectaEscalada(mensagem);
    if (escalado) {
      enviarEmailEscalada(casoTyped, mensagem).catch((err) =>
        console.error("escalada_email_failed", err instanceof Error ? err.message : "unknown"),
      );
    }

    // 6. Chamar Anthropic
    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback amigável quando a chave não está configurada
      const fallback = "A Clara IA está temporariamente indisponível. Se precisar de ajuda urgente, clique em \"Falar com humano\" no topo do chat.";
      await supabaseAdmin.from("mensagens").insert({
        caso_id: casoId,
        user_id: user.id,
        role: "assistant",
        conteudo: fallback,
      });
      return NextResponse.json({ resposta: fallback, escalado });
    }

    const systemPrompt = `${SYSTEM_PROMPT_BASE}

CONTEXTO DO CASO DO USUÁRIO:
- Tipo: ${casoTyped.tipo_caso}
- Descrição: ${casoTyped.descricao || "(não informada)"}
- Dados adicionais: ${casoTyped.dados_json ? JSON.stringify(casoTyped.dados_json) : "(nenhum)"}

Use esse contexto para dar respostas específicas ao caso do usuário — cite os detalhes dele quando fizer sentido.`;

    // Montar histórico no formato Anthropic
    const previousMessages = ((msgsPrev as MsgRow[] | null) ?? []).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.conteudo,
    }));

    let respostaTexto = "";
    try {
      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 800,
        system: systemPrompt,
        messages: [
          ...previousMessages,
          { role: "user", content: mensagem },
        ],
      });
      // Primeiro bloco de texto da resposta
      const bloco = resp.content.find((c) => c.type === "text");
      respostaTexto = bloco && "text" in bloco ? bloco.text : "";
      if (!respostaTexto) throw new Error("empty_response");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      console.error("anthropic_call_failed", msg);
      respostaTexto = "Desculpe, tive um problema pra responder agora. Tente novamente em instantes — ou clique em \"Falar com humano\" se for urgente.";
    }

    // 7. Salvar resposta da assistente
    await supabaseAdmin.from("mensagens").insert({
      caso_id: casoId,
      user_id: user.id,
      role: "assistant",
      conteudo: respostaTexto,
    });

    return NextResponse.json({ resposta: respostaTexto, escalado });
  } catch (err) {
    console.error("chat_route_error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
