-- Editorial + SEO fields for business articles (articles + article_revisions).

alter table public.articles
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists featured_image_alt text,
  add column if not exists featured_image_width integer,
  add column if not exists featured_image_height integer,
  add column if not exists key_takeaways jsonb,
  add column if not exists faq jsonb,
  add column if not exists tags text[],
  add column if not exists primary_keyword text,
  add column if not exists target_audience text,
  add column if not exists content_goal text,
  add column if not exists author_bio text,
  add column if not exists author_avatar_url text;

alter table public.article_revisions
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists featured_image_alt text,
  add column if not exists featured_image_width integer,
  add column if not exists featured_image_height integer,
  add column if not exists key_takeaways jsonb,
  add column if not exists faq jsonb,
  add column if not exists tags text[],
  add column if not exists primary_keyword text,
  add column if not exists target_audience text,
  add column if not exists content_goal text,
  add column if not exists author_bio text,
  add column if not exists author_avatar_url text;

comment on column public.articles.key_takeaways is
  'JSON array of short plain-text summary bullets.';
comment on column public.articles.faq is
  'JSON array of {question, answer} plain-text objects.';
