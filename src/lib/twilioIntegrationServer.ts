import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type TwilioIntegrationRow = {
  id: string;
  business_id: string;
  account_sid: string;
  account_friendly_name: string | null;
  from_phone_number: string | null;
  messaging_service_sid: string | null;
  connected_at: string;
  updated_at: string;
};

function serviceDb(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function getTwilioIntegrationForBusiness(
  businessId: string,
): Promise<{ row: TwilioIntegrationRow | null; error: string | null }> {
  try {
    const db = serviceDb();
    const { data, error } = await db
      .from("twilio_integrations")
      .select(
        "id, business_id, account_sid, account_friendly_name, from_phone_number, messaging_service_sid, connected_at, updated_at",
      )
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return { row: null, error: error.message };
    }
    if (!data) {
      return { row: null, error: null };
    }
    return { row: data as TwilioIntegrationRow, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load Twilio connection";
    return { row: null, error: message };
  }
}

export async function deleteTwilioIntegrationForBusiness(
  businessId: string,
): Promise<{ ok: boolean; error: string | null }> {
  try {
    const db = serviceDb();
    const { error } = await db.from("twilio_integrations").delete().eq("business_id", businessId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to disconnect Twilio";
    return { ok: false, error: message };
  }
}
