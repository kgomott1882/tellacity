export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
            }[]
          ) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(
                  name,
                  value,
                  options as Parameters<typeof cookieStore.set>[2]
                )
              );
            } catch {
              /* ignore in Route Handler */
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { businessId, tags } = body;

    if (!businessId || !Array.isArray(tags)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (tags.length > 10) {
      return NextResponse.json({ error: "Max 10 tags allowed" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("businesses")
      .update({ tags })
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .select("tags")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tags: data.tags });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
