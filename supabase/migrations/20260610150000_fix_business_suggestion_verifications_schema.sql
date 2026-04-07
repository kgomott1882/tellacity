-- Align drifted tables with app expectations (columns the API inserts/selects).
-- Safe if you already ran a shorter manual script missing `payload`, `suggester_*`, etc.

-- Legacy names → app names
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_suggestion_verifications' and column_name = 'email'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_suggestion_verifications' and column_name = 'suggester_email'
  ) then
    alter table public.business_suggestion_verifications rename column email to suggester_email;
  end if;
end $$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_suggestion_verifications' and column_name = 'name'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'business_suggestion_verifications' and column_name = 'suggester_name'
  ) then
    alter table public.business_suggestion_verifications rename column name to suggester_name;
  end if;
end $$;

alter table public.business_suggestion_verifications add column if not exists id uuid default gen_random_uuid();
alter table public.business_suggestion_verifications add column if not exists suggester_email text;
alter table public.business_suggestion_verifications add column if not exists suggester_name text;
alter table public.business_suggestion_verifications add column if not exists code text;
alter table public.business_suggestion_verifications add column if not exists expires_at timestamptz;
alter table public.business_suggestion_verifications add column if not exists consumed_at timestamptz;
alter table public.business_suggestion_verifications add column if not exists payload jsonb;
alter table public.business_suggestion_verifications add column if not exists created_at timestamptz default now();

update public.business_suggestion_verifications
set payload = '{}'::jsonb
where payload is null;

-- Remove incomplete rows so NOT NULL can apply
delete from public.business_suggestion_verifications
where suggester_email is null or btrim(suggester_email) = ''
   or suggester_name is null or btrim(suggester_name) = ''
   or code is null
   or expires_at is null;

alter table public.business_suggestion_verifications alter column payload set not null;
alter table public.business_suggestion_verifications alter column suggester_email set not null;
alter table public.business_suggestion_verifications alter column suggester_name set not null;
alter table public.business_suggestion_verifications alter column code set not null;
alter table public.business_suggestion_verifications alter column expires_at set not null;

-- Primary key on id (only when missing)
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'business_suggestion_verifications'
      and c.contype = 'p'
  ) then
    update public.business_suggestion_verifications set id = gen_random_uuid() where id is null;
    alter table public.business_suggestion_verifications alter column id set not null;
    alter table public.business_suggestion_verifications
      add constraint business_suggestion_verifications_pkey primary key (id);
  end if;
end $$;

drop index if exists idx_business_suggestion_verifications_email;

create index if not exists business_suggestion_verifications_pending_email_idx
  on public.business_suggestion_verifications (suggester_email)
  where consumed_at is null;

alter table public.business_suggestion_verifications enable row level security;

grant all on table public.business_suggestion_verifications to service_role;

notify pgrst, 'reload schema';
