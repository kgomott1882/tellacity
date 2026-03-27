-- Optional columns for imported / alternate review flows (admin list fallbacks).
alter table public.reviews add column if not exists email text;
alter table public.reviews add column if not exists author_email text;
alter table public.reviews add column if not exists consumer_id uuid references public.profiles (id) on delete set null;

create index if not exists reviews_consumer_id_idx on public.reviews (consumer_id);

comment on column public.reviews.email is 'Optional stored reviewer email (e.g. imports).';
comment on column public.reviews.author_email is 'Optional alternate author email field.';
comment on column public.reviews.consumer_id is 'Optional profile id when distinct from user_id.';
