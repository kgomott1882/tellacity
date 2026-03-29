import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminSession } from "@/components/admin/RequireAdmin";

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const body = (await request.json()) as { userId?: string };
    const userId = String(body?.userId ?? "").trim();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration missing" }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    try {
      await supabase.from("business_profiles").delete().eq("id", userId);
    } catch (e) {
      console.warn("business_profiles delete by id skipped:", e);
    }
    try {
      await supabase.from("business_profiles").delete().eq("user_id", userId);
    } catch (e) {
      console.warn("business_profiles delete by user_id skipped:", e);
    }
    try {
      await supabase.from("business_members").delete().eq("user_id", userId);
    } catch (e) {
      console.warn("business_members delete skipped:", e);
    }
    try {
      await supabase.from("reviews").delete().eq("user_id", userId);
    } catch (e) {
      console.warn("reviews delete skipped:", e);
    }
    try {
      await supabase.from("profiles").delete().eq("id", userId);
    } catch (e) {
      console.warn("profiles delete skipped:", e);
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("DELETE USER ERROR:", deleteError);
      console.error(deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
