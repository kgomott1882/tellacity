import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Only `active` businesses participate in public discovery, profiles, and new reviews. */
export function isBusinessPubliclyActive(
  status: string | null | undefined,
): boolean {
  return String(status ?? "active").trim().toLowerCase() === "active";
}

export const BUSINESS_SUSPENDED_USER_MESSAGE =
  "This business has been suspended and is no longer available on Tellacity.";

/**
 * Returns a JSON NextResponse when the business cannot accept reviews / public activity,
 * or `null` when OK to proceed.
 */
export async function assertBusinessAcceptsPublicReviews(
  supabase: SupabaseClient,
  businessId: string,
): Promise<NextResponse | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("status")
    .eq("id", businessId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  if (!isBusinessPubliclyActive(data.status)) {
    return NextResponse.json(
      {
        error: BUSINESS_SUSPENDED_USER_MESSAGE,
        code: "business_suspended",
      },
      { status: 403 },
    );
  }

  return null;
}
