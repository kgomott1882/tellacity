import { NextResponse } from "next/server";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { getSalesforceIntegrationForBusiness } from "@/lib/salesforceIntegrationServer";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const businessId = searchParams.get("business_id")?.trim() ?? "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const { row, error } = await getSalesforceIntegrationForBusiness(businessId);
  if (error) {
    console.error("[Salesforce status]", error);
    return NextResponse.json({ error: "Could not load connection status." }, { status: 500 });
  }

  if (!row) {
    return NextResponse.json({ connected: false });
  }

  return NextResponse.json({
    connected: true,
    login_host: row.login_host,
    instance_url: row.instance_url,
    org_id: row.org_id,
    org_name: row.org_name,
    connected_at: row.connected_at,
    updated_at: row.updated_at,
  });
}
