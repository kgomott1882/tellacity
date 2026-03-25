"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { normalizePlanCodeToKey } from "@/lib/plans";
import type { DashboardBusiness } from "../_context/BusinessContext";

function cleanDomain(url: string) {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split("/")[0]
    .trim();
}

export function useBusinesses(userId: string | null) {
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

        // 1) Try direct ownership first (owner_id on businesses)
        const supabase = supabaseBrowser();
        const { data: owned, error: ownedErr } = await supabase
          .from("businesses")
          .select("id, name, slug, website")
          .eq("owner_id", userId)
          .order("name", { ascending: true });

        if (!ownedErr && owned && owned.length > 0) {
          const ids = owned.map((b) => b.id);
          const { data: subsRows } = await supabase
            .from("subscriptions")
            .select("business_id, plan_code")
            .in("business_id", ids)
            .eq("status", "active");

          const planByBiz = new Map<string, string>();
          for (const row of subsRows ?? []) {
            const bid = row.business_id as string | undefined;
            if (bid && !planByBiz.has(bid)) {
              planByBiz.set(bid, String(row.plan_code ?? ""));
            }
          }

          const merged: DashboardBusiness[] = owned.map((b) => ({
            ...b,
            plan: normalizePlanCodeToKey(planByBiz.get(b.id) ?? null),
          }));

          if (mounted) {
            setData(merged);
            setLoading(false);
          }
          return;
        }
        // If owner_id column doesn't exist (PGRST204), fall through to business_owners
        if (ownedErr && (ownedErr as { code?: string }).code !== "PGRST204") {
          throw ownedErr;
        }

        // 2) Fallback: business_owners join (if table exists)
        try {
          const { data: links, error: linksErr } = await supabase
            .from("business_owners")
            .select("business_id")
            .eq("owner_user_id", userId);

          // If table doesn't exist, skip this fallback
          if (linksErr && linksErr.code === "PGRST205") {
            if (mounted) {
              setData([]);
              setLoading(false);
            }
            return;
          }

          if (linksErr) throw linksErr;

          const ids = (links || []).map((x: any) => x.business_id).filter(Boolean);

          if (!ids.length) {
            if (mounted) {
              setData([]);
              setLoading(false);
            }
            return;
          }

          const { data: joined, error: joinedErr } = await supabase
            .from("businesses")
            .select("id, name, slug, website")
            .in("id", ids)
            .order("name", { ascending: true });

          if (joinedErr) throw joinedErr;

          const j = joined ?? [];
          const jids = j.map((b) => b.id);
          const { data: subsRows } = await supabase
            .from("subscriptions")
            .select("business_id, plan_code")
            .in("business_id", jids)
            .eq("status", "active");

          const planByBiz = new Map<string, string>();
          for (const row of subsRows ?? []) {
            const bid = row.business_id as string | undefined;
            if (bid && !planByBiz.has(bid)) {
              planByBiz.set(bid, String(row.plan_code ?? ""));
            }
          }

          const merged: DashboardBusiness[] = j.map((b) => ({
            ...b,
            plan: normalizePlanCodeToKey(planByBiz.get(b.id) ?? null),
          }));

          if (mounted) setData(merged);
        } catch (fallbackErr: any) {
          // If business_owners table doesn't exist, just return empty array
          if (fallbackErr?.code === "PGRST205" || fallbackErr?.message?.includes("business_owners")) {
            if (mounted) {
              setData([]);
              setLoading(false);
            }
            return;
          }
          throw fallbackErr;
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to load businesses");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    run();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const withDomain = data.map((b) => ({
    ...b,
    website: b.website,
    website_display: b.website ? cleanDomain(b.website) : "",
  }));

  return { businesses: data, businessesWithDomain: withDomain, loading, error };
}
