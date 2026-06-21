import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type SlackIntegrationRow = {
  id: string;
  business_id: string;
  workspace_id: string | null;
  workspace_name: string | null;
  default_channel_id: string | null;
  default_channel_name: string | null;
  connected_at: string;
  updated_at: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function getSlackIntegrationForBusiness(
  businessId: string,
): Promise<{ row: SlackIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("slack_integrations")
      .select(
        "id, business_id, workspace_id, workspace_name, default_channel_id, default_channel_name, connected_at, updated_at",
      )
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return { row: null, error: error.message };
    }
    if (!data) {
      return { row: null, error: null };
    }
    return { row: data as SlackIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Slack connection";
    return { row: null, error: message };
  }
}

export async function deleteSlackIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db.from("slack_integrations").delete().eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect Slack";
    return { ok: false, error: message };
  }
}
