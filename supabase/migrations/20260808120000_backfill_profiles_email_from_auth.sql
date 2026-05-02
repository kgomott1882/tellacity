-- Optional data hygiene: when `profiles.email` is empty but the user exists in
-- `auth.users`, copy the canonical auth email. Improves joins and reduces reliance
-- on Auth Admin for display. Safe to re-run; only updates empty/missing profile emails.

update public.profiles p
set email = u.email::text
from auth.users u
where p.id = u.id
  and u.email is not null
  and btrim(u.email) <> ''
  and (p.email is null or btrim(p.email::text) = '');
