import type { User } from "@supabase/supabase-js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

const SYSTEM_TEST_REVIEW_TITLE = "System Health Check";
const INCIDENT_MSG_MAX = 8000;

export type SystemMonitoringApiResult = {
  id: string;
  check_name: string;
  check_group: string;
  status: "ok" | "fail";
  response_time_ms: number;
  message: string;
  created_at: string;
};

type SystemCheckRow = {
  id: string;
  check_name: string;
  check_group: string;
  status: "ok" | "fail";
  response_time_ms: number;
  message: string;
  created_at: string;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function errMessage(e: unknown): string {
  if (e instanceof Error) return e.message || String(e);
  return typeof e === "string" ? e : "Unknown error";
}

function readResponseTimeMs(e: unknown, fallback: number): number {
  const v = (e as { response_time_ms?: unknown }).response_time_ms;
  if (typeof v === "number" && Number.isFinite(v)) {
    return Math.round(v);
  }
  return fallback;
}

export function resolveMonitoringAppOrigin(): string {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

async function persistSystemCheck(
  supabase: SupabaseClient,
  row: {
    check_name: string;
    check_group: string;
    status: "ok" | "fail";
    response_time_ms: number;
    message: string;
  },
): Promise<SystemCheckRow> {
  const { data, error } = await supabase
    .from("system_checks")
    .insert({
      check_name: row.check_name,
      check_group: row.check_group,
      status: row.status,
      response_time_ms: Math.min(
        Math.max(0, Math.round(row.response_time_ms)),
        2_147_483_647,
      ),
      message: row.message.slice(0, 8000),
    })
    .select("id, check_name, check_group, status, response_time_ms, message, created_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to persist system_checks row");
  }
  return data as SystemCheckRow;
}

async function syncSystemIncidentAfterCheck(
  supabase: SupabaseClient,
  input: {
    check_name: string;
    check_group: string;
    check_status: "ok" | "fail";
    message: string;
  },
): Promise<void> {
  const msg = input.message.slice(0, INCIDENT_MSG_MAX);

  try {
    const { data: ongoing, error: selErr } = await supabase
      .from("system_incidents")
      .select("id, fail_count")
      .eq("check_name", input.check_name)
      .eq("status", "ongoing")
      .maybeSingle();

    if (selErr) {
      console.error("system_incidents select:", selErr);
      return;
    }

    if (input.check_status === "fail") {
      if (ongoing?.id) {
        const prev =
          typeof ongoing.fail_count === "number" && Number.isFinite(ongoing.fail_count)
            ? ongoing.fail_count
            : 1;
        const { error: upErr } = await supabase
          .from("system_incidents")
          .update({
            fail_count: prev + 1,
            last_error_message: msg,
          })
          .eq("id", ongoing.id);
        if (upErr) {
          console.error("system_incidents update (fail):", upErr);
        }
        return;
      }

      const { data: recent, error: recentErr } = await supabase
        .from("system_checks")
        .select("status, message")
        .eq("check_name", input.check_name)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentErr) {
        console.error("system_checks recent for incident gate:", recentErr);
        return;
      }

      const rows = recent ?? [];
      const newest = rows[0]?.status;
      const prev = rows[1]?.status;
      if (rows.length < 2 || newest !== "fail" || prev !== "fail") {
        return;
      }

      const firstMsgRaw =
        typeof rows[1]?.message === "string" ? rows[1].message : msg;
      const firstMsg = firstMsgRaw.slice(0, INCIDENT_MSG_MAX);

      const { error: insErr } = await supabase.from("system_incidents").insert({
        check_name: input.check_name,
        check_group: input.check_group,
        started_at: new Date().toISOString(),
        status: "ongoing",
        first_error_message: firstMsg,
        last_error_message: msg,
        fail_count: 1,
      });

      if (insErr?.code === "23505") {
        const { data: again, error: againErr } = await supabase
          .from("system_incidents")
          .select("id, fail_count")
          .eq("check_name", input.check_name)
          .eq("status", "ongoing")
          .maybeSingle();
        if (againErr || !again?.id) {
          console.error("system_incidents race re-select:", againErr);
          return;
        }
        const prevCount =
          typeof again.fail_count === "number" && Number.isFinite(again.fail_count)
            ? again.fail_count
            : 1;
        const { error: raceUp } = await supabase
          .from("system_incidents")
          .update({
            fail_count: prevCount + 1,
            last_error_message: msg,
          })
          .eq("id", again.id);
        if (raceUp) {
          console.error("system_incidents update after duplicate:", raceUp);
        }
        return;
      }

      if (insErr) {
        console.error("system_incidents insert:", insErr);
      }
      return;
    }

    if (ongoing?.id) {
      const { error: upErr } = await supabase
        .from("system_incidents")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", ongoing.id);
      if (upErr) {
        console.error("system_incidents resolve:", upErr);
      }
    }
  } catch (e) {
    console.error("syncSystemIncidentAfterCheck:", e);
  }
}

