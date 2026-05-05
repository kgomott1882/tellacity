-- Audit log: admin-initiated business status notifications (e.g. suspension notices to owners).
-- Queried only via service role (API). RLS on with no policies for authenticated roles.

create table if not exists public.admin_business_status_notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  owner_user_id uuid references auth.users (id) on delete set null,
  recipient_email text not null default '',
  status_action text not null,
  reason_key text not null default 'general',
  reason_label text,
  custom_note text,
  sent_by_user_id uuid not null references auth.users (id) on delete restrict,
  email_sent boolean not null default false,
  email_error text,
  sent_at timestamptz not null default now()
);

create index if not exists admin_business_status_notifications_business_id_idx
  on public.admin_business_status_notifications (business_id);

create index if not exists admin_business_status_notifications_sent_at_idx
  on public.admin_business_status_notifications (sent_at desc);

comment on table public.admin_business_status_notifications is
  'One row per admin-triggered business status notification (suspension etc., Resend).';

comment on column public.admin_business_status_notifications.status_action is
  'Status change applied (e.g. suspended). Free text for forward-compatibility.';
comment on column public.admin_business_status_notifications.reason_key is
  'Predefined reason key from admin UI (e.g. guidelines_violation).';
comment on column public.admin_business_status_notifications.reason_label is
  'Human-readable reason label at time of send.';
comment on column public.admin_business_status_notifications.custom_note is
  'Optional admin note included in the email and stored for audit.';
comment on column public.admin_business_status_notifications.email_sent is
  'True if the email send call returned success; false when send was skipped or failed.';
comment on column public.admin_business_status_notifications.email_error is
  'Reason the email was not sent (e.g. no owner email on file).';

alter table public.admin_business_status_notifications enable row level security;
