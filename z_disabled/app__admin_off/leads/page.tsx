�import { sql } from "@vercel/postgres";
import Link from "next/link";
export const dynamic = "force-dynamic";
function Unauthorized() {
  return (
    <div className="min-h-screen bg-[var(--clara-bg)] text-slate-900 p-8">
      <div className="max-w-xl mx-auto bg-white border rounded-2xl p-6">
        <h1 className="text-lg font-extrabold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-slate-600">
          Defina <code className="px-1 rounded bg-slate-100">ADMIN_PASSWORD</code> e acesse com <code className="px-1 rounded bg-slate-100">?p=</code>.
        </p>
        <p className="mt-4 text-sm"><Link className="underline" href="/">Voltar</Link></p>
      </div>
    </div>
  );
}
type LeadRow = {
  id: string | number;
  created_at: string | number | Date;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
};

export default async function LeadsPage({ searchParams }: { searchParams: { p?: string } }) {
  const pass = process.env.ADMIN_PASSWORD;
  const p = searchParams?.p;
  if (!pass || p !== pass) return <Unauthorized />;
  await sql`
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  const { rows } = await sql`
    SELECT id, name, email, created_at
    FROM leads
    ORDER BY created_at DESC
    LIMIT 1000;
  `;
  return (
    <div className="min-h-screen bg-[var(--clara-bg)] text-slate-900 p-8">
      <div className="max-w-5xl mx-auto bg-white border rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-xl font-extrabold">Leads (nome + e-mail)</h1>
          <span className="text-xs font-semibold px-3 py-1 rounded-full border bg-[var(--clara-butter)] border-[var(--clara-butter-2)]">
            Total (últimos 1000): {rows.length}
          </span>
        </div>
        <div className="mt-4 overflow-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 border-b">Data</th>
                <th className="text-left p-3 border-b">Nome</th>
                <th className="text-left p-3 border-b">E-mail</th>
              </tr>
            </thead>
            <tbody>
              {((rows ?? []) as unknown as LeadRow[]).map((r) => (
                <tr key={r.id} className="border-b last:border-b-0">
                  <td className="p-3">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-600">
          Acesso: <code className="px-1 rounded bg-slate-100">/admin/leads?p=SUA_SENHA</code>
        </p>
      </div>
    </div>
  );
}




