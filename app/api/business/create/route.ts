export const runtime = "nodejs";

/**
 * Legacy: creates an active business and business_owners in one step.
 * Prefer POST /api/business/create-draft + POST /api/business/verify-domain from the dashboard.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { allocateUniqueBusinessSlug } from "@/lib/businessSlug";
import { normalizeBusinessDomain } from "@/lib/normalizeBusinessDomain";
import { getServerEnv } from "@/lib/serverEnv";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { provisionReverseTrialIfEligible } from "@/lib/provisionReverseTrial";

function normalizeWebsiteInput(website: string): string {
  let domain = website.trim().toLowerCase();
  while (/^https?:\/\//.test(domain)) {
    domain = domain.replace(/^https?:\/\//, "");
  }
  domain = domain.replace(/\/+$/, "");
  return domain;
}

export async function POST(req: Request) {
  try {
    const supabaseUser = await createSupabaseServerCookies();
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user?.id || !user.email) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be signed in to create a business." },
        { status: 401 }
      );
    }

    const sessionEmail = user.email.trim().toLowerCase();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const website = typeof body.website === "string" ? body.website.trim() : "";
    const countryRaw = typeof body.country === "string" ? body.country.trim() : "";
    const country_code = countryRaw.toUpperCase().slice(0, 2);
    const bodyEmail =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim().toLowerCase()
        : sessionEmail;

    if (bodyEmail !== sessionEmail) {
      return NextResponse.json(
        { error: "email_mismatch", message: "Email does not match your signed-in account." },
        { status: 400 }
      );
    }

    if (!name || !website || country_code.length !== 2) {
      return NextResponse.json(
        {
          error: "incomplete_form",
          message: "Business name, website, and a 2-letter country code are required.",
        },
        { status: 400 }
      );
    }

    const emailDomain = normalizeBusinessDomain(sessionEmail.split("@")[1] || "");
    const websiteDomain = normalizeBusinessDomain(website);
    if (!emailDomain || websiteDomain !== emailDomain) {
      return NextResponse.json(
        {
          error: "domain_mismatch",
          message: "Website domain must match your business email domain.",
        },
        { status: 403 }
      );
    }

    const normalizedWebsite = normalizeWebsiteInput(website);
    if (!normalizedWebsite) {
      return NextResponse.json(
        { error: "invalid_website", message: "Enter a valid website." },
        { status: 400 }
      );
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: defaultCat, error: catErr } = await admin
      .from("categories")
      .select("slug, group_slug")
      .order("slug", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (catErr || !defaultCat?.slug || !defaultCat?.group_slug) {
      console.error("business/create default category:", catErr);
      return NextResponse.json(
        {
          error: "configuration_error",
          message: "Business categories are not available. Try again later or contact support.",
        },
        { status: 503 }
      );
    }

    const { data: dupRows } = await admin
      .from("businesses")
      .select("id, website")
      .eq("status", "active")
      .ilike("website", `%${websiteDomain}%`)
      .limit(15);

    const duplicate = (dupRows ?? []).some(
      (r) => normalizeBusinessDomain(String(r.website ?? "")) === websiteDomain
    );
    if (duplicate) {
      return NextResponse.json(
        {
          error: "duplicate",
          message: "A business with this website already exists.",
        },
        { status: 409 }
      );
    }

    const slug = await allocateUniqueBusinessSlug(admin, name);

    const { data: inserted, error: insertError } = await admin
      .from("businesses")
      .insert({
        name,
        slug,
        website: normalizedWebsite,
        country_code,
        category_slug: defaultCat.slug,
        primary_group_slug: defaultCat.group_slug,
        email: sessionEmail,
        source: "owner_signup",
        submission_status: "approved",
        status: "active",
        owner_id: user.id,
        is_claimed: true,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      console.error("business/create insert:", insertError);
      return NextResponse.json(
        {
          error: "insert_failed",
          message: insertError.message || "Failed to create business.",
        },
        { status: 500 }
      );
    }

    const { error: boErr } = await admin.from("business_owners").upsert(
      {
        business_id: inserted.id,
        owner_user_id: user.id,
      },
      { onConflict: "business_id" }
    );

    if (boErr) {
      console.error("business/create business_owners:", boErr);
      await admin.from("businesses").delete().eq("id", inserted.id);
      return NextResponse.json(
        { error: "owner_link_failed", message: "Could not link you as owner. Please try again." },
        { status: 500 }
      );
    }

    await provisionReverseTrialIfEligible(inserted.id, admin);

    return NextResponse.json({
      ok: true,
      slug: inserted.slug,
      businessId: inserted.id,
    });
  } catch (e) {
    console.error("business/create:", e);
    return NextResponse.json(
      { error: "unexpected_error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
