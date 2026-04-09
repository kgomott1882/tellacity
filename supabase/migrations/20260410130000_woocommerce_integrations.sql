-- WooCommerce store credentials per Tellacity business (REST API keys from WP admin).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.woocommerce_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  site_url text NOT NULL,
  consumer_key text NOT NULL,
  consumer_secret text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT woocommerce_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS woocommerce_integrations_business_id_idx
  ON public.woocommerce_integrations (business_id);

ALTER TABLE public.woocommerce_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.woocommerce_integrations IS
  'WooCommerce REST API credentials; one row per business. Written by Tellacity API after key validation.';
