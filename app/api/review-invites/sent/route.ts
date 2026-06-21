import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canAccessAnalytics, getActivePlanKeyForBusiness } from "@/lib/plans";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");
    const contextParam = searchParams.get("context")?.trim().toLowerCase() ?? "";

    if (!businessId || !businessId.trim()) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization required." },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const { data: link } = await supabase
      .from("business_owners")
      .select("business_id")
      .eq("business_id", businessId.trim())
      .eq("owner_user_id", user.id)
      .maybeSingle();

    const { data: biz } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", businessId.trim())
      .single();

    const isOwner =
      !!link ||
      (!!biz && (biz as { owner_id?: string | null }).owner_id === user.id);

    if (!isOwner) {
      return NextResponse.json(
        { error: "You do not have access to this business." },
        { status: 403 }
      );
    }

    let limit =
      limitParam != null ? parseInt(limitParam, 10) : DEFAULT_LIMIT;
    if (Number.isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    let offset = offsetParam != null ? parseInt(offsetParam, 10) : 0;
    if (Number.isNaN(offset) || offset < 0) offset = 0;

    // Performance analytics depth only (`context=analytics`). All other callers
    // (redirect limit=1, get-reviews overview, etc.) stay ungated.
    if (contextParam === "analytics") {
      const plan = await getActivePlanKeyForBusiness(businessId.trim(), supabase);
      if (!canAccessAnalytics(plan)) {
        return NextResponse.json({
          items: [],
          limit,
          offset,
          analyticsLocked: true,
        });
      }
    }

    // Direct query (service role): RLS often blocks `review_invites` for the browser JWT;
    // RPC `get_sent_invites_for_business` is not guaranteed to exist in every project.
    const { data: items, error: qError } = await supabase
      .from("review_invites")
      .select(
        "id, recipient_email, sent_at, opened_at, review_submitted_at, expires_at, status, created_at, channel"
      )
      .eq("business_id", businessId.trim())
      .not("sent_at", "is", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (qError) {
      const msg =
        (typeof qError.message === "string" && qError.message) ||
        (typeof (qError as { code?: string }).code === "string" &&
          (qError as { code: string }).code) ||
        "Failed to load invites.";
      console.warn("[review-invites/sent]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      items: Array.isArray(items) ? items : [],
      limit,
      offset,
    });
  } catch (err) {
    console.error("Sent invites error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
