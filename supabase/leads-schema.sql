-- Clara Law — lembrete do "dia 10" pro plano grátis (Kit Juizado)
-- Executar no Supabase Dashboard → SQL Editor
-- Idempotente: pode rodar múltiplas vezes sem quebrar (usa IF NOT EXISTS).
--
-- A tabela `leads` já existe e é escrita hoje por lib/supabase.ts:salvarLead()
-- (id, created_at, email, origem, tipo_caso, converteu) sempre que o plano
-- grátis é gerado em /enviar — coluna de data é created_at, não criado_em.
-- O CREATE TABLE abaixo só garante que ela existe com esse formato (caso
-- ainda não exista); o ALTER TABLE acrescenta as colunas novas usadas pelo
-- cron de lembrete. Não cria uma tabela nova.

CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT,
  origem TEXT,
  tipo_caso TEXT,
  converteu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS utm_source          TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium          TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign        TEXT,
  -- Opt-in explícito (checkbox) no passo de e-mail do wizard — sem isso, o
  -- lead nunca entra na query do cron, mesmo que já tenham passado 10 dias.
  ADD COLUMN IF NOT EXISTS quer_lembrete       BOOLEAN DEFAULT FALSE,
  -- Guarda de idempotência do cron — nunca manda o lembrete duas vezes.
  ADD COLUMN IF NOT EXISTS lembrete_enviado_em TIMESTAMPTZ,
  -- Descadastro via link assinado no próprio e-mail do lembrete.
  ADD COLUMN IF NOT EXISTS descadastrado_em    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_leads_lembrete_pendente
  ON leads (created_at)
  WHERE quer_lembrete = TRUE AND lembrete_enviado_em IS NULL AND descadastrado_em IS NULL;
