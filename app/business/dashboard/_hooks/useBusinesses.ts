"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { getUserBusinesses, type UserBusinessRow } from "@/lib/getUserBusinesses";
import { getActivePlanKeysByBusinessIds, type PlanKey } from "@/lib/plans";
import type { DashboardBusiness } from "../_context/BusinessContext";

const SESSION_FRESH_MAX_MS = 4000;
const BUSINESSES_FETCH_MAX_MS = 25_000;
const SUBSCRIPTIONS_FETCH_MAX_MS = 6000;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(fallback);
      },
    );
  });
}

function cleanDomain(url: string) {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim();
}

function mergePlans(
  base: Awaited<ReturnType<typeof getUserBusinesses>>,
  planByBiz: Map<string, PlanKey>
): DashboardBusiness[] {
  return base.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug ?? null,
    website: b.website ?? null,
    plan: planByBiz.get(b.id) ?? "free",
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
        await withTimeout(ensureSessionFresh(), SESSION_FRESH_MAX_MS, undefined);

        let base: UserBusinessRow[] = await Promise.race([
          getUserBusinesses(userId),
          new Promise<UserBusinessRow[]>((_, reject) =>
            setTimeout(
              () => reject(new Error("Could not load businesses (timed out). Check your connection and try again.")),
              BUSINESSES_FETCH_MAX_MS,
            ),
          ),
        ]);
        if (!mounted) return;

        if (base.length === 0 && refreshKey > 0) {
          for (let attempt = 0; attempt < 5 && mounted; attempt++) {
            await new Promise((r) => setTimeout(r, 280));
            await withTimeout(ensureSessionFresh(), SESSION_FRESH_MAX_MS, undefined);
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
          const planByBiz = await withTimeout(
            getActivePlanKeysByBusinessIds(ids, supabase),
            SUBSCRIPTIONS_FETCH_MAX_MS,
            new Map<string, PlanKey>(),
          );

          if (!mounted) return;

          setData(mergePlans(base, planByBiz));
        } catch {
          /* keep plan=null from mergedNoPlans */
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Failed to load businesses";
        if (mounted) {
          setData([]);
          setError(msg);
          setLoading(false);
        }
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
