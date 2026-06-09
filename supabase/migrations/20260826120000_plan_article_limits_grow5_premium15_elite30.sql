-- Raise monthly blog & case study submission caps to match src/lib/plans.ts
-- (Grow 5, Premium 15, Elite 30). Safe to re-run.

create or replace function public.plan_base_article_limit(p_plan_key text)
returns integer
language sql
immutable
as $$
  select case p_plan_key
    when 'grow' then 5
    when 'premium' then 15
    when 'elite' then 30
    else 0
  end;
$$;
