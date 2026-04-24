-- Speed admin customer metrics and any query that filters by business_id
-- and orders or ranges on created_at (per-business activity windows).

CREATE INDEX IF NOT EXISTS idx_business_activity_logs_business_id_created_at
  ON public.business_activity_logs (business_id, created_at DESC);
