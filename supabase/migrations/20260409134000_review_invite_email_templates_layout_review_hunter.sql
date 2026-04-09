-- Add Review Hunter email widget layout option.
-- Keeps existing values and extends the layout_style check constraint.

alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_layout_style_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_layout_style_check
  check (
    layout_style is null
    or layout_style in (
      'standard',
      'review_hunter',
      'review_card',
      'tellacity_branded',
      'elite_branded',
      'rating_ladder'
    )
  );
