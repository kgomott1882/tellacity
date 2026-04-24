import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getMonthlyInviteLimitForBusiness } from "@/lib/plans";

function adminServiceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

function monthStartIso(now = new Date()): string {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function isoHoursAgo(hours: number, now = new Date()): string {
  return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function isoDaysAgo(days: number, now = new Date()): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

const OWNER_DASHBOARD_ENGAGEMENT_ACTIONS = new Set([
  "dashboard_login",
  "analytics_viewed",
  "reviews_viewed",
  "invitations_viewed",
  "widgets_viewed",
  "integrations_viewed",
  "billing_viewed",
  "settings_viewed",
]);

/** Max `created_at` for "Last active" — real dashboard work only (no recipient-only noise). */
const LAST_SEEN_DASHBOARD_ACTIONS = new Set<string>([
  ...OWNER_DASHBOARD_ENGAGEMENT_ACTIONS,
  "widget_generated",
  "feature_locked_clicked",
  "profile_link_copied",
  "integration_connected",
  "mark_one_read",
  "mark_all_read",
  "review_replied",
  "invite_sent",
]);

const ACTIVITY_FETCH_PER_BUSINESS = 25_000;

async function mapInChunks<T, R>(
  items: readonly T[],
  chunkSize: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const part = await Promise.all(chunk.map((item) => fn(item)));
    out.push(...part);
  }
  return out;
}

export type AdminCustomerMetrics = {
  logins24h: number;
  logins7d: number;
  /** Latest dashboard activity from any user with access (owner, co-owner, member). */
  lastDashboardActivityAt: string | null;
  dashboardEvents7d: number;
  widgetUsed: boolean;
  widgetGeneratedCount: number;
  emailWidgetSignals: number;
  invitesSentThisMonth: number;
  inviteLimit: number;
  invitesRemaining: number;
  lastInviteSentAt: string | null;
  quiet48h: boolean;
};

export function emptyAdminCustomerMetrics(): AdminCustomerMetrics {
  return {
    logins24h: 0,
    logins7d: 0,
    lastDashboardActivityAt: null,
    dashboardEvents7d: 0,
    widgetUsed: false,
    widgetGeneratedCount: 0,
    emailWidgetSignals: 0,
    invitesSentThisMonth: 0,
    inviteLimit: 0,
    invitesRemaining: 0,
    lastInviteSentAt: null,
    quiet48h: false,
  };
}

function isMissingRelationError(error: unknown): boolean {
  const e = (error ?? {}) as { code?: string; message?: string };
  const code = String(e.code ?? "");
  const msg = String(e.message ?? "").toLowerCase();
  return (
    code === "42P01" ||
    code === "PGRST204" ||
    (msg.includes("relation") && msg.includes("does not exist"))
  );
}

export async function loadAdminCustomerMetricsMap(
  rows: Array<{
    id: string;
    owner_id: string | null;
    created_at: string | null;
  }>,
): Promise<Map<string, AdminCustomerMetrics>> {
  const out = new Map<string, AdminCustomerMetrics>();
  const db = adminServiceClient();
  const now = new Date();
  const businessIds = rows.map((r) => r.id).filter(Boolean);
  if (businessIds.length === 0) return out;

  const since120d = isoDaysAgo(120, now);
  const since24h = isoHoursAgo(24, now);
  const since7d = isoDaysAgo(7, now);
  const monthStart = monthStartIso(now);

  for (const id of businessIds) {
    out.set(id, emptyAdminCustomerMetrics());
  }

  const [
    activityChunks,
    { data: widgetRows, error: widgetErr },
    { data: emailSendRows, error: emailSendErr },
    { data: emailInviteRows, error: emailInviteErr },
    { data: monthInviteRows, error: monthInviteErr },
    { data: sentInviteRows, error: sentInviteErr },
    limitResults,
  ] = await Promise.all([
    mapInChunks(businessIds, 12, async (bid) => {
      const { data, error } = await db
        .from("business_activity_logs")
        .select("business_id, user_id, action_type, created_at")
        .eq("business_id", bid)
        .gte("created_at", since120d)
        .order("created_at", { ascending: false })
        .limit(ACTIVITY_FETCH_PER_BUSINESS);
      if (error && !isMissingRelationError(error)) {
        console.warn("[admin customers] activity logs:", bid, error.message);
      }
      return { bid, rows: (data ?? []) as Array<Record<string, unknown>> };
    }),
    db
      .from("business_activity_logs")
      .select("business_id")
      .in("business_id", businessIds)
      .eq("action_type", "widget_generated")
      .limit(100_000),
    db
      .from("email_widget_sends")
      .select("business_id")
      .in("business_id", businessIds)
      .limit(100_000),
    db
      .from("review_invites")
      .select("business_id")
      .in("business_id", businessIds)
      .eq("source", "email_widget")
      .limit(100_000),
    db
      .from("review_invites")
      .select("business_id, created_at")
      .in("business_id", businessIds)
      .gte("created_at", monthStart)
      .or("source.is.null,source.neq.email_widget")
      .limit(200_000),
    db
      .from("review_invites")
      .select("business_id, sent_at")
      .in("business_id", businessIds)
      .not("sent_at", "is", null)
      .or("source.is.null,source.neq.email_widget")
      .limit(200_000),
    Promise.all(
      businessIds.map(async (businessId) => {
        const limit = await getMonthlyInviteLimitForBusiness(businessId, db);
        return [businessId, limit] as const;
      }),
    ),
  ]);

  const parseTime = (iso: string | null | undefined) => {
    if (!iso) return Number.NaN;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : Number.NaN;
  };

  // Activity rows are scoped per business (ordered newest-first). Count
  // **any** authenticated dashboard user: `canAccessBusiness` already
  // restricts who can POST /api/business/activity-log, but only
  // `businesses.owner_id` matched before — co-owners / members never
  // advanced "Last active" or login counts.
  for (const { bid, rows } of activityChunks) {
    if (!out.has(bid)) continue;
    const m = out.get(bid)!;
    for (const raw of rows) {
      const row = raw as {
        business_id?: string;
        user_id?: string | null;
        action_type?: string;
        created_at?: string;
      };
      const at = row.created_at ?? "";
      const action = String(row.action_type ?? "");
      const t = parseTime(at);

      if (action === "dashboard_login") {
        if (Number.isFinite(t) && t >= parseTime(since24h)) m.logins24h += 1;
        if (Number.isFinite(t) && t >= parseTime(since7d)) m.logins7d += 1;
      }

      if (LAST_SEEN_DASHBOARD_ACTIONS.has(action) && Number.isFinite(t)) {
        const prev = m.lastDashboardActivityAt ? parseTime(m.lastDashboardActivityAt) : 0;
        if (t > prev) m.lastDashboardActivityAt = at;
      }

      if (
        OWNER_DASHBOARD_ENGAGEMENT_ACTIONS.has(action) &&
        Number.isFinite(t) &&
        t >= parseTime(since7d)
      ) {
        m.dashboardEvents7d += 1;
      }
    }
  }

  const bump = (bid: string, field: "widgetGeneratedCount" | "emailWidgetSignals", n = 1) => {
    if (!out.has(bid)) return;
    const m = out.get(bid)!;
    m[field] += n;
  };

  if (!widgetErr) {
    for (const raw of widgetRows ?? []) {
      const bid = String((raw as { business_id?: string }).business_id ?? "");
      if (bid) bump(bid, "widgetGeneratedCount");
    }
  } else if (!isMissingRelationError(widgetErr)) {
    console.warn("[admin customers] widget logs:", widgetErr.message);
  }

  if (!emailSendErr) {
    for (const raw of emailSendRows ?? []) {
      const bid = String((raw as { business_id?: string }).business_id ?? "");
      if (bid) bump(bid, "emailWidgetSignals");
    }
  } else if (!isMissingRelationError(emailSendErr)) {
    console.warn("[admin customers] email_widget_sends:", emailSendErr.message);
  }

  if (!emailInviteErr) {
    for (const raw of emailInviteRows ?? []) {
      const bid = String((raw as { business_id?: string }).business_id ?? "");
      if (bid) bump(bid, "emailWidgetSignals");
    }
  } else if (!isMissingRelationError(emailInviteErr)) {
    console.warn("[admin customers] email_widget invites:", emailInviteErr.message);
  }

  const monthCounts = new Map<string, number>();
  if (!monthInviteErr) {
    for (const raw of monthInviteRows ?? []) {
      const bid = String((raw as { business_id?: string }).business_id ?? "");
      if (!bid) continue;
      monthCounts.set(bid, (monthCounts.get(bid) ?? 0) + 1);
    }
  } else if (!isMissingRelationError(monthInviteErr)) {
    console.warn("[admin customers] invites month:", monthInviteErr.message);
  }

  const lastInviteByBusiness = new Map<string, string | null>();
  if (!sentInviteErr) {
    for (const raw of sentInviteRows ?? []) {
      const row = raw as { business_id?: string; sent_at?: string | null };
      const bid = String(row.business_id ?? "");
      const sentAt = row.sent_at ?? null;
      if (!bid || !sentAt) continue;
      const prev = lastInviteByBusiness.get(bid);
      if (!prev || parseTime(sentAt) > parseTime(prev)) {
        lastInviteByBusiness.set(bid, sentAt);
      }
    }
  } else if (!isMissingRelationError(sentInviteErr)) {
    console.warn("[admin customers] last sent invite:", sentInviteErr.message);
  }

  const createdByBusiness = new Map<string, string | null>();
  for (const r of rows) {
    createdByBusiness.set(r.id, r.created_at);
  }

  for (const [businessId, limit] of limitResults) {
    if (!out.has(businessId)) continue;
    const m = out.get(businessId)!;
    const sent = monthCounts.get(businessId) ?? 0;
    m.inviteLimit = Math.max(0, limit);
    m.invitesSentThisMonth = sent;
    m.invitesRemaining = Math.max(0, m.inviteLimit - sent);
  }

  for (const businessId of businessIds) {
    if (!out.has(businessId)) continue;
    const m = out.get(businessId)!;
    const lastAt = lastInviteByBusiness.get(businessId) ?? null;
    m.lastInviteSentAt = lastAt;

    const referenceIso = lastAt || createdByBusiness.get(businessId) || null;
    const refMs = parseTime(referenceIso);
    if (!Number.isFinite(refMs)) {
      m.quiet48h = true;
      continue;
    }
    const hours = (now.getTime() - refMs) / (60 * 60 * 1000);
    m.quiet48h = hours >= 48;
  }

  for (const id of businessIds) {
    const m = out.get(id)!;
    m.widgetUsed =
      m.widgetGeneratedCount > 0 || m.emailWidgetSignals > 0;
  }

  return out;
}
