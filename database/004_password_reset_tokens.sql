CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prt_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_token_hash ON public.password_reset_tokens(token_hash);
