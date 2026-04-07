"use client";

/**
 * Fire-and-forget client log to `/api/business/activity-log` (cookie session).
 * Never throws; safe to call from UI handlers.
 */
export function logDashboardActivityClient(params: {
  businessId: string;
  action: string;
  metadata?: Record<string, unknown>;
}): void {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(params);

  const run = async () => {
    try {
      let res = await fetch("/api/business/activity-log", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (res.status === 401) {
        const { supabaseBrowser } = await import("@/lib/supabaseBrowser");
        const { data } = await supabaseBrowser().auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
          res = await fetch("/api/business/activity-log", {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body,
          });
        }
      }
      await res.json().catch(() => ({}));
    } catch {
      /* ignore */
    }
  };

  void run();
}
