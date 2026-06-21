-- Salesforce Connected App credentials per Tellacity business (CRM sync bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.salesforce_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  login_host text NOT NULL DEFAULT 'https://login.salesforce.com',
  instance_url text,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  refresh_token text NOT NULL,
  org_id text,
  org_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT salesforce_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS salesforce_integrations_business_id_idx
  ON public.salesforce_integrations (business_id);

ALTER TABLE public.salesforce_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.salesforce_integrations IS
  'Salesforce Connected App refresh token; one row per business. Written after OAuth token validation.';
