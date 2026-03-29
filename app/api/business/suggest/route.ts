import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { allocateUniqueBusinessSlug } from "@/lib/businessSlug";

function normalizeWebsite(website: string): string {
  let domain = website.trim();
  domain = domain.replace(/^https?:\/\//i, "");
  domain = domain.replace(/\/+$/, "");
  return domain.toLowerCase();
}

export async function POST(request: Request) {
  try {
    if (request.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      name,
      website,
      country_code,
      category_slug,
      primary_group_slug,
      city,
      street_address,
      phone,
      public_email,
      notes,
    } = body as Record<string, unknown>;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "name is required." },
        { status: 400 }
      );
    }
    if (!website || typeof website !== "string" || !website.trim()) {
      return NextResponse.json(
        { error: "website is required." },
        { status: 400 }
      );
    }
    if (!country_code || typeof country_code !== "string" || !country_code.trim()) {
      return NextResponse.json(
        { error: "country_code is required." },
        { status: 400 }
      );
    }
    if (!category_slug || typeof category_slug !== "string" || !category_slug.trim()) {
      return NextResponse.json(
        { error: "category_slug is required." },
        { status: 400 }
      );
    }
    if (!primary_group_slug || typeof primary_group_slug !== "string" || !primary_group_slug.trim()) {
      return NextResponse.json(
        { error: "primary_group_slug is required." },
        { status: 400 }
      );
    }

    const normalizedWebsite = normalizeWebsite(website);
    if (!normalizedWebsite) {
      return NextResponse.json(
        { error: "Invalid website." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const catSlug = String(category_slug).trim();
    const groupSlug = String(primary_group_slug).trim();

    const { data: pickedCat, error: catLookupErr } = await supabase
      .from("categories")
      .select("slug, group_slug")
      .eq("slug", catSlug)
      .maybeSingle();

    if (catLookupErr || !pickedCat?.slug) {
      return NextResponse.json(
        { error: "Choose a valid category." },
        { status: 400 }
      );
    }

    if (String(pickedCat.group_slug ?? "").trim() !== groupSlug) {
      return NextResponse.json(
        { error: "Category does not match the selected primary group." },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("businesses")
      .select("id, slug")
      .ilike("website", normalizedWebsite)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        exists: true,
        slug: (existing as { slug: string }).slug,
      });
    }

    const slug = await allocateUniqueBusinessSlug(supabase, name.trim());

    const { data: newBusiness, error: insertError } = await supabase
      .from("businesses")
      .insert({
        name: name.trim(),
        slug,
        website: normalizedWebsite,
        country_code: country_code.trim(),
        category_slug: catSlug,
        primary_group_slug: groupSlug,
        address:
          typeof street_address === "string" && street_address.trim()
            ? street_address.trim()
            : null,
        city: typeof city === "string" && city.trim() ? city.trim() : null,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        email:
          typeof public_email === "string" && public_email.trim()
            ? public_email.trim()
            : null,
        description:
          typeof notes === "string" && notes.trim() ? notes.trim() : null,
        source: "user_suggested",
        submission_status: "under_review",
        status: "active",
      })
      .select("slug")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          { error: "A business with this website or slug already exists." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: insertError.message || "Failed to create suggestion." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      created: true,
      slug: (newBusiness as { slug: string }).slug,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
