"use client";

// Banner de consentimento LGPD — opt-in. Enquanto não houver escolha salva,
// nenhum evento é enviado (ver lib/analytics/track.ts). "Recusar" não mostra
// o banner de novo; a escolha pode ser trocada em /privacidade.

import { useEffect, useState } from "react";
import posthog from "posthog-js";

const CHAVE = "clara_consent_analytics";

export function ConsentBanner() {
  const [escolha, setEscolha] = useState<"granted" | "denied" | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo === "granted" || salvo === "denied") setEscolha(salvo);
    } catch {
      // segue mostrando o banner
    }
    setPronto(true);
  }, []);

  function escolher(valor: "granted" | "denied") {
    try {
      localStorage.setItem(CHAVE, valor);
    } catch {
      // sem persistência — o banner volta a aparecer na próxima visita
    }
    setEscolha(valor);
    if (valor === "granted") {
      try {
        posthog.opt_in_capturing();
      } catch {
        // posthog pode não ter inicializado (sem env configurada)
      }
    }
  }

  if (!pronto || escolha !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de analytics"
      style={{
        position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 100,
        maxWidth: 560, margin: "0 auto",
        background: "#1a2340", color: "#fff",
        borderRadius: 16, padding: "18px 20px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
        display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center",
        fontFamily: "'Montserrat', sans-serif",
      }}
    >
      <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, flex: "1 1 260px", color: "#E5E7EB" }}>
        Usamos analytics pra entender o que funciona no site. Só coletamos dados depois do seu aceite — nunca e-mail, nome ou CPF.{" "}
        <a href="/privacidade" style={{ color: "#D4AF37", textDecoration: "underline" }}>Saiba mais</a>.
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => escolher("denied")}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 18px", borderRadius: 40, cursor: "pointer" }}
        >
          Recusar
        </button>
        <button
          type="button"
          onClick={() => escolher("granted")}
          style={{ background: "#D4AF37", border: "none", color: "#1a2340", fontSize: 13, fontWeight: 700, padding: "10px 18px", borderRadius: 40, cursor: "pointer" }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
