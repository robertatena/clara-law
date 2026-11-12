"use client";

// Página persistente do caso — acesso só por token (link do e-mail de
// confirmação da compra), sem login. Mostra a petição (baixar PDF/DOCX),
// o formulário pra completar dados que faltam, o fórum resolvido e a
// orientação de órgãos (Procon/ANAC/consumidor.gov.br/Reclame Aqui).

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import OrientacaoOrgaos from "@/components/OrientacaoOrgaos";
import CompletarDadosForm from "@/components/CompletarDadosForm";

type CasoSnapshot = {
  id: string;
  tipo_caso: string;
  nome_completo: string | null;
  cpf: string | null;
  nome_empresa: string | null;
  foro_json: { foro?: string; endereco?: string } | null;
  peticao_status: string;
  peticao_erro: string | null;
};

const TIPO_LABEL: Record<string, string> = {
  voo_atrasado: "Voo atrasado",
  voo_cancelado: "Voo cancelado",
  bagagem: "Bagagem extraviada ou danificada",
  produto_defeito: "Produto com defeito",
  servico_nao_entregue: "Serviço não entregue",
  cobranca_indevida: "Cobrança indevida",
};

export default function CasoPage() {
  return (
    <Suspense fallback={null}>
      <CasoPageConteudo />
    </Suspense>
  );
}

function CasoPageConteudo() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const casoId = params.id;

  const [caso, setCaso] = useState<CasoSnapshot | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(false);
  const [mostrarSucessoForm, setMostrarSucessoForm] = useState(false);

  async function carregar() {
    setCarregando(true);
    setErroCarregar(false);
    try {
      const resp = await fetch(`/api/caso/${casoId}?token=${encodeURIComponent(token)}`);
      if (!resp.ok) { setErroCarregar(true); return; }
      const data = await resp.json();
      setCaso(data.caso);
    } catch {
      setErroCarregar(true);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (casoId && token) carregar();
    else { setCarregando(false); setErroCarregar(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [casoId, token]);

  if (carregando) {
    return <main className="min-h-screen flex items-center justify-center text-slate-500">Carregando seu caso...</main>;
  }

  if (erroCarregar || !caso) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-[#0e2b50] mb-2">Link inválido ou expirado</h1>
          <p className="text-sm text-slate-600">Confira o link do e-mail de confirmação da sua compra, ou escreva pra contato@claralaw.com.br.</p>
        </div>
      </main>
    );
  }

  const pdfUrl = `/api/caso/${casoId}/peticao.pdf?token=${encodeURIComponent(token)}`;
  const docxUrl = `/api/caso/${casoId}/peticao.docx?token=${encodeURIComponent(token)}`;
  const statusLabel =
    caso.peticao_status === "completo" ? { texto: "Petição completa", cor: "bg-green-50 text-green-700 border-green-200" } :
    caso.peticao_status === "parcial" ? { texto: "Faltam alguns dados", cor: "bg-amber-50 text-amber-700 border-amber-200" } :
    caso.peticao_status === "erro" ? { texto: "Erro ao gerar — preencha os dados e salve de novo", cor: "bg-red-50 text-red-700 border-red-200" } :
    { texto: "Preparando...", cor: "bg-slate-50 text-slate-600 border-slate-200" };

  const tipo = caso.tipo_caso as keyof typeof TIPO_LABEL;

  return (
    <main className="min-h-screen bg-[#f6f8fc] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Seu caso · Kit Juizado</p>
          <h1 className="text-3xl font-bold text-[#0e2b50]">{TIPO_LABEL[tipo] || "Seu caso"}</h1>
        </div>

        <div className={`rounded-[20px] border p-6 ${statusLabel.cor}`}>
          <div className="font-semibold text-sm mb-3">{statusLabel.texto}</div>
          <div className="flex flex-wrap gap-3">
            <a href={pdfUrl} className="rounded-full bg-[#0e2b50] text-white text-sm font-semibold px-5 py-2.5">
              Baixar petição em PDF
            </a>
            <a href={docxUrl} className="rounded-full border border-[#0e2b50] text-[#0e2b50] text-sm font-semibold px-5 py-2.5">
              Baixar DOCX editável
            </a>
          </div>
        </div>

        <div className="rounded-[20px] border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[#0e2b50] mb-3">Complete seus dados</h2>
          {mostrarSucessoForm && (
            <div className="rounded-[14px] bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-4">
              Dados salvos — sua petição foi atualizada. Baixe de novo pra ver a versão mais recente.
            </div>
          )}
          <CompletarDadosForm
            token={token}
            valoresIniciais={{
              nomeCompleto: caso.nome_completo || undefined,
              cpf: caso.cpf || undefined,
              nomeEmpresa: caso.nome_empresa || undefined,
            }}
            onSalvo={() => { setMostrarSucessoForm(true); carregar(); }}
          />
        </div>

        {caso.foro_json?.foro && (
          <div className="rounded-[20px] border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-[#0e2b50] mb-2">Seu fórum</h2>
            <p className="text-sm text-slate-700">{caso.foro_json.foro}</p>
            {caso.foro_json.endereco && <p className="text-xs text-slate-500 mt-1">{caso.foro_json.endereco}</p>}
          </div>
        )}

        <div className="rounded-[20px] border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-[#0e2b50] mb-4">Se a empresa não responder</h2>
          <OrientacaoOrgaos tipoCaso={tipo as "voo_atrasado" | "voo_cancelado" | "bagagem" | "produto_defeito" | "servico_nao_entregue" | "cobranca_indevida"} />
        </div>

        <Link href="/guia" className="block text-center text-sm text-[#185FA5]">
          Ver o guia completo do processo →
        </Link>

        <p className="text-xs text-slate-400 text-center leading-relaxed">
          Modelo orientativo — revise antes de protocolar. Plataforma educacional, não substitui advogado.
        </p>
      </div>
    </main>
  );
}
