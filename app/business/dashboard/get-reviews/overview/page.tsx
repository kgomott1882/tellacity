"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { dashboardApiGet, dashboardApiPost } from "@/lib/dashboardApiFetch";
import {
  canUseCustomEmail,
  normalizePlanCodeToKey,
  type PlanKey,
} from "@/lib/plans";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import {
  GrowUnlockButton,
  GrowUnlockError,
} from "@/components/dashboard/GrowUnlockCta";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";
import { useGrowUnlockCta } from "@/hooks/useGrowUnlockCta";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";
import RatingStars from "@/components/RatingStars";
import QRCode from "react-qr-code";
import { Download } from "lucide-react";
import { getPublicWriteReviewUrl } from "@/lib/emailBranding";
import SendEmailInviteSection from "../_components/SendEmailInviteSection";
const SENT_PAGE_SIZE = 25;
const QR_UPGRADE_FEATURE_KEY = "qr_code_reviews_overview" as const;

/** Supabase errors are often truthy but print as `{}`; avoid console.error (Next.js dev overlay). */
function formatClientFetchIssue(err: unknown): string | null {
  if (err == null) return null;
  if (typeof err !== "object") return String(err);
  const e = err as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of ["code", "message", "details", "hint"] as const) {
    const v = e[key];
    if (typeof v === "string" && v.trim()) parts.push(`${key}=${v}`);
  }
  if (parts.length) return parts.join(" ");
  try {
    const s = JSON.stringify(err);
    if (s && s !== "{}") return s;
  } catch {
    /* ignore */
  }
  return null;
}

function warnOverview(context: string, err: unknown) {
  const s = formatClientFetchIssue(err);
  if (s) console.warn(`[get-reviews/overview] ${context}:`, s);
}

