import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { sanitizeAuthNext } from "@/lib/sanitizeAuthNext";
import CallbackClient from "./CallbackClient";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildCallbackRedirectQuery(
  params: Record<string, string | string[] | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "code" || value == null) continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.set(key, value);
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/**
 * OAuth callback: Supabase redirects here with ?code= (PKCE) or hash (#access_token=...).
 * PKCE exchange runs on the server so the code verifier is read from auth cookies set
 * when signInWithOAuth started in the browser.
 */
export default async function AuthCallbackPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;

  if (code) {
    const supabase = await createSupabaseServerCookies();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("[auth/callback] server exchangeCodeForSession:", error.message);
      const next =
        typeof params.next === "string"
          ? sanitizeAuthNext(params.next, "/dashboard")
          : "/dashboard";
      redirect(
        `/auth/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`,
      );
    }
    redirect(`/auth/callback${buildCallbackRedirectQuery(params)}`);
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4F0] px-4">
          <p className="text-sm text-neutral-600">Loading…</p>
        </main>
      }
    >
      <CallbackClient />
    </Suspense>
  );
}
