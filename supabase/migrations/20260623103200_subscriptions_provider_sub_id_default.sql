-- Default when inserts omit provider_sub_id (NOT NULL column).
-- New UUID each row avoids accidental duplicates if the app forgets the field.
alter table public.subscriptions
  alter column provider_sub_id set default ('tellacity:' || gen_random_uuid()::text);
