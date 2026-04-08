-- Per-business notification preferences (dashboard API: GET/POST notification-preferences)
create table if not exists public.business_notification_preferences (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  newsletter_enabled boolean not null default false,
  notify_1_2_star boolean not null default true,
  notify_3_star boolean not null default true,
  notify_4_5_star boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.business_notification_preferences is 'Email/notification toggles per business; managed via /api/business/notification-preferences.';

alter table public.business_notification_preferences enable row level security;

-- Align with canAccessBusiness: owner, business_owners, or active business_members
create policy "business_notification_preferences_all"
  on public.business_notification_preferences for all
  using (
    exists (
      select 1
      from public.businesses b
      where b.id = business_notification_preferences.business_id
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
  )
  with check (
    exists (
      select 1
      from public.businesses b
      where b.id = business_notification_preferences.business_id
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
