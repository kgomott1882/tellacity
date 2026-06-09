-- Published-article edit workflow: revisions hold pending changes; live row stays public until admin approves.

-- ── articles: version tracking ─────────────────────────────────────────────

alter table public.articles
  add column if not exists current_version integer not null default 1 check (current_version >= 1);

alter table public.articles
  add column if not exists active_revision_id uuid;

-- ── article_revisions ───────────────────────────────────────────────────────

create table if not exists public.article_revisions (
  id                  uuid        primary key default gen_random_uuid(),
  article_id          uuid        not null references public.articles(id) on delete cascade,
  version_number      integer     not null check (version_number >= 1),
  title               text        not null default '',
  excerpt             text,
  content             jsonb       not null default '{"type":"doc","content":[]}'::jsonb,
  content_type        text        not null default 'article'
                                  check (content_type in ('article', 'case_study')),
  featured_image_url  text,
  client_industry     text,
  challenge           text,
  solution              text,
  results               text,
  status                text        not null default 'draft'
                                  check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  submitted_at          timestamptz,
  reviewed_at           timestamptz,
  reviewed_by           uuid        references auth.users(id) on delete set null,
  rejection_reason      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (article_id, version_number)
);

create index if not exists article_revisions_article_idx
  on public.article_revisions (article_id, updated_at desc);

create index if not exists article_revisions_pending_idx
  on public.article_revisions (submitted_at desc nulls last)
  where status = 'pending_review';

alter table public.articles
  drop constraint if exists articles_active_revision_id_fkey;

alter table public.articles
  add constraint articles_active_revision_id_fkey
  foreign key (active_revision_id) references public.article_revisions(id) on delete set null;

-- ── updated_at trigger ──────────────────────────────────────────────────────

drop trigger if exists article_revisions_updated_at on public.article_revisions;
create trigger article_revisions_updated_at
  before update on public.article_revisions
  for each row execute function public.articles_set_updated_at();

-- ── begin_article_revision ────────────────────────────────────────────────────

create or replace function public.begin_article_revision(p_article_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_article public.articles%rowtype;
  v_user_id uuid;
  v_revision public.article_revisions%rowtype;
  v_next_version integer;
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

  if v_article.status <> 'published' then
    raise exception 'Only published articles can start a revision';
  end if;

  if v_article.active_revision_id is not null then
    select * into v_revision
    from public.article_revisions
    where id = v_article.active_revision_id;

    if found then
      if v_revision.status = 'pending_review' then
        raise exception 'An update is already pending review';
      end if;

      if v_revision.status in ('draft', 'rejected') then
        return json_build_object(
          'ok', true,
          'revision_id', v_revision.id,
          'version_number', v_revision.version_number,
          'status', v_revision.status
        );
      end if;
    end if;
  end if;

  v_next_version := coalesce(v_article.current_version, 1) + 1;

  insert into public.article_revisions (
    article_id,
    version_number,
    title,
    excerpt,
    content,
    content_type,
    featured_image_url,
    client_industry,
    challenge,
    solution,
    results,
    status
  )
  values (
    v_article.id,
    v_next_version,
    v_article.title,
    v_article.excerpt,
    v_article.content,
    v_article.content_type,
    v_article.featured_image_url,
    v_article.client_industry,
    v_article.challenge,
    v_article.solution,
    v_article.results,
    'draft'
  )
  returning * into v_revision;

  update public.articles
  set active_revision_id = v_revision.id,
      updated_at = now()
  where id = p_article_id;

  return json_build_object(
    'ok', true,
    'revision_id', v_revision.id,
    'version_number', v_revision.version_number,
    'status', v_revision.status
  );
end;
$$;

-- ── submit_article_revision ───────────────────────────────────────────────────

create or replace function public.submit_article_revision(p_revision_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_revision public.article_revisions%rowtype;
  v_article public.articles%rowtype;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_revision
  from public.article_revisions
  where id = p_revision_id
  for update;

  if not found then
    raise exception 'Revision not found';
  end if;

  select * into v_article
  from public.articles
  where id = v_revision.article_id
  for update;

  if not found then
    raise exception 'Article not found';
  end if;

  if not public.user_can_write_articles(v_article.business_id, v_user_id) then
    raise exception 'Forbidden';
  end if;

  if v_article.status <> 'published' then
    raise exception 'Revision submit requires a published article';
  end if;

  if v_article.active_revision_id is distinct from v_revision.id then
    raise exception 'Revision is not active for this article';
  end if;

  if v_revision.status not in ('draft', 'rejected') then
    raise exception 'Revision cannot be submitted in status %', v_revision.status;
  end if;

  if trim(coalesce(v_revision.title, '')) = '' then
    raise exception 'Title is required before submit';
  end if;

  update public.article_revisions
  set status = 'pending_review',
      submitted_at = now(),
      updated_at = now(),
      rejection_reason = null,
      reviewed_at = null,
      reviewed_by = null
  where id = p_revision_id;

  return json_build_object('ok', true, 'status', 'pending_review');
end;
$$;

grant execute on function public.begin_article_revision(uuid) to authenticated;
grant execute on function public.submit_article_revision(uuid) to authenticated;

-- ── RLS: article_revisions ────────────────────────────────────────────────────

alter table public.article_revisions enable row level security;

drop policy if exists "article_revisions_dashboard_select" on public.article_revisions;
create policy "article_revisions_dashboard_select"
  on public.article_revisions for select to authenticated
  using (
    exists (
      select 1 from public.articles a
      where a.id = article_revisions.article_id
        and public.user_has_business_dashboard_access(a.business_id, auth.uid())
    )
  );

drop policy if exists "article_revisions_writer_update" on public.article_revisions;
create policy "article_revisions_writer_update"
  on public.article_revisions for update to authenticated
  using (
    exists (
      select 1 from public.articles a
      where a.id = article_revisions.article_id
        and a.status = 'published'
        and a.active_revision_id = article_revisions.id
        and public.user_can_write_articles(a.business_id, auth.uid())
    )
    and status in ('draft', 'rejected')
  )
  with check (
    exists (
      select 1 from public.articles a
      where a.id = article_revisions.article_id
        and a.status = 'published'
        and a.active_revision_id = article_revisions.id
        and public.user_can_write_articles(a.business_id, auth.uid())
    )
    and status in ('draft', 'rejected')
  );
