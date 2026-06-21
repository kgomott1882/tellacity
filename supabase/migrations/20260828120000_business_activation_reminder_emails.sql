-- One row per business: activation reminder email sent to the owner after onboarding
-- (~24–48h post domain verify) when no review invite has been sent yet.
-- Queried/written via service role (cron). RLS on with no policies for authenticated roles.

create table if not exists public.business_activation_reminder_emails (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  owner_user_id uuid,
  recipient_email text not null,
  sent_at timestamptz not null default now(),
  resend_message_id text
);

create index if not exists business_activation_reminder_emails_sent_at_idx
  on public.business_activation_reminder_emails (sent_at desc);

comment on table public.business_activation_reminder_emails is
  'At-most-one onboarding activation reminder per business (cron, Resend).';

alter table public.business_activation_reminder_emails enable row level security;

notify pgrst, 'reload schema';
