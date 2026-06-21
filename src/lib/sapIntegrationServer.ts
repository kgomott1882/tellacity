import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type SapIntegrationRow = {
  id: string;
  business_id: string;
  api_base_url: string;
  token_url: string;
  system_name: string | null;
  connected_at: string;
  updated_at: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function getSapIntegrationForBusiness(
  businessId: string,
): Promise<{ row: SapIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("sap_integrations")
      .select("id, business_id, api_base_url, token_url, system_name, connected_at, updated_at")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return { row: null, error: error.message };
    }
    if (!data) {
      return { row: null, error: null };
    }
    return { row: data as SapIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load SAP connection";
    return { row: null, error: message };
  }
}

export async function deleteSapIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db.from("sap_integrations").delete().eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect SAP";
    return { ok: false, error: message };
  }
}
