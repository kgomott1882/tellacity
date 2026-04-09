import { NextResponse } from "next/server";
import { resolveDashboardDb } from "@/lib/supabase/businessDashboardServer";

function splitDisplayName(displayName: string): { first: string; last: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0]!, last: "" };
  return { first: parts[0]!, last: parts.slice(1).join(" ") };
}

/** Account form data from server session (cookies / Bearer) , avoids client getSession() races. */
export async function GET(req: Request) {
  try {
    const ctx = await resolveDashboardDb(req);
    if (!ctx.ok) return ctx.response;

    const { data: userData, error: authErr } = await ctx.db.auth.getUser();
    if (authErr || !userData.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const u = userData.user;
    const md = (u.user_metadata ?? {}) as Record<string, unknown>;

    const { data: bp } = await ctx.db
      .from("business_profiles")
      .select("business_name")
      .eq("id", u.id)
      .maybeSingle();

    const { data: prof } = await ctx.db
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", u.id)
      .maybeSingle();

    const displayName = (md.display_name as string | undefined)?.trim() ?? "";
    let name = displayName;
    const bpName =
      bp && typeof bp === "object" && "business_name" in bp
        ? (bp as { business_name: string | null }).business_name
        : null;
    if (!name && bpName) name = String(bpName).trim();

    const signupCompany =
      typeof md.signup_company_name === "string" ? md.signup_company_name.trim() : "";
    const signupWebsite =
      typeof md.signup_website === "string" ? md.signup_website.trim() : "";
    const signupJob =
      typeof md.signup_job_title === "string" ? md.signup_job_title.trim() : "";
    const signupCc =
      typeof md.signup_country_code === "string"
        ? md.signup_country_code.trim().toUpperCase().slice(0, 2)
        : "";
    const metaCountry =
      typeof md.country === "string" ? md.country.trim().toUpperCase().slice(0, 2) : "";

    const p = prof as { first_name?: string | null; last_name?: string | null; phone?: string | null } | null;
    const pf = typeof p?.first_name === "string" ? p.first_name.trim() : "";
    const pl = typeof p?.last_name === "string" ? p.last_name.trim() : "";
    const phone = typeof p?.phone === "string" ? p.phone.trim() : "";

    const fromDisplay = splitDisplayName(displayName);

    const onboarding = {
      businessName: signupCompany || (bpName ? String(bpName).trim() : ""),
      websiteHost: signupWebsite,
      countryCode: signupCc || metaCountry,
      phone,
      firstName: pf || fromDisplay.first,
      lastName: pl || fromDisplay.last,
      jobTitle: signupJob,
      workEmail: (u.email ?? "").trim().toLowerCase(),
    };

    return NextResponse.json(
      {
        userId: u.id,
        email: u.email ?? "",
        name,
        country: (md.country as string | undefined) ?? null,
        language: (md.language as string | undefined) ?? null,
        onboarding,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[dashboard/account]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
