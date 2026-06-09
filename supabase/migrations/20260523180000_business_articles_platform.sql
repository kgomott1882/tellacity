-- =========================================================================
-- Business Articles Platform: articles, usage, images, permissions, bonus RPCs
-- Safe to re-run (idempotent where possible).
-- =========================================================================

-- ── Helpers ───────────────────────────────────────────────────────────────

create or replace function public.utc_billing_month(p_ts timestamptz default now())
returns text
language sql
stable
as $$
  select to_char(date_trunc('month', p_ts at time zone 'UTC'), 'YYYY-MM');
$$;

-- Owner, co-owner, or active member with can_write_articles (owners always true).
create or replace function public.user_can_write_articles(
  p_business_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_business_id is null then
    return false;
  end if;

  if exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = p_user_id
  ) then
    return true;
  end if;

  if exists (
    select 1 from public.business_owners bo
    where bo.business_id = p_business_id and bo.owner_user_id = p_user_id
  ) then
    return true;
  end if;

  return exists (
    select 1 from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = p_user_id
      and bm.status = 'active'
      and bm.role = 'owner'
  ) or exists (
    select 1 from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = p_user_id
      and bm.status = 'active'
      and bm.can_write_articles = true
  );
end;
$$;

create or replace function public.user_has_business_dashboard_access(
  p_business_id uuid,
  p_user_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_business_id is null then
    return false;
  end if;

  if exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = p_user_id
  ) then
    return true;
  end if;

  if exists (
    select 1 from public.business_owners bo
    where bo.business_id = p_business_id and bo.owner_user_id = p_user_id
  ) then
    return true;
  end if;

  return exists (
    select 1 from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = p_user_id
      and bm.status = 'active'
  );
end;
$$;

-- ── Team permission column ──────────────────────────────────────────────────

alter table public.business_members
  add column if not exists can_write_articles boolean not null default false;

-- Owners always retain write access via user_can_write_articles().

-- ── Bonus articles (mirrors bonus invites pattern) ──────────────────────────

create table if not exists public.business_article_bonus (
  business_id        uuid        primary key references public.businesses(id) on delete cascade,
  bonus_articles     integer     not null default 0 check (bonus_articles >= 0),
  bonus_expires_at   timestamptz,
  updated_at         timestamptz not null default now()
);

alter table public.business_article_bonus enable row level security;

-- No direct client access; admin RPCs use security definer.

-- ── articles ────────────────────────────────────────────────────────────────

create table if not exists public.articles (
  id                  uuid        primary key default gen_random_uuid(),
  business_id         uuid        not null references public.businesses(id) on delete cascade,
  author_user_id      uuid        not null references auth.users(id) on delete restrict,
  title               text        not null default '',
  slug                text        not null,
  excerpt             text,
  content             jsonb       not null default '{"type":"doc","content":[]}'::jsonb,
  content_type        text        not null default 'article'
                                  check (content_type in ('article', 'case_study')),
  featured_image_url  text,
  status              text        not null default 'draft'
                                  check (status in ('draft', 'pending_review', 'published', 'rejected')),
  client_industry     text,
  challenge           text,
  solution            text,
  results             text,
  published_at        timestamptz,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid        references auth.users(id) on delete set null,
  rejection_reason    text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (slug)
);

create index if not exists articles_public_list_idx
  on public.articles (status, published_at desc nulls last)
  where status = 'published';

create index if not exists articles_business_dashboard_idx
  on public.articles (business_id, status, updated_at desc);

create index if not exists articles_pending_review_idx
  on public.articles (submitted_at desc nulls last)
  where status = 'pending_review';

create index if not exists articles_business_id_idx
  on public.articles (business_id);

-- ── article_usage ───────────────────────────────────────────────────────────

