-- Location profile content (headline, description) and review router (reviews tied to location)
alter table public.business_locations
  add column if not exists headline text,
  add column if not exists description text;

comment on column public.business_locations.headline is 'Optional headline for location profile (match main profile or customize)';
comment on column public.business_locations.description is 'Optional description for location profile';

-- Review router: tie reviews to a specific location (optional; null = business-level)
alter table public.reviews
  add column if not exists location_id uuid references public.business_locations (id) on delete set null;

create index if not exists reviews_location_id_idx on public.reviews (location_id);
comment on column public.reviews.location_id is 'Optional: specific location this review refers to; null = business-level';
