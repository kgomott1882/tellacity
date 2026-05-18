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
 * Admin can flag a business as "restricted" (businesses.is_review_restricted = true).
 * The business stays publicly visible (discovery, profile, existing reviews), but no
 * new reviews are accepted until restriction is lifted.
 */
export const BUSINESS_RESTRICTED_USER_MESSAGE =
  "This business is currently under review and not accepting new reviews at this time.";

export const BUSINESS_RESTRICTED_ERROR_CODE = "business_review_restricted";

export function isBusinessReviewRestricted(
  value: boolean | null | undefined,
): boolean {
  return value === true;
}

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
    .select("status, is_review_restricted")
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

  if (isBusinessReviewRestricted((data as { is_review_restricted?: boolean | null }).is_review_restricted)) {
    return NextResponse.json(
      {
        error: BUSINESS_RESTRICTED_USER_MESSAGE,
        code: BUSINESS_RESTRICTED_ERROR_CODE,
      },
      { status: 403 },
    );
  }

  return null;
}
