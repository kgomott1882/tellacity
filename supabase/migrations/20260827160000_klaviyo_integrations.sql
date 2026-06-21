-- Klaviyo private API key per Tellacity business (campaign / flow bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.klaviyo_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  private_api_key text NOT NULL,
  account_id text,
  account_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT klaviyo_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS klaviyo_integrations_business_id_idx
  ON public.klaviyo_integrations (business_id);

ALTER TABLE public.klaviyo_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.klaviyo_integrations IS
  'Klaviyo private API key; one row per business. Written after Klaviyo Accounts API validation.';
