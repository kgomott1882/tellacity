export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserBusinesses } from "@/lib/getUserBusinesses";
import { getActivePlanKeysByBusinessIds } from "@/lib/plans";
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
      return NextResponse.json({ plansByBusinessId: {} });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const planByBiz = await getActivePlanKeysByBusinessIds(ids, admin);

    return NextResponse.json({
      plansByBusinessId: Object.fromEntries(
        ids.map((id) => [id, planByBiz.get(id) ?? "free"])
      ),
    });
  } catch (e) {
    console.error("[business/dashboard/plans] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
