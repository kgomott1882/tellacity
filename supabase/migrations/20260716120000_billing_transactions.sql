-- Transaction ledger for successful billing events captured from payment providers.
-- Read by trusted API routes using service_role; does not replace `subscriptions`.

create table if not exists public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reference text not null,
  amount bigint not null,
  currency text not null,
  status text not null,
  plan_code text not null,
  created_at timestamptz not null default now()
);

comment on table public.billing_transactions is
  'Append-only payment ledger keyed by provider reference. subscriptions remains the source of truth for active access.';

create unique index if not exists billing_transactions_reference_key
  on public.billing_transactions (reference);

create index if not exists billing_transactions_business_id_created_at_idx
  on public.billing_transactions (business_id, created_at desc);

alter table public.billing_transactions enable row level security;

-- No policies: authenticated users do not read this table directly; dashboard APIs use service_role.
