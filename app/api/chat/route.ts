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
- Se o usuário pedir explicitamente para conversar com uma pessoa da equipe (advogado, humano, atendente), diga apenas "vou encaminhar seu pedido agora" — o encaminhamento real é feito pelo sistema, não é você quem faz.

Responda de forma curta e objetiva (máximo 4-5 parágrafos curtos). Use quebras de linha para facilitar leitura em mobile.`;

// Prompt especial para o chat de acolhimento (sem caso específico)
const SYSTEM_PROMPT_ACOLHIMENTO = `Você é a Clara, assistente educacional da plataforma Clara Law. O usuário está com uma dúvida geral sobre o processo de defesa do consumidor no Brasil.

Seja especialmente acolhedora — muitas pessoas têm medo de processos judiciais. Desmistifique, acalme e oriente em linguagem simples.

Quando alguém perguntar sobre INTIMAÇÃO: explique que é boa notícia (ação foi aceita), não é processo criminal, não afeta CPF, é só uma convocação formal — como um e-mail formal da Justiça.

NUNCA dê consultoria jurídica específica.

Sempre termine sua resposta com: "Se precisar de ajuda mais específica, pode falar com um advogado."

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
  escalado_em: string | null;
};

type MsgRow = { role: string; conteudo: string };

// Retorna true se o e-mail saiu com sucesso, false caso contrário.
// Não lança — o handler POST precisa distinguir entre "enviado" e "falhou" para
// devolver ao cliente o feedback correto (selo verde vs vermelho).
async function enviarEmailEscalada(caso: CasoRow, ultimaMensagem: string, userEmail?: string): Promise<boolean> {
  const replyTo = caso.email || userEmail || "";
  console.log("escalada_email:", {
    to: "claralaw.aviso@gmail.com",
    from: process.env.GMAIL_USER,
    hasPass: !!process.env.GMAIL_PASS,
    casoId: caso.id,
    replyTo,
  });
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn("escalada_email_skipped: GMAIL_USER ou GMAIL_PASS ausente no ambiente");
    return false;
  }
  const linhas = [
    `<p>Um usuário pediu ajuda humana no chat da Clara.</p>`,
    `<p><strong>Email:</strong> ${caso.email || userEmail || "(sem e-mail no caso)"}</p>`,
    `<p><strong>Caso ID:</strong> ${caso.id}</p>`,
    `<p><strong>Tipo:</strong> ${caso.tipo_caso}</p>`,
    `<p><strong>Descrição:</strong> ${caso.descricao || "(sem descrição)"}</p>`,
    `<p><strong>Última mensagem do usuário:</strong></p>`,
    `<blockquote style="border-left:3px solid #D4AF37;margin:0;padding:8px 16px;color:#374151;">${ultimaMensagem}</blockquote>`,
    caso.dados_json
      ? `<details><summary>Dados completos do caso (JSON)</summary><pre style="font-size:11px;background:#F8F7F4;padding:12px;border-radius:8px;overflow:auto;">${JSON.stringify(caso.dados_json, null, 2)}</pre></details>`
      : "",
  ].join("\n");

  try {
    await transporter.sendMail({
      from: `"Clara Law" <${process.env.GMAIL_USER}>`,
      to: "claralaw.aviso@gmail.com",
      replyTo: replyTo || undefined,
      subject: `[ESCALADA] Ajuda humana solicitada — ${caso.tipo_caso}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;">${linhas}</div>`,
    });
    console.log("escalada_email_sent: ok");
    return true;
  } catch (err) {
    console.error("escalada_email_send_failed", err instanceof Error ? err.message : "unknown");
    return false;
  }
}

// Mensagem canônica devolvida ao usuário quando a escalada é aceita e o e-mail sai.
// Substitui a resposta da Anthropic — assim a UI reflete o que aconteceu de verdade.
const MSG_ESCALADA_ENVIADA =
  "Recebi seu pedido de ajuda humana e encaminhei seu caso pra equipe. Você vai receber contato por e-mail no endereço cadastrado em até 24h úteis. Enquanto isso, se preferir escrever, é claralaw.aviso@gmail.com.";

