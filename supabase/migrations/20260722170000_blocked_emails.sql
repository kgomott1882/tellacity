-- Permanently blocked emails + guest display names for spam without stored email.
-- Blocking purges matching reviews/drafts/OTPs (and scam-body matches when notes include markers).

create table if not exists public.blocked_emails (
  email text primary key,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  notes text
);

comment on table public.blocked_emails is
  'Admin blocklist: normalized lowercased emails barred from reviews / business signup & claim.';

create index if not exists blocked_emails_created_at_idx
  on public.blocked_emails (created_at desc);

alter table public.blocked_emails enable row level security;

drop policy if exists blocked_emails_admin_select on public.blocked_emails;
create policy blocked_emails_admin_select
  on public.blocked_emails for select to authenticated
  using (public.is_current_user_admin());

-- Guest display names (e.g. "Rebecca") used when reviews have no email on file
create table if not exists public.blocked_guest_names (
  guest_name text primary key,
  reason text,
  created_by uuid,
  created_at timestamptz not null default now(),
  notes text
);

comment on table public.blocked_guest_names is
  'Admin blocklist: normalized lowercased guest display names barred from reviewing.';

create index if not exists blocked_guest_names_created_at_idx
  on public.blocked_guest_names (created_at desc);

alter table public.blocked_guest_names enable row level security;

drop policy if exists blocked_guest_names_admin_select on public.blocked_guest_names;
create policy blocked_guest_names_admin_select
  on public.blocked_guest_names for select to authenticated
  using (public.is_current_user_admin());

create or replace function public.normalize_block_email(p_email text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(both from coalesce(p_email, ''))), '');
$$;

create or replace function public.normalize_block_guest_name(p_name text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(both from coalesce(p_name, ''))), '');
$$;

create or replace function public.is_email_blocked(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.blocked_emails b
    where b.email = public.normalize_block_email(p_email)
  );
$$;

create or replace function public.is_guest_name_blocked(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.blocked_guest_names b
    where b.guest_name = public.normalize_block_guest_name(p_name)
  );
$$;

revoke all on function public.is_email_blocked(text) from public;
grant execute on function public.is_email_blocked(text) to anon, authenticated, service_role;

revoke all on function public.is_guest_name_blocked(text) from public;
grant execute on function public.is_guest_name_blocked(text) to anon, authenticated, service_role;

create or replace function public.purge_content_for_email_service(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := public.normalize_block_email(p_email);
  v_reviews int := 0;
  v_drafts int := 0;
  v_otps int := 0;
  v_helpful int := 0;
begin
  if v_email is null or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  -- Match stored email columns OR scam email pasted into title/body
  delete from public.reviews r
  where lower(trim(coalesce(r.guest_email, ''))) = v_email
     or lower(trim(coalesce(r.author_email, ''))) = v_email
     or lower(trim(coalesce(r.email, ''))) = v_email
     or lower(coalesce(r.title, '')) like '%' || v_email || '%'
     or lower(coalesce(r.body, '')) like '%' || v_email || '%';
  get diagnostics v_reviews = row_count;

  begin
    delete from public.review_drafts d
    where lower(trim(coalesce(d.email, ''))) = v_email
       or lower(coalesce(d.title, '')) like '%' || v_email || '%'
       or lower(coalesce(d.body, '')) like '%' || v_email || '%';
    get diagnostics v_drafts = row_count;
  exception
    when undefined_table then
      v_drafts := 0;
  end;

  begin
    delete from public.review_otps o
    where lower(trim(coalesce(o.email, ''))) = v_email;
    get diagnostics v_otps = row_count;
  exception
    when undefined_table then
      v_otps := 0;
  end;

  begin
    delete from public.review_helpful_votes h
    where lower(trim(coalesce(h.guest_email, ''))) = v_email;
    get diagnostics v_helpful = row_count;
  exception
    when undefined_table then
      v_helpful := 0;
    when undefined_column then
      v_helpful := 0;
  end;

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'deleted_reviews', v_reviews,
    'deleted_drafts', v_drafts,
    'deleted_otps', v_otps,
    'deleted_helpful', v_helpful
  );
end;
$$;

