import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import type { AdminUserRow } from "@/lib/admin";

export async function GET() {
  try {
    await requireAdminSession();

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server configuration missing", data: [] }, { status: 500 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase.rpc("admin_list_users", {
      search_term: null,
      role_filter: null,
      limit_count: 50,
      offset_count: 0,
    });

    if (error) {
      return NextResponse.json({ error: error.message, data: [] }, { status: 500 });
    }

    return NextResponse.json({
      data: (Array.isArray(data) ? data : []) as AdminUserRow[],
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message, data: [] }, { status: 500 });
  }
}
