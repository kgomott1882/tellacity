export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { isAuthEmailAlreadyRegistered } from "@/lib/signupIdentitySync";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmailShape(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string };
    const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
    if (!email || !isValidEmailShape(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await admin.rpc("service_role_auth_email_exists", {
      p_email: email,
    });

    if (!error && (data === true || data === false)) {
      return NextResponse.json(
        { exists: data },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    const exists = await isAuthEmailAlreadyRegistered(
      supabaseUrl,
      serviceRoleKey,
      email
    );
    return NextResponse.json(
      { exists },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[check-email-exists]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
