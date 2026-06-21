-- Zendesk API credentials per Tellacity business (post-ticket review invite bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.zendesk_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  subdomain text NOT NULL,
  agent_email text NOT NULL,
  api_token text NOT NULL,
  account_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zendesk_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS zendesk_integrations_business_id_idx
  ON public.zendesk_integrations (business_id);

ALTER TABLE public.zendesk_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.zendesk_integrations IS
  'Zendesk subdomain + agent API token; one row per business. Written after /users/me validation.';
