-- Business replies to reviews (public owner response)
create table if not exists public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  body text not null,
  author_role text not null default 'business',
  created_at timestamptz not null default now()
);

create index if not exists review_replies_review_id_idx on public.review_replies (review_id);
create index if not exists review_replies_author_role_idx on public.review_replies (author_role);

comment on table public.review_replies is 'Business owner replies to customer reviews; author_role typically "business".';
