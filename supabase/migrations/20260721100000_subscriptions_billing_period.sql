-- Paystack verify: store subscription billing period end and clear scheduled downgrade fields.

alter table public.subscriptions
  add column if not exists current_period_end timestamptz,
  add column if not exists pending_plan_code text,
  add column if not exists pending_change_at timestamptz;

comment on column public.subscriptions.current_period_end is 'End of the current paid period (exclusive boundary semantics: renew before this instant).';
comment on column public.subscriptions.pending_plan_code is 'Plan scheduled to apply at pending_change_at (e.g. downgrade); cleared on successful payment.';
comment on column public.subscriptions.pending_change_at is 'When pending_plan_code takes effect; cleared on successful payment.';
