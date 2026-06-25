-- Card-on-trial Build 2.5: monthly recurring renewal state (per-cycle idempotency, grace, retries).
-- Separate from trial_end_charge_* which is single-shot trial conversion state.

alter table public.subscriptions
  add column if not exists renewal_charge_reference text,
  add column if not exists renewal_charge_for_period_end timestamptz,
  add column if not exists renewal_failed_at timestamptz,
  add column if not exists renewal_failure_message text,
  add column if not exists renewal_retry_count integer not null default 0,
  add column if not exists renewal_next_retry_at timestamptz,
  add column if not exists renewal_grace_ends_at timestamptz,
  add column if not exists recurring_billing_enabled boolean not null default false;

comment on column public.subscriptions.renewal_charge_reference is
  'Paystack reference for the in-flight or completed monthly renewal charge for the current billing cycle.';
comment on column public.subscriptions.renewal_charge_for_period_end is
  'Per-cycle idempotency anchor: the expired current_period_end boundary this renewal charge renews FROM. One claim per (business_id, period end) at the DB level.';
comment on column public.subscriptions.renewal_failed_at is
  'When the first renewal charge_authorization failed for the current billing cycle.';
comment on column public.subscriptions.renewal_failure_message is
  'Last error from a failed monthly renewal charge.';
comment on column public.subscriptions.renewal_retry_count is
  'Number of renewal charge attempts in the current grace window (resets after successful renewal or expiry).';
comment on column public.subscriptions.renewal_next_retry_at is
  'When the cron should attempt the next renewal charge retry during grace.';
comment on column public.subscriptions.renewal_grace_ends_at is
  'Access cutoff during grace: paid plan features continue until this instant; after this, subscription may expire to free if renewal did not succeed.';
comment on column public.subscriptions.recurring_billing_enabled is
  'Explicit consent for stored-card monthly recurring billing. Must be true (with a saved authorization) before renewal charges run.';

-- Card-on-trial businesses that saved a card consented to recurring billing.
update public.subscriptions
set recurring_billing_enabled = true
where trial_card_captured_at is not null
  and recurring_billing_enabled = false;

-- Cron: active stored-card subs whose billing period may need renewal.
create index if not exists subscriptions_recurring_renewal_cron_idx
  on public.subscriptions (status, current_period_end)
  where paystack_authorization_code is not null;

-- Cron: subs due for a renewal retry during grace.
create index if not exists subscriptions_renewal_next_retry_idx
  on public.subscriptions (renewal_next_retry_at)
  where renewal_next_retry_at is not null;

-- DB-level double-charge backstop: one renewal claim per business per billing cycle.
create unique index if not exists subscriptions_renewal_charge_period_unique_idx
  on public.subscriptions (business_id, renewal_charge_for_period_end)
  where renewal_charge_for_period_end is not null;
