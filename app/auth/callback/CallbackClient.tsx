"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { sanitizeAuthNext } from "@/lib/sanitizeAuthNext";
import { handleRedirect } from "@/lib/postLoginRedirect";
import { WRITE_REVIEW_GOOGLE_MODE_SESSION_KEY } from "@/lib/writeReviewGoogleSession";
import {
  GOOGLE_REVIEW_ITEM_CONTEXT_KEY,
  WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY,
} from "@/lib/writeReviewItemGoogleSession";

/**
 * Post-auth client handler: reads session from cookies (set server-side for PKCE OAuth),
 * legacy hash tokens, or existing session; then redirects to the right destination.
 */
export default function CallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = useMemo(
    () => sanitizeAuthNext(searchParams.get("next"), "/dashboard"),
    [searchParams],
  );
  const nextRaw = useMemo(() => searchParams.get("next"), [searchParams]);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        if (hashParams.get("type") === "recovery") {
          const nextParam = searchParams.get("next");
          const sanitized = nextParam
            ? sanitizeAuthNext(nextParam, "/auth/reset-password")
            : "/auth/reset-password";
          const recoveryPath =
            sanitized === "/business/reset-password" ||
            sanitized.startsWith("/business/reset-password")
              ? "/business/reset-password"
              : "/auth/reset-password";
          router.replace(recoveryPath + window.location.hash);
          return;
        }
      }

      await new Promise((r) => setTimeout(r, 100));
      if (!isMounted) return;

      try {
        const { data } = await supabaseBrowser().auth.getSession();
        const user = data?.session?.user;

        if (!isMounted) return;
        if (user?.id) {
          if (
            typeof window !== "undefined" &&
            user.email &&
            user.email.trim()
          ) {
            window.localStorage.setItem("user_email", user.email.trim());
            window.localStorage.setItem("google_review_email", user.email.trim());
          }
          if (
            typeof window !== "undefined" &&
            window.sessionStorage.getItem(WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY) === "1"
          ) {
            window.sessionStorage.removeItem(WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY);
            let businessSlug = "";
            let photoId = "";
            try {
              const rawCtx = window.localStorage.getItem(GOOGLE_REVIEW_ITEM_CONTEXT_KEY);
              if (rawCtx) {
                const parsed = JSON.parse(rawCtx) as {
                  business_slug?: string;
                  photo_id?: string;
                  product_photo_id?: string;
                };
                businessSlug =
                  typeof parsed.business_slug === "string" ? parsed.business_slug.trim() : "";
                photoId =
                  typeof parsed.photo_id === "string" && parsed.photo_id.trim()
                    ? parsed.photo_id.trim()
                    : typeof parsed.product_photo_id === "string"
                      ? parsed.product_photo_id.trim()
                      : "";
              }
            } catch {
              // ignore malformed local context; fallback route still supports retry
            }
            const q = new URLSearchParams();
            q.set("google_continue", "1");
            if (businessSlug) q.set("businessSlug", businessSlug);
            if (photoId) q.set("photoId", photoId);
            window.location.href = `${window.location.origin}/write-review/item?${q.toString()}`;
            return;
          }
          if (
            typeof window !== "undefined" &&
            window.sessionStorage.getItem(WRITE_REVIEW_GOOGLE_MODE_SESSION_KEY) === "1"
          ) {
            window.location.href = `${window.location.origin}/write-review?google_continue=1`;
            return;
          }
          if (nextRaw && nextRaw.trim()) {
            const sanitized = sanitizeAuthNext(nextRaw, "/dashboard");
            window.location.href = `${window.location.origin}${sanitized}`;
            return;
          }
          await handleRedirect(user.id);
          return;
        }

        const loginPath = safeNext.startsWith("/business")
          ? "/business/login"
          : "/auth/login";
        router.replace(`${loginPath}?next=${encodeURIComponent(safeNext)}`);
        setStatus("done");
      } catch {
        if (isMounted) setStatus("error");
      }
    };

    run();
    return () => {
      isMounted = false;
    };
  }, [router, safeNext, nextRaw, searchParams]);

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
