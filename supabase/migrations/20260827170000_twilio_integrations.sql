-- Twilio SMS credentials per Tellacity business (review invite bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.twilio_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  account_sid text NOT NULL,
  auth_token text NOT NULL,
  account_friendly_name text,
  from_phone_number text,
  messaging_service_sid text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT twilio_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS twilio_integrations_business_id_idx
  ON public.twilio_integrations (business_id);

ALTER TABLE public.twilio_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.twilio_integrations IS
  'Twilio Account SID + auth token; one row per business. Written after Twilio REST validation.';
