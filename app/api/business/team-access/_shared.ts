/**
 * Shared helpers for team-access API routes.
 * Bearer (in-memory session) or cookie session — same pattern as other dashboard APIs.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";

export function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key);
}

export async function resolveUser(req: Request) {
  const serviceSupabase = makeSupabase();
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const {
      data: { user },
      error,
    } = await serviceSupabase.auth.getUser(token);
    if (error || !user) return { user: null, supabase: null };
    return { user, supabase: serviceSupabase };
  }

  const cookieClient = await createSupabaseServerCookies();
  const {
    data: { user },
    error,
  } = await cookieClient.auth.getUser();
  if (error || !user) return { user: null, supabase: null };
  return { user, supabase: serviceSupabase };
}

export async function getOwnedBusiness(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as { id: string; name: string };
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export function notFound(msg = "Business not found.") {
  return NextResponse.json({ error: msg }, { status: 404 });
}

export function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 });
}

export function serverError(msg: string) {
  return NextResponse.json({ error: msg }, { status: 500 });
}
