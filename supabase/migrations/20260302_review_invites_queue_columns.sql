-- Add queue/scheduling columns to review_invites.
-- All columns are nullable so existing rows are unaffected.
-- send_at:           when the invite email should be sent (NULL = send immediately on insert)
-- sent_at:           timestamp the first invite email was actually sent
-- reminder_at:       when the reminder email should be sent (NULL = no reminder)
-- reminder_sent_at:  timestamp the reminder email was actually sent
-- last_send_error:   last error message from the email provider (cleared on success)

alter table public.review_invites
  add column if not exists send_at            timestamptz,
  add column if not exists sent_at            timestamptz,
  add column if not exists reminder_at        timestamptz,
  add column if not exists reminder_sent_at   timestamptz,
  add column if not exists last_send_error    text;

-- Index to make the cron worker query fast
create index if not exists review_invites_send_at_idx
  on public.review_invites (send_at)
  where sent_at is null;

create index if not exists review_invites_reminder_at_idx
  on public.review_invites (reminder_at)
  where reminder_sent_at is null;
