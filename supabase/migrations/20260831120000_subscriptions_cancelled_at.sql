-- Build 3: customer-requested cancellation marker (access continues until pending_change_at).

alter table public.subscriptions
  add column if not exists cancelled_at timestamptz;

comment on column public.subscriptions.cancelled_at is
  'When the customer requested subscription cancellation. Access continues until pending_change_at; no further trial-end or renewal charges.';
