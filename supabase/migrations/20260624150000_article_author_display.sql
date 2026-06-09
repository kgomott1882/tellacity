-- Optional display author fields for business articles + revision copy support.

alter table public.articles
  add column if not exists author_name text;

alter table public.articles
  add column if not exists author_title text;

alter table public.article_revisions
  add column if not exists author_name text;

alter table public.article_revisions
  add column if not exists author_title text;

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
    author_name,
    author_title,
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
    v_article.author_name,
    v_article.author_title,
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

grant execute on function public.begin_article_revision(uuid) to authenticated;
