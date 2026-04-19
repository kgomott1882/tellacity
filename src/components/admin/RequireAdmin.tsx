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

/**
 * Plain result safe for {@link cache}; do not put a Supabase client here (Next/RSC can strip it).
 */
const verifyAdminSessionCached = cache(
  async (pathname: string): Promise<{ userId: string; email: string }> => {
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

    return { userId: user.id, email: user.email?.trim() || "" };
  }
);

/**
 * Ensures the visitor is signed in and has profiles.is_admin = true.
 * Redirects: unauthenticated → /auth/login, authenticated non-admin → /dashboard
 * Admin check is cached per request; always returns a fresh cookie-bound Supabase client.
 */
export async function requireAdminSession(pathname = "/admin"): Promise<AdminSession> {
  const { userId, email } = await verifyAdminSessionCached(pathname);
  const supabase = await createSupabaseServerCookies();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || user.id !== userId) {
    const next = encodeURIComponent(pathname);
    redirect(`/auth/login?next=${next}`);
  }

  return { supabase, user, email };
}

/**
 * Server wrapper that runs the same checks as {@link requireAdminSession}.
 */
export default async function RequireAdmin({ children }: { children: ReactNode }) {
  await requireAdminSession();
  return <>{children}</>;
}
