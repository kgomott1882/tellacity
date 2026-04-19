-- System monitoring: persisted check outcomes (written by app API using service role).

CREATE TABLE IF NOT EXISTS public.system_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  check_group text NOT NULL,
  status text NOT NULL CHECK (status IN ('ok', 'fail')),
  response_time_ms integer NOT NULL CHECK (response_time_ms >= 0),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS system_checks_created_at_idx
  ON public.system_checks (created_at DESC);

CREATE INDEX IF NOT EXISTS system_checks_name_created_idx
  ON public.system_checks (check_name, created_at DESC);

COMMENT ON TABLE public.system_checks IS
  'Synthetic monitoring results; inserted by POST /api/system/run-checks (service role).';

ALTER TABLE public.system_checks ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.system_checks FROM PUBLIC;
GRANT SELECT, INSERT, DELETE ON public.system_checks TO service_role;

NOTIFY pgrst, 'reload schema';
