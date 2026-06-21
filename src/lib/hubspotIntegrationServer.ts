import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type HubSpotIntegrationRow = {
  id: string;
  business_id: string;
  portal_id: string | null;
  account_type: string | null;
  connected_at: string;
  updated_at: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function getHubSpotIntegrationForBusiness(
  businessId: string,
): Promise<{ row: HubSpotIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("hubspot_integrations")
      .select("id, business_id, portal_id, account_type, connected_at, updated_at")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return { row: null, error: error.message };
    }
    if (!data) {
      return { row: null, error: null };
    }
    return { row: data as HubSpotIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load HubSpot connection";
    return { row: null, error: message };
  }
}

export async function deleteHubSpotIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db.from("hubspot_integrations").delete().eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect HubSpot";
    return { ok: false, error: message };
  }
}
