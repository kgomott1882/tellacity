# Fix "Bucket not found" for logo uploads

When you see **"Bucket not found"** or **400 Bad Request** on logo upload, the Storage bucket does not exist yet. Create it once:

## Steps (Supabase Dashboard)

1. Open **[Supabase Dashboard](https://supabase.com/dashboard)** → your project.
2. In the left sidebar click **Storage**.
3. Click **New bucket**.
4. Set:
   - **Name:** `business_logos` (exactly this; underscore, not hyphen)
   - **Public bucket:** **ON** (so the public profile page can show the logo)
   - (Optional) **File size limit:** 2 MB  
   - (Optional) **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`
5. Click **Create bucket**.

Then try uploading a logo again from **Dashboard → Profile page**.

## Policies (optional)

If uploads are still blocked, add policies in **SQL Editor** by running the policy section of  
`supabase/migrations/20260132_storage_business_logos_bucket.sql` (the four `create policy` blocks for `storage.objects`, and change `business-logos` to `business_logos` in those policies).
