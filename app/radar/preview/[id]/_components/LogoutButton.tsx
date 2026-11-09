"use client";

// Botão de logout admin — POST /api/radar/admin/logout apaga o cookie.
// Redireciona pra /radar/admin/login no sucesso.

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/radar/admin/logout", { method: "POST" });
    } catch {
      // ignora — o cookie ainda pode ter sido apagado pelo browser localmente
    } finally {
      router.push("/radar/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      onClick={logout}
      disabled={loading}
      style={{
        position: "fixed",
        top: 60,
        right: 16,
        zIndex: 201,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        fontSize: 11,
        fontWeight: 600,
        padding: "6px 12px",
        borderRadius: 6,
        border: "none",
        cursor: loading ? "wait" : "pointer",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      {loading ? "..." : "sair"}
    </button>
  );
}
