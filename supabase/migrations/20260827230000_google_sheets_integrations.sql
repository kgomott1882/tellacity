-- Google Sheets service account + spreadsheet per Tellacity business (export bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.google_sheets_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  spreadsheet_id text NOT NULL,
  spreadsheet_title text,
  worksheet_name text,
  service_account_email text NOT NULL,
  private_key text NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_sheets_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS google_sheets_integrations_business_id_idx
  ON public.google_sheets_integrations (business_id);

ALTER TABLE public.google_sheets_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.google_sheets_integrations IS
  'Google Sheets spreadsheet + service account key; one row per business. Written after Sheets API validation.';
