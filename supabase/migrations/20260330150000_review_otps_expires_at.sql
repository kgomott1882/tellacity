-- OTP expiry for invite review verification (verify route checks expires_at).
alter table public.review_otps add column if not exists expires_at timestamptz;

update public.review_otps
set expires_at = created_at + interval '10 minutes'
where expires_at is null;

alter table public.review_otps alter column expires_at set default (now() + interval '10 minutes');

alter table public.review_otps alter column expires_at set not null;
