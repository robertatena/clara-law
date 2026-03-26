import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
type Body = { name: string; email: string };
function clean(s: string) {
  return (s ?? "").toString().trim();
}
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Body>;
  const name = clean(body.name ?? "");
  const email = clean(body.email ?? "").toLowerCase();
  if (!name) return NextResponse.json({ error: "missing_name" }, { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    INSERT INTO leads (name, email)
    VALUES (${name}, ${email})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
  `;
  return NextResponse.json({ ok: true });
}

