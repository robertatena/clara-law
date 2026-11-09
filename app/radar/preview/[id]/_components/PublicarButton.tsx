"use client";

// Botão de publicação — só renderizado quando edição é rascunho.
// Exige confirmação (window.confirm) antes de disparar POST.
// No sucesso, redireciona pra /radar (que já reflete a nova publicação
// via revalidatePath disparado pelo endpoint).

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PublicarButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function publicar() {
    const ok = window.confirm(
      `Publicar ${id}?\n\nDepois disso a edição fica IMUTÁVEL — nenhum campo pode ser alterado.`,
    );
    if (!ok) return;

    setLoading(true);
    setErro(null);
    try {
      const resp = await fetch("/api/radar/publicar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = await resp.json().catch(() => ({}));

      if (resp.ok) {
        // Publicação bem-sucedida — redirect + hard refresh
        router.push("/radar");
        router.refresh();
        return;
      }

      if (resp.status === 409 && body.error === "rascunho_desatualizado") {
        setErro(
          "Rascunho desatualizado. " +
            (body.detalhe || "Regenere o rascunho antes de publicar."),
        );
        return;
      }
      if (resp.status === 409) {
        setErro(body.message || "Edição não pode ser publicada agora.");
        return;
      }
      if (resp.status === 401) {
        setErro("Sessão expirada. Faça login novamente.");
        return;
      }
      setErro("Erro " + resp.status + " — " + (body.error || "desconhecido"));
    } catch {
      setErro("Erro ao contactar o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      style={{
        background: "#F8F7F4",
        borderTop: "1px solid #ECEAE4",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <button
          onClick={publicar}
          disabled={loading}
          style={{
            background: loading ? "#9ca3af" : "#dc2626",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            padding: "16px 40px",
            borderRadius: 40,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Montserrat', sans-serif",
          }}
        >
          {loading ? "Publicando..." : "Publicar esta edição"}
        </button>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 12, fontStyle: "italic" }}>
          Confirmação será exigida antes da publicação.
        </p>

        {erro && (
          <div
            style={{
              background: "#FEE2E2",
              border: "1px solid #FCA5A5",
              color: "#991B1B",
              padding: "12px 16px",
              borderRadius: 10,
              fontSize: 13,
              marginTop: 20,
              maxWidth: 500,
              marginLeft: "auto",
              marginRight: "auto",
              textAlign: "left",
            }}
          >
            {erro}
          </div>
        )}
      </div>
    </section>
  );
}
