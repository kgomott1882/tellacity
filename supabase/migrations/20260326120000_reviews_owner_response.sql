-- Business owner reply stored on the review row (dashboard inbox).
alter table public.reviews add column if not exists owner_response text;
alter table public.reviews add column if not exists owner_response_at timestamptz;

comment on column public.reviews.owner_response is 'Business public reply to this review.';
comment on column public.reviews.owner_response_at is 'When owner_response was last set.';
