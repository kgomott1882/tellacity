-- HubSpot private app access token per Tellacity business (CRM sync bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.hubspot_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  access_token text NOT NULL,
  portal_id text,
  account_type text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hubspot_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS hubspot_integrations_business_id_idx
  ON public.hubspot_integrations (business_id);

ALTER TABLE public.hubspot_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.hubspot_integrations IS
  'HubSpot private app access token; one row per business. Written after account-info API validation.';
