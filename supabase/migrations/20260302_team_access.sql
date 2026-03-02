-- Team Access: business_members + business_member_invites
-- =========================================================

-- ── business_members ─────────────────────────────────────────────────────────

create table if not exists public.business_members (
  id          uuid        primary key default gen_random_uuid(),
  business_id uuid        not null references public.businesses(id) on delete cascade,
  user_id     uuid        not null references auth.users(id) on delete cascade,
  role        text        not null default 'member'
                          check (role in ('owner', 'admin', 'member')),
  status      text        not null default 'active'
                          check (status in ('active', 'removed')),
  created_at  timestamptz not null default now(),
  unique (business_id, user_id)
);

alter table public.business_members enable row level security;

-- Members can see the team for any business they actively belong to
create policy "members_select"
  on public.business_members for select
  using (
    exists (
      select 1 from public.business_members bm2
      where bm2.business_id = business_members.business_id
        and bm2.user_id     = auth.uid()
        and bm2.status      = 'active'
    )
  );

-- Only the business owner may insert / update / delete members
create policy "owner_insert"
  on public.business_members for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_members.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "owner_update"
  on public.business_members for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_members.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "owner_delete"
  on public.business_members for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_members.business_id
        and b.owner_id = auth.uid()
    )
  );

-- ── business_member_invites ───────────────────────────────────────────────────

create table if not exists public.business_member_invites (
  id          uuid        primary key default gen_random_uuid(),
  business_id uuid        not null references public.businesses(id) on delete cascade,
  email       text        not null,
  role        text        not null default 'member'
                          check (role in ('admin', 'member')),
  token       uuid        not null default gen_random_uuid(),
  invited_by  uuid        not null references auth.users(id) on delete set null,
  status      text        not null default 'pending'
                          check (status in ('pending', 'accepted', 'revoked')),
  created_at  timestamptz not null default now(),
  accepted_at timestamptz,
  unique (token),
  -- Only one pending invite per email per business
  unique nulls not distinct (business_id, email)
    -- partial unique enforced via index below (standard unique above is a fallback)
);

-- Partial unique index: only one pending invite per (business_id, email)
create unique index if not exists business_member_invites_pending_unique
  on public.business_member_invites (business_id, email)
  where status = 'pending';

alter table public.business_member_invites enable row level security;

-- Only the business owner can see / manage invites
create policy "owner_select_invites"
  on public.business_member_invites for select
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_member_invites.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "owner_insert_invites"
  on public.business_member_invites for insert
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_member_invites.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "owner_update_invites"
  on public.business_member_invites for update
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_member_invites.business_id
        and b.owner_id = auth.uid()
    )
  );

create policy "owner_delete_invites"
  on public.business_member_invites for delete
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_member_invites.business_id
        and b.owner_id = auth.uid()
    )
  );

-- ── SECURITY DEFINER: accept_business_member_invite ──────────────────────────

create or replace function public.accept_business_member_invite(p_token uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite  record;
  v_user_id uuid;
begin
  -- Require authenticated caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Find pending invite
  select * into v_invite
  from public.business_member_invites
  where token = p_token
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Invite not found or already used';
  end if;

  -- Add member (idempotent)
  insert into public.business_members (business_id, user_id, role, status)
  values (v_invite.business_id, v_user_id, v_invite.role, 'active')
  on conflict (business_id, user_id) do update
    set role   = excluded.role,
        status = 'active';

  -- Mark invite accepted
  update public.business_member_invites
  set status      = 'accepted',
      accepted_at = now()
  where id = v_invite.id;

  return json_build_object(
    'business_id', v_invite.business_id,
    'role',        v_invite.role,
    'accepted',    true
  );
end;
$$;

-- ── Seed owner memberships for existing businesses ────────────────────────────

insert into public.business_members (business_id, user_id, role, status)
select id, owner_id, 'owner', 'active'
from   public.businesses
where  owner_id is not null
on conflict (business_id, user_id) do nothing;
