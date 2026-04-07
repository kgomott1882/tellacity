-- Trust-style review showcase layout for Premium+ email widgets.
alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_layout_style_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_layout_style_check
  check (layout_style in ('standard', 'elite_branded', 'review_card'));
