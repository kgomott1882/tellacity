import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type GoogleSheetsIntegrationRow = {
  id: string;
  business_id: string;
  spreadsheet_id: string;
  spreadsheet_title: string | null;
  worksheet_name: string | null;
  service_account_email: string;
  connected_at: string;
  updated_at: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function getGoogleSheetsIntegrationForBusiness(
  businessId: string,
): Promise<{ row: GoogleSheetsIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("google_sheets_integrations")
      .select(
        "id, business_id, spreadsheet_id, spreadsheet_title, worksheet_name, service_account_email, connected_at, updated_at",
      )
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return { row: null, error: error.message };
    }
    if (!data) {
      return { row: null, error: null };
    }
    return { row: data as GoogleSheetsIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Google Sheets connection";
    return { row: null, error: message };
  }
}

export async function deleteGoogleSheetsIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db
      .from("google_sheets_integrations")
      .delete()
      .eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect Google Sheets";
    return { ok: false, error: message };
  }
}
