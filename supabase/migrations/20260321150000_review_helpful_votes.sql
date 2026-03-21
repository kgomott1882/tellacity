-- Review "Helpful" likes: one vote per authenticated user or per guest email per review.
-- like_count on reviews is maintained by triggers.

alter table public.reviews
  add column if not exists like_count integer not null default 0;

create table if not exists public.review_helpful_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid references auth.users (id) on delete cascade,
  guest_email text,
  guest_name text,
  created_at timestamptz not null default now(),
  constraint review_helpful_votes_one_identity check (
    (user_id is not null and guest_email is null)
    or (user_id is null and guest_email is not null)
  )
);

create unique index if not exists review_helpful_votes_review_user_uniq
  on public.review_helpful_votes (review_id, user_id)
  where user_id is not null;

create unique index if not exists review_helpful_votes_review_guest_email_uniq
  on public.review_helpful_votes (review_id, lower(guest_email))
  where guest_email is not null;

create index if not exists review_helpful_votes_review_id_idx
  on public.review_helpful_votes (review_id);

create table if not exists public.review_helpful_otps (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  email text not null,
  guest_name text not null,
  code text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists review_helpful_otps_lookup_idx
  on public.review_helpful_otps (review_id, lower(email));

comment on table public.review_helpful_votes is 'Public "was this helpful" votes; one per user or guest email per review.';
comment on table public.review_helpful_otps is 'Email verification before recording a guest helpful vote.';

-- Maintain reviews.like_count
create or replace function public.review_helpful_bump_like_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.reviews
    set like_count = coalesce(like_count, 0) + 1
    where id = new.review_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.reviews
    set like_count = greatest(coalesce(like_count, 0) - 1, 0)
    where id = old.review_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_review_helpful_votes_ai on public.review_helpful_votes;
create trigger trg_review_helpful_votes_ai
  after insert on public.review_helpful_votes
  for each row execute function public.review_helpful_bump_like_count();

drop trigger if exists trg_review_helpful_votes_ad on public.review_helpful_votes;
create trigger trg_review_helpful_votes_ad
  after delete on public.review_helpful_votes
  for each row execute function public.review_helpful_bump_like_count();

alter table public.review_helpful_votes enable row level security;
alter table public.review_helpful_otps enable row level security;
