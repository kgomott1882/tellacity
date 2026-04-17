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

export type AdminCustomerMetrics = {
  logins24h: number;
  logins7d: number;
  lastOwnerActivityAt: string | null;
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
    lastOwnerActivityAt: null,
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

  const ownerByBusiness = new Map<string, string>();
  for (const r of rows) {
    if (r.owner_id) ownerByBusiness.set(r.id, r.owner_id);
  }

  const since120d = isoDaysAgo(120, now);
  const since24h = isoHoursAgo(24, now);
  const since7d = isoDaysAgo(7, now);
  const monthStart = monthStartIso(now);

  for (const id of businessIds) {
    out.set(id, emptyAdminCustomerMetrics());
  }

  const [
    { data: activityRows, error: activityErr },
    { data: widgetRows, error: widgetErr },
    { data: emailSendRows, error: emailSendErr },
    { data: emailInviteRows, error: emailInviteErr },
    { data: monthInviteRows, error: monthInviteErr },
    { data: sentInviteRows, error: sentInviteErr },
    limitResults,
  ] = await Promise.all([
    db
      .from("business_activity_logs")
      .select("business_id, user_id, action_type, created_at")
      .in("business_id", businessIds)
      .gte("created_at", since120d)
      .limit(200_000),
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

  if (activityErr && !isMissingRelationError(activityErr)) {
    console.warn("[admin customers] activity logs:", activityErr.message);
  }

  const parseTime = (iso: string | null | undefined) => {
    if (!iso) return Number.NaN;
    const t = new Date(iso).getTime();
    return Number.isFinite(t) ? t : Number.NaN;
  };

  for (const raw of activityRows ?? []) {
    const row = raw as {
      business_id?: string;
      user_id?: string | null;
      action_type?: string;
      created_at?: string;
    };
    const bid = String(row.business_id ?? "");
    if (!bid || !out.has(bid)) continue;
    const m = out.get(bid)!;
    const ownerId = ownerByBusiness.get(bid);
    const uid = row.user_id ? String(row.user_id) : "";
    const isOwner = ownerId && uid === ownerId;
    const at = row.created_at ?? "";
    const action = String(row.action_type ?? "");

    if (isOwner && action === "dashboard_login") {
      const t = parseTime(at);
      if (Number.isFinite(t) && t >= parseTime(since24h)) m.logins24h += 1;
      if (Number.isFinite(t) && t >= parseTime(since7d)) m.logins7d += 1;
    }

    if (isOwner) {
      const t = parseTime(at);
      if (Number.isFinite(t)) {
        const prev = m.lastOwnerActivityAt ? parseTime(m.lastOwnerActivityAt) : 0;
        if (t > prev) m.lastOwnerActivityAt = at;
      }
    }

    if (
      isOwner &&
      OWNER_DASHBOARD_ENGAGEMENT_ACTIONS.has(action) &&
      parseTime(at) >= parseTime(since7d)
    ) {
      m.dashboardEvents7d += 1;
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
