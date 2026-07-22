-- Track how many reviews were deleted when an email was blocked / purged.

alter table public.blocked_emails
  add column if not exists reviews_deleted_count integer not null default 0;

alter table public.blocked_emails
  add column if not exists last_purged_at timestamptz;

comment on column public.blocked_emails.reviews_deleted_count is
  'Cumulative count of reviews deleted for this blocked email (block + re-purge).';

comment on column public.blocked_emails.last_purged_at is
  'When content was last purged for this blocked email.';

-- Atomically add to the running total after a purge.
create or replace function public.record_blocked_email_purge_counts(
  p_email text,
  p_reviews_deleted integer default 0,
  p_drafts_deleted integer default 0,
  p_otps_deleted integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := public.normalize_block_email(p_email);
  v_row public.blocked_emails%rowtype;
begin
  if v_email is null or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'invalid_email');
  end if;

  update public.blocked_emails
  set
    reviews_deleted_count = coalesce(reviews_deleted_count, 0)
      + greatest(coalesce(p_reviews_deleted, 0), 0),
    last_purged_at = now()
  where email = v_email
  returning * into v_row;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'email_not_blocked');
  end if;

  return jsonb_build_object(
    'ok', true,
    'email', v_row.email,
    'reviews_deleted_count', v_row.reviews_deleted_count,
    'last_purged_at', v_row.last_purged_at
  );
end;
$$;

revoke all on function public.record_blocked_email_purge_counts(text, integer, integer, integer) from public;
grant execute on function public.record_blocked_email_purge_counts(text, integer, integer, integer) to service_role;

notify pgrst, 'reload schema';
