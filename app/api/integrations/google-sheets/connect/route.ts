import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireBusinessAccess } from "@/lib/supabase/businessDashboardServer";
import { logBusinessActivity } from "@/lib/logBusinessActivity";
import { verifyGoogleSheetsConnection } from "@/lib/googleSheetsConnect";

export const runtime = "nodejs";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const businessId = typeof o.business_id === "string" ? o.business_id.trim() : "";
  const spreadsheetRaw =
    typeof o.spreadsheet_id === "string"
      ? o.spreadsheet_id.trim()
      : typeof o.spreadsheet_url === "string"
        ? o.spreadsheet_url.trim()
        : "";
  const serviceAccountJson =
    typeof o.service_account_json === "string" ? o.service_account_json.trim() : "";
  const worksheetName =
    typeof o.worksheet_name === "string" ? o.worksheet_name.trim() : "";

  if (!businessId || !UUID_REGEX.test(businessId)) {
    return NextResponse.json({ error: "Missing or invalid business_id" }, { status: 400 });
  }
  if (!spreadsheetRaw || !serviceAccountJson) {
    return NextResponse.json(
      { error: "spreadsheet_id (or URL) and service_account_json are required" },
      { status: 400 },
    );
  }

  const ctx = await requireBusinessAccess(request, businessId);
  if (!ctx.ok) return ctx.response;

  const verified = await verifyGoogleSheetsConnection(
    spreadsheetRaw,
    serviceAccountJson,
    worksheetName || null,
  );
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: upsertError } = await supabaseServer.from("google_sheets_integrations").upsert(
    {
      business_id: businessId,
      spreadsheet_id: verified.spreadsheet_id,
      spreadsheet_title: verified.spreadsheet_title,
      worksheet_name: verified.worksheet_name,
      service_account_email: verified.service_account_email,
      private_key: verified.private_key,
      connected_at: now,
      updated_at: now,
    },
    { onConflict: "business_id" },
  );

  if (upsertError) {
    console.error("[Google Sheets connect] Supabase error:", upsertError);
    return NextResponse.json(
      { error: "Failed to save connection. Run the latest database migration if this persists." },
      { status: 500 },
    );
  }

  void logBusinessActivity({
    businessId,
    userId: ctx.userId,
    action: "integration_connected",
    metadata: {
      provider: "google-sheets",
      spreadsheet_id: verified.spreadsheet_id,
      spreadsheet_title: verified.spreadsheet_title,
      worksheet_name: verified.worksheet_name,
    },
  });

  return NextResponse.json({
    ok: true,
    spreadsheet_id: verified.spreadsheet_id,
    spreadsheet_title: verified.spreadsheet_title,
    worksheet_name: verified.worksheet_name,
    service_account_email: verified.service_account_email,
  });
}
