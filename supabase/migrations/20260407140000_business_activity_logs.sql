-- Raw event feed for business dashboard actions (admin Activity Feed reads this table).

CREATE TABLE IF NOT EXISTS public.business_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  business_id uuid NOT NULL,
  user_id uuid NULL,

  action_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_business_activity_logs_business_id
  ON public.business_activity_logs (business_id);

CREATE INDEX IF NOT EXISTS idx_business_activity_logs_created_at
  ON public.business_activity_logs (created_at DESC);

COMMENT ON TABLE public.business_activity_logs IS
  'Append-only audit trail for dashboard actions; service role inserts from API.';
