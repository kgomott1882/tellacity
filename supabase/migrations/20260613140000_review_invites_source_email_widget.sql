-- Email widget sends: one review_invites row per recipient with source = email_widget (no monthly quota).
alter table public.review_invites
  add column if not exists source text;

comment on column public.review_invites.source is
  'email_widget: marketing widget email link; excluded from monthly invite quota. NULL = standard invite.';
