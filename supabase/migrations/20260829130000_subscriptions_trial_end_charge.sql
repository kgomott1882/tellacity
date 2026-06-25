-- Card-on-trial Build 2: trial-end charge idempotency, failure state, refund audit.

alter table public.subscriptions
  add column if not exists reverse_trial_used_at timestamptz,
  add column if not exists trial_card_verify_refund_failed_at timestamptz,
  add column if not exists trial_card_verify_refund_error text,
  add column if not exists trial_end_charge_reference text,
  add column if not exists trial_end_charge_failed_at timestamptz,
  add column if not exists trial_end_charge_failure_message text;

comment on column public.subscriptions.reverse_trial_used_at is
  'Set when a one-time reverse trial starts; preserves already_trialed after provider_sub_id changes.';
comment on column public.subscriptions.trial_card_verify_refund_failed_at is
  'When the R1 tokenization refund failed after trial card capture (manual follow-up).';
comment on column public.subscriptions.trial_card_verify_refund_error is
  'Last error from failed tokenization refund.';
comment on column public.subscriptions.trial_end_charge_reference is
  'Paystack reference for the day-14 trial conversion charge (idempotency).';
comment on column public.subscriptions.trial_end_charge_failed_at is
  'When trial-end charge_authorization failed; no auto-retry until Build 4.';
comment on column public.subscriptions.trial_end_charge_failure_message is
  'Last error from failed trial-end charge.';

create index if not exists subscriptions_trial_verify_refund_failed_idx
  on public.subscriptions (trial_card_verify_refund_failed_at)
  where trial_card_verify_refund_failed_at is not null;

create index if not exists subscriptions_trial_end_charge_failed_idx
  on public.subscriptions (trial_end_charge_failed_at)
  where trial_end_charge_failed_at is not null;

-- Preserve already_trialed for existing trial: rows before this column existed.
update public.subscriptions
set reverse_trial_used_at = coalesce(updated_at, now())
where reverse_trial_used_at is null
  and provider_sub_id like 'trial:%';
