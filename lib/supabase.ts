import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zsmtcomxlyhovgxpdban.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function salvarCaso(dados: {
  tipo_caso: string;
  cia_aerea: string;
  nome_completo: string;
  cpf: string;
  email_usuario: string;
  telefone: string;
  num_voo: string;
  data_voo: string;
  tempo_atraso: string;
  recebeu_comida: string;
  recebeu_hotel: string;
  despesas_extras: string;
  contrato_aceito: boolean;
}) {
  const { data, error } = await supabase
    .from("casos")
    .insert([{ ...dados, contrato_aceito_em: new Date().toISOString() }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function uploadDocumento(casoId: string, arquivo: File, nome: string) {
  const ext = arquivo.name.split(".").pop();
  const path = `${casoId}/${nome}.${ext}`;

  const { error } = await supabase.storage
    .from("Documentos Clara")
    .upload(path, arquivo, { upsert: true });

  if (error) throw error;
  return path;
}

export async function uploadContrato(casoId: string, blob: Blob) {
  const path = `contratos/${casoId}/contrato.pdf`;
  const { error } = await supabase.storage
    .from("Documentos Clara")
    .upload(path, blob, { upsert: true, contentType: "application/pdf" });
  if (error) throw error;
  return path;
}

export async function marcarEmailEnviado(casoId: string) {
  const { error } = await supabase
    .from("casos")
    .update({ email_enviado: true, email_enviado_em: new Date().toISOString(), status: "email_enviado" })
    .eq("id", casoId);

  if (error) throw error;
}
