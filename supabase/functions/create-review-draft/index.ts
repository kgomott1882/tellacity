/// <reference lib="deno.ns" />
/** Deploy after edits: `supabase functions deploy create-review-draft`
 *  Set secrets: NEXT_PUBLIC_APP_URL (app origin), SUPABASE_SERVICE_ROLE_KEY (for owner notify POST).
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...extraHeaders,
    },
  });
}

function isUuid(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/** Row is an unpublished OTP / in-progress review */
function rowIsDraft(row: {
  draft?: boolean | null;
}): boolean {
  return row.draft === true;
}

/**
 * A review that would count as “already on the business profile” for duplicate UX:
 * published workflow + visible (not moderated hidden).
 */
function rowIsPublicLiveReview(row: {
  draft?: boolean | null;
  status?: string | null;
  visibility?: string | null;
}): boolean {
  if (row.draft === true) return false;
  const st = row.status;
  if (st && st !== "published") return false;
  const vis = String(row.visibility ?? "visible").trim().toLowerCase();
  return vis === "visible";
}

/** Business-level review (not an item / product_photo review). */
function isGeneralBusinessReviewRow(row: {
  product_photo_id?: string | null;
}): boolean {
  const p = row.product_photo_id;
  if (p == null) return true;
  if (typeof p === "string" && p.trim() === "") return true;
  return false;
}

/** Mirrors app `reviewBusinessSelfReview`, block reviews from the business’s website / work domain. */
const GENERIC_CONSUMER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "aol.com",
  "gmx.com",
  "gmx.de",
  "web.de",
  "yandex.com",
  "mail.com",
  "zoho.com",
]);

function normalizeWebsiteHost(input: string): string {
  if (!input) return "";
  let value = input.trim().toLowerCase();
  while (/^https?:\/\//.test(value)) {
    value = value.replace(/^https?:\/\//, "");
  }
  value = value.replace(/\/+$/, "");
  value = value.split("/")[0] ?? value;
  while (value.startsWith("www.")) {
    value = value.slice(4);
  }
  return value;
}

function extractEmailHost(emailLower: string): string | null {
  const e = emailLower.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1 || at === e.length - 1) return null;
  return e.slice(at + 1).trim() || null;
}

function isGenericConsumerDomain(d: string): boolean {
  return GENERIC_CONSUMER_DOMAINS.has(d.trim().toLowerCase());
}

function domainIsUnder(org: string, cand: string): boolean {
  const o = org.trim().toLowerCase();
  const c = cand.trim().toLowerCase();
  if (!o || !c) return false;
  if (c === o) return true;
  return c.endsWith("." + o);
}

function buildBusinessDomainSetEdge(row: {
  email?: string | null;
  website?: string | null;
  website_display?: string | null;
}): { domains: Set<string>; contactEmailLower: string | null } {
  const out = new Set<string>();
  const add = (raw: string) => {
    const d = normalizeWebsiteHost(raw);
    if (d) out.add(d);
  };
  add(String(row.website_display ?? ""));
  add(String(row.website ?? ""));
  const contact = String(row.email ?? "").trim().toLowerCase();
  if (contact.includes("@")) {
    const host = extractEmailHost(contact);
    if (host && !isGenericConsumerDomain(host)) {
      add(host);
    }
  }
  return { domains: out, contactEmailLower: contact || null };
}

function isReviewerBlockedEdge(
  reviewerEmailLower: string,
  domains: Set<string>,
  contactEmailLower: string | null,
): boolean {
  const rev = reviewerEmailLower.trim().toLowerCase();
  if (!rev.includes("@")) return false;
  if (
    contactEmailLower &&
    rev === contactEmailLower.trim().toLowerCase()
  ) {
    return true;
  }
  const rd = extractEmailHost(rev);
  if (!rd) return false;
  for (const bd of domains) {
    if (!bd) continue;
    if (domainIsUnder(bd, rd)) return true;
  }
  return false;
}

