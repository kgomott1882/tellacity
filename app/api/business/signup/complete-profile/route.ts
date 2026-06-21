export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeBusinessDomain } from "@/lib/normalizeBusinessDomain";
import { allocateUniqueBusinessSlug } from "@/lib/businessSlug";
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
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const email = user.email.trim().toLowerCase();
    const emailDomain = normalizeBusinessDomain(email.split("@")[1] || "");
    if (!emailDomain) {
      return NextResponse.json({ error: "invalid_session" }, { status: 400 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const website = typeof body.website === "string" ? body.website.trim() : "";
    const country_code =
      typeof body.country_code === "string" ? body.country_code.trim().toUpperCase().slice(0, 2) : "";
    const category_slug =
      typeof body.category_slug === "string" ? body.category_slug.trim() : "";
    const primary_group_slug =
      typeof body.primary_group_slug === "string" ? body.primary_group_slug.trim() : "";
    const city = typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;
    const street_address =
      typeof body.street_address === "string" && body.street_address.trim()
        ? body.street_address.trim()
        : null;
    const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
    const public_email =
      typeof body.public_email === "string" && body.public_email.trim()
        ? body.public_email.trim()
        : email;
    const notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    if (!name || !website || !country_code || !category_slug || !primary_group_slug) {
      return NextResponse.json({ error: "incomplete_form" }, { status: 400 });
    }

    const websiteDomain = normalizeBusinessDomain(website);
    if (!websiteDomain || websiteDomain !== emailDomain) {
      return NextResponse.json({ error: "domain_mismatch" }, { status: 403 });
    }

    const normalizedWebsite = normalizeWebsiteInput(website);
    if (!normalizedWebsite) {
      return NextResponse.json({ error: "invalid_website" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: pickedCat, error: pickedCatErr } = await admin
      .from("categories")
      .select("slug, group_slug")
      .eq("slug", category_slug.trim())
      .maybeSingle();

    if (pickedCatErr || !pickedCat?.slug) {
      return NextResponse.json({ error: "Choose a valid category." }, { status: 400 });
    }

    if (String(pickedCat.group_slug ?? "").trim() !== primary_group_slug.trim()) {
      return NextResponse.json(
        { error: "Category does not match the selected primary group." },
        { status: 400 }
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
        { error: "A business with this website already exists." },
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
        category_slug,
        primary_group_slug,
        address: street_address,
        city,
        phone,
        email: public_email,
        description: notes,
        source: "owner_signup",
        submission_status: "approved",
        status: "active",
        owner_id: user.id,
        is_claimed: true,
      })
      .select("id, slug")
      .single();

    if (insertError) {
      console.error("complete-profile insert:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Failed to create business." },
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
      console.error("complete-profile business_owners:", boErr);
      await admin.from("businesses").delete().eq("id", inserted.id);
      return NextResponse.json({ error: "owner_link_failed" }, { status: 500 });
    }

    await provisionReverseTrialIfEligible(inserted.id, admin);

    return NextResponse.json({
      ok: true,
      slug: inserted.slug,
      businessId: inserted.id,
    });
  } catch (e) {
    console.error("complete-profile:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
