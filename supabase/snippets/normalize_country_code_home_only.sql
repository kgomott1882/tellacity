-- Standalone for Supabase SQL Editor: ONLY public.normalize_country_code_home + grants.
-- Does not replace get_top_businesses_for_category_global, get_category_business_count,
-- or get_home_feed_for_country (avoids 42P13 if those already have a newer return type).
-- Source of truth for the function body: migrations/20260624130000_home_country_code_alias_normalization.sql

create or replace function public.normalize_country_code_home(p_code text)
returns text
language sql
immutable
as $$
  select case
    when p_code is null then null
    when length(trim(p_code)) = 0 then null
    when upper(trim(p_code)) in ('UK', 'GB', 'GBR', 'UNITED KINGDOM') then 'GB'
    when upper(trim(p_code)) in ('US', 'USA', 'U.S.', 'U.S.A', 'UNITED STATES', 'UNITED STATES OF AMERICA') then 'US'
    when upper(trim(p_code)) in ('CA', 'CAN', 'CANADA') then 'CA'
    when upper(trim(p_code)) in ('ZA', 'ZAF', 'SOUTH AFRICA') then 'ZA'
    when upper(trim(p_code)) in ('AU', 'AUS', 'AUSTRALIA') then 'AU'
    when upper(trim(p_code)) in ('NZ', 'NZL', 'NEW ZEALAND') then 'NZ'
    when upper(trim(p_code)) in ('IE', 'IRL', 'IRELAND') then 'IE'
    else upper(trim(p_code))
  end;
$$;

comment on function public.normalize_country_code_home(text) is
  'Homepage country normalization (UK/GB, US/USA, CA/CAN, ZA/ZAF, AU/AUS, NZ/NZL, IE/IRL).';

grant execute on function public.normalize_country_code_home(text) to anon;
grant execute on function public.normalize_country_code_home(text) to authenticated;
