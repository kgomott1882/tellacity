-- Audit log: automated no-reply "community guidelines" warning emails to reviewers, sent from admin.
-- Queried only via service role (API). RLS on with no policies for authenticated roles.

create table if not exists public.admin_review_guideline_warning_emails (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  recipient_email text not null,
  sent_at timestamptz not null default now(),
  sent_by_user_id uuid not null references auth.users (id) on delete restrict
);

create index if not exists admin_review_guideline_warning_emails_review_id_idx
  on public.admin_review_guideline_warning_emails (review_id);

create index if not exists admin_review_guideline_warning_emails_sent_at_idx
  on public.admin_review_guideline_warning_emails (sent_at desc);

comment on table public.admin_review_guideline_warning_emails is
  'One row per guidelines-warning email to a review author (admin-initiated, Resend).';

alter table public.admin_review_guideline_warning_emails enable row level security;
