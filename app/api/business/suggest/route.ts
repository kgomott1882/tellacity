import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  insertSuggestedBusiness,
  normalizeSuggestWebsite,
  validateSuggestCategory,
  type NormalizedSuggestPayload,
} from "@/lib/businessSuggestShared";
import { sendBusinessSuggestionOtpEmail } from "@/lib/sendBusinessSuggestionOtpEmail";

const MISSING_TABLE_HINT =
  "Database setup required: open Supabase Dashboard → SQL Editor. If the table does not exist yet, run scripts/apply-business-suggestion-verifications.sql. If you already created a different version of the table, run scripts/fix-business-suggestion-verifications.sql, then try again.";

function isMissingBusinessSuggestionTable(err: { message?: string; code?: string } | null | undefined): boolean {
  const m = err?.message ?? "";
  return (
    m.includes("business_suggestion_verifications") ||
    (m.includes("schema cache") && m.includes("Could not find the table"))
  );
}

function isNormalizedPayload(x: unknown): x is NormalizedSuggestPayload {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.name === "string" &&
    typeof o.website_normalized === "string" &&
    typeof o.country_code === "string" &&
    typeof o.category_slug === "string" &&
    typeof o.primary_group_slug === "string"
  );
}

function parseBusinessBody(body: Record<string, unknown>): {
  name: string;
  website: string;
  country_code: string;
  category_slug: string;
  primary_group_slug: string;
  city: string | null;
  street_address: string | null;
  phone: string | null;
  public_email: string | null;
  notes: string | null;
} | { error: string } {
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
  } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return { error: "name is required." };
  }
  if (!website || typeof website !== "string" || !website.trim()) {
    return { error: "website is required." };
  }
  if (!country_code || typeof country_code !== "string" || !country_code.trim()) {
    return { error: "country_code is required." };
  }
  if (!category_slug || typeof category_slug !== "string" || !category_slug.trim()) {
    return { error: "category_slug is required." };
  }
  if (!primary_group_slug || typeof primary_group_slug !== "string" || !primary_group_slug.trim()) {
    return { error: "primary_group_slug is required." };
  }

  const trimmedCountry = country_code.trim().toUpperCase().slice(0, 2);
  if (trimmedCountry.length !== 2) {
    return { error: "country_code must be a 2-letter code." };
  }

  return {
    name: name.trim(),
    website: website.trim(),
    country_code: trimmedCountry,
    category_slug: category_slug.trim(),
    primary_group_slug: primary_group_slug.trim(),
    city: typeof city === "string" && city.trim() ? city.trim() : null,
    street_address:
      typeof street_address === "string" && street_address.trim() ? street_address.trim() : null,
    phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
    public_email:
      typeof public_email === "string" && public_email.trim() ? public_email.trim() : null,
    notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
  };
}

