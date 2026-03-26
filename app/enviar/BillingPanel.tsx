"use client";

import { useMemo, useState } from "react";

type Props = {
  email: string;
  freeLeft: number;
  credits: number;
  onPurchased?: () => void;
};

export default function BillingPanel({ email, freeLeft, credits, onPurchased }: Props) {
  const [loading, setLoading] = useState(false);
  const [qty, setQty] = useState(1);

  const canBuy = useMemo(() => (email || "").trim().length > 3, [email]);

  async function buy() {
    if (!canBuy) {
      alert("Preencha o e-mail para comprar.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, qty }),
      });
      const j = await r.json();
      if (!j?.ok || !j?.url) throw new Error(j?.error || "checkout_failed");
      window.location.href = j.url;
    } catch (e: any) {
      alert("Não foi possível iniciar o pagamento: " + (e?.message || "erro"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ border: "1px solid #E6E8EC", borderRadius: 18, padding: 16, background: "#fff" }}>
      <h3 style={{ margin: 0, fontSize: 16 }}>Créditos</h3>
      <div style={{ marginTop: 8, color: "#475467" }}>
        <div><b>Grátis restantes:</b> {freeLeft}</div>
        <div><b>Créditos pagos:</b> {credits}</div>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontSize: 13, color: "#667085" }}>Comprar:</label>
        <select value={qty} onChange={(e) => setQty(Number(e.target.value))}
          style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #D0D5DD" }}>
          <option value={1}>1 análise (R$ 5)</option>
          <option value={5}>5 análises (R$ 25)</option>
          <option value={10}>10 análises (R$ 50)</option>
        </select>
        <button onClick={buy} disabled={loading || !canBuy}
          style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid #0B2B4A", background: "#0B2B4A", color: "#fff", fontWeight: 700 }}>
          {loading ? "Abrindo pagamento..." : "Pagar e continuar"}
        </button>
      </div>

      <div style={{ marginTop: 10, color: "#667085", fontSize: 12 }}>
        Pagamento via <b>cartão</b> ou <b>PIX</b> (Stripe). Após pagar, os créditos entram automaticamente.
      </div>
    </div>
  );
}
