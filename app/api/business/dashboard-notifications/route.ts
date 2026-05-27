import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canAccessBusiness,
  resolveDashboardDb,
} from "@/lib/supabase/businessDashboardServer";
import {
  PLAN_PHOTO_LIMITS,
  getActivePlanKeyForBusinessResult,
  getPhotoLimitForPlan,
  type PlanKey,
} from "@/lib/plans";
import {
  FREE_PLAN_PHOTO_RETENTION_DAYS,
  finalWarningCutoffIso,
  photoExpiresAtIso,
} from "@/lib/businessPhotoExpiry";

/**
 * Minimum lifetime `dashboard_login` events before the
 * `photos_free_limit_upgrade` nudge kicks in. Matches the product
 * description: the upgrade nudge only fires once the owner has "logged
 * in and out of the dashboard a few times" and clearly returns to use it.
 */
const PHOTOS_UPGRADE_NUDGE_MIN_LOGINS = 3;

export const runtime = "nodejs";

type DashboardNotification = {
  key: string;
  title: string;
  description: string;
  href: string;
  priority: number;
  created_at: string;
  always_show?: boolean;
};

function isMissingRelationError(error: unknown): boolean {
  const e = (error ?? {}) as { code?: string; message?: string };
  const code = String(e.code ?? "");
  const msg = String(e.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST204" ||
    msg.includes("relation") && msg.includes("does not exist")
  );
}

function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function last24HoursIso(now = new Date()): string {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
}

async function loadReadKeys(
  db: SupabaseClient,
  businessId: string,
  userId: string
): Promise<Set<string>> {
  const { data, error } = await db
    .from("business_dashboard_notification_reads")
    .select("notification_key")
    .eq("business_id", businessId)
    .eq("user_id", userId);

  if (error) {
    if (isMissingRelationError(error)) return new Set<string>();
    throw error;
  }

  const out = new Set<string>();
  for (const row of data ?? []) {
    const k = String((row as { notification_key?: string }).notification_key ?? "").trim();
    if (k) out.add(k);
  }
  return out;
}

function parseIntCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.floor(value));
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Math.max(0, Math.floor(Number(value)));
  }
  return 0;
}

