-- Privacy: default display name; never expose empty guest_name publicly
alter table public.reviews
  alter column guest_name set default 'Anonymous';

update public.reviews
set guest_name = 'Anonymous'
where guest_name is null or trim(guest_name) = '';
