export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { expireAllPastDueSubscriptions } from "@/lib/subscriptionExpiry";
import { getServerEnv } from "@/lib/serverEnv";

function authorizeCron(req: Request): boolean {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  const cronSecret = process.env.CRON_SECRET?.trim();
  const systemSecret = process.env.SYSTEM_CHECKS_SECRET?.trim();
  return (
    (cronSecret != null && cronSecret !== "" && token === cronSecret) ||
    (systemSecret != null && systemSecret !== "" && token === systemSecret)
  );
}

/**
 * Hourly cron (see vercel.json): downgrade paid workspaces to free when
 * `current_period_end` has passed without a renewal payment.
 */
export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const result = await expireAllPastDueSubscriptions(supabase);

    if (result.errors.length) {
      console.warn("[billing/expire-subscriptions] partial errors:", result.errors);
    }

    return NextResponse.json({
      success: result.errors.length === 0,
      ...result,
    });
  } catch (e) {
    console.error("[billing/expire-subscriptions] unhandled:", e);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
