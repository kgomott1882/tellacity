-- Allow non-invite guest OTP drafts (public write-review flow) without a review_invites row.
alter table public.review_drafts alter column invite_id drop not null;
