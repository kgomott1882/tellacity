-- Profile page: ensure businesses has email, phone, postcode, website_display, logo_url
alter table public.businesses add column if not exists email text;
alter table public.businesses add column if not exists phone text;
alter table public.businesses add column if not exists postcode text;
alter table public.businesses add column if not exists website_display text;
alter table public.businesses add column if not exists logo_url text;

comment on column public.businesses.email is 'Public contact email for the business profile';
comment on column public.businesses.phone is 'Public contact phone for the business profile';
comment on column public.businesses.postcode is 'Postcode / ZIP for the business address';
comment on column public.businesses.website_display is 'Display URL (e.g. domain only) for the business website';
comment on column public.businesses.logo_url is 'URL of the business logo (e.g. Supabase Storage or external)';