export async function POST(request: Request) {
  try {
    if (request.method !== "POST") {
      return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const phase = typeof body.phase === "string" ? body.phase.trim() : "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (phase === "confirm") {
      const requestId = typeof body.request_id === "string" ? body.request_id.trim() : "";
      const code = typeof body.code === "string" ? body.code.trim() : "";

      if (!requestId) {
        return NextResponse.json({ error: "request_id is required." }, { status: 400 });
      }
      if (!/^\d{6}$/.test(code)) {
        return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
      }

      const { data: row, error: fetchErr } = await supabase
        .from("business_suggestion_verifications")
        .select("id, code, expires_at, consumed_at, payload")
        .eq("id", requestId)
        .maybeSingle();

      if (fetchErr && isMissingBusinessSuggestionTable(fetchErr)) {
        return NextResponse.json({ error: MISSING_TABLE_HINT }, { status: 503 });
      }

      if (fetchErr || !row) {
        return NextResponse.json(
          { error: "Invalid or expired verification. Request a new code." },
          { status: 400 }
        );
      }

      if (row.consumed_at != null) {
        return NextResponse.json({ error: "This code was already used." }, { status: 400 });
      }

      if (new Date(String(row.expires_at)).getTime() < Date.now()) {
        return NextResponse.json({ error: "This code has expired. Go back and request a new one." }, { status: 400 });
      }

      if (String(row.code) !== code) {
        return NextResponse.json({ error: "That code is incorrect." }, { status: 400 });
      }

      if (!isNormalizedPayload(row.payload)) {
        return NextResponse.json({ error: "Invalid stored payload." }, { status: 500 });
      }

      const payload = row.payload;

      const catCheck = await validateSuggestCategory(
        supabase,
        payload.category_slug,
        payload.primary_group_slug
      );
      if (!catCheck.ok) {
        return NextResponse.json({ error: catCheck.message }, { status: 400 });
      }

      const { data: existing } = await supabase
        .from("businesses")
        .select("id, slug")
        .ilike("website", payload.website_normalized)
        .limit(1)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("business_suggestion_verifications")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", requestId);
        return NextResponse.json({
          exists: true,
          slug: (existing as { slug: string }).slug,
        });
      }

      const created = await insertSuggestedBusiness(supabase, payload);
      if (!created.ok) {
        const status = created.code === "23505" ? 409 : 500;
        return NextResponse.json({ error: created.message }, { status });
      }

      await supabase
        .from("business_suggestion_verifications")
        .update({ consumed_at: new Date().toISOString() })
        .eq("id", requestId);

      return NextResponse.json({
        created: true,
        slug: created.slug,
      });
    }

    if (phase !== "send_code") {
      return NextResponse.json(
        {
          error: "Invalid phase. Use send_code then confirm.",
        },
        { status: 400 }
      );
    }

    const suggesterName =
      typeof body.suggester_name === "string" ? body.suggester_name.trim() : "";
    const suggesterEmailRaw =
      typeof body.suggester_email === "string" ? body.suggester_email.trim().toLowerCase() : "";

    if (!suggesterName) {
      return NextResponse.json({ error: "Your name is required." }, { status: 400 });
    }
    if (!suggesterEmailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(suggesterEmailRaw)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const parsed = parseBusinessBody(body);
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const normalizedWebsite = normalizeSuggestWebsite(parsed.website);
    if (!normalizedWebsite) {
      return NextResponse.json({ error: "Invalid website." }, { status: 400 });
    }

    const catCheck = await validateSuggestCategory(
      supabase,
      parsed.category_slug,
      parsed.primary_group_slug
    );
    if (!catCheck.ok) {
      return NextResponse.json({ error: catCheck.message }, { status: 400 });
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

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email is temporarily unavailable. Please try again later." },
        { status: 503 }
      );
    }

    const { error: delErr } = await supabase
      .from("business_suggestion_verifications")
      .delete()
      .eq("suggester_email", suggesterEmailRaw)
      .is("consumed_at", null);

    if (delErr && isMissingBusinessSuggestionTable(delErr)) {
      return NextResponse.json({ error: MISSING_TABLE_HINT }, { status: 503 });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const payload: NormalizedSuggestPayload = {
      name: parsed.name,
      website_normalized: normalizedWebsite,
      country_code: parsed.country_code,
      category_slug: parsed.category_slug,
      primary_group_slug: parsed.primary_group_slug,
      city: parsed.city,
      street_address: parsed.street_address,
      phone: parsed.phone,
      public_email: parsed.public_email,
      notes: parsed.notes,
    };

    const { data: inserted, error: insErr } = await supabase
      .from("business_suggestion_verifications")
      .insert({
        suggester_email: suggesterEmailRaw,
        suggester_name: suggesterName,
        code: otp,
        expires_at: expiresAt,
        consumed_at: null,
        payload,
      })
      .select("id")
      .single();

    if (insErr || !inserted?.id) {
      console.error("business_suggestion_verifications insert:", insErr);
      if (insErr && isMissingBusinessSuggestionTable(insErr)) {
        return NextResponse.json({ error: MISSING_TABLE_HINT }, { status: 503 });
      }
      return NextResponse.json(
        { error: insErr?.message || "Could not start verification." },
        { status: 500 }
      );
    }

    try {
      await sendBusinessSuggestionOtpEmail(suggesterEmailRaw, otp, parsed.name);
    } catch (mailErr) {
      console.error("sendBusinessSuggestionOtpEmail:", mailErr);
      await supabase.from("business_suggestion_verifications").delete().eq("id", inserted.id);
      return NextResponse.json({ error: "Could not send verification email." }, { status: 500 });
    }

    return NextResponse.json({
      code_sent: true,
      request_id: inserted.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 }
    );
  }
}
