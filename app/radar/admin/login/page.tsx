"use client";

// Login administrativo do Radar — form minimal.
//
// Envia POST /api/radar/admin/login com o token.
// No sucesso, redireciona pra `?next=…` (se presente) ou `/radar`.
// Erros comuns: token inválido (401), rate limit (429).

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro(null);
    try {
      const resp = await fetch("/api/radar/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (resp.status === 429) {
        setErro("Muitas tentativas em pouco tempo. Aguarde alguns minutos.");
        return;
      }
      if (!resp.ok) {
        setErro("Token inválido.");
        return;
      }
      const next = searchParams.get("next") || "/radar";
      router.push(next);
      router.refresh();
    } catch {
      setErro("Erro ao contactar o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        fontFamily: "'Montserrat', sans-serif",
        background: "#F8F7F4",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #E0DDD6",
          borderRadius: 16,
          padding: "36px 32px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 4px 12px rgba(26,35,64,0.06)",
        }}
      >
        <h1
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontWeight: 700,
            fontSize: 22,
            color: "#1a2340",
            marginBottom: 8,
          }}
        >
          Radar · acesso admin
        </h1>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24, lineHeight: 1.6 }}>
          Cole o token administrativo pra acessar preview e publicação.
        </p>

        <form onSubmit={submit}>
          <label
            htmlFor="token"
            style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}
          >
            RADAR_ADMIN_TOKEN
          </label>
          <input
            id="token"
            type="password"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #D1CCC4",
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 16,
              fontFamily: "monospace",
            }}
          />

          {erro && (
            <div
              style={{
                background: "#FEE2E2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                padding: "8px 12px",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              width: "100%",
              background: loading || !token ? "#9ca3af" : "#1a2340",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              padding: "12px 20px",
              borderRadius: 8,
              border: "none",
              cursor: loading || !token ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 20, lineHeight: 1.5 }}>
          Sessão dura 24h. Cookie httpOnly + secure + sameSite=strict.
        </p>
      </div>
    </main>
  );
}
