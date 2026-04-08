-- Optional: allow direct SELECT on metrics view for anon/authenticated (e.g. future client reads).
-- Homepage batch metrics API uses service role; this grant helps tooling and keeps policy explicit.

grant select on public.business_review_metrics_v to anon, authenticated;
