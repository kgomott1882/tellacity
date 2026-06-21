-- SAP OAuth client credentials per Tellacity business (enterprise feedback bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.sap_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  api_base_url text NOT NULL,
  token_url text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  system_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sap_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS sap_integrations_business_id_idx
  ON public.sap_integrations (business_id);

ALTER TABLE public.sap_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.sap_integrations IS
  'SAP OData OAuth client credentials; one row per business. Written after token + API validation.';
