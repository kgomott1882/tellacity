-- Plan-based subscription for invite limits (free, grow, premium, elite).
-- Dashboard reads business.plan and uses it to show monthly invite limit.
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free';

COMMENT ON COLUMN public.businesses.plan IS 'Subscription plan key: free, grow, premium, elite. Used for invite limits and feature access.';
