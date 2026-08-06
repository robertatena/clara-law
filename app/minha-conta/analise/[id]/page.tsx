"use client";

// Página que revisita uma análise de contrato salva (original ou reanálise).
// Lê user_casos.dados_json.resultado via Supabase RLS (só o dono acessa) e
// renderiza uma view simplificada com os pontos principais.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-auth";

type ResultadoSalvo = {
  nota_geral?: number;
  score?: number;
  resumo?: string;
  pontos_atencao?: Array<{ titulo?: string; explicacao?: string; risco?: string; por_que_importa?: string }>;
  riscos_principais?: Array<{ titulo?: string; linguagem_simples?: string; risco?: string }>;
  base_legal?: Array<{ titulo?: string; fundamento?: string }>;
  email_pronto?: { assunto?: string; corpo?: string };
  orientacao_final?: string;
  perguntas_para_negociar?: string[];
};

type CasoDetalhe = {
  id: string;
  tipo_caso: string;
  created_at: string;
  reanalise_de: string | null;
  dados_json: { contractType?: string; resultado?: ResultadoSalvo } | null;
};

const ClaraIcon = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="#D4AF37" strokeWidth="1.8" fill="none" />
    <polygon points="20,9 31,29 9,29" fill="none" stroke="#D4AF37" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export default function RevisitarAnalisePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const supabase = createBrowserSupabase();

  const [caso, setCaso] = useState<CasoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelado) return;
      if (!user) { setErro("Faça login pra ver a análise."); setCarregando(false); return; }

      const { data, error } = await supabase
        .from("user_casos")
        .select("id, tipo_caso, created_at, reanalise_de, dados_json")
        .eq("id", id)
        .eq("tipo_caso", "analise_contrato")
        .maybeSingle();
      if (cancelado) return;
      if (error || !data) { setErro("Análise não encontrada ou sem acesso."); setCarregando(false); return; }
      setCaso(data as CasoDetalhe);
      setCarregando(false);
    })();
    return () => { cancelado = true; };
  }, [id, supabase]);

  const resultado = caso?.dados_json?.resultado;
  const contractType = caso?.dados_json?.contractType || "Contrato";
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <main style={{ fontFamily: "'Montserrat', sans-serif", background: "#F8F7F4", minHeight: "100vh", paddingTop: 64 }}>
      <nav style={{ background: "#fff", borderBottom: "1px solid #ECEAE4", position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(26,35,64,0.04)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/minha-conta" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <ClaraIcon size={32} />
            <span style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 14, letterSpacing: "0.14em", color: "#A8D8F0" }}>CLARA LAW</span>
          </Link>
          {caso?.reanalise_de ? (
            <Link href={`/minha-conta/caso/${caso.reanalise_de}`} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Voltar ao caso</Link>
          ) : (
            <Link href={`/minha-conta/caso/${id}`} style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Voltar ao caso</Link>
          )}
        </div>
      </nav>

      <section style={{ padding: "56px 24px 40px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto" }}>

          {carregando && <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center" }}>Carregando…</p>}

          {erro && (
            <div style={{ background: "#FFF9ED", border: "1px solid #fcd34d", color: "#92400e", padding: "16px 20px", borderRadius: 12, fontSize: 14 }}>
              {erro}
              <div style={{ marginTop: 8 }}>
                <Link href="/minha-conta" style={{ color: "#185FA5", fontSize: 13 }}>← Voltar aos meus casos</Link>
              </div>
            </div>
          )}

          {!carregando && caso && !resultado && (
            <div style={{ background: "#F0F4FF", border: "1px solid #C7D2FE", borderRadius: 14, padding: "20px 22px", color: "#3730a3", fontSize: 14, lineHeight: 1.65 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Análise sem cópia salva</div>
              <p>Essa análise é anterior ao histórico persistente. O relatório completo foi enviado pro seu e-mail no momento da compra. Análises futuras ficam salvas aqui automaticamente.</p>
            </div>
          )}

          {!carregando && caso && resultado && (
            <>
              <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "22px 24px", marginBottom: 20, boxShadow: "0 6px 20px rgba(26,35,64,0.04)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 6 }}>
                  {caso.reanalise_de ? "Reanálise" : "Análise original"}
                </div>
                <h1 style={{ fontFamily: "'Raleway', sans-serif", fontWeight: 700, fontSize: 22, color: "#1a2340", marginBottom: 6, lineHeight: 1.3 }}>
                  {contractType}
                </h1>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>Analisado em {fmt(caso.created_at)}</div>
              </div>

              {typeof (resultado.nota_geral ?? resultado.score) === "number" && (
                <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>Nota do contrato</div>
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#1a2340" }}>{resultado.nota_geral ?? resultado.score}<span style={{ fontSize: 16, color: "#9ca3af", fontWeight: 500 }}>/100</span></div>
                </div>
              )}

              {resultado.resumo && (
                <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>Resumo</div>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{resultado.resumo}</p>
                </div>
              )}

              {Array.isArray(resultado.pontos_atencao) && resultado.pontos_atencao.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>Pontos de atenção</div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    {resultado.pontos_atencao.map((p, i) => (
                      <li key={i} style={{ paddingBottom: 12, borderBottom: i < resultado.pontos_atencao!.length - 1 ? "1px solid #F0EEE8" : "none" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2340", marginBottom: 4 }}>{p.titulo || `Ponto ${i + 1}`}{p.risco ? <span style={{ marginLeft: 8, fontSize: 11, color: "#6b7280", fontWeight: 500 }}>Risco {p.risco}</span> : null}</div>
                        {p.explicacao && <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, margin: 0 }}>{p.explicacao}</p>}
                        {p.por_que_importa && <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginTop: 6, margin: "6px 0 0" }}><strong>Por que importa:</strong> {p.por_que_importa}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resultado.email_pronto?.corpo && (
                <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 10 }}>E-mail pronto pra negociar</div>
                  {resultado.email_pronto.assunto && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Assunto</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2340" }}>{resultado.email_pronto.assunto}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, whiteSpace: "pre-wrap", background: "#F8F7F4", padding: "12px 14px", borderRadius: 10, border: "1px solid #E0DDD6" }}>
                    {resultado.email_pronto.corpo}
                  </div>
                </div>
              )}

              {resultado.orientacao_final && (
                <div style={{ background: "#fff", border: "1px solid #E0DDD6", borderRadius: 14, padding: "20px 22px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", color: "#D4AF37", textTransform: "uppercase", marginBottom: 8 }}>Orientação final</div>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{resultado.orientacao_final}</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
