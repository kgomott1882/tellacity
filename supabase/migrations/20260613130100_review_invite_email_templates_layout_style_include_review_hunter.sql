-- Fixes layout_style check after 20260613120000 accidentally dropped `review_hunter` and `tellacity_branded`.
-- Run this in Supabase SQL Editor if migrations were not applied (same body as this file).

alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_layout_style_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_layout_style_check
  check (
    layout_style is null
    or layout_style in (
      'standard',
      'review_hunter',
      'elite_branded',
      'review_card',
      'rating_ladder',
      'tellacity_branded'
    )
  );