async function jsonIfSameDomainAsBusiness(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  reviewerEmailLower: string,
): Promise<Response | null> {
  const { data, error } = await supabase
    .from("businesses")
    .select("email, website, website_display")
    .eq("id", businessId)
    .maybeSingle();
  if (error || !data) return null;
  const ctx = buildBusinessDomainSetEdge(
    data as {
      email?: string | null;
      website?: string | null;
      website_display?: string | null;
    },
  );
  if (
    isReviewerBlockedEdge(
      reviewerEmailLower,
      ctx.domains,
      ctx.contactEmailLower,
    )
  ) {
    return json(
      {
        error:
          "You can’t use a work email for this business. Please leave a review from a personal email address.",
        error_code: "same_domain_as_business",
      },
      403,
    );
  }
  return null;
}

/**
 * Inserts `review_received` (service role). Awaited so rows appear before the HTTP response.
 * Temporary debug logs ,  remove when stable.
 */
/** Same owner email as Next.js `notifyBusinessOwnerOfNewReview` (service-role → app API). */
async function fireNotifyOwnerFromEdge(p: {
  businessId: string;
  reviewId: string;
  rating: number;
}): Promise<void> {
  const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL")?.trim();
  const sr = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!appUrl || !sr) {
    if (!appUrl) {
      console.error("review-owner-notify: NEXT_PUBLIC_APP_URL is not set");
    }
    return;
  }
  try {
    const url = `${appUrl.replace(/\/$/, "")}/api/internal/review-owner-notify`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sr}`,
      },
      body: JSON.stringify({
        business_id: p.businessId,
        review_id: p.reviewId,
        rating: p.rating,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("review-owner-notify HTTP", res.status, t);
    }
  } catch (e) {
    console.error("review-owner-notify fetch", e);
  }
}

/** Returns true when the activity row was inserted (caller may notify after publish). */
async function logReviewReceivedEdge(
  supabase: ReturnType<typeof createClient>,
  p: {
    businessId: string;
    userId: string | null;
    reviewId: string;
    rating: number;
  },
): Promise<boolean> {
  const { businessId, reviewId, rating } = p;
  console.log("LOGGING review_received", {
    businessId,
    reviewId,
    rating,
  });
  try {
    const { error } = await supabase.from("business_activity_logs").insert({
      business_id: businessId,
      action_type: "review_received",
      metadata: { review_id: reviewId, rating },
    });
    if (error) {
      console.error("LOG FAILED", error);
      return false;
    }
    console.log("LOG SUCCESS");
    return true;
  } catch (error) {
    console.error("LOG FAILED", error);
    return false;
  }
}

function logInviteConvertedEdge(
  supabase: ReturnType<typeof createClient>,
  p: {
    businessId: string;
    userId: string | null;
    inviteId: string;
    reviewId: string;
  },
): void {
  void (async () => {
    try {
      const { error } = await supabase.from("business_activity_logs").insert({
        business_id: p.businessId,
        user_id: p.userId,
        action_type: "invite_converted",
        metadata: { invite_id: p.inviteId, review_id: p.reviewId },
      });
      if (error) console.error("invite_converted log failed:", error.message);
    } catch (e) {
      console.error("invite_converted log failed:", e);
    }
  })();
}

type DraftPayload = {
  business_id?: string;
  rating?: number;
  title?: string | null;
  body?: string;
  guest_name?: string;
  guest_email?: string;
  date_of_experience?: string | null;
  marketing_opt_in?: boolean | null;
  receipt_url?: string | null;
  reference_number?: string | null;
  invite_id?: string | null;
  /** When true with valid `invite_token`, publish without OTP (invite link flow). */
  is_invite?: boolean;
  invite_token?: string | null;
};

serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceKey) {
      console.error("Missing Supabase env", {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!serviceKey,
      });
      return json({ error: "Missing Supabase env" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const anonKeyEnv = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const authHeader = req.headers.get("Authorization") ?? "";
    let authedUser: { id: string; email?: string | null } | null = null;
    if (authHeader.startsWith("Bearer ")) {
      const bearer = authHeader.slice(7).trim();
      if (bearer && bearer !== anonKeyEnv && bearer !== serviceKey) {
        const { data: userData, error: authGetUserErr } = await supabase.auth
          .getUser(bearer);
        if (authGetUserErr) {
          console.error("create-review-draft auth.getUser error:", authGetUserErr);
        } else if (userData?.user) {
          authedUser = userData.user;
        }
      }
    }

    let payload: DraftPayload;
    try {
      payload = (await req.json()) as DraftPayload;
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    // Basic payload validation
    if (!payload || typeof payload !== "object") {
      return json({ error: "Invalid payload" }, 400);
    }

    const business_id = (payload.business_id ?? "").trim();
    if (!isUuid(business_id)) {
      return json({ error: "business_id must be a valid UUID" }, 400);
    }

    const { data: bizStatusRow, error: bizStatusErr } = await supabase
      .from("businesses")
      .select("status")
      .eq("id", business_id)
      .maybeSingle();
    if (bizStatusErr || !bizStatusRow) {
      return json({ error: "business_not_found" }, 404);
    }
    const st = String(
      (bizStatusRow as { status?: string | null }).status ?? "active",
    )
      .trim()
      .toLowerCase();
    if (st !== "active") {
      return json(
        {
          error: "business_suspended",
          message:
            "This business has been suspended and is no longer available on Tellacity.",
        },
        403,
      );
    }

    const ratingNum = Number(payload.rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return json({ error: "rating must be between 1 and 5" }, 400);
    }

    const body = (payload.body ?? "").trim();
    if (!body) {
      return json({ error: "body is required" }, 400);
    }

    const guest_name = (payload.guest_name ?? "").trim();
    if (!guest_name) {
      return json({ error: "guest_name is required" }, 400);
    }

    const guest_email = (payload.guest_email ?? "").trim().toLowerCase();
    if (!guest_email || !guest_email.includes("@")) {
      return json({ error: "guest_email must be a valid email" }, 400);
    }

    const reviewerEmailForDomain =
      authedUser?.email?.trim().toLowerCase() || guest_email;
    const sameDomainBlock = await jsonIfSameDomainAsBusiness(
      supabase,
      business_id,
      reviewerEmailForDomain,
    );
    if (sameDomainBlock) return sameDomainBlock;

    let date_of_experience: string | null = null;
    if (payload.date_of_experience && payload.date_of_experience.trim()) {
      const d = payload.date_of_experience.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return json({ error: "date_of_experience must be YYYY-MM-DD" }, 400);
      }
      const parsed = new Date(d);
      if (Number.isNaN(parsed.getTime())) {
        return json({ error: "date_of_experience is invalid" }, 400);
      }
      date_of_experience = d;
    }

    const marketing_opt_in = payload.marketing_opt_in ?? false;
    const receipt_url =
      payload.receipt_url && payload.receipt_url.trim()
        ? payload.receipt_url.trim()
        : null;
    const reference_number =
      payload.reference_number && payload.reference_number.trim()
        ? payload.reference_number.trim()
        : null;

    const is_invite = Boolean(payload.is_invite);
    const invite_token_raw =
      typeof payload.invite_token === "string" ? payload.invite_token.trim() : "";

    // ── Invite link: publish immediately (no OTP) ───────────────────────────
    if (is_invite) {
      if (!invite_token_raw) {
        return json({ error: "invite_token_required" }, 400);
      }

      const { data: inv, error: invErr } = await supabase
        .from("review_invites")
        .select(
          "id, business_id, recipient_email, review_submitted_at, expires_at",
        )
        .eq("token", invite_token_raw)
        .maybeSingle();

      if (invErr || !inv) {
        return json({ error: "invalid_invite" }, 400);
      }

      if (inv.business_id !== business_id) {
        return json({ error: "invalid_invite" }, 400);
      }

      const invEmail = String(inv.recipient_email ?? "").trim().toLowerCase();
      if (!invEmail) {
        return json({ error: "invalid_invite" }, 400);
      }
      if (authedUser) {
        const uEmail = String(authedUser.email ?? "").trim().toLowerCase();
        if (!uEmail || uEmail !== invEmail) {
          return json({ error: "invalid_invite" }, 400);
        }
      } else if (invEmail !== guest_email) {
        return json({ error: "invalid_invite" }, 400);
      }

      if (inv.review_submitted_at) {
        return json({ error: "invite_used" }, 400);
      }

      if (inv.expires_at) {
        const exp = new Date(String(inv.expires_at));
        if (!Number.isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
          return json({ error: "invite_expired" }, 400);
        }
      }

      const inviteRowId = (inv as { id: string }).id;

      const userIdForReview: string | null = authedUser ? authedUser.id : null;
      const guestEmailForReview: string | null = authedUser ? null : guest_email;

      const titleVal =
        payload.title && payload.title.trim()
          ? payload.title.trim()
          : null;

      const publishedUpdateRow: Record<string, unknown> = {
        rating: ratingNum,
        title: titleVal,
        body,
        guest_name,
        user_id: userIdForReview,
        guest_email: guestEmailForReview,
        date_of_experience,
        marketing_opt_in,
        receipt_url,
        reference_number,
        status: "published",
        draft: false,
        visibility: "visible",
        invite_id: inviteRowId,
        updated_at: new Date().toISOString(),
      };
      if (!userIdForReview) {
        publishedUpdateRow.source = "guest";
      }

      const publishedInsertRow: Record<string, unknown> = {
        business_id,
        rating: ratingNum,
        title: titleVal,
        body,
        guest_name,
        user_id: userIdForReview,
        guest_email: guestEmailForReview,
        date_of_experience,
        marketing_opt_in,
        receipt_url,
        reference_number,
        status: "published",
        draft: false,
        visibility: "visible",
        invite_id: inviteRowId,
      };
      if (!userIdForReview) {
        publishedInsertRow.source = "guest";
      }

      const markInviteSubmitted = async (): Promise<boolean> => {
        const ts = new Date().toISOString();
        const { error: invUpErr } = await supabase
          .from("review_invites")
          .update({
            review_submitted_at: ts,
            status: "completed",
          })
          .eq("id", inviteRowId);
        if (invUpErr) {
          console.error("REVIEW INVITE UPDATE ERROR:", invUpErr);
          return false;
        }
        return true;
      };

      type ListRow = {
        id: string;
        status?: string | null;
        draft?: boolean | null;
        visibility?: string | null;
        created_at?: string | null;
        product_photo_id?: string | null;
      };

      let list: ListRow[] = [];
      if (authedUser) {
        const [uRes, gRes] = await Promise.all([
          supabase
            .from("reviews")
            .select("id, status, draft, visibility, created_at, product_photo_id")
            .eq("business_id", business_id)
            .eq("user_id", authedUser.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("reviews")
            .select("id, status, draft, visibility, created_at, product_photo_id")
            .eq("business_id", business_id)
            .eq("guest_email", invEmail)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);
        const existingInviteError = uRes.error ?? gRes.error;
        if (existingInviteError) {
          console.error(
            "Invite flow existing review lookup failed:",
            existingInviteError,
          );
          return json({ error: "unexpected_error" }, 500);
        }
        const map = new Map<string, ListRow>();
        for (const r of [...(uRes.data ?? []), ...(gRes.data ?? [])]) {
          if (r?.id) map.set(r.id, r as ListRow);
        }
        list = [...map.values()].sort(
          (a, b) =>
            new Date(String(b.created_at ?? 0)).getTime() -
            new Date(String(a.created_at ?? 0)).getTime(),
        );
      } else {
        const { data: existingRows, error: existingInviteError } = await supabase
          .from("reviews")
          .select("id, status, draft, visibility, created_at, product_photo_id")
          .eq("business_id", business_id)
          .eq("guest_email", guest_email)
          .order("created_at", { ascending: false })
          .limit(20);

        if (existingInviteError) {
          console.error(
            "Invite flow existing review lookup failed:",
            existingInviteError,
          );
          return json({ error: "unexpected_error" }, 500);
        }
        list = (existingRows ?? []) as ListRow[];
      }

      const draftRow = list.find(
        (r) => rowIsDraft(r) && isGeneralBusinessReviewRow(r),
      );
      if (draftRow?.id) {
        const { error: upErr } = await supabase
          .from("reviews")
          .update(publishedUpdateRow)
          .eq("id", draftRow.id);

        if (upErr) {
          console.error("Invite flow publish draft error:", upErr);
          return json({ error: "unexpected_error" }, 500);
        }

        if (!(await markInviteSubmitted())) {
          return json({ error: "unexpected_error" }, 500);
        }

        const logged = await logReviewReceivedEdge(supabase, {
          businessId: business_id,
          userId: userIdForReview,
          reviewId: draftRow.id,
          rating: Math.round(ratingNum),
        });
        if (logged) {
          await fireNotifyOwnerFromEdge({
            businessId: business_id,
            reviewId: draftRow.id,
            rating: Math.round(ratingNum),
          });
        }
        logInviteConvertedEdge(supabase, {
          businessId: business_id,
          userId: userIdForReview,
          inviteId: inviteRowId,
          reviewId: draftRow.id,
        });

        return json(
          {
            published: true,
            requiresOtp: false,
            reviewId: draftRow.id,
          },
          200,
        );
      }

      const liveRow = list.find(
        (r) =>
          rowIsPublicLiveReview(r) && isGeneralBusinessReviewRow(r),
      );
      if (liveRow?.id) {
        return json(
          {
            requiresUpdate: true,
            reviewId: liveRow.id,
          },
          200,
        );
      }

      // Hidden / non-live rows still tied to this email: republish in place so the invite
      // succeeds (business page may show 0 visible reviews while a hidden row existed).
      const salvageRow = list.find(
        (r) =>
          isGeneralBusinessReviewRow(r) && !rowIsPublicLiveReview(r),
      );
      if (salvageRow?.id) {
        const { error: upSalvage } = await supabase
          .from("reviews")
          .update(publishedUpdateRow)
          .eq("id", salvageRow.id);

        if (upSalvage) {
          console.error("Invite flow salvage publish error:", upSalvage);
          return json({ error: "unexpected_error" }, 500);
        }

        if (!(await markInviteSubmitted())) {
          return json({ error: "unexpected_error" }, 500);
        }

        const loggedSalvage = await logReviewReceivedEdge(supabase, {
          businessId: business_id,
          userId: userIdForReview,
          reviewId: salvageRow.id,
          rating: Math.round(ratingNum),
        });
        if (loggedSalvage) {
          await fireNotifyOwnerFromEdge({
            businessId: business_id,
            reviewId: salvageRow.id,
            rating: Math.round(ratingNum),
          });
        }
        logInviteConvertedEdge(supabase, {
          businessId: business_id,
          userId: userIdForReview,
          inviteId: inviteRowId,
          reviewId: salvageRow.id,
        });

        return json(
          {
            published: true,
            requiresOtp: false,
            reviewId: salvageRow.id,
          },
          200,
        );
      }

      const { data: publishedRow, error: pubErr } = await supabase
        .from("reviews")
        .insert(publishedInsertRow)
        .select("id,business_id")
        .single();

      if (pubErr) {
        console.error("REVIEW INSERT ERROR:", pubErr);
        const anyErr = pubErr as { code?: string; message?: string };
        if (anyErr?.code === "23505") {
          return json({ error: "duplicate_review" }, 409);
        }
        return json(
          { error: anyErr.message ?? "unexpected_error" },
          500,
        );
      }

      if (!publishedRow?.id) {
        return json({ error: "unexpected_error" }, 500);
      }

      if (!(await markInviteSubmitted())) {
        return json({ error: "unexpected_error" }, 500);
      }

      const loggedInsert = await logReviewReceivedEdge(supabase, {
        businessId: business_id,
        userId: userIdForReview,
        reviewId: publishedRow.id,
        rating: Math.round(ratingNum),
      });
      if (loggedInsert) {
        await fireNotifyOwnerFromEdge({
          businessId: business_id,
          reviewId: publishedRow.id,
          rating: Math.round(ratingNum),
        });
      }
      logInviteConvertedEdge(supabase, {
        businessId: business_id,
        userId: userIdForReview,
        inviteId: inviteRowId,
        reviewId: publishedRow.id,
      });

      return json(
        {
          published: true,
          requiresOtp: false,
          reviewId: publishedRow.id,
        },
        200,
      );
    }

    const invite_idRaw =
      payload.invite_id && payload.invite_id.trim()
        ? payload.invite_id.trim()
        : null;
    const invite_id =
      invite_idRaw && isUuid(invite_idRaw) ? invite_idRaw : null;

    // Check for an existing published review for this business + guest email
    const { data: guestRows, error: existingError } = await supabase
      .from("reviews")
      .select("id, status, draft, visibility, created_at, product_photo_id")
      .eq("business_id", business_id)
      .eq("guest_email", guest_email)
      .order("created_at", { ascending: false })
      .limit(20);

    if (existingError) {
      console.error("Existing review lookup failed:", existingError);
      return json({ error: "unexpected_error" }, 500);
    }

    const guestList = guestRows ?? [];

    const { data: pendingDraftRow, error: pendingDraftErr } = await supabase
      .from("review_drafts")
      .select("id")
      .eq("business_id", business_id)
      .eq("email", guest_email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pendingDraftErr) {
      console.error("review_drafts lookup failed:", pendingDraftErr);
      return json({ error: "unexpected_error" }, 500);
    }

    if (pendingDraftRow?.id) {
      return json(
        {
          error: "draft_exists",
          draft_id: pendingDraftRow.id,
        },
        409,
      );
    }

    const guestLive = guestList.find(
      (r) =>
        rowIsPublicLiveReview(r) && isGeneralBusinessReviewRow(r),
    );
    if (guestLive?.id) {
      return json(
        {
          requiresUpdate: true,
          reviewId: guestLive.id,
        },
        200,
      );
    }

    const draftInsert: Record<string, unknown> = {
      business_id,
      rating: ratingNum,
      title:
        payload.title && payload.title.trim()
          ? payload.title.trim()
          : null,
      body,
      email: guest_email,
      guest_name,
      date_of_experience,
      marketing_opt_in,
      receipt_url,
      reference_number,
    };

    if (invite_id) {
      draftInsert.invite_id = invite_id;
    }

    const { data: draftData, error: draftInsErr } = await supabase
      .from("review_drafts")
      .insert(draftInsert)
      .select("id")
      .single();

    if (draftInsErr || !draftData?.id) {
      console.error("review_drafts insert error:", draftInsErr);
      const anyErr = draftInsErr as { code?: string; message?: string };
      if (anyErr?.code === "23505") {
        return json({ error: "duplicate_review" }, 409);
      }
      return json({ error: "unexpected_error" }, 500);
    }

    const draftId = draftData.id as string;

    let otpRowId: string | null = null;
    try {
      const otp = generateOtp();

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { data: otpRow, error: otpError } = await supabase
        .from("review_otps")
        .insert({
          email: guest_email,
          code: otp,
          draft_id: draftId,
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (otpError || !otpRow?.id) {
        console.error("Failed to insert review_otps row:", otpError);
        await supabase.from("review_drafts").delete().eq("id", draftId);
        return json({ error: "unexpected_error" }, 500);
      }

      otpRowId = otpRow.id;

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY is not set");
        await supabase.from("review_otps").delete().eq("draft_id", draftId);
        await supabase.from("review_drafts").delete().eq("id", draftId);
        return json({ error: "unexpected_error" }, 500);
      }

      const resendFrom = Deno.env.get("RESEND_FROM_EMAIL")?.trim() ||
        "Tellacity <notifications@tellacity.com>";

      const subject = "Your verification code";
      const html =
        `<p>Your verification code is <strong>${otp}</strong></p>`;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: guest_email,
          subject,
          html,
        }),
      });

      if (!emailResponse.ok) {
        const errorBody = await emailResponse.text();
        console.error(
          "Resend OTP email error:",
          emailResponse.status,
          errorBody,
        );
        await supabase.from("review_otps").delete().eq("draft_id", draftId);
        await supabase.from("review_drafts").delete().eq("id", draftId);
        return json({ error: "unexpected_error" }, 500);
      }
    } catch (err) {
      console.error("OTP generation/email error:", err);
      if (otpRowId) {
        await supabase.from("review_otps").delete().eq("draft_id", draftId);
      }
      await supabase.from("review_drafts").delete().eq("id", draftId);
      return json({ error: "unexpected_error" }, 500);
    }

    return json(
      {
        requiresOtp: true,
        draft_id: draftId,
      },
      200,
    );
  } catch (err: any) {
    console.error("create-review-draft failed:", err);

    return json(
      {
        error: "unexpected_error",
      },
      500,
    );
  }
});

