export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { sessionEmailDomainMatchesBusinessWebsite } from "@/lib/businessDomainVerification";
import { rejectIfEmailBlocked } from "@/lib/blockedEmails";

/**
 * Validates that the signed-in user may start domain OTP for claiming an existing listing.
 * Does not create business_owners , call POST /api/business/verify-domain (no code) to send OTP.
 * Email vs website domain is compared with normalizeWebsiteDomain rules via sessionEmailDomainMatchesBusinessWebsite.
 */
export async function POST(req: Request) {
  try {
    const supabaseUser = await createSupabaseServerCookies();
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user?.id || !user.email) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be signed in." },
        { status: 401 }
      );
    }

    const sessionEmail = user.email.trim().toLowerCase();
    const body = (await req.json().catch(() => ({}))) as { businessId?: string };
    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    if (!businessId) {
      return NextResponse.json({ error: "missing_business_id" }, { status: 400 });
    }

    const blocked = await rejectIfEmailBlocked(sessionEmail);
    if (blocked) return blocked;

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: b, error: bErr } = await admin
      .from("businesses")
      .select("id, website, owner_id, is_claimed, status")
      .eq("id", businessId)
      .maybeSingle();

    if (bErr || !b) {
      return NextResponse.json(
        { error: "business_not_found", message: "Business not found." },
        { status: 404 }
      );
    }

    if (String(b.status ?? "").toLowerCase() !== "active") {
      return NextResponse.json(
        { error: "not_claimable", message: "This business is not available to claim." },
        { status: 400 }
      );
    }

    if (b.owner_id != null && String(b.owner_id).trim() !== "") {
      return NextResponse.json(
        { error: "already_claimed", message: "This business already has an owner." },
        { status: 409 }
      );
    }

    if (b.is_claimed === true) {
      return NextResponse.json(
        { error: "already_claimed", message: "This business is already claimed." },
        { status: 409 }
      );
    }

    if (!sessionEmailDomainMatchesBusinessWebsite(sessionEmail, b.website)) {
      return NextResponse.json(
        {
          error: "domain_mismatch",
          message:
            "Use your company email (e.g. name@syfnet.com) to verify ownership of this business. Personal emails like Gmail or Yahoo won't work for security reasons.",
        },
        { status: 403 }
      );
    }

    const { data: existingBo } = await admin
      .from("business_owners")
      .select("owner_user_id")
      .eq("business_id", businessId)
      .maybeSingle();

    if (existingBo?.owner_user_id) {
      return NextResponse.json(
        { error: "already_claimed", message: "This business already has an owner." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ok: true, businessId: b.id });
  } catch (e) {
    console.error("claim-request:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
