-- Enforce uniqueness on canonical_slug (multiple NULLs still allowed).
-- Apply only after backfill: resolve any duplicate canonical_slug values first or this migration will fail.

create unique index idx_businesses_canonical_slug
  on public.businesses (canonical_slug)
  where canonical_slug is not null;

comment on index public.idx_businesses_canonical_slug is
  'Unique non-null canonical_slug for /b/[slug] lookups; run after generateCanonicalSlugs and duplicate cleanup.';
