-- Email widget system: adds 'widget' as a valid template_key and creates the
-- email_widget_sends log table.

-- 1. Allow 'widget' as a template_key value in review_invite_email_templates.
--    The existing migration created the table with a "type" column; the app
--    uses a column called template_key. We add the constraint update here so
--    the widget key is accepted.
alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_type_check;

-- Re-add the check on the template_key column (the deployed column name).
-- If the column is still named "type" in some environments this is a no-op.
alter table public.review_invite_email_templates
  drop constraint if exists review_invite_email_templates_template_key_check;

alter table public.review_invite_email_templates
  add constraint review_invite_email_templates_template_key_check
  check (template_key in ('standard', 'custom', 'widget'));

-- 2. Log table for widget email sends (no invite tokens, no quota consumption).
create table if not exists public.email_widget_sends (
  id            uuid        primary key default gen_random_uuid(),
  business_id   uuid        not null references public.businesses (id) on delete cascade,
  recipient_count int       not null default 1,
  sent_at       timestamptz not null default now()
);

create index if not exists email_widget_sends_business_id_idx
  on public.email_widget_sends (business_id);

comment on table public.email_widget_sends is
  'Lightweight log of email widget sends. No invite tokens or quota consumed.';

alter table public.email_widget_sends enable row level security;

create policy "Business owners can view widget sends"
  on public.email_widget_sends for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
        and (
          b.owner_id = auth.uid()
          or exists (
            select 1 from public.business_owners bo
            where bo.business_id = b.id
              and bo.owner_user_id = auth.uid()
          )
        )
    )
  );

create policy "Service role can insert widget sends"
  on public.email_widget_sends for insert
  with check (true);
