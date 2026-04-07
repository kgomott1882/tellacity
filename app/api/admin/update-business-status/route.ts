import { NextResponse } from "next/server";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";

type Body = {
  businessId?: string;
  newStatus?: string | null;
  newSubmissionStatus?: string | null;
};

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerCookies();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.is_admin !== true) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Body;
    const businessId = String(body.businessId ?? "").trim();
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const newStatus =
      body.newStatus === undefined || body.newStatus === null
        ? null
        : String(body.newStatus).trim() || null;
    const newSubmissionStatus =
      body.newSubmissionStatus === undefined || body.newSubmissionStatus === null
        ? null
        : String(body.newSubmissionStatus).trim() || null;

    if (!newStatus && !newSubmissionStatus) {
      return NextResponse.json(
        { error: "At least one of newStatus or newSubmissionStatus is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase.rpc("admin_update_business_status", {
      target_business_id: businessId,
      new_status: newStatus,
      new_submission_status: newSubmissionStatus,
    });

    if (error) {
      console.error("admin_update_business_status:", error);
      return NextResponse.json(
        { error: error.message ?? "RPC failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("update-business-status:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
