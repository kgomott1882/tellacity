-- Optional label for invite OTP rows (create-draft uses purpose = 'review').
alter table public.consumer_otps add column if not exists purpose text;
