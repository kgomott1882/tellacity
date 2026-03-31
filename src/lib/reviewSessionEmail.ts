import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";

/**
 * finalEmail = session?.user?.email ?? body.guest_email (normalized).
 * Used by create-draft, verify, and update routes.
 */
export async function resolveReviewGuestEmail(
  bodyGuestEmail: string,
): Promise<string> {
  const body = (bodyGuestEmail ?? "").trim().toLowerCase();
  try {
    const supabase = await createSupabaseServerCookies();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const sessionEmail = session?.user?.email?.trim().toLowerCase() ?? "";
    if (sessionEmail) return sessionEmail;
  } catch {
    // no session or SSR edge
  }
  return body;
}

export async function getReviewSessionEmail(): Promise<string> {
  try {
    const supabase = await createSupabaseServerCookies();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.user?.email?.trim().toLowerCase() ?? "";
  } catch {
    return "";
  }
}
