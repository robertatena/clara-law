�import { getUsers } from "@/lib/data/users";
type AdminUser = {
  name?: string | null;
  email?: string | null;
  date?: string | null;
  [key: string]: any;
};

export default async function Admin() {const users = await getUsers();
  const safeUsers = Array.isArray(users) ? users : [];

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Admin � Acessos</h1>
      <table className="mt-6 w-full border">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">E-mail</th>
            <th className="p-2 text-left">Data</th>
          </tr>
        </thead>
        <tbody>
          {safeUsers.map((u, i) => (
            <tr key={i} className="border-b">
              <td className="p-2">{u.name || "-"}</td>
              <td className="p-2">{u.email}</td>
              <td className="p-2 text-sm text-neutral-500">{u.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}



