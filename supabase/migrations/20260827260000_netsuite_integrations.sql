-- NetSuite Token-Based Authentication credentials per Tellacity business (CRM feedback bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.netsuite_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  account_id text NOT NULL,
  consumer_key text NOT NULL,
  consumer_secret text NOT NULL,
  token_id text NOT NULL,
  token_secret text NOT NULL,
  account_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT netsuite_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS netsuite_integrations_business_id_idx
  ON public.netsuite_integrations (business_id);

ALTER TABLE public.netsuite_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.netsuite_integrations IS
  'NetSuite TBA credentials; one row per business. Written after REST API validation.';
