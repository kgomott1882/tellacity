-- Optional safety: inserts that omit `provider` still satisfy NOT NULL.
alter table public.subscriptions
  alter column provider set default 'tellacity';
