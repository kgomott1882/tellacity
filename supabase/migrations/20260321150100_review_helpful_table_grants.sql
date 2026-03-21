-- Defensive grants for helpful-vote tables (some projects lack default table grants).
-- Safe to run if migration 20260321150000_review_helpful_votes.sql already ran.

grant select, insert, update, delete on table public.review_helpful_votes to service_role;
grant select, insert, update, delete on table public.review_helpful_otps to service_role;