create table if not exists public.article_usage (
  id             uuid        primary key default gen_random_uuid(),
  business_id    uuid        not null references public.businesses(id) on delete cascade,
  billing_month  text        not null,
  articles_used  integer     not null default 0 check (articles_used >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (business_id, billing_month)
);

create index if not exists article_usage_business_month_idx
  on public.article_usage (business_id, billing_month);

-- ── article_images ──────────────────────────────────────────────────────────

create table if not exists public.article_images (
  id           uuid        primary key default gen_random_uuid(),
  article_id   uuid        references public.articles(id) on delete set null,
  business_id  uuid        not null references public.businesses(id) on delete cascade,
  storage_path text        not null,
  public_url   text        not null,
  kind         text        not null default 'inline'
                           check (kind in ('featured', 'inline')),
  created_at   timestamptz not null default now()
);

create index if not exists article_images_business_idx
  on public.article_images (business_id, created_at desc);

create index if not exists article_images_article_idx
  on public.article_images (article_id);

-- ── Storage bucket: article_media ───────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('article_media', 'article_media', true)
on conflict (id) do nothing;

drop policy if exists "article_media_authenticated_insert" on storage.objects;
create policy "article_media_authenticated_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'article_media');

drop policy if exists "article_media_authenticated_update" on storage.objects;
create policy "article_media_authenticated_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'article_media');

drop policy if exists "article_media_authenticated_delete" on storage.objects;
create policy "article_media_authenticated_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'article_media');

drop policy if exists "article_media_public_select" on storage.objects;
create policy "article_media_public_select"
  on storage.objects for select
  using (bucket_id = 'article_media');

-- ── Plan + bonus limit helpers ──────────────────────────────────────────────

create or replace function public.normalize_plan_code_to_key(p_plan text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
begin
  v := lower(trim(coalesce(p_plan, '')));
  if v = '' then return 'free'; end if;
  if v like 'business_%' then v := substring(v from 10); end if;
  if position('_' in v) > 0 then v := split_part(v, '_', 1); end if;
  if v in ('free', 'grow', 'premium', 'elite') then return v; end if;
  return 'free';
end;
$$;

create or replace function public.plan_base_article_limit(p_plan_key text)
returns integer
language sql
immutable
as $$
  select case p_plan_key
    when 'grow' then 2
    when 'premium' then 10
    when 'elite' then 20
    else 0
  end;
$$;

create or replace function public.get_bonus_articles(p_business_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_bonus integer;
begin
  select coalesce(b.bonus_articles, 0) into v_bonus
  from public.business_article_bonus b
  where b.business_id = p_business_id
    and (b.bonus_expires_at is null or b.bonus_expires_at > now());

  return coalesce(v_bonus, 0);
end;
$$;

create or replace function public.get_monthly_article_limit(p_business_id uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan text := 'free';
  v_row record;
begin
  select s.plan_code into v_row
  from public.subscriptions s
  where s.business_id = p_business_id
    and s.status in ('active', 'trialing', 'past_due', 'pending')
  order by s.updated_at desc nulls last
  limit 1;

  if v_row.plan_code is not null then
    v_plan := public.normalize_plan_code_to_key(v_row.plan_code);
  end if;

  return public.plan_base_article_limit(v_plan) + public.get_bonus_articles(p_business_id);
end;
$$;

-- ── Admin bonus RPCs ────────────────────────────────────────────────────────

create or replace function public.admin_add_bonus_articles(
  p_business_id uuid,
  p_amount integer,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  insert into public.business_article_bonus (business_id, bonus_articles, updated_at)
  values (p_business_id, p_amount, now())
  on conflict (business_id) do update
    set bonus_articles = public.business_article_bonus.bonus_articles + excluded.bonus_articles,
        updated_at = now();
end;
$$;

create or replace function public.admin_reset_bonus_articles(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.business_article_bonus (business_id, bonus_articles, bonus_expires_at, updated_at)
  values (p_business_id, 0, null, now())
  on conflict (business_id) do update
    set bonus_articles = 0,
        bonus_expires_at = null,
        updated_at = now();
end;
$$;

create or replace function public.admin_remove_bonus_articles(
  p_business_id uuid,
  p_amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  insert into public.business_article_bonus (business_id, bonus_articles, updated_at)
  values (p_business_id, 0, now())
  on conflict (business_id) do update
    set bonus_articles = greatest(0, public.business_article_bonus.bonus_articles - p_amount),
        updated_at = now();
end;
$$;

-- ── Submit / return credit RPCs ─────────────────────────────────────────────

create or replace function public.submit_article_for_review(p_article_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_article public.articles%rowtype;
  v_user_id uuid;
  v_month text;
  v_used integer;
  v_limit integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_article
  from public.articles
  where id = p_article_id
  for update;

  if not found then
    raise exception 'Article not found';
  end if;

  if not public.user_can_write_articles(v_article.business_id, v_user_id) then
    raise exception 'Forbidden';
  end if;

  if v_article.status not in ('draft', 'rejected') then
    raise exception 'Article cannot be submitted in status %', v_article.status;
  end if;

  if trim(coalesce(v_article.title, '')) = '' then
    raise exception 'Title is required before submit';
  end if;

  v_month := public.utc_billing_month(now());
  v_limit := public.get_monthly_article_limit(v_article.business_id);

  if v_limit <= 0 then
    raise exception 'Article submissions require a Grow plan or higher';
  end if;

  insert into public.article_usage (business_id, billing_month, articles_used)
  values (v_article.business_id, v_month, 0)
  on conflict (business_id, billing_month) do nothing;

  select articles_used into v_used
  from public.article_usage
  where business_id = v_article.business_id
    and billing_month = v_month
  for update;

  if v_used >= v_limit then
    raise exception 'Monthly article limit reached';
  end if;

  update public.articles
  set status = 'pending_review',
      submitted_at = now(),
      updated_at = now(),
      rejection_reason = null,
      reviewed_at = null,
      reviewed_by = null
  where id = p_article_id;

  update public.article_usage
  set articles_used = articles_used + 1,
      updated_at = now()
  where business_id = v_article.business_id
    and billing_month = v_month;

  return json_build_object('ok', true, 'status', 'pending_review');
end;
$$;

create or replace function public.return_article_credit(p_business_id uuid, p_billing_month text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.article_usage
  set articles_used = greatest(0, articles_used - 1),
      updated_at = now()
  where business_id = p_business_id
    and billing_month = p_billing_month
    and articles_used > 0;
end;
$$;

-- ── updated_at trigger ──────────────────────────────────────────────────────

create or replace function public.articles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists articles_updated_at on public.articles;
create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.articles_set_updated_at();

drop trigger if exists article_usage_updated_at on public.article_usage;
create trigger article_usage_updated_at
  before update on public.article_usage
  for each row execute function public.articles_set_updated_at();

-- ── RLS: articles ───────────────────────────────────────────────────────────

alter table public.articles enable row level security;

drop policy if exists "articles_public_select" on public.articles;
create policy "articles_public_select"
  on public.articles for select
  using (
    status = 'published'
    and exists (
      select 1 from public.businesses b
      where b.id = articles.business_id
        and b.status = 'active'
    )
  );

drop policy if exists "articles_dashboard_select" on public.articles;
create policy "articles_dashboard_select"
  on public.articles for select to authenticated
  using (public.user_has_business_dashboard_access(business_id, auth.uid()));

drop policy if exists "articles_writer_insert" on public.articles;
create policy "articles_writer_insert"
  on public.articles for insert to authenticated
  with check (
    public.user_can_write_articles(business_id, auth.uid())
    and author_user_id = auth.uid()
    and status = 'draft'
  );

drop policy if exists "articles_writer_update" on public.articles;
create policy "articles_writer_update"
  on public.articles for update to authenticated
  using (
    public.user_can_write_articles(business_id, auth.uid())
    and status in ('draft', 'rejected')
  )
  with check (
    public.user_can_write_articles(business_id, auth.uid())
    and status in ('draft', 'rejected')
  );

drop policy if exists "articles_writer_delete" on public.articles;
create policy "articles_writer_delete"
  on public.articles for delete to authenticated
  using (
    public.user_can_write_articles(business_id, auth.uid())
    and status in ('draft', 'rejected')
  );

-- ── RLS: article_usage ────────────────────────────────────────────────────

alter table public.article_usage enable row level security;

drop policy if exists "article_usage_dashboard_select" on public.article_usage;
create policy "article_usage_dashboard_select"
  on public.article_usage for select to authenticated
  using (public.user_has_business_dashboard_access(business_id, auth.uid()));

-- ── RLS: article_images ───────────────────────────────────────────────────

alter table public.article_images enable row level security;

drop policy if exists "article_images_public_select" on public.article_images;
create policy "article_images_public_select"
  on public.article_images for select
  using (
    exists (
      select 1 from public.articles a
      join public.businesses b on b.id = a.business_id
      where a.id = article_images.article_id
        and a.status = 'published'
        and b.status = 'active'
    )
  );

drop policy if exists "article_images_dashboard_select" on public.article_images;
create policy "article_images_dashboard_select"
  on public.article_images for select to authenticated
  using (public.user_has_business_dashboard_access(business_id, auth.uid()));

drop policy if exists "article_images_writer_insert" on public.article_images;
create policy "article_images_writer_insert"
  on public.article_images for insert to authenticated
  with check (public.user_can_write_articles(business_id, auth.uid()));

drop policy if exists "article_images_writer_delete" on public.article_images;
create policy "article_images_writer_delete"
  on public.article_images for delete to authenticated
  using (public.user_can_write_articles(business_id, auth.uid()));

-- Grants for authenticated RPC callers
grant execute on function public.submit_article_for_review(uuid) to authenticated;
grant execute on function public.get_bonus_articles(uuid) to authenticated;
grant execute on function public.get_monthly_article_limit(uuid) to authenticated;
grant execute on function public.admin_add_bonus_articles(uuid, integer, text) to authenticated;
grant execute on function public.admin_reset_bonus_articles(uuid) to authenticated;
grant execute on function public.admin_remove_bonus_articles(uuid, integer) to authenticated;
grant execute on function public.return_article_credit(uuid, text) to service_role;
