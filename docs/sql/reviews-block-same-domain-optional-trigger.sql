-- =============================================================================
-- OPTIONAL: DB-level enforcement when guest_email is set on reviews.
-- Primary enforcement lives in the Next.js API + edge function (reviewBusinessSelfReview).
-- Use this only if you also insert/update reviews outside the app with service role.
--
-- Does NOT evaluate auth-only reviews (user_id set, guest_email null).
-- =============================================================================

create or replace function public.reviews_guest_email_matches_business_org_domain(
  p_business_id uuid,
  p_guest_email text
) returns boolean
language plpgsql
stable
as $$
declare
  v_guest text := lower(trim(p_guest_email));
  v_host text;
  b_email text;
  b_website_display text;
  b_website text;
  v_site text;
  v_w text;
  v_contact_host text;
begin
  if v_guest is null or position('@' in v_guest) < 2 then
    return false;
  end if;

  v_host := lower(trim(split_part(v_guest, '@', 2)));
  if v_host is null or v_host = '' then
    return false;
  end if;

  select lower(trim(coalesce(x.email, ''))),
         lower(trim(coalesce(x.website_display, ''))),
         lower(trim(coalesce(x.website, '')))
    into b_email, b_website_display, b_website
    from public.businesses x
   where x.id = p_business_id;

  if not found then
    return false;
  end if;

  -- Exact match on public contact email
  if b_email is not null and b_email <> '' and v_guest = b_email then
    return true;
  end if;

  -- Normalize hosts like normalizeWebsiteDomain (first path segment, no scheme/www)
  v_site := regexp_replace(regexp_replace(split_part(coalesce(b_website_display, ''), '/', 1), '^https?://', '', 'gi'), '^www\.', '', 'i');
  v_w := regexp_replace(regexp_replace(split_part(coalesce(b_website, ''), '/', 1), '^https?://', '', 'gi'), '^www\.', '', 'i');

  if v_site is not null and v_site <> '' and (v_host = v_site or v_host like '%.' || v_site) then
    return true;
  end if;
  if v_w is not null and v_w <> '' and (v_host = v_w or v_host like '%.' || v_w) then
    return true;
  end if;

  -- Non-generic contact domain (same idea as app isGenericConsumerEmailDomain — abbreviated list)
  if b_email is not null and position('@' in b_email) > 1 then
    v_contact_host := lower(trim(split_part(b_email, '@', 2)));
    if v_contact_host is not null and v_contact_host <> ''
       and v_contact_host not in (
         'gmail.com','googlemail.com','yahoo.com','hotmail.com','outlook.com','live.com','msn.com',
         'icloud.com','me.com','mac.com','proton.me','protonmail.com','aol.com'
       )
       and (v_host = v_contact_host or v_host like '%.' || v_contact_host) then
      return true;
    end if;
  end if;

  return false;
end;
$$;

comment on function public.reviews_guest_email_matches_business_org_domain(uuid, text) is
  'Returns true if guest email is same as business contact or under business website/corporate email domain.';

-- Uncomment to enable:
-- create or replace function public.reviews_enforce_not_business_domain_before_write()
-- returns trigger
-- language plpgsql
-- as $$
-- begin
--   if new.guest_email is not null
--      and public.reviews_guest_email_matches_business_org_domain(new.business_id, new.guest_email) then
--     raise exception 'same_domain_as_business'
--       using errcode = '23514', message = 'Review blocked: business domain email';
--   end if;
--   return new;
-- end;
-- $$;
--
-- drop trigger if exists trg_reviews_block_business_domain on public.reviews;
-- create trigger trg_reviews_block_business_domain
--   before insert or update of guest_email on public.reviews
--   for each row
--   execute function public.reviews_enforce_not_business_domain_before_write();
