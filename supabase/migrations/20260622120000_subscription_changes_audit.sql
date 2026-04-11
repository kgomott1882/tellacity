-- Audit trail for subscription plan changes (written by billing upgrade API + future flows).
-- Idempotent: safe if re-applied. Does not alter `subscriptions`.

create table if not exists public.subscription_changes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null,
  old_plan text,
  new_plan text not null,
  changed_at timestamptz not null default now()
);

comment on table public.subscription_changes is
  'Append-only audit: plan transitions per business_id. Inserts use service role from trusted APIs.';

create index if not exists subscription_changes_business_id_idx
  on public.subscription_changes (business_id);

create index if not exists subscription_changes_changed_at_idx
  on public.subscription_changes (changed_at desc);

alter table public.subscription_changes enable row level security;

-- No policies: anon/authenticated cannot read/write via PostgREST; service_role bypasses RLS for API routes.