const MSG_ESCALADA_FALHA =
  "Tentei encaminhar seu pedido, mas tivemos uma falha técnica agora. Por favor, escreva direto para claralaw.aviso@gmail.com — nossa equipe responde por lá.";

function fmtDataBR(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return "uma data anterior";
  }
}
function msgEscaladaJaEncaminhado(iso: string): string {
  return `Já encaminhei seu pedido de ajuda humana em ${fmtDataBR(iso)}. Nossa equipe recebeu — se quiser reforçar, escreva pra claralaw.aviso@gmail.com.`;
}

type HistoricoMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const casoIdRaw = body.casoId;
    const casoId = typeof casoIdRaw === "string" ? casoIdRaw.trim() : "";
    const mensagem = String(body.mensagem || "").trim();
    // Histórico opcional enviado pelo cliente (usado no chat de acolhimento sem caso)
    const historicoCliente = Array.isArray(body.historico) ? (body.historico as HistoricoMsg[]) : [];

    if (!mensagem) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    // Autenticação — obrigatória em ambos os fluxos
    const cookieStore = await cookies();
    const supabase = createRouteSupabase(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // ── FLUXO A: chat de acolhimento (sem caso específico) ─────────────────
    // Não persiste nada no banco. Histórico vem do cliente (state local).
    if (!casoId) {
      if (!process.env.ANTHROPIC_API_KEY) {
        return NextResponse.json({
          resposta: "A Clara IA está temporariamente indisponível. Tente novamente em instantes.",
          escalado: false,
        });
      }

      const previousMessages: HistoricoMsg[] = historicoCliente
        .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
        .slice(-20); // últimas 20 pra não estourar contexto

      let respostaTexto = "";
      try {
        const resp = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 800,
          system: SYSTEM_PROMPT_ACOLHIMENTO,
          messages: [
            ...previousMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user" as const, content: mensagem },
          ],
        });
        const bloco = resp.content.find((c) => c.type === "text");
        respostaTexto = bloco && "text" in bloco ? bloco.text : "";
        if (!respostaTexto) throw new Error("empty_response");
      } catch (err) {
        console.error("anthropic_acolhimento_failed", err instanceof Error ? err.message : "unknown");
        respostaTexto = "Desculpe, tive um problema pra responder agora. Tente de novo em instantes.";
      }

      return NextResponse.json({ resposta: respostaTexto, escalado: false });
    }

    // ── FLUXO B: chat sobre caso específico (persiste no banco) ────────────

    // Buscar caso (RLS garante que só retorna se for do usuário)
    const { data: caso, error: casoErr } = await supabase
      .from("user_casos")
      .select("id, user_id, email, tipo_caso, descricao, dados_json, escalado_em")
      .eq("id", casoId)
      .maybeSingle();
    if (casoErr || !caso) {
      return NextResponse.json({ error: "caso_not_found" }, { status: 404 });
    }
    const casoTyped = caso as CasoRow;

    // Buscar histórico da conversa (últimas 20 pra não estourar contexto)
    const { data: msgsPrev } = await supabase
      .from("mensagens")
      .select("role, conteudo")
      .eq("caso_id", casoId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Salvar mensagem do usuário
    const { error: insertUserErr } = await supabaseAdmin.from("mensagens").insert({
      caso_id: casoId,
      user_id: user.id,
      role: "user",
      conteudo: mensagem,
    });
    if (insertUserErr) {
      console.error("chat_insert_user_error", insertUserErr.message);
    }

    // Escalada — se detectada, dispara e-mail SÍNCRONO e pula a Anthropic.
    // O usuário precisa saber se o e-mail saiu de verdade antes da UI mostrar
    // "encaminhado" — fire-and-forget mascarava falhas de entrega.
    //
    // Idempotência: se caso.escalado_em já existe, NÃO envia novo e-mail.
    // Devolve mensagem canônica de "já encaminhado" para o usuário.
    const escalado = detectaEscalada(mensagem);
    if (escalado) {
      // Fluxo A: escalada duplicada — já foi encaminhada antes
      if (casoTyped.escalado_em) {
        const respostaJa = msgEscaladaJaEncaminhado(casoTyped.escalado_em);
        await supabaseAdmin.from("mensagens").insert({
          caso_id: casoId,
          user_id: user.id,
          role: "assistant",
          conteudo: respostaJa,
        });
        return NextResponse.json({
          resposta: respostaJa,
          escalado: true,
          escalado_status: "ja_encaminhado",
          escalado_em: casoTyped.escalado_em,
        });
      }

      // Fluxo B: primeira escalada — envia e marca escalado_em se sucesso
      const enviado = await enviarEmailEscalada(casoTyped, mensagem, user.email ?? undefined);
      if (enviado) {
        const agora = new Date().toISOString();
        const { error: updateErr } = await supabaseAdmin
          .from("user_casos")
          .update({ escalado_em: agora })
          .eq("id", casoId);
        if (updateErr) {
          // O e-mail já saiu — só falhou o registro. Log e segue: no pior caso, próxima
          // tentativa dispara outro e-mail (não corrompe nada, só perde idempotência daquela sessão).
          console.error("escalado_em_update_failed", updateErr.message);
        }
      }
      const respostaCanonica = enviado ? MSG_ESCALADA_ENVIADA : MSG_ESCALADA_FALHA;
      await supabaseAdmin.from("mensagens").insert({
        caso_id: casoId,
        user_id: user.id,
        role: "assistant",
        conteudo: respostaCanonica,
      });
      return NextResponse.json({
        resposta: respostaCanonica,
        // legacy: só true se realmente enviou (client velho passa a exibir "Encaminhado" só quando de fato foi)
        escalado: enviado,
        // novo: distingue os 3 estados possíveis
        escalado_status: enviado ? "enviado" : "falhou",
      });
    }

    // Chamar Anthropic (nunca alcançado se houve escalada — path retornou acima)
    if (!process.env.ANTHROPIC_API_KEY) {
      const fallback = "A Clara IA está temporariamente indisponível. Se precisar de ajuda urgente, escreva para claralaw.aviso@gmail.com.";
      await supabaseAdmin.from("mensagens").insert({
        caso_id: casoId,
        user_id: user.id,
        role: "assistant",
        conteudo: fallback,
      });
      return NextResponse.json({ resposta: fallback, escalado: false });
    }

    const systemPrompt = `${SYSTEM_PROMPT_BASE}

CONTEXTO DO CASO DO USUÁRIO:
- Tipo: ${casoTyped.tipo_caso}
- Descrição: ${casoTyped.descricao || "(não informada)"}
- Dados adicionais: ${casoTyped.dados_json ? JSON.stringify(casoTyped.dados_json) : "(nenhum)"}

Use esse contexto para dar respostas específicas ao caso do usuário — cite os detalhes dele quando fizer sentido.`;

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
      const bloco = resp.content.find((c) => c.type === "text");
      respostaTexto = bloco && "text" in bloco ? bloco.text : "";
      if (!respostaTexto) throw new Error("empty_response");
    } catch (err) {
      console.error("anthropic_call_failed", err instanceof Error ? err.message : "unknown");
      respostaTexto = "Desculpe, tive um problema pra responder agora. Tente novamente em instantes — se for urgente, escreva para claralaw.aviso@gmail.com.";
    }

    await supabaseAdmin.from("mensagens").insert({
      caso_id: casoId,
      user_id: user.id,
      role: "assistant",
      conteudo: respostaTexto,
    });

    return NextResponse.json({ resposta: respostaTexto, escalado: false });
  } catch (err) {
    console.error("chat_route_error", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
