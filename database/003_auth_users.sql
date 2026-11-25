-- Genda: Tabela de usuários do painel administrativo (autenticação)

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  plan_name text NOT NULL DEFAULT 'Plano Pro',
  plan_status text NOT NULL DEFAULT 'Ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_establishment_id
  ON public.users (establishment_id);
