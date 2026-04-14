-- Dashboard bell notifications: per-user read-state per business.
create table if not exists public.business_dashboard_notification_reads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null,
  notification_key text not null,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (business_id, user_id, notification_key)
);

create index if not exists idx_business_dashboard_notif_reads_lookup
  on public.business_dashboard_notification_reads (business_id, user_id, read_at desc);

comment on table public.business_dashboard_notification_reads is
  'Read-state for dashboard navbar notifications per user + business.';

alter table public.business_dashboard_notification_reads enable row level security;

create policy "business_dashboard_notification_reads_select"
  on public.business_dashboard_notification_reads
  for select
  using (
    user_id = auth.uid()
    and exists (
      select 1
      from public.businesses b
      where b.id = business_dashboard_notification_reads.business_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1
            from public.business_owners bo
            where bo.business_id = b.id
              and bo.owner_user_id = auth.uid()
          )
          or exists (
            select 1
            from public.business_members bm
            where bm.business_id = b.id
              and bm.user_id = auth.uid()
              and bm.status = 'active'
          )
        )
    )
  );

create policy "business_dashboard_notification_reads_insert"
  on public.business_dashboard_notification_reads
  for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.businesses b
      where b.id = business_dashboard_notification_reads.business_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1
            from public.business_owners bo
            where bo.business_id = b.id
              and bo.owner_user_id = auth.uid()
          )
          or exists (
            select 1
            from public.business_members bm
            where bm.business_id = b.id
              and bm.user_id = auth.uid()
              and bm.status = 'active'
          )
        )
    )
  );

create policy "business_dashboard_notification_reads_update"
  on public.business_dashboard_notification_reads
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
