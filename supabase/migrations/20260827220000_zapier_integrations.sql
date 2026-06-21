-- Zapier catch-hook URL per Tellacity business (automation bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.zapier_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  zap_label text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT zapier_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS zapier_integrations_business_id_idx
  ON public.zapier_integrations (business_id);

ALTER TABLE public.zapier_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.zapier_integrations IS
  'Zapier catch-hook URL; one row per business. Written after webhook test POST validation.';
