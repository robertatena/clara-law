export type SavedUser = {
  name?: string;
  email: string;
  telefone?: string;
  papel?: string;
  createdAt?: string;
};

// memória em runtime (dev). Troque por DB depois.
const memory: SavedUser[] = [];

export async function saveUser(u: SavedUser) {
  if (!u?.email) throw new Error("email obrigatório");
  const email = String(u.email).trim().toLowerCase();

  const existing = memory.find(x => (x.email || "").toLowerCase() === email);
  if (existing) {
    Object.assign(existing, { ...u, email, createdAt: existing.createdAt || new Date().toISOString() });
    return existing;
  }

  const created = { ...u, email, createdAt: new Date().toISOString() };
  memory.push(created);
  return created;
}

export async function getUserByEmail(email: string) {
  const e = String(email || "").trim().toLowerCase();
  return memory.find(x => (x.email || "").toLowerCase() === e) || null;
}
