CREATE OR REPLACE FUNCTION public.admin_update_business_status(
new_status TEXT,
new_submission_status TEXT,
target_business_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
UPDATE businesses
SET
status = COALESCE(new_status, status),
submission_status = COALESCE(new_submission_status, submission_status)
WHERE id = target_business_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_business_status(TEXT, TEXT, UUID)
TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
