import { NextResponse } from "next/server";
import {
  resolveUser,
  unauthorized,
  badRequest,
  serverError,
  makeSupabase,
} from "../_shared";

export async function POST(req: Request) {
  try {
    const { user } = await resolveUser(req);
    if (!user) return unauthorized();

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return badRequest("Invalid JSON body.");
    }

    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!token) return badRequest("token is required.");

    // Use service-role client so the SECURITY DEFINER RPC can run with the
    // caller's auth.uid() injected via the user JWT we already validated above.
    // We call the RPC via the service-role client but pass the user's JWT so
    // auth.uid() resolves correctly inside the function.
    const authHeader = req.headers.get("authorization");
    const userToken  = authHeader?.replace("Bearer ", "").trim() ?? "";

    // Create an anon client scoped to the user's JWT so auth.uid() works
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    if (!url || !anonKey) return serverError("Missing Supabase env vars.");

    const { createClient } = await import("@supabase/supabase-js");
    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    const { data, error } = await userClient.rpc("accept_business_member_invite", {
      p_token: token,
    });

    if (error) {
      console.error("[team-access accept] rpc error:", error);
      const msg = error.message ?? "";
      if (
        msg.includes("not found") ||
        msg.includes("already used") ||
        msg.includes("Not authenticated")
      ) {
        return badRequest(msg);
      }
      return serverError(msg);
    }

    return NextResponse.json(data ?? { accepted: true });
  } catch (err: any) {
    console.error("[team-access accept] unhandled:", err);
    return serverError("Unexpected server error.");
  }
}
