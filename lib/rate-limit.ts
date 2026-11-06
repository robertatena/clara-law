// Rate limit em memória — best-effort. Em serverless (Vercel), cada instância
// tem seu próprio estado e instâncias reciclam entre invocações frias, então
// isso NÃO é uma garantia dura entre requests, mas já corta scripts simples
// de abuso dentro de uma instância quente. Pra garantia real (compartilhada
// entre instâncias), precisaria de um store externo (Supabase, Redis etc.)
// — fora do escopo desta correção pontual.

const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) {
    const cutoff = now - windowMs;
    for (const [k, v] of hits) {
      const filtered = v.filter((t) => t > cutoff);
      if (filtered.length === 0) hits.delete(k); else hits.set(k, filtered);
    }
  }
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
