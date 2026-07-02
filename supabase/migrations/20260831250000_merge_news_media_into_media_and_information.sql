-- Merge category news-media (News & Media) into media-and-information (Media & Information).

update public.businesses
set
  tags = case
    when coalesce(tags, array[]::text[]) @> array['news-media']::text[] then tags
    else array_append(coalesce(tags, array[]::text[]), 'news-media')
  end,
  category_slug = 'media-and-information'
where category_slug = 'news-media';

update public.businesses b
set secondary_category_slugs = (
  select coalesce(array_agg(distinct replaced.slug order by replaced.slug), array[]::text[])
  from (
    select case
      when s = 'news-media' then 'media-and-information'
      else s
    end as slug
    from unnest(coalesce(b.secondary_category_slugs, array[]::text[])) as u(s)
  ) replaced
)
where b.secondary_category_slugs is not null
  and 'news-media' = any(b.secondary_category_slugs);

delete from public.categories
where slug = 'news-media';
