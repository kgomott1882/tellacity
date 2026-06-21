-- One row per business: trial-ending reminder (~3 days before Grow trial ends).
-- Queried/written via service role (cron). RLS on with no policies for authenticated roles.

create table if not exists public.business_trial_ending_emails (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  owner_user_id uuid,
  recipient_email text not null,
  sent_at timestamptz not null default now(),
  resend_message_id text
);

create index if not exists business_trial_ending_emails_sent_at_idx
  on public.business_trial_ending_emails (sent_at desc);

comment on table public.business_trial_ending_emails is
  'At-most-one Grow trial ending reminder per business (cron, Resend).';

alter table public.business_trial_ending_emails enable row level security;

notify pgrst, 'reload schema';
