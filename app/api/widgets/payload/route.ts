import { NextRequest, NextResponse } from "next/server";
import { createWidgetClient } from "@/lib/supabaseServerWidget";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const business = searchParams.get("business")?.trim();

  if (!business) {
    return NextResponse.json({ error: "business param is required" }, { status: 400 });
  }

  let limit = parseInt(searchParams.get("limit") ?? "5", 10);
  if (isNaN(limit) || limit < 1) limit = 1;
  if (limit > 20) limit = 20;

  const supabase = createWidgetClient();

  const { data: payload, error } = await supabase.rpc("get_widget_payload_v1", {
    p_business_slug: business,
    p_limit: limit,
  });

  if (error) {
    console.error("[widgets/payload] RPC error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!payload || (typeof payload === "object" && (payload as any).error === "Business not found")) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json(payload, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
