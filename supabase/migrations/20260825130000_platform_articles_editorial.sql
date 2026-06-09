-- Editorial fields + TipTap content for platform_articles (mirrors business articles editor).

alter table public.platform_articles
  add column if not exists content jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  add column if not exists content_type text not null default 'article'
    check (content_type in ('article', 'case_study')),
  add column if not exists client_industry text,
  add column if not exists challenge text,
  add column if not exists solution text,
  add column if not exists results text,
  add column if not exists author_name text,
  add column if not exists author_title text,
  add column if not exists author_bio text,
  add column if not exists author_avatar_url text,
  add column if not exists featured_image_alt text,
  add column if not exists featured_image_width integer,
  add column if not exists featured_image_height integer,
  add column if not exists key_takeaways jsonb,
  add column if not exists faq jsonb,
  add column if not exists tags text[],
  add column if not exists primary_keyword text,
  add column if not exists target_audience text,
  add column if not exists content_goal text;

comment on column public.platform_articles.content is
  'TipTap JSON document for the business-style article editor.';
comment on column public.platform_articles.body_html is
  'Rendered HTML for public pages; kept in sync when content is saved.';
