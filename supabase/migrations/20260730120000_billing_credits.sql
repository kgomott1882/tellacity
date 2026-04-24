-- Billing credits ledger.
-- Stores pro-rated credits that reduce upgrade charges (and any future manual credits).
-- Amounts are kept in USD minor units (cents) for deterministic pricing; converted
-- to the Paystack charge currency at initialize time.

create table if not exists public.billing_credits (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,

  amount_usd_minor integer not null check (amount_usd_minor > 0),
  remaining_usd_minor integer not null
    check (remaining_usd_minor >= 0 and remaining_usd_minor <= amount_usd_minor),

  -- Lifecycle of a credit:
  --   available  - usable at checkout
  --   pending    - reserved by a specific checkout reference (awaiting verify)
  --   consumed   - fully used
  --   void       - invalidated (refund, admin adjustment, etc.)
  status text not null default 'available'
    check (status in ('available','pending','consumed','void')),

  -- Provenance: how this credit was created.
  --   proration  - auto-minted on mid-cycle upgrade
  --   manual     - admin granted
  --   refund     - reversed charge
  source text not null default 'proration'
    check (source in ('proration','manual','refund','other')),

  previous_plan_code text,
  new_plan_code text,
  reference text,                            -- paystack reference that triggered/consumes this credit
  current_period_end timestamptz,            -- anchor for proration idempotency

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  consumed_at timestamptz
);

-- Idempotency: only one active proration credit per (business, period anchor).
-- Lets initialize re-run safely without minting duplicates when a user reopens checkout.
create unique index if not exists uq_billing_credits_biz_period_proration
  on public.billing_credits (business_id, current_period_end)
  where source = 'proration'
    and status in ('available','pending')
    and current_period_end is not null;

create index if not exists idx_billing_credits_biz_status
  on public.billing_credits (business_id, status);

-- Keep updated_at in sync.
create or replace function public.billing_credits_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists billing_credits_touch_updated_at on public.billing_credits;
create trigger billing_credits_touch_updated_at
  before update on public.billing_credits
  for each row execute function public.billing_credits_touch_updated_at();

-- RLS: business owners can read their own credits; writes go through service role.
alter table public.billing_credits enable row level security;

drop policy if exists billing_credits_select_owner on public.billing_credits;
create policy billing_credits_select_owner
  on public.billing_credits
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = billing_credits.business_id
        and b.owner_id = auth.uid()
    )
  );

grant select on public.billing_credits to authenticated;
grant all on public.billing_credits to service_role;

comment on table public.billing_credits is
  'Ledger of USD-minor credits applied against upgrade charges (pro-ration, manual, refunds).';
comment on column public.billing_credits.amount_usd_minor is
  'Face value of the credit at creation, in USD cents.';
comment on column public.billing_credits.remaining_usd_minor is
  'Portion still available to consume, in USD cents.';
comment on column public.billing_credits.current_period_end is
  'Current subscription period boundary the credit was minted against (proration idempotency anchor).';