function reviewerDisplayNameFromAuthUser(user: User): string {
  const meta = user.user_metadata ?? {};
  const email = (user.email ?? "").trim();
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    (typeof meta.display_name === "string" && meta.display_name.trim()) ||
    "";
  if (fromMeta) return fromMeta.slice(0, 200);
  if (email.includes("@")) {
    return email.split("@")[0]!.slice(0, 200);
  }
  return "Anonymous";
}

async function executeWriteReviewLoggedInCheck(
  supabase: SupabaseClient,
): Promise<{ response_time_ms: number }> {
  const businessId = process.env.SYSTEM_CHECK_BUSINESS_ID?.trim() ?? "";
  const userId = process.env.SYSTEM_CHECK_USER_ID?.trim() ?? "";

  if (!isUuid(businessId)) {
    const err = new Error("SYSTEM_CHECK_BUSINESS_ID must be set to a valid UUID");
    Object.assign(err, { response_time_ms: 0 });
    throw err;
  }
  if (!isUuid(userId)) {
    const err = new Error("SYSTEM_CHECK_USER_ID must be set to a valid UUID");
    Object.assign(err, { response_time_ms: 0 });
    throw err;
  }

  const t0 = performance.now();

  const { data: adminUser, error: adminErr } = await supabase.auth.admin.getUserById(userId);
  if (adminErr || !adminUser?.user) {
    const ms = Math.round(performance.now() - t0);
    const err = new Error(
      adminErr?.message ?? "SYSTEM_CHECK_USER_ID not found in auth.users",
    );
    Object.assign(err, { response_time_ms: ms });
    throw err;
  }

  const user = adminUser.user;
  const guest_name = reviewerDisplayNameFromAuthUser(user);
  const date_of_experience = new Date().toISOString().slice(0, 10);

  await supabase
    .from("reviews")
    .delete()
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("title", SYSTEM_TEST_REVIEW_TITLE);

  const { data: createdRow, error: insertError } = await supabase
    .from("reviews")
    .insert({
      business_id: businessId,
      user_id: user.id,
      guest_name,
      rating: 5,
      title: SYSTEM_TEST_REVIEW_TITLE,
      body: "Automated test review",
      date_of_experience,
      status: "published",
      visibility: "visible",
      verification_status: "verified",
      draft: false,
      imported: false,
      is_flagged: false,
    })
    .select("id")
    .single();

  const response_time_ms = Math.round(performance.now() - t0);

  if (insertError) {
    const err = new Error(insertError.message || "Review insert failed");
    Object.assign(err, { response_time_ms });
    throw err;
  }
  if (!createdRow?.id) {
    const err = new Error("Review insert returned no id");
    Object.assign(err, { response_time_ms });
    throw err;
  }

  return { response_time_ms };
}

async function executeUserLoginCheck(): Promise<{ response_time_ms: number }> {
  const email = process.env.SYSTEM_CHECK_USER_EMAIL?.trim() ?? "";
  const password = process.env.SYSTEM_CHECK_USER_PASSWORD?.trim() ?? "";
  const { supabaseUrl } = getServerEnv();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!email || !password || !anonKey) {
    const err = new Error(
      "SYSTEM_CHECK_USER_EMAIL, SYSTEM_CHECK_USER_PASSWORD, and NEXT_PUBLIC_SUPABASE_ANON_KEY are required for user_login check",
    );
    Object.assign(err, { response_time_ms: 0 });
    throw err;
  }

  const anon = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const t0 = performance.now();
  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  const response_time_ms = Math.round(performance.now() - t0);

  if (error || !data.session) {
    const err = new Error(error?.message ?? "signInWithPassword failed");
    Object.assign(err, { response_time_ms });
    throw err;
  }

  return { response_time_ms };
}

