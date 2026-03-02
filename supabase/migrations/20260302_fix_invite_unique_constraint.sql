-- Drop the hard unique constraint on (business_id, email) that blocks re-inviting
-- the same email address after a revoke/accept. The partial unique index
-- (business_member_invites_pending_unique) already enforces one pending invite
-- per email per business, which is the only constraint we need.

do $$
declare
  v_constraint text;
begin
  select conname into v_constraint
  from pg_constraint
  where conrelid = 'public.business_member_invites'::regclass
    and contype = 'u'
    and array_length(conkey, 1) = 2
    -- matches the (business_id, email) pair
    and conkey::int[] @> array[
      (select attnum from pg_attribute
       where attrelid = 'public.business_member_invites'::regclass
         and attname = 'business_id'),
      (select attnum from pg_attribute
       where attrelid = 'public.business_member_invites'::regclass
         and attname = 'email')
    ]::int[];

  if v_constraint is not null then
    execute format('alter table public.business_member_invites drop constraint %I', v_constraint);
  end if;
end;
$$;

-- Ensure the partial unique index still exists (idempotent)
create unique index if not exists business_member_invites_pending_unique
  on public.business_member_invites (business_id, email)
  where status = 'pending';
