-- SQL Migration 002: Onboarding Tokens Table
-- Creates table for secure magic-link tokens used in passwordless onboarding

-- Onboarding tokens table - secure magic links for passwordless onboarding
CREATE TABLE IF NOT EXISTS public.onboarding_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_id_hash TEXT NOT NULL UNIQUE, -- SHA256 hash of token_id for lookups
  practice_id UUID NOT NULL REFERENCES public.practices(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL, -- 7 days from issued_at
  used_at TIMESTAMPTZ, -- NULL until consumed, then timestamp
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_token_id_hash ON public.onboarding_tokens(token_id_hash);
CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_practice_id ON public.onboarding_tokens(practice_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_expires_at ON public.onboarding_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_onboarding_tokens_used_at ON public.onboarding_tokens(used_at);

-- Enable RLS
ALTER TABLE public.onboarding_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for onboarding_tokens
-- Allow service role to perform all operations
CREATE POLICY "Service role can manage onboarding tokens" ON public.onboarding_tokens
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow app role to read tokens for verification
CREATE POLICY "App role can read onboarding tokens" ON public.onboarding_tokens
  FOR SELECT TO app_role
  USING (true);

-- Allow app role to update tokens (for consumption)
CREATE POLICY "App role can update onboarding tokens" ON public.onboarding_tokens
  FOR UPDATE TO app_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE public.onboarding_tokens IS 'Secure magic-link tokens for passwordless onboarding';
COMMENT ON COLUMN public.onboarding_tokens.token_id_hash IS 'SHA256 hash of token_id for secure lookups without storing full token';
COMMENT ON COLUMN public.onboarding_tokens.practice_id IS 'Practice this token is scoped to';
COMMENT ON COLUMN public.onboarding_tokens.issued_at IS 'When the token was created';
COMMENT ON COLUMN public.onboarding_tokens.expires_at IS 'When the token expires (7 days from issued_at)';
COMMENT ON COLUMN public.onboarding_tokens.used_at IS 'When the token was consumed (NULL until used)';

-- Log successful migration
INSERT INTO public.events (type, actor, payload_json) 
VALUES ('migration_completed', 'system', '{"migration": "002_onboarding_tokens", "tables_created": 1}');
