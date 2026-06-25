-- Fix review_invites.expires_at: production had a short/wrong column default (often ~now()
-- or OTP-style minutes). Invites should stay valid 90 days from send/create.

alter table public.review_invites
  alter column expires_at set default (timezone('utc', now()) + interval '90 days');

-- Repair every open invite with a TTL under 7 days (catches bad defaults, not real policy).
update public.review_invites
set expires_at = coalesce(sent_at, created_at, timezone('utc', now())) + interval '90 days'
where review_submitted_at is null
  and (
    expires_at is null
    or expires_at <= coalesce(sent_at, created_at, timezone('utc', now())) + interval '7 days'
  );

create or replace function public.review_invites_ensure_expires_at()
returns trigger
language plpgsql
as $$
declare
  v_anchor timestamptz;
  v_min_expires timestamptz;
begin
  v_anchor := coalesce(new.sent_at, new.created_at, timezone('utc', now()));
  v_min_expires := v_anchor + interval '90 days';

  if new.expires_at is null or new.expires_at < v_min_expires then
    new.expires_at := v_min_expires;
  end if;

  return new;
end;
$$;

drop trigger if exists review_invites_ensure_expires_at on public.review_invites;

create trigger review_invites_ensure_expires_at
  before insert or update of expires_at, sent_at, created_at
  on public.review_invites
  for each row
  execute function public.review_invites_ensure_expires_at();

comment on function public.review_invites_ensure_expires_at() is
  'Guarantees invite links remain valid at least 90 days from sent_at/created_at.';
