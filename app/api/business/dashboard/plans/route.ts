export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserBusinesses } from "@/lib/getUserBusinesses";
import { getBusinessIdsOwnedByUser } from "@/lib/businessOwnership";
import { getDashboardPlanContextByBusinessIds } from "@/lib/plans";
import { getReverseTrialEligibility } from "@/lib/provisionReverseTrial";
import { getServerEnv } from "@/lib/serverEnv";
import { requireUserSession } from "@/lib/supabase/businessDashboardServer";

/**
 * Server-side plan lookup for the business dashboard.
 * Avoids browser reads against `subscriptions`, which are protected by RLS.
 */
export async function GET(req: Request) {
  try {
    const session = await requireUserSession(req);
    if (!session.ok) return session.response;

    const businesses = await getUserBusinesses(session.userId, session.db);
    const ids = businesses
      .map((business) => business.id?.trim())
      .filter((value): value is string => Boolean(value));

    if (ids.length === 0) {
      return NextResponse.json({
        plansByBusinessId: {},
        trialEligibleByBusinessId: {},
        subscriptionStatusByBusinessId: {},
        trialEndsAtByBusinessId: {},
      });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const planContextByBiz = await getDashboardPlanContextByBusinessIds(ids, admin);

    let ownedBusinessIds: Set<string>;
    try {
      ownedBusinessIds = await getBusinessIdsOwnedByUser(admin, session.userId, ids);
    } catch (ownerErr) {
      console.error("[business/dashboard/plans] owner lookup:", ownerErr);
      return NextResponse.json({ error: "Server error." }, { status: 500 });
    }

    const trialEligibleEntries = await Promise.all(
      ids.map(async (id) => {
        if (!ownedBusinessIds.has(id)) {
          return [id, false] as const;
        }
        const eligibility = await getReverseTrialEligibility(id, admin);
        return [id, eligibility.eligible] as const;
      }),
    );

    return NextResponse.json({
      plansByBusinessId: Object.fromEntries(
        ids.map((id) => [id, planContextByBiz.get(id)?.plan ?? "free"]),
      ),
      trialEligibleByBusinessId: Object.fromEntries(trialEligibleEntries),
      subscriptionStatusByBusinessId: Object.fromEntries(
        ids.map((id) => [id, planContextByBiz.get(id)?.subscriptionStatus ?? null]),
      ),
      trialEndsAtByBusinessId: Object.fromEntries(
        ids.map((id) => [id, planContextByBiz.get(id)?.trialEndsAt ?? null]),
      ),
    });
  } catch (e) {
    console.error("[business/dashboard/plans] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
