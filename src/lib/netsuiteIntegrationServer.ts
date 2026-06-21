import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type NetsuiteIntegrationRow = {
  id: string;
  business_id: string;
  account_id: string;
  account_name: string | null;
  connected_at: string;
  updated_at: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function getNetsuiteIntegrationForBusiness(
  businessId: string,
): Promise<{ row: NetsuiteIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("netsuite_integrations")
      .select("id, business_id, account_id, account_name, connected_at, updated_at")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return { row: null, error: error.message };
    }
    if (!data) {
      return { row: null, error: null };
    }
    return { row: data as NetsuiteIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load NetSuite connection";
    return { row: null, error: message };
  }
}

export async function deleteNetsuiteIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db.from("netsuite_integrations").delete().eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect NetSuite";
    return { ok: false, error: message };
  }
}
