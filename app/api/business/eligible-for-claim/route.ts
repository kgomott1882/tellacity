export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";

/**
 * Returns whether an active listing can still be claimed (no owner / not linked).
 * Does not check email domain , POST /api/business/claim-request does that.
 */
export async function GET(req: Request) {
  try {
    const supabaseUser = await createSupabaseServerCookies();
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const businessId = url.searchParams.get("businessId")?.trim() ?? "";
    if (!businessId) {
      return NextResponse.json(
        { eligible: false, message: "Missing business." },
        { status: 400 }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: b, error: bErr } = await admin
      .from("businesses")
      .select("id, owner_id, is_claimed, status")
      .eq("id", businessId)
      .maybeSingle();

    if (bErr || !b) {
      return NextResponse.json({
        eligible: false,
        message: "Business not found.",
      });
    }

    if (String(b.status ?? "").toLowerCase() !== "active") {
      return NextResponse.json({
        eligible: false,
        message: "This business is not available to claim.",
      });
    }

    if (b.owner_id != null && String(b.owner_id).trim() !== "") {
      return NextResponse.json({
        eligible: false,
        message: "This business already has an owner.",
      });
    }

    if (b.is_claimed === true) {
      return NextResponse.json({
        eligible: false,
        message: "This business is already claimed.",
      });
    }

    const { data: existingBo } = await admin
      .from("business_owners")
      .select("business_id")
      .eq("business_id", businessId)
      .maybeSingle();

    if (existingBo) {
      return NextResponse.json({
        eligible: false,
        message: "This business is already linked to an account.",
      });
    }

    return NextResponse.json({ eligible: true, businessId: b.id });
  } catch (e) {
    console.error("eligible-for-claim:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
