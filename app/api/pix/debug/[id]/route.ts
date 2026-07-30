// ROTA EXPLORATÓRIA — descobrir qual endpoint da AbacatePay aceita
// o ID pix_char_... retornado por POST /v2/transparents/create.
// TEMPORÁRIA — apagar assim que descobrir o endpoint correto.

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CANDIDATES: Array<{ label: string; build: (id: string) => string }> = [
  { label: "v2 transparents by id (path)",         build: (id) => `https://api.abacatepay.com/v2/transparents/${encodeURIComponent(id)}` },
  { label: "v2 transparents check (query id)",     build: (id) => `https://api.abacatepay.com/v2/transparents/check?id=${encodeURIComponent(id)}` },
  { label: "v1 pixQrCode check (query id)",        build: (id) => `https://api.abacatepay.com/v1/pixQrCode/check?id=${encodeURIComponent(id)}` },
  { label: "v1 pixQrCode by id (path)",            build: (id) => `https://api.abacatepay.com/v1/pixQrCode/${encodeURIComponent(id)}` },
  { label: "v2 pixQrCode check (query id)",        build: (id) => `https://api.abacatepay.com/v2/pixQrCode/check?id=${encodeURIComponent(id)}` },
  { label: "v2 pixQrCode by id (path)",            build: (id) => `https://api.abacatepay.com/v2/pixQrCode/${encodeURIComponent(id)}` },
  { label: "v1 billing by id (path)",              build: (id) => `https://api.abacatepay.com/v1/billing/${encodeURIComponent(id)}` },
  { label: "v1 billing check (query id)",          build: (id) => `https://api.abacatepay.com/v1/billing/check?id=${encodeURIComponent(id)}` },
  { label: "v1 charges by id (path)",              build: (id) => `https://api.abacatepay.com/v1/charges/${encodeURIComponent(id)}` },
];

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const apiKey = process.env.ABACATEPAY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "pix_not_configured" }, { status: 500 });

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const results: Array<{
    label: string;
    url: string;
    httpStatus: number;
    ok: boolean;
    body: unknown;
  }> = [];

  for (const c of CANDIDATES) {
    const url = c.build(id);
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
        cache: "no-store",
      });
      const raw = await resp.text();
      let body: unknown;
      try { body = JSON.parse(raw); } catch { body = raw.slice(0, 400); }
      results.push({ label: c.label, url, httpStatus: resp.status, ok: resp.ok, body });
    } catch (err) {
      results.push({
        label: c.label,
        url,
        httpStatus: 0,
        ok: false,
        body: { error: err instanceof Error ? err.message : "unknown" },
      });
    }
  }

  const winners = results.filter((r) => r.ok);
  console.log("pix_debug_scan", {
    id,
    total: results.length,
    winnersCount: winners.length,
    winnersLabels: winners.map((w) => w.label),
  });

  return NextResponse.json({ id, results, winners });
}
