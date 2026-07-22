-- Clara Law — schema da área logada
-- Executar no Supabase Dashboard → SQL Editor
-- Idempotente: pode rodar múltiplas vezes sem quebrar (usa IF NOT EXISTS).

-- ─── TABELA user_casos ───────────────────────────────────────────────────────
-- Casos vinculados a um usuário autenticado (após pagamento).

CREATE TABLE IF NOT EXISTS user_casos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  tipo_caso TEXT NOT NULL,
    -- 'voo_atrasado' | 'voo_cancelado' | 'cobranca_indevida'
    -- 'produto_defeito' | 'analise_contrato' | 'desconhecido'
  descricao TEXT,                     -- resumo curto do caso
  dados_json JSONB,                   -- dados completos do wizard (metadata da session Stripe)
  stripe_session_id TEXT UNIQUE,      -- idempotência: evita duplicar em retentativas do webhook
  status TEXT DEFAULT 'ativo',        -- 'ativo' | 'email_enviado' | 'resolvido' | 'encerrado'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marcos datados dos eventos do caso (timeline).
-- ALTER separado para permitir re-rodar o schema sobre bancos que já tinham
-- a tabela sem essas colunas.
ALTER TABLE user_casos
  ADD COLUMN IF NOT EXISTS email_enviado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolvido_em     TIMESTAMPTZ;

-- ─── TABELA mensagens ────────────────────────────────────────────────────────
-- Chat da Clara IA com o usuário sobre o caso.

CREATE TABLE IF NOT EXISTS mensagens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caso_id UUID REFERENCES user_casos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                 -- 'user' | 'assistant'
  conteudo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RLS (Row Level Security) ────────────────────────────────────────────────
-- Cada usuário só enxerga/edita os próprios dados.
-- Webhook usa SERVICE_ROLE_KEY que bypassa RLS.

ALTER TABLE user_casos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens  ENABLE ROW LEVEL SECURITY;

-- Drop antes de re-criar pra que reruns funcionem sem erro "policy already exists"
DROP POLICY IF EXISTS "usuarios veem seus casos" ON user_casos;
CREATE POLICY "usuarios veem seus casos" ON user_casos
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "usuarios veem suas mensagens" ON mensagens;
CREATE POLICY "usuarios veem suas mensagens" ON mensagens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_casos_user_id     ON user_casos(user_id);
CREATE INDEX IF NOT EXISTS idx_user_casos_stripe_sid  ON user_casos(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_caso_id      ON mensagens(caso_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_caso_created ON mensagens(caso_id, created_at);

-- ─── TRIGGER: manter updated_at atualizado ───────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_casos_updated ON user_casos;
CREATE TRIGGER trg_user_casos_updated
  BEFORE UPDATE ON user_casos
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
