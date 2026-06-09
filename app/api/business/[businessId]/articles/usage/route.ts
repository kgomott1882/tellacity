export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { getArticleUsageForBusiness } from "@/lib/articles/usage";
import { getActivePlanKeyForBusiness, nextTierUpgradeCtaLabel } from "@/lib/plans";
import { UUID_RE, jsonError } from "../_shared";

type RouteParams = { params: Promise<{ businessId: string }> };

export async function GET(req: Request, ctx: RouteParams) {
  const { businessId } = await ctx.params;
  if (!UUID_RE.test(businessId)) return jsonError("Invalid business id");

  const access = await requireBusinessAccess(req, businessId);
  if (!access.ok) return access.response;

  const usage = await getArticleUsageForBusiness(businessId, access.db);
  const plan = await getActivePlanKeyForBusiness(businessId, access.db);

  return NextResponse.json({
    ...usage,
    plan,
    canSubmit: usage.limit > 0 && usage.remaining > 0,
    requiresPlanUpgrade: usage.limit <= 0,
    upgradeCta: nextTierUpgradeCtaLabel(plan),
  });
}
