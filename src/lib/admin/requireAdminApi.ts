import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getServerEnv } from "@/lib/serverEnv";

export type AdminApiContext = {
  userId: string;
  admin: SupabaseClient;
};

export async function requireAdminApi(): Promise<
  AdminApiContext | NextResponse
> {
  const userClient = await createSupabaseServerCookies();
  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await userClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_admin !== true) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
    return { userId: user.id, admin };
  } catch (e) {
    console.error("[requireAdminApi] env", e);
    return NextResponse.json({ error: "Service misconfigured" }, { status: 500 });
  }
}
