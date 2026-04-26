-- Clean invalid businesses.category_slug values: map known legacy slugs to valid
-- categories.slug, preserve originals in tags (text[]), fallback remaining invalid
-- rows to administration-and-services, then enforce FK to categories(slug).
--
-- Prerequisite: target slugs must already exist in public.categories (no new
-- categories are created by this migration).

-- ---------------------------------------------------------------------------
-- Step 1 — Ensure tags column exists as text[] (compatible with to_jsonb(tags) in RPCs)
-- ---------------------------------------------------------------------------
do $tags_setup$
declare
  tags_udt text;
begin
  select c.udt_name
    into tags_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'businesses'
    and c.column_name = 'tags';

  if tags_udt is null then
    alter table public.businesses add column tags text[];
  elsif tags_udt = 'jsonb' then
    alter table public.businesses
      alter column tags type text[] using (
        case
          when tags is null then null::text[]
          when jsonb_typeof(tags) = 'array' then
            coalesce(
              array(select jsonb_array_elements_text(tags)),
              array[]::text[]
            )
          else array[trim(tags::text)]
        end
      );
  end if;
end;
$tags_setup$;

-- ---------------------------------------------------------------------------
-- Step 2 — IT mapping
-- ---------------------------------------------------------------------------
update public.businesses
set
  tags = array_append(coalesce(tags, array[]::text[]), category_slug),
  category_slug = 'it-and-communication'
where category_slug in (
  'it-services',
  'web-designer',
  'website-designer',
  'software-company',
  'cloud-computing-service',
  'it-security-service',
  'computer-repair-service',
  'web-hosting-company'
);

-- ---------------------------------------------------------------------------
-- Step 3 — MARKETING mapping
-- ---------------------------------------------------------------------------
update public.businesses
set
  tags = array_append(coalesce(tags, array[]::text[]), category_slug),
  category_slug = 'sales-and-marketing'
where category_slug in (
  'marketing-agency',
  'seo-service',
  'advertising-agency',
  'online-marketing-agency',
  'media-and-marketing-agency'
);

-- ---------------------------------------------------------------------------
-- Step 4 — LOGISTICS mapping
-- ---------------------------------------------------------------------------
update public.businesses
set
  tags = array_append(coalesce(tags, array[]::text[]), category_slug),
  category_slug = 'shipping-and-logistics'
where category_slug in (
  'courier-service',
  'delivery-service',
  'logistics-service',
  'shipping-company',
  'freight-forwarding-service',
  'removals-company'
);

-- ---------------------------------------------------------------------------
-- Step 5 — HOME SERVICES mapping
-- ---------------------------------------------------------------------------
update public.businesses
set
  tags = array_append(coalesce(tags, array[]::text[]), category_slug),
  category_slug = 'home-services'
where category_slug in (
  'plumber',
  'electrician',
  'roofing-service',
  'heating-service',
  'gas-engineer'
);

-- ---------------------------------------------------------------------------
-- Step 6 — BUILDING MATERIALS mapping
-- ---------------------------------------------------------------------------
update public.businesses
set
  tags = array_append(coalesce(tags, array[]::text[]), category_slug),
  category_slug = 'building-materials'
where category_slug in (
  'timber-merchant',
  'window-supplier',
  'door-supplier',
  'stone-supplier'
);

-- ---------------------------------------------------------------------------
-- Step 7 — FALLBACK: any primary slug not present in categories
-- ---------------------------------------------------------------------------
update public.businesses b
set
  tags = array_append(coalesce(b.tags, array[]::text[]), b.category_slug),
  category_slug = 'administration-and-services'
where b.category_slug is not null
  and not exists (
    select 1
    from public.categories c
    where c.slug = b.category_slug
  );

-- ---------------------------------------------------------------------------
-- Step 8 — Foreign key (idempotent)
-- ---------------------------------------------------------------------------
alter table public.businesses
  drop constraint if exists fk_category_slug;

alter table public.businesses
  add constraint fk_category_slug
  foreign key (category_slug)
  references public.categories (slug);
