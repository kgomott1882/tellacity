-- Article link validation failure logs (anti-abuse monitoring)
CREATE TABLE IF NOT EXISTS public.article_validation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  validation_type text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_validation_logs_business_created
  ON public.article_validation_logs (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_validation_logs_type_created
  ON public.article_validation_logs (validation_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_validation_logs_article_created
  ON public.article_validation_logs (article_id, created_at DESC);

COMMENT ON TABLE public.article_validation_logs IS
  'Logs article content link validation failures for abuse monitoring.';

ALTER TABLE public.article_validation_logs ENABLE ROW LEVEL SECURITY;

-- Business members can insert logs for their business (API uses authenticated client)
DROP POLICY IF EXISTS article_validation_logs_insert_member ON public.article_validation_logs;
CREATE POLICY article_validation_logs_insert_member
  ON public.article_validation_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_members bm
      WHERE bm.business_id = article_validation_logs.business_id
        AND bm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      WHERE b.id = article_validation_logs.business_id
        AND b.owner_id = auth.uid()
    )
  );

-- Admins can read all validation logs
DROP POLICY IF EXISTS article_validation_logs_select_admin ON public.article_validation_logs;
CREATE POLICY article_validation_logs_select_admin
  ON public.article_validation_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

GRANT SELECT, INSERT ON public.article_validation_logs TO authenticated;
GRANT ALL ON public.article_validation_logs TO service_role;
