-- Adds the `reviews_showcase` email widget layout.
-- Available on Premium and Elite plans only (application-level gate).
--
-- Rerun-safe: drops and recreates the check constraint with the new value
-- in the allowlist, preserving every previously valid layout style.

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
      'tellacity_branded',
      'reviews_showcase'
    )
  );
