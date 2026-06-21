import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { connectedProviderSlugsForBusiness } from "@/lib/integrationsConnectedServer";

/**
 * Connected integration slugs for the dashboard.
 * Uses the same per-provider helpers as each /api/integrations/{slug}/status route.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await context.params;
    const ctx = await requireBusinessAccess(req, businessId);
    if (!ctx.ok) return ctx.response;

    const { providers, error } = await connectedProviderSlugsForBusiness(businessId);

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
