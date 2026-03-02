import { NextResponse } from "next/server";
import { makeSupabase } from "../_shared";

/**
 * Public endpoint — no auth required.
 * Returns the email, role, and business name for a pending invite token
 * so the accept-invite page can display context before the user sets a password.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  try {
    const supabase = makeSupabase();

    const { data: invite, error } = await supabase
      .from("business_member_invites")
      .select("email, role, status, businesses(name)")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      console.error("[invite-info] query error:", error);
      return NextResponse.json({ error: "Failed to look up invite." }, { status: 500 });
    }

    if (!invite || (invite as any).status !== "pending") {
      return NextResponse.json(
        { error: "Invite not found or already used." },
        { status: 404 }
      );
    }

    const businessName =
      (invite as any).businesses?.name ?? "a business";

    return NextResponse.json({
      email:        (invite as any).email,
      role:         (invite as any).role,
      businessName,
    });
  } catch (err: any) {
    console.error("[invite-info] unhandled:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
