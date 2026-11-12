-- Clara Law — campos pra geração da petição JEC (Kit Juizado)
-- Executar no Supabase Dashboard → SQL Editor
-- Idempotente: pode rodar múltiplas vezes sem quebrar (usa IF NOT EXISTS).
--
-- Sem colunas de caminho de arquivo — a petição (PDF/DOCX) é renderizada sob
-- demanda a partir desses campos estruturados, nunca armazenada como binário.

ALTER TABLE user_casos
  -- Dados que faltam pra petição, coletados DEPOIS do pagamento (formulário
  -- em /caso/[id], acesso por token — nunca antes de confirmar o pagamento).
  ADD COLUMN IF NOT EXISTS nome_completo    TEXT,
  ADD COLUMN IF NOT EXISTS cpf              TEXT,
  ADD COLUMN IF NOT EXISTS endereco_autor   JSONB,
  ADD COLUMN IF NOT EXISTS nome_empresa     TEXT,
  ADD COLUMN IF NOT EXISTS cnpj_empresa     TEXT,
  ADD COLUMN IF NOT EXISTS endereco_empresa JSONB,
  ADD COLUMN IF NOT EXISTS valor_causa      TEXT,
  ADD COLUMN IF NOT EXISTS cep_busca        TEXT,
  ADD COLUMN IF NOT EXISTS cep_proprio      BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS foro_json        JSONB,
  -- 'pendente' (não tentou ainda) | 'parcial' (gerada, com [PREENCHER]) |
  -- 'completo' (sem lacunas) | 'erro' (geração falhou — ver peticao_erro).
  ADD COLUMN IF NOT EXISTS peticao_status   TEXT DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS peticao_gerada_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS peticao_erro     TEXT;
