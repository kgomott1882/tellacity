import AdminBlockedEmailsClient from "@/components/admin/AdminBlockedEmailsClient";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { listBlockedEmails } from "@/lib/blockedEmails";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export const dynamic = "force-dynamic";

export default async function AdminBlockedEmailsPage() {
  await requireAdminSession("/admin/blocked-emails");

  let rows: Awaited<ReturnType<typeof listBlockedEmails>>["rows"] = [];
  let listError: string | null = null;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const listed = await listBlockedEmails(admin);
    rows = listed.rows;
    listError = listed.error;
  } catch (e) {
    listError = e instanceof Error ? e.message : "Could not load blocked emails.";
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Blocked emails</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Permanently stop abusers from writing reviews or creating/claiming businesses. Blocking is
          by email only (unique) and deletes matching published content immediately.
        </p>
      </div>
      {listError ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {listError}
        </div>
      ) : null}
      <AdminBlockedEmailsClient initialRows={rows} />
    </div>
  );
}
