-- Built-in section slug `services`: default display title is now "Other" (not "Services").
-- URL path segment remains /services; only `title` changes for rows still on the old label.
update public.business_photo_sections
set title = 'Other'
where slug = 'services'
  and is_builtin = true
  and title = 'Services';
