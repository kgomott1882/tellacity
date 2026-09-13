export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { revalidateBusinessProfileById } from "@/lib/revalidateBusinessProfile";

/**
 * Bust ISR cache for /b/[slug] after owner edits (description, name, etc.).
 */
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[],
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(
                  name,
                  value,
                  options as Parameters<typeof cookieStore.set>[2],
                ),
              );
            } catch {
              /* ignore */
            }
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => null)) as {
      businessId?: string;
    } | null;
    const businessId = String(body?.businessId ?? "").trim();
    if (!businessId) {
      return NextResponse.json({ error: "businessId required" }, { status: 400 });
    }

    const { data: owned } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!owned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await revalidateBusinessProfileById(admin, businessId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[revalidate-profile]", e);
    return NextResponse.json({ error: "revalidate_failed" }, { status: 500 });
  }
}
