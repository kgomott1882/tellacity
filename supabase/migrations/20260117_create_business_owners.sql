create table if not exists public.business_owners (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  owner_user_id uuid not null,
  created_at timestamp with time zone default now()
);
