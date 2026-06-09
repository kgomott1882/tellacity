-- Article archiving: extend status lifecycle, preserve history, RPC archive/restore.

-- ── Extend status enum via check constraint ─────────────────────────────────

alter table public.articles
  drop constraint if exists articles_status_check;

alter table public.articles
  add constraint articles_status_check
  check (status in ('draft', 'pending_review', 'published', 'rejected', 'archived'));

alter table public.articles
  add column if not exists archived_at timestamptz,
  add column if not exists status_before_archive text;

create index if not exists articles_archived_business_idx
  on public.articles (business_id, archived_at desc nulls last)
  where status = 'archived';

comment on column public.articles.archived_at is
  'When the business archived this article (removed from public view).';
comment on column public.articles.status_before_archive is
  'Status to restore to when un-archiving (typically published).';

-- ── archive_article ─────────────────────────────────────────────────────────

create or replace function public.archive_article(p_article_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_article public.articles%rowtype;
  v_user_id uuid;
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
    raise exception 'Only published articles can be archived';
  end if;

  update public.articles
  set status = 'archived',
      status_before_archive = v_article.status,
      archived_at = now(),
      updated_at = now()
  where id = p_article_id;

  return json_build_object(
    'ok', true,
    'status', 'archived',
    'archived_at', now()
  );
end;
$$;

-- ── restore_article ─────────────────────────────────────────────────────────

create or replace function public.restore_article(p_article_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_article public.articles%rowtype;
  v_user_id uuid;
  v_restore_status text;
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

  if v_article.status <> 'archived' then
    raise exception 'Only archived articles can be restored';
  end if;

  v_restore_status := coalesce(nullif(trim(v_article.status_before_archive), ''), 'published');

  if v_restore_status not in ('draft', 'pending_review', 'published', 'rejected') then
    v_restore_status := 'published';
  end if;

  update public.articles
  set status = v_restore_status,
      archived_at = null,
      status_before_archive = null,
      updated_at = now()
  where id = p_article_id;

  return json_build_object(
    'ok', true,
    'status', v_restore_status
  );
end;
$$;

grant execute on function public.archive_article(uuid) to authenticated;
grant execute on function public.restore_article(uuid) to authenticated;
