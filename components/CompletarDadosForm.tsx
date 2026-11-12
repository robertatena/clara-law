"use client";

// Formulário curto pós-pagamento — só aparece quando a petição ainda está
// "parcial" (faltam dados). Envia pra /api/caso/completar-dados, que já
// resolve o fórum pelo CEP e recalcula o status da petição.

import { useState } from "react";

type Props = {
  token: string;
  valoresIniciais?: {
    nomeCompleto?: string;
    cpf?: string;
    nomeEmpresa?: string;
  };
  onSalvo: () => void;
};

export default function CompletarDadosForm({ token, valoresIniciais, onSalvo }: Props) {
  const [nomeCompleto, setNomeCompleto] = useState(valoresIniciais?.nomeCompleto || "");
  const [cpf, setCpf] = useState(valoresIniciais?.cpf || "");
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [cepAutor, setCepAutor] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState(valoresIniciais?.nomeEmpresa || "");
  const [cnpjEmpresa, setCnpjEmpresa] = useState("");
  const [valorCausa, setValorCausa] = useState("");
  const [cepBusca, setCepBusca] = useState("");
  const [cepProprio, setCepProprio] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const resp = await fetch("/api/caso/completar-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          nomeCompleto,
          cpf,
          enderecoAutor: { logradouro, numero, bairro, cidade, uf, cep: cepAutor },
          nomeEmpresa,
          cnpjEmpresa,
          valorCausa,
          cepBusca: cepBusca || cepAutor,
          cepProprio,
        }),
      });
      if (!resp.ok) {
        setErro("Não foi possível salvar. Confira os dados e tente novamente.");
        return;
      }
      onSalvo();
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Seu nome completo</label>
          <input type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)}
            className="w-full rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Seu CPF</label>
          <input type="text" inputMode="numeric" value={cpf} onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
            placeholder="Só números"
            className="w-full rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Seu endereço</label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input type="text" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Rua/Av."
            className="md:col-span-2 rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
          <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número"
            className="rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
          <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Bairro"
            className="rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
          <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Cidade"
            className="md:col-span-2 rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
          <input type="text" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))} placeholder="UF"
            className="rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
          <input type="text" inputMode="numeric" value={cepAutor} onChange={(e) => setCepAutor(e.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="CEP"
            className="rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nome da empresa (ré)</label>
          <input type="text" value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)}
            className="w-full rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">CNPJ da empresa <span className="text-slate-400 font-normal">(se souber)</span></label>
          <input type="text" inputMode="numeric" value={cnpjEmpresa} onChange={(e) => setCnpjEmpresa(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Valor da causa</label>
        <p className="text-xs text-slate-500 mb-2">Soma dos danos materiais que você pode comprovar + uma estimativa de dano moral, se for o caso.</p>
        <input type="text" value={valorCausa} onChange={(e) => setValorCausa(e.target.value)} placeholder="R$ 0,00"
          className="w-full rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Onde ajuizar a ação</label>
        <div className="flex gap-2 mb-2">
          <button type="button" onClick={() => setCepProprio(true)}
            className={`flex-1 rounded-full py-2 text-xs font-semibold ${cepProprio ? "bg-[#0e2b50]/10 text-[#0e2b50] border border-[#0e2b50]/40" : "bg-transparent text-slate-500 border border-slate-200"}`}>
            CEP da minha casa (padrão)
          </button>
          <button type="button" onClick={() => setCepProprio(false)}
            className={`flex-1 rounded-full py-2 text-xs font-semibold ${!cepProprio ? "bg-[#0e2b50]/10 text-[#0e2b50] border border-[#0e2b50]/40" : "bg-transparent text-slate-500 border border-slate-200"}`}>
            CEP da empresa/local do fato
          </button>
        </div>
        <p className="text-xs text-slate-500 mb-2">
          {cepProprio
            ? "CDC art. 101, I — você pode ajuizar no foro do seu próprio domicílio."
            : "Lei 9.099/95, art. 4º, I — foro do domicílio do réu ou do local do fato."}
        </p>
        <input type="text" inputMode="numeric" value={cepBusca} onChange={(e) => setCepBusca(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="CEP pra buscar o fórum (deixe vazio pra usar o CEP acima)"
          className="w-full rounded-[14px] border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none" />
      </div>

      {erro && <div className="rounded-[14px] bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erro}</div>}

      <button type="submit" disabled={salvando}
        className="w-full rounded-full bg-[#0e2b50] text-white font-bold text-sm py-3 disabled:opacity-50">
        {salvando ? "Salvando..." : "Salvar e gerar minha petição"}
      </button>
    </form>
  );
}
