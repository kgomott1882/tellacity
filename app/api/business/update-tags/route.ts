export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sanitizeBusinessTagsForSave } from "@/lib/businessTags";
import {
  BUSINESS_TAGS_SAVE_ERROR_FALLBACK,
  userFacingErrorMessage,
} from "@/lib/userFacingError";

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

    const cleaned = sanitizeBusinessTagsForSave(tags, 10);

    if (tags.length > 10) {
      return NextResponse.json(
        { error: "You can add up to 10 keywords." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("businesses")
      .update({ tags: cleaned })
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .select("tags")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: userFacingErrorMessage(
            error.message,
            BUSINESS_TAGS_SAVE_ERROR_FALLBACK,
          ),
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ tags: data.tags });
  } catch {
    return NextResponse.json(
      { error: "We couldn’t save your keywords. Please try again." },
      { status: 500 },
    );
  }
}
