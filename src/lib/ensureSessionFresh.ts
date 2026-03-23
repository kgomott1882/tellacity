"use client";

import { supabaseBrowser } from "@/lib/supabaseBrowser";

/**
 * Proactively refreshes the Supabase session when the access token is expired or near expiry.
 * Stale JWTs cause RLS to return empty rows and API routes to 401 — symptoms match "blank until relogin".
 */
export async function ensureSessionFresh(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const supabase = supabaseBrowser();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    const exp = session.expires_at;
    if (!exp) return;

    const now = Math.floor(Date.now() / 1000);
    const skewSec = 120; // refresh if within 2 minutes of expiry
    if (exp - now < skewSec) {
      const { error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn("[ensureSessionFresh] refreshSession:", error.message);
      }
    }
  } catch (e) {
    console.warn("[ensureSessionFresh]", e);
  }
}
