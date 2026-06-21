-- Marketo REST API credentials per Tellacity business (campaign / program bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.marketo_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  rest_endpoint text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  munchkin_id text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT marketo_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS marketo_integrations_business_id_idx
  ON public.marketo_integrations (business_id);

ALTER TABLE public.marketo_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.marketo_integrations IS
  'Marketo REST client credentials; one row per business. Written after OAuth token validation.';
