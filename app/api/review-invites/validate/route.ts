import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  reviewInviteRowIsExpired,
  reviewInviteRowIsUsed,
  type InviteRowRecord,
} from "@/lib/reviewInviteValidation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token } = (body || {}) as { token?: string };

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json(
        { error: "Token is required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: invite, error } = await supabase
      .from("review_invites")
      .select("*")
      .eq("token", token.trim())
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Invalid invite link." },
        { status: 400 }
      );
    }

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid invite link." },
        { status: 400 }
      );
    }

    const row = invite as InviteRowRecord;

    if (reviewInviteRowIsUsed(row)) {
      return NextResponse.json(
        { error: "This invitation link has already been used." },
        { status: 400 }
      );
    }

    if (reviewInviteRowIsExpired(row)) {
      return NextResponse.json(
        { error: "Invalid or expired invite link." },
        { status: 400 }
      );
    }

    const businessId = row.business_id;
    if (typeof businessId !== "string" || !businessId) {
      return NextResponse.json(
        { error: "Invalid invite link." },
        { status: 400 }
      );
    }

    const { data: biz } = await supabase
      .from("businesses")
      .select("name, slug")
      .eq("id", businessId)
      .maybeSingle();

    const businessName =
      biz && typeof biz === "object" && "name" in biz
        ? (biz as { name: string | null }).name
        : null;
    const businessSlug =
      biz && typeof biz === "object" && "slug" in biz
        ? (biz as { slug: string | null }).slug
        : null;

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      businessId,
      businessName,
      businessSlug,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid invite link." },
      { status: 500 }
    );
  }
}