async function expectHttpStatus(
  origin: string,
  path: string,
  init: RequestInit,
  allowed: number[],
): Promise<{ response_time_ms: number; snippet: string }> {
  const url = `${origin}${path}`;
  const t0 = performance.now();
  const res = await fetch(url, init);
  const response_time_ms = Math.round(performance.now() - t0);
  const snippet = (await res.text()).slice(0, 240);
  if (!allowed.includes(res.status)) {
    const err = new Error(
      `HTTP ${res.status} (expected one of: ${allowed.join(", ")}). Body: ${snippet}`,
    );
    Object.assign(err, { response_time_ms });
    throw err;
  }
  return { response_time_ms, snippet };
}

type CheckDef = {
  name: string;
  group: string;
  run: (ctx: {
    supabase: SupabaseClient;
    origin: string;
  }) => Promise<{ response_time_ms: number; message: string }>;
};

function buildCheckDefinitions(): CheckDef[] {
  return [
    {
      name: "core_supabase_env",
      group: "core",
      run: async () => {
        getServerEnv();
        return { response_time_ms: 0, message: "NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY present" };
      },
    },
    {
      name: "core_anon_key",
      group: "core",
      run: async () => {
        const k = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
        if (!k) {
          throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is missing (needed for auth smoke + login check)");
        }
        return { response_time_ms: 0, message: "Anon key configured" };
      },
    },
    {
      name: "core_database_read",
      group: "core",
      run: async ({ supabase }) => {
        const t0 = performance.now();
        const { error } = await supabase.from("businesses").select("id").limit(1);
        const response_time_ms = Math.round(performance.now() - t0);
        if (error) {
          const err = new Error(error.message);
          Object.assign(err, { response_time_ms });
          throw err;
        }
        return { response_time_ms, message: "Readable `businesses` via service role" };
      },
    },
    {
      name: "write_review_logged_in",
      group: "reviews",
      run: async ({ supabase }) => {
        const r = await executeWriteReviewLoggedInCheck(supabase);
        return { response_time_ms: r.response_time_ms, message: "Published test review row inserted" };
      },
    },
    {
      name: "user_login",
      group: "authentication",
      run: async () => {
        const r = await executeUserLoginCheck();
        return { response_time_ms: r.response_time_ms, message: "signInWithPassword succeeded" };
      },
    },
    {
      name: "http_auth_check_email_exists",
      group: "authentication",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/auth/check-email-exists",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "not-an-email" }),
          },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Route reachable (400 on invalid email)",
        };
      },
    },
    {
      name: "http_password_reset_send_otp",
      group: "password_reset",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/auth/password-reset/send-otp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "x" }),
          },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Consumer/business forgot-password send-otp reachable (validation 400)",
        };
      },
    },
    {
      name: "http_password_reset_complete",
      group: "password_reset",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/auth/password-reset/complete",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "health-check@example.com",
              code: "000000",
              newPassword: "short",
            }),
          },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Password reset complete route reachable (validation 400)",
        };
      },
    },
    {
      name: "http_business_signup_send_code",
      group: "business_signup",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/business/signup/send-code",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "bad" }),
          },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Business signup send-code reachable (400 invalid email)",
        };
      },
    },
    {
      name: "http_business_signup_verify_code",
      group: "business_signup",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/business/signup/verify-code",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Business signup verify-code reachable (400 missing fields)",
        };
      },
    },
    {
      name: "http_business_signup_complete_profile",
      group: "business_signup",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/business/signup/complete-profile",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
          [401],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Complete profile route requires session (401 without cookies)",
        };
      },
    },
    {
      name: "http_business_claim_request",
      group: "business_claim",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/business/claim-request",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ businessId: "00000000-0000-4000-8000-000000000001" }),
          },
          [401],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Claim request route reachable (401 when not signed in)",
        };
      },
    },
    {
      name: "http_business_eligible_for_claim",
      group: "business_claim",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/business/eligible-for-claim",
          { method: "GET" },
          [401],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Eligible-for-claim route reachable (401 without session)",
        };
      },
    },
    {
      name: "http_reviews_create_auth_required",
      group: "reviews",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/reviews/create",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
          [401],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Logged-in review API reachable (401 without bearer)",
        };
      },
    },
    {
      name: "http_reviews_create_draft_guest_shape",
      group: "reviews",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/reviews/create-draft",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Guest write-review draft route reachable (400 empty body)",
        };
      },
    },
    {
      name: "http_review_drafts_create_invite_publish_shape",
      group: "review_invites",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/review-drafts/create",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Invite publish draft route reachable (400 invalid payload)",
        };
      },
    },
    {
      name: "http_review_invites_sent_list",
      group: "review_invites",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/review-invites/sent",
          { method: "GET" },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Review invites sent route reachable (400 without businessId)",
        };
      },
    },
    {
      name: "http_review_invite_email_templates",
      group: "review_invites",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/review-invite-email-templates",
          { method: "GET" },
          [200],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Invite email templates API returned 200",
        };
      },
    },
    {
      name: "http_reviews_resend_otp_shape",
      group: "reviews",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/reviews/resend-otp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draft_id: "00000000-0000-4000-8000-000000000000" }),
          },
          [404],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Resend OTP route reachable (404 for unknown draft)",
        };
      },
    },
    {
      name: "http_widgets_payload_validation",
      group: "widgets",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/widgets/payload",
          { method: "GET" },
          [400],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Widget payload API reachable (400 without business slug)",
        };
      },
    },
    {
      name: "http_widgets_embed_page",
      group: "widgets",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/widgets/embed",
          { method: "GET", headers: { Accept: "text/html" } },
          [200],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Widget embed page returns HTML 200",
        };
      },
    },
    {
      name: "http_paystack_webhook_ack",
      group: "payments",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/webhooks/paystack",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "__system_health_ping", data: {} }),
          },
          [200],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: "Paystack webhook accepts non-charge events (200 received)",
        };
      },
    },
    {
      name: "http_billing_paystack_initialize_validation",
      group: "payments",
      run: async ({ origin }) => {
        const r = await expectHttpStatus(
          origin,
          "/api/billing/paystack/initialize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          },
          [400, 500],
        );
        return {
          response_time_ms: r.response_time_ms,
          message:
            "Paystack initialize route reachable (400 missing fields, or 500 if Paystack secret invalid)",
        };
      },
    },
    {
      name: "http_widget_payload_live_business",
      group: "widgets",
      run: async ({ origin }) => {
        const slug = process.env.SYSTEM_CHECK_WIDGET_BUSINESS_SLUG?.trim() ?? "";
        if (!slug) {
          return {
            response_time_ms: 0,
            message: "Skipped — set SYSTEM_CHECK_WIDGET_BUSINESS_SLUG to assert 200 widget payload",
          };
        }
        const r = await expectHttpStatus(
          origin,
          `/api/widgets/payload?business=${encodeURIComponent(slug)}&limit=1`,
          { method: "GET" },
          [200],
        );
        return {
          response_time_ms: r.response_time_ms,
          message: `Widget payload OK for slug “${slug}”`,
        };
      },
    },
  ];
}

