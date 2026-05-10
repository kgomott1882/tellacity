-- Hardens the auth.users INSERT trigger so Google "Continue with Google" no longer
-- fails at the Supabase callback (`/auth/v1/callback` → 500 unexpected_failure).
--
-- Symptoms before this migration:
--   * Email/OTP "Helpful" works (does not touch auth.users).
--   * "Continue with Google" lands on imstyrwydypcmzwupmzu.supabase.co/auth/v1/callback
--     with `{"code":500,"error_code":"unexpected_failure","msg":"Unexpected failure ..."}`.
--   * Supabase Auth log shows a Postgres error from the trigger that fires when GoTrue
--     INSERTs the new user (or UPDATEs last_sign_in_at on identity link).
--
-- Root cause: a trigger function on `auth.users` raised an exception that escaped the
-- trigger, GoTrue rolled the auth transaction back, and surfaced as `unexpected_failure`.
-- The previous version of `tellacity_sync_profile_from_auth_user` only wrapped the
-- INSERT in EXCEPTION, but errors elsewhere in the function body could still bubble up.
-- Additionally, hosted Supabase projects often retain leftover trigger functions from
-- tutorials/dashboards (handle_new_user, on_auth_user_created, ...) that we cannot DROP
-- TRIGGER directly because `auth.users` is owned by `supabase_auth_admin`. Dropping the
-- public function with CASCADE is the only portable way to remove those triggers.
--
-- This migration: removes any leftover public trigger functions tied to auth.users,
-- replaces ours with a fully bullet-proof version that NEVER raises, and recreates the
-- two triggers we actually want.

-- 1) Remove all known/legacy public functions used by triggers on auth.users.
--    CASCADE drops the trigger when the function is in `public`.
drop function if exists public.tellacity_sync_profile_from_auth_user() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_user_trigger() cascade;
drop function if exists public.clone_user() cascade;
drop function if exists public.sync_profile_from_auth() cascade;
drop function if exists public.create_profile_for_user() cascade;
drop function if exists public.create_profile() cascade;
drop function if exists public.on_auth_user_created() cascade;
drop function if exists public.on_auth_user_updated() cascade;

-- 2) Best-effort: drop legacy triggers that may exist directly on auth.users from
--    earlier dashboard tutorials. Ignore privilege errors (the table is owned by
--    `supabase_auth_admin`; those drops would need the Dashboard SQL editor).
do $$
begin
  execute 'drop trigger if exists on_auth_user_created on auth.users';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  execute 'drop trigger if exists on_auth_user_updated on auth.users';
exception when insufficient_privilege then null;
end $$;

do $$
begin
  execute 'drop trigger if exists handle_new_user_trigger on auth.users';
exception when insufficient_privilege then null;
end $$;

-- 3) Bullet-proof profile sync. The ENTIRE body is wrapped in EXCEPTION WHEN OTHERS,
--    so no failure path can ever bubble up to GoTrue and abort the auth transaction.
--    Tolerates `public.profiles` not existing yet, missing email column, etc.
create or replace function public.tellacity_sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text;
begin
  begin
    v_email := coalesce(
      nullif(lower(btrim(new.email::text)), ''),
      'user_' || replace(new.id::text, '-', '') || '@tellacity.auth'
    );

    insert into public.profiles (id, email)
    values (new.id, v_email)
    on conflict (id) do nothing;
  exception
    when undefined_table then
      -- public.profiles does not exist; do nothing, do not block auth.
      null;
    when undefined_column then
      -- profiles missing `email`; insert id-only as a last resort.
      begin
        insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
      exception when others then null;
      end;
    when others then
      -- Never block auth.users INSERT/UPDATE. Log a warning instead.
      raise warning 'tellacity_sync_profile_from_auth_user (id=%, email=%): % / %',
        new.id, new.email, sqlstate, sqlerrm;
  end;

  return new;
end;
$$;

alter function public.tellacity_sync_profile_from_auth_user() owner to postgres;

revoke all on function public.tellacity_sync_profile_from_auth_user() from public;
grant execute on function public.tellacity_sync_profile_from_auth_user()
  to postgres, service_role, supabase_auth_admin;

comment on function public.tellacity_sync_profile_from_auth_user() is
  'Idempotent public.profiles shell from auth.users; never raises so OAuth / email auth flows are not blocked.';

-- 4) Re-create the two triggers we actually want.
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

notify pgrst, 'reload schema';
