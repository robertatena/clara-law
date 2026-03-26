"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
export default function EnviarPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [papel, setPapel] = useState("Contratante (quem paga)");
  const [aceite, setAceite] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const emailOk = useMemo(() => /^\S+@\S+\.\S+$/.test(email.trim()), [email]);
  function validar() {
    if (!nome.trim()) return "Preencha seu nome.";
    if (!emailOk) return "E-mail inválido.";
    if (!telefone.trim()) return "Preencha seu telefone.";
    if (!aceite) return "É necessário aceitar os termos para continuar.";
    return null;
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    const msg = validar();
    if (msg) {
      setErro(msg);
      return;
    }
    setLoading(true);
    try {
      // salva localmente (pra você não perder enquanto conecta backend)
      localStorage.setItem(
        "clara_user",
        JSON.stringify({ nome: nome.trim(), email: email.trim(), telefone: telefone.trim(), papel })
      );
      // navega SEM window.location (evita refresh e bugs)
      // router.push("/analisar");  // (auto-patch)
    } catch (err: any) {
      setErro("Falha ao salvar dados. Veja o console.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Antes de analisar seu contrato</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <input
            className="w-full rounded-lg border border-slate-200 px-4 py-3"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
        </div>
        <div>
          <input
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <input
            className="w-full rounded-lg border border-slate-200 px-4 py-3"
            placeholder="Seu telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-slate-200 px-4 py-3"
            value={papel}
            onChange={(e) => setPapel(e.target.value)}
          >
            <option>Contratante (quem paga)</option>
            <option>Contratado (quem presta)</option>
            <option>Representante/Procurador</option>
          </select>
        </div>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={aceite}
            onChange={(e) => setAceite(e.target.checked)}
          />
          <span>
            Concordo com o uso das informações enviadas para fins de análise automática e entendo que a Clara Law não
            substitui um advogado.
          </span>
        </label>
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-slate-900 px-6 py-4 text-white disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Analisar contrato"}
        </button>
      </form>
    </main>
  );
}
