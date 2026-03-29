-- Fix GoTrue "Database error granting user" when a trigger or function on auth.users fails
-- and rolls back the auth transaction.
--
-- Hosted note: postgres often cannot DROP TRIGGER on auth.users directly (table owner is
-- supabase_auth_admin). Dropping the trigger's function with CASCADE removes the trigger
-- when that function lives in public — the usual Supabase pattern.
--
-- If login still fails after this migration: Dashboard → Authentication → Logs for the
-- underlying SQL error; then remove any remaining trigger on auth.users via the SQL editor
-- (Supabase can run as a role that owns auth.users).

-- Idempotent: remove our previous install first (CASCADE drops triggers that use this function)
drop function if exists public.tellacity_sync_profile_from_auth_user() cascade;

-- Common Supabase template / tutorial names (CASCADE drops any trigger using them)
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_user_trigger() cascade;
drop function if exists public.clone_user() cascade;
drop function if exists public.sync_profile_from_auth() cascade;

-- Best-effort: dashboard-created triggers not tied to the functions above
do $$
begin
  execute 'drop trigger if exists on_auth_user_created on auth.users';
exception
  when insufficient_privilege then
    raise notice 'Could not drop on_auth_user_created on auth.users (use Dashboard SQL editor if needed).';
end $$;

do $$
begin
  execute 'drop trigger if exists on_auth_user_updated on auth.users';
exception
  when insufficient_privilege then
    raise notice 'Could not drop on_auth_user_updated on auth.users (use Dashboard SQL editor if needed).';
end $$;

create or replace function public.tellacity_sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  v_email := coalesce(
    nullif(lower(trim(both from new.email::text)), ''),
    'user_' || replace(new.id::text, '-', '') || '@tellacity.auth'
  );

  begin
    insert into public.profiles (id, email)
    values (new.id, v_email)
    on conflict (id) do nothing;
  exception
    when others then
      raise warning 'tellacity_sync_profile_from_auth_user: %', sqlerrm;
  end;

  return new;
end;
$$;

create trigger tellacity_auth_user_profile_sync_ins
  after insert on auth.users
  for each row
  execute function public.tellacity_sync_profile_from_auth_user();

create trigger tellacity_auth_user_profile_sync_signin
  after update of last_sign_in_at on auth.users
  for each row
  when (
    old.last_sign_in_at is distinct from new.last_sign_in_at
    or (new.last_sign_in_at is not null and old.last_sign_in_at is null)
  )
  execute function public.tellacity_sync_profile_from_auth_user();

comment on function public.tellacity_sync_profile_from_auth_user() is
  'Idempotent public.profiles shell from auth.users; errors are logged and ignored so GoTrue login is not blocked.';

notify pgrst, 'reload schema';
