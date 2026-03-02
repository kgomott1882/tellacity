-- Email templates per business: standard (read-only default) and custom (editable on Grow+).
create table if not exists public.review_invite_email_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  "type" text not null check ("type" in ('standard', 'custom')),
  subject text,
  body text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, "type")
);

create index if not exists review_email_templates_business_id_idx on public.review_invite_email_templates (business_id);

comment on table public.review_invite_email_templates is 'Per-business email templates for review invites: standard (default) and custom (Grow+).';

alter table public.review_invite_email_templates enable row level security;

-- Business owners can manage templates for their businesses
create policy "Business owners can manage review_email_templates"
  on public.review_invite_email_templates for all
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
      and (b.owner_id = auth.uid() or exists (select 1 from public.business_owners bo where bo.business_id = b.id and bo.owner_user_id = auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id
      and (b.owner_id = auth.uid() or exists (select 1 from public.business_owners bo where bo.business_id = b.id and bo.owner_user_id = auth.uid()))
    )
  );
