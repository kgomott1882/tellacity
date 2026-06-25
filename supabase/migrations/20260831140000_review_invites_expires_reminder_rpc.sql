-- Review invite expiry + reminder RPC (card-on-file cron uses get_review_invites_for_reminders).

alter table public.review_invites
  add column if not exists expires_at timestamptz,
  add column if not exists reminder_count integer not null default 0,
  add column if not exists last_reminder_sent_at timestamptz;

comment on column public.review_invites.expires_at is
  'Invite link valid until this time; extended on send/reminder.';

-- Active, unused invites: ensure a future expiry from sent/created time.
update public.review_invites
set expires_at = coalesce(sent_at, created_at, now()) + interval '90 days'
where review_submitted_at is null
  and (expires_at is null or expires_at < now());

-- Return type changed (added expires_at); must drop before replace.
drop function if exists public.get_review_invites_for_reminders();

create or replace function public.get_review_invites_for_reminders()
returns table (
  id uuid,
  token text,
  recipient_email text,
  opened_at timestamptz,
  reminder_count integer,
  review_submitted_at timestamptz,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    ri.id,
    ri.token,
    ri.recipient_email,
    ri.opened_at,
    coalesce(ri.reminder_count, 0)::integer,
    ri.review_submitted_at,
    ri.expires_at
  from public.review_invites ri
  where ri.review_submitted_at is null
    and ri.sent_at is not null
    and ri.sent_at <= now() - interval '3 days'
    and coalesce(ri.reminder_count, 0) < 1
    and ri.last_reminder_sent_at is null
    and (ri.expires_at is null or ri.expires_at > now())
  order by ri.sent_at asc
  limit 100;
$$;

comment on function public.get_review_invites_for_reminders() is
  'Cron: one reminder per invite, ~3 days after first send, only while link is still valid.';

grant execute on function public.get_review_invites_for_reminders() to service_role;
