-- OTP rows must store the auth email (NOT NULL) for auditing and constraints.

alter table public.business_domain_verifications
  add column if not exists email text;

update public.business_domain_verifications v
set email = lower(trim(u.email))
from auth.users u
where u.id = v.user_id
  and (v.email is null or btrim(v.email) = '');

delete from public.business_domain_verifications
where email is null or btrim(email) = '';

alter table public.business_domain_verifications
  alter column email set not null;

comment on column public.business_domain_verifications.email is
  'Work email from auth session at OTP send time; never null.';

notify pgrst, 'reload schema';
