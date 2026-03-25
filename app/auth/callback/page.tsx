"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { sanitizeAuthNext } from "@/lib/sanitizeAuthNext";
import { handleRedirect } from "@/lib/postLoginRedirect";

/**
 * OAuth callback: Supabase redirects here with hash (#access_token=...).
 * This page lets the client establish the session, then redirects to `next` or dashboard.
 * Exception: password recovery (type=recovery in hash) is sent to /auth/reset-password so the user can set a new password instead of being auto-signed in.
 */
function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = useMemo(
    () => sanitizeAuthNext(searchParams.get("next"), "/dashboard"),
    [searchParams]
  );
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      // Password recovery: do not treat as login – send to reset-password page with hash so user can set new password
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        if (hashParams.get("type") === "recovery") {
          router.replace("/auth/reset-password" + window.location.hash);
          return;
        }
      }
      // Give Supabase a moment to read the URL hash and set the session
      await new Promise((r) => setTimeout(r, 100));
      if (!isMounted) return;

      try {
        const { data } = await supabaseBrowser().auth.getSession();
        const user = data?.session?.user;

        if (!isMounted) return;
        if (user?.id) {
          await handleRedirect(user.id);
          return;
        } else {
          // No session (e.g. user closed OAuth) – send to login with return url
          const loginPath = safeNext.startsWith("/business")
            ? "/business/login"
            : "/auth/login";
          router.replace(`${loginPath}?next=${encodeURIComponent(safeNext)}`);
        }
        setStatus("done");
      } catch {
        if (isMounted) setStatus("error");
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [router, safeNext]);

  if (status === "error") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4F0] px-4">
        <p className="text-sm text-red-600">Something went wrong signing you in.</p>
        <Link
          href={`/auth/login?next=${encodeURIComponent(safeNext)}`}
          className="mt-4 text-sm font-medium text-[#1FAF9E] hover:underline"
        >
          Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4F0] px-4">
      <p className="text-sm text-neutral-600">Signing you in…</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-[#F8F4F0] px-4">
          <p className="text-sm text-neutral-600">Loading…</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
