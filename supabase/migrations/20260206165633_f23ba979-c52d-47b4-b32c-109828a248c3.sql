-- ============================================
-- SISTEMA DE API KEYS PARA ADMIN/INTEGRAÇÕES
-- ============================================

-- 1) Tabela de usuários admin (para controle de acesso)
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'finance', 'support', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2) Tabela de API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  scopes TEXT[] DEFAULT ARRAY['*'], -- Escopos: '*', 'finance:read', 'rides:read', etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  last_used_at TIMESTAMPTZ,
  last_used_ip TEXT,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para busca rápida da API key
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(api_key) WHERE is_active = true;

-- ============================================
-- ATIVAR RLS
-- ============================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNÇÃO HELPER: Verificar se é admin
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- ============================================
-- FUNÇÃO HELPER: Verificar role específica
-- ============================================
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND is_active = true
      AND (role = _role OR role = 'super_admin')
  )
$$;

-- ============================================
-- FUNÇÃO: Validar API Key (usada por Edge Functions)
-- ============================================
CREATE OR REPLACE FUNCTION public.validate_api_key(p_api_key TEXT)
RETURNS TABLE (
  key_id UUID,
  key_name TEXT,
  scopes TEXT[],
  is_valid BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ak.id,
    ak.name,
    ak.scopes,
    true as is_valid
  FROM public.api_keys ak
  WHERE ak.api_key = p_api_key
    AND ak.is_active = true;
    
  -- Atualiza último uso (não bloqueia a query)
  UPDATE public.api_keys
  SET 
    last_used_at = now(),
    usage_count = usage_count + 1
  WHERE api_key = p_api_key AND is_active = true;
END;
$$;

-- ============================================
-- RLS POLICIES - admin_users
-- ============================================
CREATE POLICY "Super admins can manage all admin users"
  ON public.admin_users FOR ALL
  USING (public.has_admin_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view admin users"
  ON public.admin_users FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================
-- RLS POLICIES - api_keys
-- ============================================
CREATE POLICY "Only super admins can manage API keys"
  ON public.api_keys FOR ALL
  USING (public.has_admin_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view API keys"
  ON public.api_keys FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ============================================
-- INSERIR API KEY MASTER (MOVA)
-- ============================================
INSERT INTO public.api_keys (name, api_key, scopes, created_by)
VALUES (
  'MOVA Master Key',
  'mova_live_9f3c2a1d7b84e6c1f9a0b2c4e8d7a6f5',
  ARRAY['*'],
  NULL -- Criado pelo sistema
)
ON CONFLICT (api_key) DO NOTHING;