create or replace function public.purge_content_for_guest_name_service(p_guest_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := public.normalize_block_guest_name(p_guest_name);
  v_reviews int := 0;
  v_drafts int := 0;
begin
  if v_name is null or length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_guest_name');
  end if;

  -- Only purge reviews that have NO stored reviewer email (avoid wiping legit same-name users)
  delete from public.reviews r
  where public.normalize_block_guest_name(r.guest_name) = v_name
    and nullif(lower(trim(coalesce(r.guest_email, ''))), '') is null
    and nullif(lower(trim(coalesce(r.author_email, ''))), '') is null
    and nullif(lower(trim(coalesce(r.email, ''))), '') is null;
  get diagnostics v_reviews = row_count;

  begin
    delete from public.review_drafts d
    where public.normalize_block_guest_name(d.guest_name) = v_name
      and nullif(lower(trim(coalesce(d.email, ''))), '') is null;
    get diagnostics v_drafts = row_count;
  exception
    when undefined_table then
      v_drafts := 0;
    when undefined_column then
      v_drafts := 0;
  end;

  return jsonb_build_object(
    'ok', true,
    'guest_name', v_name,
    'deleted_reviews', v_reviews,
    'deleted_drafts', v_drafts
  );
end;
$$;

revoke all on function public.purge_content_for_email_service(text) from public;
grant execute on function public.purge_content_for_email_service(text) to service_role;

revoke all on function public.purge_content_for_guest_name_service(text) from public;
grant execute on function public.purge_content_for_guest_name_service(text) to service_role;

create or replace function public.admin_block_email_service(
  p_email text,
  p_reason text default null,
  p_created_by uuid default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := public.normalize_block_email(p_email);
  v_purge jsonb;
begin
  if v_email is null or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  insert into public.blocked_emails (email, reason, created_by, notes)
  values (
    v_email,
    nullif(trim(both from coalesce(p_reason, '')), ''),
    p_created_by,
    nullif(trim(both from coalesce(p_notes, '')), '')
  )
  on conflict (email) do update set
    reason = coalesce(excluded.reason, public.blocked_emails.reason),
    notes = coalesce(excluded.notes, public.blocked_emails.notes);

  v_purge := public.purge_content_for_email_service(v_email);

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'purge', v_purge
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

create or replace function public.admin_block_guest_name_service(
  p_guest_name text,
  p_reason text default null,
  p_created_by uuid default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := public.normalize_block_guest_name(p_guest_name);
  v_purge jsonb;
begin
  if v_name is null or length(v_name) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_guest_name');
  end if;

  insert into public.blocked_guest_names (guest_name, reason, created_by, notes)
  values (
    v_name,
    nullif(trim(both from coalesce(p_reason, '')), ''),
    p_created_by,
    nullif(trim(both from coalesce(p_notes, '')), '')
  )
  on conflict (guest_name) do update set
    reason = coalesce(excluded.reason, public.blocked_guest_names.reason),
    notes = coalesce(excluded.notes, public.blocked_guest_names.notes);

  v_purge := public.purge_content_for_guest_name_service(v_name);

  return jsonb_build_object(
    'ok', true,
    'guest_name', v_name,
    'purge', v_purge
  );
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

create or replace function public.admin_unblock_email_service(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := public.normalize_block_email(p_email);
  v_count int := 0;
begin
  if v_email is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  delete from public.blocked_emails where email = v_email;
  get diagnostics v_count = row_count;

  return jsonb_build_object('ok', true, 'email', v_email, 'removed', v_count > 0);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

create or replace function public.admin_unblock_guest_name_service(p_guest_name text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := public.normalize_block_guest_name(p_guest_name);
  v_count int := 0;
begin
  if v_name is null then
    return jsonb_build_object('ok', false, 'error', 'invalid_guest_name');
  end if;

  delete from public.blocked_guest_names where guest_name = v_name;
  get diagnostics v_count = row_count;

  return jsonb_build_object('ok', true, 'guest_name', v_name, 'removed', v_count > 0);
exception
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.admin_block_email_service(text, text, uuid, text) from public;
grant execute on function public.admin_block_email_service(text, text, uuid, text) to service_role;

revoke all on function public.admin_block_guest_name_service(text, text, uuid, text) from public;
grant execute on function public.admin_block_guest_name_service(text, text, uuid, text) to service_role;

revoke all on function public.admin_unblock_email_service(text) from public;
grant execute on function public.admin_unblock_email_service(text) to service_role;

revoke all on function public.admin_unblock_guest_name_service(text) from public;
grant execute on function public.admin_unblock_guest_name_service(text) to service_role;

notify pgrst, 'reload schema';
