import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type SalesforceIntegrationRow = {
  id: string;
  business_id: string;
  login_host: string;
  instance_url: string | null;
  org_id: string | null;
  org_name: string | null;
  connected_at: string;
  updated_at: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function getSalesforceIntegrationForBusiness(
  businessId: string,
): Promise<{ row: SalesforceIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("salesforce_integrations")
      .select(
        "id, business_id, login_host, instance_url, org_id, org_name, connected_at, updated_at",
      )
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return { row: null, error: error.message };
    }
    if (!data) {
      return { row: null, error: null };
    }
    return { row: data as SalesforceIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Salesforce connection";
    return { row: null, error: message };
  }
}

export async function deleteSalesforceIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db
      .from("salesforce_integrations")
      .delete()
      .eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect Salesforce";
    return { ok: false, error: message };
  }
}
