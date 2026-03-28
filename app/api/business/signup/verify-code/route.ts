export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { BusinessSignupPendingPayload } from "@/lib/businessSignupPayload";
import { BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE } from "@/lib/businessSignupDomainMessage";
import { extractDomain } from "@/lib/extractDomain";
import { getServerEnv } from "@/lib/serverEnv";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function slugFromCompanyName(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return base || "business";
}

function normalizeSignupError(message: string) {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("already been registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already registered")
  ) {
    return "Account already exists. Please log in.";
  }
  return message;
}

type VerifyBody = {
  email?: string;
  code?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as VerifyBody;
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "weak_password" }, { status: 400 });
    }

    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: row, error: rowErr } = await supabase
      .from("business_signup_verifications")
      .select("id, code, payload, expires_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rowErr) {
      console.error("business signup verify fetch:", rowErr);
      return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: "no_pending_signup" }, { status: 400 });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await supabase.from("business_signup_verifications").delete().eq("id", row.id);
      return NextResponse.json({ error: "code_expired" }, { status: 400 });
    }

    if (row.code !== code) {
      return NextResponse.json({ error: "wrong_code" }, { status: 400 });
    }

    const payload = row.payload as BusinessSignupPendingPayload;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const emailDomain = (email.split("@")[1] ?? "").trim().toLowerCase();
    const websiteDomain = extractDomain(payload.website ?? "");
    if (!emailDomain || websiteDomain !== emailDomain) {
      return NextResponse.json(
        { error: "domain_mismatch", message: BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE },
        { status: 400 }
      );
    }

    const phoneTrim =
      typeof payload.phoneNumber === "string" ? payload.phoneNumber.trim() : "";

    if (payload.selectedBusinessId) {
      const { data: biz, error: bizErr } = await supabase
        .from("businesses")
        .select("id, website, status")
        .eq("id", payload.selectedBusinessId)
        .maybeSingle();

      if (bizErr || !biz) {
        return NextResponse.json({ error: "business_not_found" }, { status: 400 });
      }

      if (String(biz.status ?? "").toLowerCase() !== "active") {
        return NextResponse.json({ error: "business_not_active" }, { status: 400 });
      }

      const bizDomain = extractDomain(String(biz.website ?? ""));
      if (bizDomain !== emailDomain) {
        return NextResponse.json(
          {
            error: "domain_claim_mismatch",
            message: BUSINESS_SIGNUP_DOMAIN_MISMATCH_MESSAGE,
          },
          { status: 403 }
        );
      }
    }

    const fullName = `${payload.firstName.trim()} ${payload.lastName.trim()}`.trim();

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: "business",
        display_name: fullName,
      },
    });

    if (createErr || !created?.user?.id) {
      const msg = createErr?.message ?? "Could not create account.";
      return NextResponse.json(
        { error: "create_user_failed", message: normalizeSignupError(msg) },
        { status: 400 }
      );
    }

    const userId = created.user.id;

    const { data: existingByEmail } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingByEmail && existingByEmail.id !== userId) {
      const tempEmail = `${email}.old.${Date.now()}`;
      await supabase.from("business_profiles").update({ email: tempEmail }).eq("id", existingByEmail.id);
    }

    const { error: profileUpsertError } = await supabase.from("business_profiles").upsert(
      {
        id: userId,
        email,
        business_name: payload.companyName.trim(),
      },
      { onConflict: "id" }
    );

    if (profileUpsertError) {
      await supabase.auth.admin.deleteUser(userId);
      console.error("business signup verify profile:", profileUpsertError);
      return NextResponse.json({ error: "profile_failed" }, { status: 500 });
    }

    try {
      if (payload.selectedBusinessId) {
        const { error: updErr } = await supabase
          .from("businesses")
          .update({
            owner_id: userId,
            is_claimed: true,
          })
          .eq("id", payload.selectedBusinessId);

        if (updErr) {
          console.error("business signup claim update:", updErr);
          throw updErr;
        }

        const { error: boErr } = await supabase.from("business_owners").upsert(
          {
            business_id: payload.selectedBusinessId,
            owner_user_id: userId,
          },
          { onConflict: "business_id" }
        );

        if (boErr) {
          console.error("business signup business_owners:", boErr);
          throw boErr;
        }

        if (phoneTrim) {
          await supabase
            .from("businesses")
            .update({ phone: phoneTrim })
            .eq("id", payload.selectedBusinessId);
        }
      } else {
        const slug = `${slugFromCompanyName(payload.companyName)}-${userId.replace(/-/g, "").slice(0, 12)}`;

        const insertPayload: Record<string, unknown> = {
          name: payload.companyName.trim(),
          website: payload.website.trim(),
          owner_id: userId,
          status: "active",
          country_code: payload.country || "",
          slug,
        };
        if (phoneTrim) insertPayload.phone = phoneTrim;
        if (payload.plan) insertPayload.plan = payload.plan;

        const { error: businessError } = await supabase.from("businesses").insert(insertPayload);

        if (businessError) {
          console.error("business signup insert:", businessError);
          throw businessError;
        }
      }
    } catch (bizFail) {
      await supabase.from("business_profiles").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: "business_failed" }, { status: 500 });
    }

    await supabase.from("business_signup_verifications").delete().eq("id", row.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("business signup verify:", e);
    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}
