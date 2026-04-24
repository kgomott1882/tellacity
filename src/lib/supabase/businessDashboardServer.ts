import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { canAccessBusiness } from "@/lib/canAccessBusinessShared";

export { canAccessBusiness };

export function createSupabaseWithJwt(accessToken: string): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );
}

export type DashboardDbContext =
  | { ok: true; userId: string; email: string | null; db: SupabaseClient }
  | { ok: false; response: NextResponse };

/**
 * Cookie session first; optional Bearer for in-memory Supabase session after refresh.
 */
export async function resolveDashboardDb(req: Request): Promise<DashboardDbContext> {
  const cookieClient = await createSupabaseServerCookies();
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const {
      data: { user },
      error,
    } = await cookieClient.auth.getUser(token);
    if (error || !user) {
      return {
        ok: false,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    return {
      ok: true,
      userId: user.id,
      email: user.email ?? null,
      db: createSupabaseWithJwt(token),
    };
  }

  const {
    data: { user },
    error,
  } = await cookieClient.auth.getUser();
  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, userId: user.id, email: user.email ?? null, db: cookieClient };
}

/**
 * Cookie session (createServerClient + anon key) or Bearer JWT; anon key only , no service role.
 * Logs the resolved user for API debugging.
 */
export async function requireUserSession(req: Request): Promise<
  | { ok: true; db: SupabaseClient; user: User; userId: string }
  | { ok: false; response: NextResponse }
> {
  const ctx = await resolveDashboardDb(req);
  if (!ctx.ok) return { ok: false, response: ctx.response };

  const {
    data: { user },
  } = await ctx.db.auth.getUser();
  console.log("API USER:", user);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }),
    };
  }

  return { ok: true, db: ctx.db, user, userId: user.id };
}

export async function requireBusinessAccess(
  req: Request,
  businessId: string
): Promise<DashboardDbContext> {
  const trimmed = businessId?.trim();
  if (!trimmed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing business id" }, { status: 400 }),
    };
  }

  const ctx = await resolveDashboardDb(req);
  if (!ctx.ok) return ctx;

  const allowed = await canAccessBusiness(ctx.db, ctx.userId, trimmed);
  if (!allowed) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId: ctx.userId, email: ctx.email, db: ctx.db };
}
