-- Card-on-trial (Paystack): store reusable authorization after tokenization verify charge.
-- Legacy no-card trials leave these null.

alter table public.subscriptions
  add column if not exists paystack_authorization_code text,
  add column if not exists paystack_customer_code text,
  add column if not exists paystack_customer_email text,
  add column if not exists trial_card_captured_at timestamptz;

comment on column public.subscriptions.paystack_authorization_code is
  'Paystack reusable authorization_code from trial card capture (charge_authorization at trial end).';
comment on column public.subscriptions.paystack_customer_code is
  'Paystack customer_code tied to the trial card authorization.';
comment on column public.subscriptions.paystack_customer_email is
  'Email used when creating the Paystack authorization (required for later charges).';
comment on column public.subscriptions.trial_card_captured_at is
  'When the trial card authorization was saved; null for legacy no-card trials.';
