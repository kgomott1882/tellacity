import type { ReactNode } from "react";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";

export type AdminSession = {
  supabase: SupabaseClient;
  user: User;
  email: string;
};

async function requireAdminSessionUncached(pathname = "/admin"): Promise<AdminSession> {
  const supabase = await createSupabaseServerCookies();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const next = encodeURIComponent(pathname);
    redirect(`/auth/login?next=${next}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.is_admin !== true) {
    redirect("/dashboard");
  }

  const email = user.email?.trim() || "";

  return { supabase, user, email };
}

/**
 * Ensures the visitor is signed in and has profiles.is_admin = true.
 * Redirects: unauthenticated → /auth/login, authenticated non-admin → /dashboard
 * Cached per request so layout + pages share one round trip.
 */
export const requireAdminSession = cache(requireAdminSessionUncached);

/**
 * Server wrapper that runs the same checks as {@link requireAdminSession}.
 */
export default async function RequireAdmin({ children }: { children: ReactNode }) {
  await requireAdminSession();
  return <>{children}</>;
}
