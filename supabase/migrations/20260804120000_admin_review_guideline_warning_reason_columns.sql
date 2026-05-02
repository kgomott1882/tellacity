alter table public.admin_review_guideline_warning_emails
  add column if not exists reason_key text not null default 'general',
  add column if not exists reason_label text,
  add column if not exists custom_note text;

comment on column public.admin_review_guideline_warning_emails.reason_key is
  'Predefined reason key from admin UI (e.g. promotional, custom).';
comment on column public.admin_review_guideline_warning_emails.reason_label is
  'Human-readable reason label at time of send.';
comment on column public.admin_review_guideline_warning_emails.custom_note is
  'Optional admin note; required context when reason is custom.';
