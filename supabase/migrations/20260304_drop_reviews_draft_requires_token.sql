-- Drop reviews_draft_requires_token check constraint
-- Guest review verification is handled via consumer_otps.magic_token,
-- so drafts no longer require a draft_token column.

alter table public.reviews
drop constraint if exists reviews_draft_requires_token;

