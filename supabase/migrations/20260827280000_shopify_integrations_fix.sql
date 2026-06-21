-- Repair shopify_integrations schema/constraints and dedupe rows that confuse connected vs manage status.

ALTER TABLE public.shopify_integrations
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses (id) ON DELETE CASCADE;

ALTER TABLE public.shopify_integrations
  ADD COLUMN IF NOT EXISTS scope text;

ALTER TABLE public.shopify_integrations
  ADD COLUMN IF NOT EXISTS webhook_registered boolean NOT NULL DEFAULT false;

ALTER TABLE public.shopify_integrations
  ADD COLUMN IF NOT EXISTS connected_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.shopify_integrations
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Keep the newest row per business_id (manage page used maybeSingle and failed on duplicates).
DELETE FROM public.shopify_integrations older
USING public.shopify_integrations newer
WHERE older.business_id IS NOT NULL
  AND older.business_id = newer.business_id
  AND older.id <> newer.id
  AND older.updated_at < newer.updated_at;

-- Keep the newest row per shop_domain.
DELETE FROM public.shopify_integrations older
USING public.shopify_integrations newer
WHERE older.shop_domain = newer.shop_domain
  AND older.id <> newer.id
  AND older.updated_at < newer.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS shopify_integrations_shop_domain_idx
  ON public.shopify_integrations (shop_domain);

DO $$
BEGIN
  ALTER TABLE public.shopify_integrations
    ADD CONSTRAINT shopify_integrations_business_id_key UNIQUE (business_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

COMMENT ON TABLE public.shopify_integrations IS
  'Shopify store OAuth token; one row per shop_domain and per business_id when linked from dashboard.';
