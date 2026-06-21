-- Shopify OAuth token per Tellacity business (order webhook bridge).
-- Table may already exist in some environments; migration is additive and idempotent.

CREATE TABLE IF NOT EXISTS public.shopify_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.businesses (id) ON DELETE CASCADE,
  shop_domain text NOT NULL,
  access_token text NOT NULL,
  scope text,
  webhook_registered boolean NOT NULL DEFAULT false,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS shopify_integrations_shop_domain_idx
  ON public.shopify_integrations (shop_domain);

CREATE UNIQUE INDEX IF NOT EXISTS shopify_integrations_business_id_idx
  ON public.shopify_integrations (business_id)
  WHERE business_id IS NOT NULL;

ALTER TABLE public.shopify_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.shopify_integrations IS
  'Shopify store OAuth token; one row per business when linked from dashboard. Webhooks on orders/create and orders/fulfilled.';
