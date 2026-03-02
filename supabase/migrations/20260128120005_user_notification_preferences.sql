-- User email notification preferences for business dashboard
create table if not exists public.user_notification_preferences (
  user_id uuid primary key,
  newsletter boolean not null default false,
  service_1_2_star boolean not null default true,
  service_3_star boolean not null default true,
  service_4_5_star boolean not null default true,
  product_1_star boolean not null default false,
  product_2_star boolean not null default false,
  product_3_star boolean not null default false,
  product_4_star boolean not null default false,
  product_5_star boolean not null default false,
  product_modified_reviews boolean not null default false,
  product_questions boolean not null default false,
  product_replies boolean not null default false,
  updated_at timestamptz default now()
);

alter table public.user_notification_preferences enable row level security;

create policy "Users can read own notification preferences"
  on public.user_notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.user_notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.user_notification_preferences for update
  using (auth.uid() = user_id);
