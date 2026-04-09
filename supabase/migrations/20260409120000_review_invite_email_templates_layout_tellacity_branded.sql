-- Email widget: Tellacity trust-summary layout (Premium & Elite). Adds layout_style value tellacity_branded.
alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_layout_style_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_layout_style_check
  check (layout_style in ('standard', 'elite_branded', 'review_card', 'rating_ladder', 'tellacity_branded'));
