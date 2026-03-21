-- Allow many helpful votes per review (multiple rows per user or guest email).
-- Replaces unique indexes with non-unique indexes for lookups.

drop index if exists review_helpful_votes_review_user_uniq;
drop index if exists review_helpful_votes_review_guest_email_uniq;

create index if not exists review_helpful_votes_review_user_idx
  on public.review_helpful_votes (review_id, user_id)
  where user_id is not null;

create index if not exists review_helpful_votes_review_guest_idx
  on public.review_helpful_votes (review_id, lower(guest_email))
  where guest_email is not null;

comment on table public.review_helpful_votes is 'Public helpful votes; many rows per review; like_count on reviews is maintained by triggers.';
