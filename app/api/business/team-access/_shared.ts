/**
 * Shared helpers for team-access API routes.
 * Follows the same pattern as app/api/business/invite-settings/route.ts.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars.");
  return createClient(url, key);
}

export async function resolveUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return { user: null, supabase: null };
  const token = authHeader.replace("Bearer ", "").trim();
  const supabase = makeSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
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