function getDaysUntilReset(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const ms = next.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function formatSentAt(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${h}:${m}`;
  } catch {
    return "-";
  }
}

function formatMethod(raw: string | null | undefined): string {
  if (!raw) return "-";
  const s = String(raw).toLowerCase();
  if (s === "email") return "Email";
  if (s === "qr") return "QR";
  if (s === "api") return "API";
  return raw;
}

type SentInviteRow = {
  recipient_email?: string | null;
  invite_method?: string | null;
  channel?: string | null;
  sent_at?: string | null;
  opened_at?: string | null;
  review_submitted_at?: string | null;
  last_event_type?: string | null;
  last_event_at?: string | null;
};

export default function GetReviewsOverviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedBusiness, bumpNavRefresh } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const isOverviewRoute = pathname?.includes("/get-reviews") && (pathname?.endsWith("overview") || pathname?.endsWith("get-reviews"));

  const [loading, setLoading] = useState(true);
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(0);
  const [daysUntilReset, setDaysUntilReset] = useState<number>(() => getDaysUntilReset());
  const [metrics, setMetrics] = useState({
    sentThisMonth: 0,
    deliveredThisMonth: 0,
    totalPublishedReviews: 0,
    reviewsThisMonth: 0,
    averageRatingLifetime: 0,
    averageRatingThisMonth: 0,
  });
  const [viewMode, setViewMode] = useState<"monthly" | "funnel">("monthly");
  const [sentItems, setSentItems] = useState<SentInviteRow[]>([]);
  const ROW_HEIGHT = 56; // approximate row height
  const MIN_ROWS = 6;
  const [isExpanded, setIsExpanded] = useState(false);
  const [sentOffset, setSentOffset] = useState<number>(0);
  const [hasMoreSent, setHasMoreSent] = useState<boolean>(true);
  const fetchUsage = useCallback(async () => {
    if (!businessId) {
      setMonthlyUsage(0);
      setMonthlyLimit(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await dashboardApiPost<{
        monthlyCount: number;
        limit: number;
        sentThisMonth?: number;
        deliveredThisMonth?: number;
      }>("/api/review-invites/usage", { businessId });

      setMonthlyUsage(data.monthlyCount);
      setMonthlyLimit(data.limit);
      setMetrics((prev) => ({
        ...prev,
        sentThisMonth: data.sentThisMonth ?? prev.sentThisMonth,
        deliveredThisMonth: data.deliveredThisMonth ?? prev.deliveredThisMonth,
      }));
    } catch (err) {
      warnOverview("usage fetch", err);
      setMonthlyUsage(0);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchUsage();
  }, [businessId, fetchUsage]);

  useEffect(() => {
    if (isOverviewRoute) {
      setDaysUntilReset(getDaysUntilReset());
      fetchUsage();
    }
  }, [isOverviewRoute, fetchUsage]);

  useEffect(() => {
    const onVisible = () => {
      setDaysUntilReset(getDaysUntilReset());
      if (document.visibilityState === "visible") fetchUsage();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchUsage]);

  useEffect(() => {
    const interval = setInterval(() => setDaysUntilReset(getDaysUntilReset()), 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const normalizedPlan: PlanKey = normalizePlanCodeToKey(selectedBusiness?.plan);
  const canQrReviews = canUseCustomEmail(normalizedPlan);

  const growUnlockUsage = useGrowUnlockCta({
    businessId,
    currentPlan: normalizedPlan,
    trialEligible: selectedBusiness?.trialEligible === true,
    subscriptionStatus: selectedBusiness?.subscriptionStatus,
    onTrialStarted: bumpNavRefresh,
    paidDestination: {
      type: "href",
      href: "/business/dashboard/settings/usage",
    },
  });

  const growUnlockQr = useGrowUnlockCta({
    businessId,
    currentPlan: normalizedPlan,
    trialEligible: selectedBusiness?.trialEligible === true,
    subscriptionStatus: selectedBusiness?.subscriptionStatus,
    onTrialStarted: bumpNavRefresh,
    paidDestination: {
      type: "action",
      run: () => {
        if (businessId) {
          logDashboardActivityClient({
            businessId,
            action: "feature_locked_clicked",
            metadata: { feature: QR_UPGRADE_FEATURE_KEY, destination: "pricing_plans" },
          });
        }
        router.push("/business/dashboard/settings/usage");
      },
    },
  });

  const remainingInvites = Math.max(monthlyLimit - monthlyUsage, 0);
  const isLimitReached = monthlyUsage >= monthlyLimit;
  const nearMonthlyInviteLimit =
    monthlyLimit > 0 && monthlyUsage / monthlyLimit > 0.8 && !isLimitReached;
  const moderateInviteUsageNudge =
    monthlyLimit > 0 &&
    monthlyUsage / monthlyLimit > 0.5 &&
    !nearMonthlyInviteLimit &&
    !isLimitReached;
  const openQrUpgradeModal = () => {
    growUnlockQr.onClick();
  };

  const fetchMetrics = async () => {
    if (!businessId) return;

    await ensureSessionFresh();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const supabase = supabaseBrowser();

    const { data: lifetimeReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("business_id", businessId)
      .eq("status", "published");

    const totalPublishedReviews = lifetimeReviews?.length ?? 0;

    const averageRatingLifetime =
      totalPublishedReviews > 0
        ? (lifetimeReviews ?? []).reduce(
            (acc: number, r: { rating: number }) => acc + (r.rating ?? 0),
            0
          ) / totalPublishedReviews
        : 0;

    const { data: monthlyReviews } = await supabase
      .from("reviews")
      .select("rating")
      .eq("business_id", businessId)
      .eq("status", "published")
      .gte("created_at", startOfMonth.toISOString());

    const reviewsThisMonth = monthlyReviews?.length ?? 0;

    const averageRatingThisMonth =
      reviewsThisMonth > 0
        ? (monthlyReviews ?? []).reduce(
            (acc: number, r: { rating: number }) => acc + (r.rating ?? 0),
            0
          ) / reviewsThisMonth
        : 0;

    setMetrics((prev) => ({
      ...prev,
      totalPublishedReviews,
      reviewsThisMonth,
      averageRatingLifetime,
      averageRatingThisMonth,
    }));
  };

  const fetchSentInvites = useCallback(
    async (offset: number, append: boolean) => {
      setLoading(true);
      try {
        if (!businessId) {
          setSentItems([]);
          setHasMoreSent(false);
          setSentOffset(0);
          return;
        }

        await ensureSessionFresh();

        const path = `/api/review-invites/sent?businessId=${encodeURIComponent(
          businessId
        )}&limit=${SENT_PAGE_SIZE}&offset=${offset}`;

        const json = await dashboardApiGet<{
          items: Array<{
            id: string;
            recipient_email?: string | null;
            channel?: string | null;
            created_at?: string | null;
            sent_at?: string | null;
            opened_at?: string | null;
            review_submitted_at?: string | null;
          }>;
        }>(path);

        const rows = Array.isArray(json.items) ? json.items : [];
        const mapped: SentInviteRow[] = rows.map((row: any) => ({
          recipient_email: row.recipient_email ?? null,
          invite_method: row.channel ?? null,
          channel: row.channel ?? null,
          sent_at: row.sent_at ?? row.created_at ?? null,
          opened_at: row.opened_at ?? null,
          review_submitted_at: row.review_submitted_at ?? null,
          last_event_type: row.review_submitted_at
            ? "Completed"
            : row.opened_at
              ? "Opened"
              : "Sent",
          last_event_at: row.review_submitted_at ?? row.opened_at ?? null,
        }));

        setSentItems((prev) => (append ? [...prev, ...mapped] : mapped));
        setHasMoreSent(mapped.length >= SENT_PAGE_SIZE);
        setSentOffset(offset + mapped.length);
      } catch (err) {
        warnOverview("invite fetch (unexpected)", err);
        setSentItems([]);
        setHasMoreSent(false);
        setSentOffset(0);
      } finally {
        setLoading(false);
      }
    },
    [businessId]
  );

  const refreshAfterInviteSent = useCallback(() => {
    void fetchUsage();
    void fetchSentInvites(0, false);
  }, [fetchUsage, fetchSentInvites]);

  const handleLoadMoreSent = () => {
    if (!businessId || loading || !hasMoreSent) return;
    fetchSentInvites(sentOffset, true);
  };

  useEffect(() => {
    if (!businessId) return;
    fetchSentInvites(0, false);
  }, [businessId, fetchSentInvites]);

  useEffect(() => {
    if (!businessId) return;
    fetchMetrics();
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;

    const supabase = supabaseBrowser();
    const channel = supabase
      .channel("review-metrics-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "review_invite_events",
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          void fetchUsage();
          void fetchSentInvites(0, false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reviews",
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, fetchUsage, fetchSentInvites]);

  const reviewOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://tellacity.com";
  const reviewUrl = selectedBusiness?.slug
    ? getPublicWriteReviewUrl(reviewOrigin, selectedBusiness.slug)
    : "";

  function downloadQR() {
    if (!canQrReviews) return;
    const svg = document.getElementById("review-qr-overview");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const img = new Image();
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 240, 240);
      ctx.drawImage(img, 0, 0, 240, 240);
      const link = document.createElement("a");
      link.download = "tellacity-review-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  if (!businessId || !selectedBusiness) return null;

  return (
    <div>
      <h1 className="text-2xl font-semibold">Invitations</h1>
      <p className="mt-2 text-sm text-gray-500">
        Send invites, track performance, and collect verified customer feedback.
      </p>

      <PlanStatusBanner
        plan={normalizedPlan}
        businessId={businessId ?? ""}
        trialEligible={selectedBusiness?.trialEligible === true}
        subscriptionStatus={selectedBusiness?.subscriptionStatus}
        trialEndsAt={selectedBusiness?.trialEndsAt}
        onTrialStarted={bumpNavRefresh}
      />

      {/* Section A - KPI strip */}
      <div className="mt-8">
        <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-700">
          <button
            type="button"
            onClick={() => setViewMode("monthly")}
            className="inline-flex items-center gap-2"
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                viewMode === "monthly"
                  ? "border-gray-900"
                  : "border-gray-300"
              }`}
            >
              {viewMode === "monthly" && (
                <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
              )}
            </span>
            <span className={viewMode === "monthly" ? "font-semibold text-gray-900" : "text-gray-600"}>
              Monthly performance
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("funnel")}
            className="inline-flex items-center gap-2"
          >
            <span
              className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
                viewMode === "funnel"
                  ? "border-gray-900"
                  : "border-gray-300"
              }`}
            >
              {viewMode === "funnel" && (
                <span className="h-2.5 w-2.5 rounded-full bg-gray-900" />
              )}
            </span>
            <span className={viewMode === "funnel" ? "font-semibold text-gray-900" : "text-gray-600"}>
              Overall funnel health
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-wide text-gray-500">
              <span>Invitations sent this month</span>
              <AvailableToUseLabel />
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {monthlyUsage} / {monthlyLimit}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {remainingInvites} remaining this month
            </div>
            {moderateInviteUsageNudge ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" role="status">
                <p className="text-xs font-medium text-emerald-900">
                  You&apos;re actively collecting reviews. Upgrade your plan to accelerate growth.
                </p>
                <GrowUnlockButton {...growUnlockUsage} variant="compact" />
              </div>
            ) : null}
            {nearMonthlyInviteLimit ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between" role="status">
                <p className="text-xs font-medium text-amber-800">
                  You&apos;re close to your limit. New review requests will stop when you hit your
                  cap. Upgrade before then to avoid interruptions in your review flow.
                </p>
                <GrowUnlockButton {...growUnlockUsage} variant="compact" />
              </div>
            ) : null}
            <GrowUnlockError message={growUnlockUsage.errorMessage} className="mt-2" />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-wide text-gray-500">
              <span>Delivered</span>
              <AvailableToUseLabel />
            </div>
            <>
              <div className="mt-2 text-2xl font-semibold text-gray-900">
                {metrics.deliveredThisMonth}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {metrics.deliveredThisMonth} delivered this month
              </div>
            </>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-wide text-gray-500">
              <span>Reviews generated</span>
              <AvailableToUseLabel />
            </div>
            {viewMode === "monthly" ? (
              <>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {metrics.reviewsThisMonth}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {metrics.reviewsThisMonth} reviews this month
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {metrics.totalPublishedReviews}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Total published reviews
                </div>
              </>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-wide text-gray-500">
              <span>Average rating</span>
              <AvailableToUseLabel />
            </div>
            {viewMode === "monthly" ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl font-semibold text-gray-900">
                    {metrics.averageRatingThisMonth > 0
                      ? metrics.averageRatingThisMonth.toFixed(1)
                      : "-"}
                  </span>
                  {metrics.averageRatingThisMonth > 0 && (
                    <RatingStars rating={metrics.averageRatingThisMonth} size={14} />
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {metrics.reviewsThisMonth > 0
                    ? `From ${metrics.reviewsThisMonth} published reviews this month`
                    : "No published reviews this month"}
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-2xl font-semibold text-gray-900">
                    {metrics.averageRatingLifetime > 0
                      ? metrics.averageRatingLifetime.toFixed(1)
                      : "-"}
                  </span>
                  {metrics.averageRatingLifetime > 0 && (
                    <RatingStars rating={metrics.averageRatingLifetime} size={14} />
                  )}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {metrics.totalPublishedReviews > 0
                    ? `From ${metrics.totalPublishedReviews} published reviews`
                    : "No published reviews yet"}
                </div>
              </>
            )}
          </div>
        </div>
        {monthlyUsage > 0 ? (
          <p className="mt-4 text-xs text-gray-500" role="status">
            You&apos;re actively collecting reviews. Keep the momentum going.
          </p>
        ) : null}
      </div>

      <SendEmailInviteSection
        businessId={businessId}
        plan={selectedBusiness.plan}
        trialEligible={selectedBusiness.trialEligible === true}
        subscriptionStatus={selectedBusiness.subscriptionStatus}
        onTrialStarted={bumpNavRefresh}
        onInviteSent={refreshAfterInviteSent}
      />

      {/* Section B - Invites sent */}
      <div
        id="invites-sent"
        className="scroll-mt-24 mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-gray-900">
          Invites sent
          <AvailableToUseLabel />
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          See every invite you've sent and when it was sent.
        </p>
        {sentItems.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No invites sent yet.</p>
        ) : (
          <>
            <div
              className="mt-4 pr-2 transition-all duration-300"
              style={
                isExpanded
                  ? { maxHeight: "none" }
                  : { maxHeight: MIN_ROWS * ROW_HEIGHT, overflowY: "auto" }
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="pb-3 pr-4 font-medium">Email</th>
                      <th className="pb-3 pr-4 font-medium">Method</th>
                      <th className="pb-3 pr-4 font-medium">Sent</th>
                      <th className="pb-3 font-medium">Latest status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sentItems.map((row, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        <td className="py-3 pr-4 text-gray-900">
                          {row.recipient_email ?? "-"}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {formatMethod(row.invite_method ?? row.channel)}
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {formatSentAt(row.sent_at)}
                        </td>
                        <td className="py-3">
                          <span className="text-gray-700">
                            {row.last_event_type ?? "-"}
                          </span>
                          {row.last_event_at && (
                            <span className="ml-1 block text-xs text-gray-400">
                              {formatSentAt(row.last_event_at)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {sentItems.length > MIN_ROWS && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="text-teal-600 hover:text-teal-700 text-sm font-medium transition"
                >
                  {isExpanded ? "Close" : "Show all"}
                </button>
              </div>
            )}
            {hasMoreSent && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleLoadMoreSent}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Section C - QR code */}
      {reviewUrl && (
        <div className="mt-10 rounded-xl border-2 border-[#2fb2a8] bg-white p-6 shadow-sm">
          <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-gray-900">
            Collect reviews offline
            {canQrReviews ? <AvailableToUseLabel /> : null}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Use your public review link anywhere, or print a QR code for counters, tables, packaging,
            and events. Grow unlocks high-resolution download and full offline collection.
          </p>
          <div
            className={`relative mt-6 min-h-[min(340px,50vh)] overflow-hidden rounded-xl border border-gray-100 bg-gray-50/40 ${
              !canQrReviews ? "md:min-h-[280px]" : ""
            }`}
          >
            <div className="flex flex-col gap-6 p-4 sm:p-5 md:flex-row md:items-start">
              <div
                className={`flex-shrink-0 inline-flex flex-col ${
                  !canQrReviews ? "pointer-events-none select-none" : ""
                }`}
              >
                <div className="inline-flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <QRCode id="review-qr-overview" value={reviewUrl} size={220} />
                  <span className="text-xs text-gray-500">Scan to leave a review</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <div className={!canQrReviews ? "select-text" : ""}>
                  <p className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <span>Review link</span>
                    {!canQrReviews ? <AvailableToUseLabel /> : null}
                  </p>
                  <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
                    <span className="flex-1 truncate text-sm text-gray-800">{reviewUrl}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (canQrReviews) downloadQR();
                    else openQrUpgradeModal();
                  }}
                  className={`inline-flex items-center gap-2 self-start rounded-lg px-4 py-2.5 text-sm font-medium text-white transition ${
                    !canQrReviews
                      ? "bg-[#124541] shadow-md hover:bg-[#0f3a35]"
                      : "bg-[#124541] hover:bg-[#0f3a35]"
                  }`}
                >
                  <Download size={15} />
                  Download QR as PNG
                </button>
                <p
                  className={`text-sm leading-relaxed text-gray-600 ${
                    !canQrReviews ? "pointer-events-none select-none" : ""
                  }`}
                >
                  <span className="font-medium text-gray-800">Where teams use this:</span> front desk
                  displays, table tents, delivery inserts, thank-you cards, trade booths, and receipt
                  footers, anywhere a quick scan is easier than typing a URL.
                </p>
              </div>
            </div>

            {!canQrReviews ? (
              <>
                <div
                  className="absolute inset-4 z-20 rounded-xl bg-neutral-950/35 backdrop-blur-[2px] sm:inset-5 md:inset-6"
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-4 z-30 flex items-center justify-center p-2 sm:inset-5 sm:p-3 md:inset-6 md:p-4">
                  <div
                    className="pointer-events-auto max-h-[min(92vh,calc(100%-1.5rem))] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-neutral-900/85 px-7 py-7 text-left shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-black/20 backdrop-blur-md sm:px-8 sm:py-8"
                    role="region"
                    aria-label="Offline QR review collection requires an upgrade"
                  >
                    <p className="text-center text-2xl" aria-hidden>
                      🔒
                    </p>
                    <h3 className="mt-1 text-center text-lg font-semibold text-neutral-100">
                      Turn foot traffic into verified reviews
                    </h3>
                    <p className="mt-2 text-center text-sm text-neutral-400">
                      Your real review link is already in the QR behind this card. Upgrade to download,
                      print, and deploy it everywhere customers see you.
                    </p>
                    <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm text-neutral-200">
                      <li className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                          ✓
                        </span>
                        <span>
                          <strong className="text-neutral-100">Print-ready PNG:</strong> one click to
                          drop the QR into posters, stickers, menus, and packaging artwork.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                          ✓
                        </span>
                        <span>
                          <strong className="text-neutral-100">Same trusted link:</strong> every scan
                          opens your public Tellacity write-review flow; no extra setup per location.
                        </span>
                      </li>
                      <li className="flex gap-2">
                        <span className="mt-0.5 shrink-0 text-[#1FAF9E]" aria-hidden>
                          ✓
                        </span>
                        <span>
                          <strong className="text-neutral-100">Works offline-first:</strong> perfect
                          for retail, hospitality, events, and field teams where email isn&apos;t the
                          moment.
                        </span>
                      </li>
                    </ul>
                    <div className="mt-6 flex flex-col items-center gap-2">
                      <GrowUnlockButton
                        {...growUnlockQr}
                        className="inline-flex w-full items-center justify-center rounded-lg bg-[#1FAF9E] px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-[#2fb2a8] sm:w-auto"
                      />
                      <GrowUnlockError message={growUnlockQr.errorMessage} className="w-full text-center" />
                      <p className="text-center text-xs text-neutral-500">
                        After upgrading, use <strong className="text-neutral-400">Download QR as PNG</strong>{" "}
                        on the right. It activates instantly.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

    </div>
  );
}
