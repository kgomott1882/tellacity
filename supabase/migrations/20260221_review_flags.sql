-- Business user flags a review (sends to platform for review; one flag per user per review)
create table if not exists public.review_flags (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Add status column if table already existed without it
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'review_flags' and column_name = 'status'
  ) then
    alter table public.review_flags add column status text not null default 'pending' check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- If table already existed with business_user_id, rename to user_id for consistency
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'review_flags' and column_name = 'business_user_id'
  ) then
    alter table public.review_flags rename column business_user_id to user_id;
  end if;
end $$;

create index if not exists review_flags_review_id_idx on public.review_flags (review_id);
create index if not exists review_flags_user_id_idx on public.review_flags (user_id);
create unique index if not exists review_flags_review_user_uniq on public.review_flags (review_id, user_id);

comment on table public.review_flags is 'Business users flag reviews for platform moderation; one row per user per review.';

alter table public.review_flags enable row level security;

create policy "Users can read own flags"
  on public.review_flags
  for select
  using (auth.uid() = user_id);

-- Insert is done via API with service role; no insert policy needed for anon/authenticated.
-- Platform can manage (update/delete) via service role or admin policy later.
