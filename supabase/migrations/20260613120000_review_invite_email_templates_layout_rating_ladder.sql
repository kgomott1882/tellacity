-- Email widget: "How did we do?" rating rows (Premium+). Adds layout_style value rating_ladder.
alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_layout_style_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_layout_style_check
  check (layout_style in ('standard', 'elite_branded', 'review_card', 'rating_ladder'));
