DROP FUNCTION IF EXISTS public.admin_get_recent_activity(integer);
DROP FUNCTION IF EXISTS public.admin_get_recent_activity(int);

CREATE OR REPLACE FUNCTION public.admin_get_recent_activity(limit_count int DEFAULT 10)
RETURNS TABLE (
item_type text,
title text,
subtitle text,
email text,
name text,
created_at timestamp
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
RETURN QUERY

-- REVIEWS
SELECT
'review'::text,
COALESCE(r.title, 'Untitled review')::text,
COALESCE(b.name, '')::text,
COALESCE(p.email, u.email, r.author_email, r.guest_email, '')::text,
COALESCE(
p.display_name,
r.guest_name,
r.guest_email,
u.email,
'Guest'
)::text,
r.created_at::timestamp
FROM reviews r
LEFT JOIN businesses b ON r.business_id = b.id
LEFT JOIN auth.users u ON r.user_id = u.id
LEFT JOIN profiles p ON p.user_id = u.id

UNION ALL

-- USERS
SELECT
'user'::text,
'New user'::text,
''::text,
COALESCE(u.email, '')::text,
COALESCE(
p.display_name,
u.email,
'User'
)::text,
u.created_at::timestamp
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id

UNION ALL

-- BUSINESSES
SELECT
'business'::text,
COALESCE(b.name, '')::text,
''::text,
COALESCE(u.email, '')::text,
COALESCE(
p.display_name,
u.email,
'Business Owner'
)::text,
b.created_at::timestamp
FROM businesses b
LEFT JOIN auth.users u ON b.owner_id = u.id
LEFT JOIN profiles p ON p.user_id = u.id

ORDER BY created_at DESC
LIMIT limit_count;

END;
$$;
