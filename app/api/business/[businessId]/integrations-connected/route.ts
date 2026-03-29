import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { getServerEnv } from "@/lib/serverEnv";

/**
 * Connected integration slugs for the dashboard.
 * Uses shopify_integrations (and future tables) — not business_integrations_v1, which often
 * lacks GRANTs for authenticated in Supabase and caused "permission denied for view".
 */
async function connectedProviderSlugsForBusiness(
  businessId: string,
  userScopedDb: SupabaseClient
): Promise<{ providers: string[]; error: Error | null }> {
  const providers: string[] = [];

  let db: SupabaseClient = userScopedDb;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    db = createClient(supabaseUrl, serviceRoleKey);
  } catch {
    /* local / missing key: keep user-scoped client */
  }

  const { data, error } = await db
    .from("shopify_integrations")
    .select("shop_domain")
    .eq("business_id", businessId)
    .limit(1);

  if (error) {
    return { providers: [], error: new Error(error.message) };
  }
  if (data?.length) {
    providers.push("shopify");
  }

  return { providers, error: null };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const { providers, error } = await connectedProviderSlugsForBusiness(
      businessId,
      ctx.db
    );

    if (error) {
      console.error("[integrations-connected]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { providers },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[integrations-connected]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
