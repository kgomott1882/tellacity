-- Magento / Adobe Commerce store credentials per Tellacity business (REST integration access token).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.magento_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  site_url text NOT NULL,
  access_token text NOT NULL,
  store_code text NOT NULL DEFAULT 'default',
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT magento_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS magento_integrations_business_id_idx
  ON public.magento_integrations (business_id);

ALTER TABLE public.magento_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.magento_integrations IS
  'Magento 2 REST API integration token; one row per business. Written by Tellacity API after token validation.';
