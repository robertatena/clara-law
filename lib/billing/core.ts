import { db } from "./db";

export const FREE_LIMIT = 2;         // 2 análises grátis
export const PRICE_CENTS = 500;      // R$ 5,00
export const CURRENCY = "brl";

export function normEmail(email: string) {
  return (email || "").trim().toLowerCase();
}

export function getOrCreate(emailRaw: string) {
  const email = normEmail(emailRaw);
  if (!email) throw new Error("E-mail é obrigatório");
  const row = db.prepare("SELECT * FROM billing_users WHERE email=?").get(email);
  if (row) return row;
  db.prepare("INSERT INTO billing_users (email, free_used, credits) VALUES (?, 0, 0)").run(email);
  return db.prepare("SELECT * FROM billing_users WHERE email=?").get(email);
}

export function status(emailRaw: string) {
  const u = getOrCreate(emailRaw);
  const freeRemaining = Math.max(0, FREE_LIMIT - u.free_used);
  return {
    email: u.email,
    freeUsed: u.free_used,
    freeRemaining,
    credits: u.credits,
    canAnalyze: (freeRemaining > 0) || (u.credits > 0),
  };
}

export function consumeOne(emailRaw: string) {
  const u = getOrCreate(emailRaw);
  if (u.credits > 0) {
    db.prepare("UPDATE billing_users SET credits=credits-1, updated_at=datetime('now') WHERE email=?").run(u.email);
    return { ok: true, used: "credit" as const };
  }
  if (u.free_used < FREE_LIMIT) {
    db.prepare("UPDATE billing_users SET free_used=free_used+1, updated_at=datetime('now') WHERE email=?").run(u.email);
    return { ok: true, used: "free" as const };
  }
  return { ok: false, reason: "no_quota" as const };
}

export function addCreditFromSession(emailRaw: string, sessionId: string, amountCents: number, currency: string) {
  const email = normEmail(emailRaw);
  if (!email) throw new Error("E-mail é obrigatório");
  if (!sessionId) throw new Error("session_id ausente");

  const exists = db.prepare("SELECT session_id FROM billing_payments WHERE session_id=?").get(sessionId);
  if (exists) return { ok: true, already: true };

  db.prepare("INSERT INTO billing_payments (session_id, email, amount_cents, currency) VALUES (?, ?, ?, ?)").run(
    sessionId, email, amountCents, currency
  );
  db.prepare("UPDATE billing_users SET credits=credits+1, updated_at=datetime('now') WHERE email=?").run(email);
  return { ok: true, already: false };
}