function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return "recently";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "recently";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeSinceLabel(fromIso: string | null | undefined, now = new Date()): string {
  if (!fromIso) return "a while";
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return "a while";
  const diffMs = Math.max(0, now.getTime() - from.getTime());
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"}`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const businessId = url.searchParams.get("businessId")?.trim() ?? "";
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId." }, { status: 400 });
    }

    const auth = await resolveDashboardDb(req);
    if (!auth.ok) return auth.response;

    const allowed = await canAccessBusiness(auth.db, auth.userId, businessId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const [
      { data: business, error: businessErr },
      { count: publishedReviewCount },
      { count: sentThisMonthCount },
      { count: loginCount24h },
      unrepliedSummary,
      latestInviteRow,
      widgetGeneratedCount,
      emailWidgetSendsCount,
      emailWidgetInviteCount,
      photoCountResult,
      loginLifetimeCount,
      planResolution,
      expiringPhotosResult,
    ] = await Promise.all([
        auth.db
          .from("businesses")
          .select("id, logo_url, description, category_slug, address, city, country_code, created_at")
          .eq("id", businessId)
          .maybeSingle(),
        auth.db
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("status", "published"),
        auth.db
          .from("review_invite_events")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("event_type", "invitation_sent")
          .gte("created_at", monthStartIso()),
        auth.db
          .from("business_activity_logs")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("user_id", auth.userId)
          .eq("action_type", "dashboard_login")
          .gte("created_at", last24HoursIso()),
        auth.db
          .from("reviews")
          .select("id, created_at")
          .eq("business_id", businessId)
          .eq("status", "published")
          .is("owner_response", null)
          .order("created_at", { ascending: true })
          .limit(1),
        auth.db
          .from("review_invite_events")
          .select("created_at")
          .eq("business_id", businessId)
          .eq("event_type", "invitation_sent")
          .order("created_at", { ascending: false })
          .limit(1),
        auth.db
          .from("business_activity_logs")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("action_type", "widget_generated"),
        auth.db
          .from("email_widget_sends")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId),
        auth.db
          .from("review_invites")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("source", "email_widget"),
        // Total photos uploaded to `business_photos` for this business, matches
        // the upload API's plan-cap check (`status`-agnostic). Drives both the
        // "no photos yet" nudge and the Free-plan "upgrade for more photos" nudge.
        auth.db
          .from("business_photos")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId),
        // Lifetime `dashboard_login` events for this owner + business. Used
        // to gate the upgrade nudge until the owner has returned a few times.
        auth.db
          .from("business_activity_logs")
          .select("id", { count: "exact", head: true })
          .eq("business_id", businessId)
          .eq("user_id", auth.userId)
          .eq("action_type", "dashboard_login"),
        // Current plan key (free / grow / premium / elite).
        getActivePlanKeyForBusinessResult(businessId, auth.db),
        // Photos already past the 29-day retention warning cutoff. Free-plan
        // photos become eligible for automatic removal at 30 days from
        // `created_at`, so anything that clears the warning cutoff drives
        // the "photos will be removed within 24 hours" urgent notice. The
        // free plan cap is tiny (≤4), so limit(100) is well over any real
        // per-business volume.
        auth.db
          .from("business_photos")
          .select("id, created_at")
          .eq("business_id", businessId)
          .lte("created_at", finalWarningCutoffIso())
          .order("created_at", { ascending: true })
          .limit(100),
      ]);

    if (businessErr) {
      return NextResponse.json({ error: businessErr.message }, { status: 500 });
    }
    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    const createdAt = String((business as { created_at?: string | null }).created_at ?? new Date().toISOString());
    const logoUrl = String((business as { logo_url?: string | null }).logo_url ?? "").trim();
    const description = String((business as { description?: string | null }).description ?? "").trim();
    const categorySlug = String((business as { category_slug?: string | null }).category_slug ?? "").trim();
    const address = String((business as { address?: string | null }).address ?? "").trim();
    const city = String((business as { city?: string | null }).city ?? "").trim();
    const countryCode = String((business as { country_code?: string | null }).country_code ?? "").trim();

    const notifications: DashboardNotification[] = [];

    const profileItemsMissing = [logoUrl ? 0 : 1, description ? 0 : 1].reduce((a, b) => a + b, 0);
    if (profileItemsMissing > 0) {
      notifications.push({
        key: "profile_incomplete",
        title: "Your public profile is incomplete",
        description:
          profileItemsMissing > 1
            ? "Add your logo and business description to build trust."
            : "Complete your profile details to improve conversions.",
        href: "/business/dashboard/settings/business-profile",
        priority: 100,
        created_at: createdAt,
      });
    }

    if (!categorySlug) {
      notifications.push({
        key: "categories_missing",
        title: "Manage your company's categories",
        description: "Select categories so customers can discover your business.",
        href: "/business/dashboard/settings/categories",
        priority: 90,
        created_at: createdAt,
      });
    }

    if (!address || !city || !countryCode) {
      notifications.push({
        key: "registration_address_missing",
        title: "Confirm your business registration address",
        description: "Add address details to strengthen your profile credibility.",
        href: "/business/dashboard/settings/business-profile",
        priority: 80,
        created_at: createdAt,
      });
    }

    const publishedCount = parseIntCount(publishedReviewCount);
    const invitesThisMonth = parseIntCount(sentThisMonthCount);

    const logins24h = parseIntCount(loginCount24h);
    if (logins24h >= 1) {
      notifications.push({
        key: "login_count_24h",
        title:
          logins24h === 1
            ? "You've logged in 1 time in the last 24 hours"
            : `You've logged in ${logins24h} times in the last 24 hours`,
        description: "Automate invitations to turn activity into more reviews.",
        href: "/business/dashboard/get-reviews/overview",
        priority: 60,
        created_at: new Date().toISOString(),
        always_show: true,
      });
    }

    const latestInviteAt =
      Array.isArray(latestInviteRow.data) && latestInviteRow.data.length > 0
        ? String((latestInviteRow.data[0] as { created_at?: string | null }).created_at ?? "")
        : null;
    const referenceIso = latestInviteAt || createdAt;
    const hoursSinceInvite = (() => {
      if (!referenceIso) return Number.POSITIVE_INFINITY;
      const ref = new Date(referenceIso);
      if (Number.isNaN(ref.getTime())) return Number.POSITIVE_INFINITY;
      return (Date.now() - ref.getTime()) / (60 * 60 * 1000);
    })();

    const hoursSinceLastInvite = (() => {
      if (!latestInviteAt) return Number.POSITIVE_INFINITY;
      const ref = new Date(latestInviteAt);
      if (Number.isNaN(ref.getTime())) return Number.POSITIVE_INFINITY;
      return (Date.now() - ref.getTime()) / (60 * 60 * 1000);
    })();
    const sentInviteInLast48h = Boolean(latestInviteAt) && hoursSinceLastInvite < 48;
    const coldStartNoInvites = publishedCount === 0 && invitesThisMonth === 0;
    const inviteCadenceQuiet = hoursSinceInvite >= 48;

    if (!sentInviteInLast48h && (coldStartNoInvites || inviteCadenceQuiet)) {
      let description: string;
      if (latestInviteAt) {
        const since = timeSinceLabel(latestInviteAt);
        description = `No invites sent in the last 48 hours (last sent ${since} ago). Monthly allocations don't roll over, send more to keep collecting reviews.`;
      } else if (inviteCadenceQuiet) {
        description = `You haven't sent any invites yet (${timeSinceLabel(createdAt)} since setup). Invites reset each calendar month, use them to grow reviews and visibility.`;
      } else {
        description =
          "Review invites reset each calendar month and don't roll over. Send invitations now to start collecting reviews and strengthen your online presence.";
      }
      notifications.push({
        key: "review_invites_nudge",
        title: "Use your review invitations",
        description,
        href: "/business/dashboard/get-reviews/invitation-methods",
        priority: 82,
        created_at: new Date().toISOString(),
      });
    }

    const widgetsUsedCount = parseIntCount(widgetGeneratedCount);
    const emailWidgetSentCount = emailWidgetSendsCount.error
      ? 0
      : parseIntCount(emailWidgetSendsCount.count);
    const emailWidgetInvitesCount = emailWidgetInviteCount.error
      ? 0
      : parseIntCount(emailWidgetInviteCount.count);
    const hasAnyWidgetUsage =
      widgetsUsedCount > 0 || emailWidgetSentCount > 0 || emailWidgetInvitesCount > 0;
    if (!hasAnyWidgetUsage) {
      notifications.push({
        key: "widgets_not_used_yet",
        title: "You have not used widgets yet",
        description: "Use your widgets to maximize your online backlinks SEO.",
        href: "/business/dashboard/share/widgets",
        priority: 84,
        created_at: new Date().toISOString(),
        always_show: true,
      });
    }

    // Photo-upload nudges:
    //  1) "No photos uploaded yet", any plan, no rows in `business_photos`.
    //  2) "Upgrade for more photos", Free plan, hit the free cap, AND the
    //     owner has logged in a few times (engaged, not a drive-by signup).
    // `photoCountResult` / `loginLifetimeCount` already handle their own
    // errors below via `parseIntCount` + explicit `.error` checks so a
    // missing / restricted table never breaks the rest of the feed.
    const photoCount = photoCountResult.error
      ? 0
      : parseIntCount(photoCountResult.count);
    const photoTableAvailable = !photoCountResult.error;
    const lifetimeLogins = loginLifetimeCount.error
      ? 0
      : parseIntCount(loginLifetimeCount.count);
    const activePlanKey: PlanKey = planResolution.ok ? planResolution.plan : "free";
    const freePhotoCap = PLAN_PHOTO_LIMITS.free;
    const photoCapForPlan = getPhotoLimitForPlan(activePlanKey);

    if (photoTableAvailable && photoCount < photoCapForPlan) {
      const remaining = photoCapForPlan - photoCount;
      const remainingLabel = remaining === 1 ? "1 slot" : `${remaining} slots`;
      notifications.push({
        key: "photos_upload_capacity",
        title:
          photoCount === 0
            ? "Showcase your business with photos"
            : `Fill your photo gallery (${remainingLabel} left)`,
        description:
          photoCount === 0
            ? "You haven't uploaded any photos yet. Add images of your team, workspace, or work, profiles with photos get more trust and engagement."
            : `You've used ${photoCount} of ${photoCapForPlan} photos on your plan (${remainingLabel} remaining). Add more to stand out while you still have room.`,
        href: "/business/dashboard/settings/photos",
        priority: 75,
        created_at: createdAt,
      });
    }

    if (
      photoTableAvailable &&
      activePlanKey === "free" &&
      photoCount >= freePhotoCap &&
      lifetimeLogins >= PHOTOS_UPGRADE_NUDGE_MIN_LOGINS
    ) {
      notifications.push({
        key: "photos_free_limit_upgrade",
        title: "Unlock more photos, your profile is getting noticed",
        description:
          "You've used all of your free photo slots. Visitors are viewing your business page, upgrade your plan to upload more photos and keep them engaged.",
        href: "/business/dashboard/billing?source=upload_limit",
        priority: 78,
        created_at: new Date().toISOString(),
        always_show: true,
      });
    }

    // Free-plan 30-day photo retention notices:
    //   1) `photos_free_retention_policy`, informational nudge shown to
    //      any free-plan business that has uploaded at least one photo but
    //      nothing is in the final warning window yet. Dismissible.
    //   2) `photos_free_expiring_24h`, urgent, always-visible warning
    //      once any photo crosses the 29-day threshold. Copy names the
    //      count and the earliest cutoff so the owner can decide before
    //      the deletion sweep runs.
    // Photo retention is re-evaluated at query time from `created_at` +
    // the resolved plan, upgrading to any paid plan instantly hides both
    // nudges on the next refresh.
    const expiringPhotoRows = expiringPhotosResult.error
      ? []
      : ((expiringPhotosResult.data ?? []) as Array<{
          id?: string;
          created_at?: string | null;
        }>);
    const expiringPhotoCount = expiringPhotoRows.length;
    const earliestExpiringCreatedAt =
      expiringPhotoRows[0]?.created_at ?? null;
    const earliestExpiresAtIso = photoExpiresAtIso(
      earliestExpiringCreatedAt,
    );

    if (
      photoTableAvailable &&
      activePlanKey === "free" &&
      photoCount > 0 &&
      expiringPhotoCount === 0
    ) {
      notifications.push({
        key: "photos_free_retention_policy",
        title: `Free-plan photos are removed after ${FREE_PLAN_PHOTO_RETENTION_DAYS} days`,
        description: `Photos uploaded on the Free plan are automatically removed ${FREE_PLAN_PHOTO_RETENTION_DAYS} calendar days after upload. Upgrade to any paid plan to keep them live for good.`,
        href: "/business/dashboard/billing?source=upload_limit",
        priority: 55,
        created_at: createdAt,
      });
    }

    if (
      photoTableAvailable &&
      activePlanKey === "free" &&
      expiringPhotoCount > 0
    ) {
      const photosLabel = expiringPhotoCount === 1 ? "photo" : "photos";
      const cutoffLabel = formatDateShort(earliestExpiresAtIso);
      notifications.push({
        key: "photos_free_expiring_24h",
        title: `${expiringPhotoCount} ${photosLabel} will be removed within 24 hours`,
        description: `Your Free-plan ${photosLabel} on this profile ${
          expiringPhotoCount === 1 ? "is" : "are"
        } about to hit the ${FREE_PLAN_PHOTO_RETENTION_DAYS}-day retention cutoff (earliest on ${cutoffLabel}). Upgrade now to keep ${
          expiringPhotoCount === 1 ? "it" : "them"
        } live, otherwise the photo${
          expiringPhotoCount === 1 ? "" : "s"
        } will be removed and you'll need to re-upload after the window rolls over.`,
        href: "/business/dashboard/billing?source=upload_limit",
        priority: 96,
        created_at: new Date().toISOString(),
        always_show: true,
      });
    }

    const oldestUnreplied = Array.isArray(unrepliedSummary.data) ? unrepliedSummary.data[0] : null;
    const unrepliedCountHead = await auth.db
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "published")
      .is("owner_response", null);
    const unrepliedCount = parseIntCount(unrepliedCountHead.count);
    if (unrepliedCount > 0) {
      const oldestDate = formatDateShort(
        oldestUnreplied ? String((oldestUnreplied as { created_at?: string | null }).created_at ?? "") : null
      );
      const receivedLabel = publishedCount === 1 ? "1 review received" : `${publishedCount} reviews received`;
      const pendingLabel = unrepliedCount === 1 ? "1 needs reply" : `${unrepliedCount} need replies`;
      notifications.push({
        key: "reviews_pending_reply",
        title:
          unrepliedCount === 1
            ? "1 review needs a reply"
            : `${unrepliedCount} reviews need replies`,
        description: `${receivedLabel}; ${pendingLabel}. Oldest pending from ${oldestDate}.`,
        href: "/business/dashboard/manage-reviews",
        priority: 95,
        created_at: new Date().toISOString(),
        always_show: true,
      });
    }

    const dedup = new Map<string, DashboardNotification>();
    for (const n of notifications) dedup.set(n.key, n);
    const candidates = Array.from(dedup.values()).sort((a, b) => b.priority - a.priority);

    const readKeys = await loadReadKeys(auth.db, businessId, auth.userId);
    const items = candidates.map((item) => ({
      ...item,
      read: item.always_show ? false : readKeys.has(item.key),
    }));
    const unreadCount = items.filter((i) => !i.read).length;

    return NextResponse.json({ items, unreadCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      businessId?: string;
      action?: "mark_one_read" | "mark_all_read";
      key?: string;
    };
    const businessId = typeof body.businessId === "string" ? body.businessId.trim() : "";
    const action = body.action;
    const key = typeof body.key === "string" ? body.key.trim() : "";

    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId." }, { status: 400 });
    }
    if (action !== "mark_one_read" && action !== "mark_all_read") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    if (action === "mark_one_read" && !key) {
      return NextResponse.json({ error: "Missing key." }, { status: 400 });
    }

    const auth = await resolveDashboardDb(req);
    if (!auth.ok) return auth.response;
    const allowed = await canAccessBusiness(auth.db, auth.userId, businessId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const nowIso = new Date().toISOString();
    if (action === "mark_one_read") {
      const { error } = await auth.db
        .from("business_dashboard_notification_reads")
        .upsert(
          {
            business_id: businessId,
            user_id: auth.userId,
            notification_key: key,
            read_at: nowIso,
          },
          { onConflict: "business_id,user_id,notification_key" }
        );
      if (error) {
        if (isMissingRelationError(error)) {
          return NextResponse.json(
            { error: "Notifications table missing. Run the latest Supabase migration." },
            { status: 500 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    const { items } = await (await GET(req)).json().catch(() => ({ items: [] as Array<{ key?: string; read?: boolean }> }));
    const unreadKeys = (Array.isArray(items) ? items : [])
      .filter((i) => i && i.read === false && typeof i.key === "string")
      .map((i) => String(i.key));

    if (unreadKeys.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const rows = unreadKeys.map((notificationKey) => ({
      business_id: businessId,
      user_id: auth.userId,
      notification_key: notificationKey,
      read_at: nowIso,
    }));

    const { error } = await auth.db
      .from("business_dashboard_notification_reads")
      .upsert(rows, { onConflict: "business_id,user_id,notification_key" });

    if (error) {
      if (isMissingRelationError(error)) {
        return NextResponse.json(
          { error: "Notifications table missing. Run the latest Supabase migration." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
