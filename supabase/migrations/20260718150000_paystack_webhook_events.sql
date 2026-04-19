-- Paystack webhook inbox (raw events). Used by admin Payments / revenue tooling and ops.

create table if not exists public.paystack_webhook_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null,
  reference text,
  payload jsonb
);

alter table public.paystack_webhook_events
  add column if not exists created_at timestamptz not null default now();

create index if not exists paystack_webhook_events_created_at_idx
  on public.paystack_webhook_events (created_at desc);

create index if not exists paystack_webhook_events_event_idx
  on public.paystack_webhook_events (event);

alter table public.paystack_webhook_events enable row level security;

comment on table public.paystack_webhook_events is
  'Append-only Paystack webhook payloads; service role writes from /api/webhooks/paystack.';
