import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const limitParam = searchParams.get("limit");
    const offsetParam = searchParams.get("offset");

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

    const { data: items, error: rpcError } = await supabase.rpc(
      "get_sent_invites_for_business",
      {
        p_business_id: businessId.trim(),
        p_limit: limit,
        p_offset: offset,
      }
    );

    if (rpcError) {
      console.error("get_sent_invites_for_business error:", rpcError);
      return NextResponse.json(
        { error: rpcError.message ?? "Failed to load invites." },
        { status: 500 }
      );
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
