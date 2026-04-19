-- Incident tracking for synthetic monitoring (one "ongoing" row per check_name at a time).

CREATE TABLE IF NOT EXISTS public.system_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name text NOT NULL,
  check_group text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL CHECK (status IN ('ongoing', 'resolved')),
  first_error_message text,
  last_error_message text,
  fail_count integer NOT NULL DEFAULT 1 CHECK (fail_count >= 1),
  resolved_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS system_incidents_one_ongoing_per_check_name
  ON public.system_incidents (check_name)
  WHERE (status = 'ongoing');

CREATE INDEX IF NOT EXISTS system_incidents_check_name_status_idx
  ON public.system_incidents (check_name, status);

COMMENT ON TABLE public.system_incidents IS
  'Monitoring incidents: at most one ongoing row per check_name; updated after system_checks by run-checks API.';

ALTER TABLE public.system_incidents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.system_incidents FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_incidents TO service_role;

NOTIFY pgrst, 'reload schema';
