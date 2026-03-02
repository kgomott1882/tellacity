-- Add template_type column to review_invite_email_templates.
-- Existing rows default to 'invite'. Widget rows use 'email_widget'.

alter table public.review_invite_email_templates
  add column if not exists template_type text not null default 'invite';

-- Back-fill existing rows
update public.review_invite_email_templates
set template_type = 'invite'
where template_type is null or template_type = '';

-- Add check constraint (drop first in case of re-run)
alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_template_type_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_template_type_check
  check (template_type in ('invite', 'custom_invite', 'email_widget'));

-- Also add intro_message column used by the widget structured layout
alter table public.review_invite_email_templates
  add column if not exists intro_message text;
