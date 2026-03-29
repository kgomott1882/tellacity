export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { allocateUniqueBusinessSlug } from "@/lib/businessSlug";
import { getServerEnv } from "@/lib/serverEnv";
import { normalizeWebsiteDomain } from "@/lib/normalizeWebsiteDomain";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { sessionEmailDomainMatchesBusinessWebsite } from "@/lib/businessDomainVerification";
import { sendBusinessDomainVerificationOtp } from "@/lib/sendBusinessDomainVerificationOtp";

type ExistingRow = {
  id: string;
  status: string | null;
  owner_id: string | null;
  is_claimed: boolean | null;
};

export async function POST(req: Request) {
  try {
    const supabaseUser = await createSupabaseServerCookies();
    const {
      data: { user },
      error: userErr,
    } = await supabaseUser.auth.getUser();

    if (userErr || !user?.id || !user.email) {
      return NextResponse.json(
        { error: "unauthorized", message: "You must be signed in." },
        { status: 401 }
      );
    }

    const sessionEmail = user.email.trim().toLowerCase();
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const websiteFromBody = typeof body.website === "string" ? body.website.trim() : "";
    const countryRaw =
      typeof body.country_code === "string"
        ? body.country_code.trim()
        : typeof body.country === "string"
          ? body.country.trim()
          : "";
    const country_code = countryRaw.toUpperCase().slice(0, 2);
    const category_slug =
      typeof body.category_slug === "string" ? body.category_slug.trim() : "";
    const primary_group_slug =
      typeof body.primary_group_slug === "string" ? body.primary_group_slug.trim() : "";
    const city =
      typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;
    const street_address =
      typeof body.street_address === "string" && body.street_address.trim()
        ? body.street_address.trim()
        : null;
    const phone =
      typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
    const public_email =
      typeof body.public_email === "string" && body.public_email.trim()
        ? body.public_email.trim().toLowerCase()
        : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;

    const websiteTrim = websiteFromBody;

    if (
      !name ||
      !websiteTrim ||
      country_code.length !== 2 ||
      !category_slug ||
      !primary_group_slug
    ) {
      return NextResponse.json(
        {
          error: "incomplete_form",
          message:
            "Business name, website, country, primary group, and category are required.",
        },
        { status: 400 }
      );
    }

    const normalizedWebsite = normalizeWebsiteDomain(websiteTrim);
    if (!sessionEmailDomainMatchesBusinessWebsite(sessionEmail, websiteTrim)) {
      return NextResponse.json(
        {
          error: "domain_mismatch",
          message: "Your email domain must match your business website.",
        },
        { status: 403 }
      );
    }

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

    const { data: pickedCat, error: pickedCatErr } = await admin
      .from("categories")
      .select("slug, group_slug")
      .eq("slug", category_slug)
      .maybeSingle();

    if (pickedCatErr || !pickedCat?.slug) {
      return NextResponse.json(
        { error: "invalid_category", message: "Choose a valid category." },
        { status: 400 }
      );
    }

    if (String(pickedCat.group_slug ?? "").trim() !== primary_group_slug) {
      return NextResponse.json(
        {
          error: "category_group_mismatch",
          message: "Category does not match the selected primary group.",
        },
        { status: 400 }
      );
    }

    const { data: existingRows, error: existingErr } = await admin
      .from("businesses")
      .select("id, status, owner_id, is_claimed")
      .eq("website", normalizedWebsite)
      .limit(1);

    if (existingErr) {
      console.error("create-draft lookup by website:", existingErr);
      return NextResponse.json(
        { error: "lookup_failed", message: existingErr.message },
        { status: 500 }
      );
    }

    const existing = (existingRows?.[0] ?? null) as ExistingRow | null;

    const contactEmail = public_email && public_email.length > 0 ? public_email : sessionEmail;

    let businessId: string;
    let reused = false;

    if (existing) {
      const hasOwner = existing.owner_id != null && String(existing.owner_id).trim() !== "";
      const claimed = existing.is_claimed === true;

      if (hasOwner || claimed) {
        return NextResponse.json(
          { error: "already_claimed", message: "Business already claimed" },
          { status: 409 }
        );
      }

      const st = String(existing.status ?? "").toLowerCase();
      const isPendingReusable =
        st === "pending_verification" && !hasOwner && !claimed;

      if (isPendingReusable) {
        businessId = String(existing.id);
        reused = true;

        const slug = await allocateUniqueBusinessSlug(admin, name, businessId);

        const { error: upErr } = await admin
          .from("businesses")
          .update({
            name,
            slug,
            website: normalizedWebsite,
            country_code,
            category_slug: pickedCat.slug,
            primary_group_slug,
            address: street_address,
            city,
            phone,
            email: contactEmail,
            description: notes,
            source: "owner_signup",
            submission_status: "pending",
            status: "pending_verification",
            owner_id: null,
            is_claimed: false,
          })
          .eq("id", businessId);

        if (upErr) {
          console.error("create-draft update reused draft:", upErr);
          return NextResponse.json(
            {
              error: "update_failed",
              message: upErr.message || "Could not update draft business.",
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          {
            error: "website_in_use",
            message:
              "A listing for this website already exists on Tellacity. Use Claim to connect your account.",
          },
          { status: 409 }
        );
      }
    } else {
      const slug = await allocateUniqueBusinessSlug(admin, name);

      const { data: inserted, error: insertError } = await admin
        .from("businesses")
        .insert({
          name,
          slug,
          website: normalizedWebsite,
          country_code,
          category_slug: pickedCat.slug,
          primary_group_slug,
          address: street_address,
          city,
          phone,
          email: contactEmail,
          description: notes,
          source: "owner_signup",
          submission_status: "pending",
          status: "pending_verification",
          owner_id: null,
          is_claimed: false,
        })
        .select("id")
        .single();

      if (insertError || !inserted) {
        console.error("create-draft insert:", insertError);
        return NextResponse.json(
          {
            error: "insert_failed",
            message: insertError?.message || "Failed to create draft business.",
          },
          { status: 500 }
        );
      }

      businessId = inserted.id as string;
    }

    const otpResult = await sendBusinessDomainVerificationOtp(
      admin,
      supabaseUser,
      businessId
    );

    if (!otpResult.ok) {
      console.error("create-draft OTP send:", otpResult);
      if (!reused) {
        await admin.from("businesses").delete().eq("id", businessId);
      }
      const payload: Record<string, unknown> = {
        error: otpResult.error,
        success: false,
        ...(otpResult.message ? { message: otpResult.message } : {}),
        ...(otpResult.dev ?? {}),
      };
      return NextResponse.json(payload, { status: otpResult.status });
    }

    if (otpResult.sent === false && otpResult.alreadyOwner) {
      return NextResponse.json({
        success: true,
        businessId,
        otpAlreadySatisfied: true,
      });
    }

    return NextResponse.json({
      success: true,
      businessId,
    });
  } catch (e) {
    console.error("create-draft:", e);
    return NextResponse.json(
      { error: "unexpected_error", message: "Something went wrong.", success: false },
      { status: 500 }
    );
  }
}
