-- Slack bot token per Tellacity business (review / feedback notifications bridge).
-- Access only via service role in Next.js API routes (RLS enabled, no policies for anon/authenticated).

CREATE TABLE IF NOT EXISTS public.slack_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  bot_token text NOT NULL,
  workspace_id text,
  workspace_name text,
  default_channel_id text,
  default_channel_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT slack_integrations_business_id_key UNIQUE (business_id)
);

CREATE INDEX IF NOT EXISTS slack_integrations_business_id_idx
  ON public.slack_integrations (business_id);

ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.slack_integrations IS
  'Slack bot token and optional default channel; one row per business. Written after auth.test validation.';
