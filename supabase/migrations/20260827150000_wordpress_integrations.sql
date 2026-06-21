-- WordPress site link per Tellacity business (REST discovery + widget embed bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.wordpress_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  site_url text NOT NULL,
  site_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wordpress_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS wordpress_integrations_business_id_idx
  ON public.wordpress_integrations (business_id);

ALTER TABLE public.wordpress_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.wordpress_integrations IS
  'Linked WordPress site for widget embeds; one row per business. Written after wp-json verification.';
