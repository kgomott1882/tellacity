-- Add layout_style column to review_invite_email_templates.
-- Allowed values: 'standard' (default) | 'elite_branded' (Elite plan only).

alter table public.review_invite_email_templates
  add column if not exists layout_style text not null default 'standard';

alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_layout_style_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_layout_style_check
  check (layout_style in ('standard', 'elite_branded'));

-- Back-fill existing rows
update public.review_invite_email_templates
set layout_style = 'standard'
where layout_style is null or layout_style = '';
