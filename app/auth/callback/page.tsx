import { Suspense } from "react";
import CallbackClient from "./CallbackClient";

/**
 * OAuth callback landing page. PKCE `?code=` exchange runs in middleware so session
 * cookies are written on the redirect response. This page reads the session and
 * redirects to dashboard (or `next`). Hash-based recovery links are handled client-side.
 */
export default function AuthCallbackPage() {
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
