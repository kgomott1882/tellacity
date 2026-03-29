"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { getUserBusinesses } from "@/lib/getUserBusinesses";
import { normalizePlanCodeToKey } from "@/lib/plans";
import type { DashboardBusiness } from "../_context/BusinessContext";

function cleanDomain(url: string) {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim();
}

function mergePlans(
  base: Awaited<ReturnType<typeof getUserBusinesses>>,
  planByBiz: Map<string, string>
): DashboardBusiness[] {
  return base.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug ?? null,
    website: b.website ?? null,
    plan: normalizePlanCodeToKey(planByBiz.get(b.id) ?? null),
  }));
}

export function useBusinesses(userId: string | null, refreshKey = 0) {
  const [data, setData] = useState<DashboardBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function run() {
      if (!userId) {
        setData([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await ensureSessionFresh();

        let base = await getUserBusinesses(userId);
        if (!mounted) return;

        if (base.length === 0 && refreshKey > 0) {
          for (let attempt = 0; attempt < 6 && mounted; attempt++) {
            await new Promise((r) => setTimeout(r, 400));
            await ensureSessionFresh();
            base = await getUserBusinesses(userId);
            if (!mounted) return;
            if (base.length > 0) break;
          }
        }

        if (!mounted) return;

        if (base.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const mergedNoPlans = mergePlans(base, new Map());
        setData(mergedNoPlans);
        setLoading(false);

        const supabase = supabaseBrowser();
        const ids = base.map((b) => b.id);

        try {
          const subsRows = await Promise.race([
            supabase
              .from("subscriptions")
              .select("business_id, plan_code")
              .in("business_id", ids)
              .eq("status", "active")
              .then((r) => r.data ?? []),
            new Promise<never[]>((resolve) => setTimeout(() => resolve([]), 8000)),
          ]);

          if (!mounted) return;

          const planByBiz = new Map<string, string>();
          for (const row of subsRows) {
            const bid = row.business_id as string | undefined;
            if (bid && !planByBiz.has(bid)) {
              planByBiz.set(bid, String(row.plan_code ?? ""));
            }
          }
          setData(mergePlans(base, planByBiz));
        } catch {
          /* keep plan=null from mergedNoPlans */
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load businesses";
        if (mounted) setError(msg);
        if (mounted) setLoading(false);
      }
    }

    void run();

    return () => {
      mounted = false;
    };
  }, [userId, refreshKey]);

  const withDomain = data.map((b) => ({
    ...b,
    website: b.website,
    website_display: b.website ? cleanDomain(b.website) : "",
  }));

  return { businesses: data, businessesWithDomain: withDomain, loading, error };
}
