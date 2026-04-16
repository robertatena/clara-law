"use client";

import { useState } from "react";
import Link from "next/link";

interface ForumResult {
  encontrado: boolean;
  foro?: string;
  endereco?: string;
  email?: string;
  horario?: string;
  aviso?: string;
  link?: string;
  mensagem?: string;
  erro?: string;
}

export function ForumBuscador({ compact = false }: { compact?: boolean }) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<ForumResult | null>(null);
  const [erro, setErro] = useState("");

  function formatarCep(v: string) {
    const num = v.replace(/\D/g, "").slice(0, 8);
    if (num.length > 5) return num.slice(0, 5) + "-" + num.slice(5);
    return num;
  }

  async function buscar() {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) {
      setErro("Digite o CEP completo com 8 números.");
      return;
    }
    setErro("");
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/forum?cep=${cepLimpo}`);
      const data = await res.json();
      setResultado(data);
    } catch {
      setErro("Erro ao buscar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Input */}
      <div style={{ display: "flex", gap: 8, maxWidth: compact ? 400 : 480, marginBottom: 8 }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="CEP da empresa ou pessoa (ex: 01310-100)"
          value={cep}
          onChange={(e) => {
            setCep(formatarCep(e.target.value));
            setErro("");
            setResultado(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
          style={{
            flex: 1,
            border: erro ? "1px solid #f87171" : "1px solid #D0CCC4",
            borderRadius: 10,
            padding: "12px 16px",
            fontSize: 14,
            fontFamily: "'Montserrat', sans-serif",
            outline: "none",
            background: "#fff",
            color: "#1a2340",
          }}
        />
        <button
          onClick={buscar}
          disabled={loading}
          style={{
            background: loading ? "#9ca3af" : "#1a2340",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px 20px",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Montserrat', sans-serif",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "Buscando..." : "Encontrar fórum"}
        </button>
      </div>

      {erro && <p style={{ fontSize: 12, color: "#dc2626", marginBottom: 8 }}>{erro}</p>}

      <p style={{ fontSize: 12, color: "#aaa", marginBottom: resultado ? 16 : 0 }}>
        Digite o CEP do endereço da empresa ou pessoa que causou o problema — não o seu.
      </p>

      {/* Resultado encontrado */}
      {resultado?.encontrado && (
        <div style={{
          background: "#F8F7F4",
          border: "1px solid #E0DDD6",
          borderRadius: 14,
          padding: 20,
          marginTop: 8,
          maxWidth: compact ? 400 : 520,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 18 }}>🏛️</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1a2340", fontFamily: "'Raleway', sans-serif" }}>
              {resultado.foro}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, color: "#4b5563" }}>
              <span>📍</span><span>{resultado.endereco}</span>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              <span>✉️</span>
              <a href={`mailto:${resultado.email}`} style={{ color: "#185FA5", fontWeight: 600, textDecoration: "none" }}>
                {resultado.email}
              </a>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "#4b5563" }}>
              <span>🕐</span><span>{resultado.horario}</span>
            </div>
          </div>

          {resultado.aviso && (
            <p style={{ fontSize: 11, color: "#aaa", marginBottom: 16, lineHeight: 1.5 }}>
              ⚠️ {resultado.aviso}
            </p>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              href={`/enviar?origem=forum&foro=${encodeURIComponent(resultado.foro ?? "")}&email=${encodeURIComponent(resultado.email ?? "")}`}
              style={{ background: "#1a2340", color: "#fff", fontSize: 12, fontWeight: 600, padding: "10px 18px", borderRadius: 24, textDecoration: "none" }}>
              ✉️ Gerar e-mail de notificação
            </Link>
            <Link href="/forum"
              style={{ border: "1px solid #C8C3BA", color: "#1a2340", fontSize: 12, padding: "10px 16px", borderRadius: 24, textDecoration: "none" }}>
              O que levar no dia →
            </Link>
          </div>
        </div>
      )}

      {/* Não encontrado */}
      {resultado && !resultado.encontrado && (
        <div style={{ background: "#FFF9ED", border: "1px solid #fcd34d", borderRadius: 12, padding: 16, marginTop: 8, maxWidth: 480, fontSize: 13, color: "#92400e" }}>
          <strong style={{ fontWeight: 600 }}>CEP não encontrado no mapa.</strong>
          {" "}{resultado.mensagem}
          {resultado.link && (
            <> <a href={resultado.link} target="_blank" rel="noreferrer" style={{ color: "#185FA5" }}>Consultar TJSP diretamente →</a></>
          )}
        </div>
      )}
    </div>
  );
}