/**
 * Runs the full synthetic suite, persists each row to `system_checks`, and syncs `system_incidents`.
 */
export async function runSystemMonitoringChecks(): Promise<{
  results: SystemMonitoringApiResult[];
}> {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const origin = resolveMonitoringAppOrigin();
  const defs = buildCheckDefinitions();
  const results: SystemMonitoringApiResult[] = [];

  for (const d of defs) {
    let status: "ok" | "fail" = "ok";
    let response_time_ms = 0;
    let message = "";

    try {
      const r = await d.run({ supabase, origin });
      response_time_ms = r.response_time_ms;
      message = r.message;
    } catch (e: unknown) {
      status = "fail";
      message = errMessage(e);
      response_time_ms = readResponseTimeMs(e, Math.round(performance.now()));
    }

    const row = await persistSystemCheck(supabase, {
      check_name: d.name,
      check_group: d.group,
      status,
      response_time_ms,
      message,
    });

    await syncSystemIncidentAfterCheck(supabase, {
      check_name: row.check_name,
      check_group: row.check_group,
      check_status: row.status,
      message: row.message,
    });

    results.push({
      id: row.id,
      check_name: row.check_name,
      check_group: row.check_group,
      status: row.status,
      response_time_ms: row.response_time_ms,
      message: row.message,
      created_at: row.created_at,
    });
  }

  return { results };
}
