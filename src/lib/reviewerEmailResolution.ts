import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Fetches canonical emails from `auth.users` (via Auth Admin API). Use when
 * `profiles.email` is missing but the reviewer signed in with Supabase Auth.
 */
export async function emailsFromAuthUsersByIds(
  admin: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean))];
  const out = new Map<string, string>();
  const chunkSize = 15;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (id) => {
        try {
          const { data, error } = await admin.auth.admin.getUserById(id);
          if (error || !data?.user?.email) return;
          const e = String(data.user.email).trim();
          if (e) out.set(id, e);
        } catch {
          // ignore per-id failures
        }
      }),
    );
  }
  return out;
}
