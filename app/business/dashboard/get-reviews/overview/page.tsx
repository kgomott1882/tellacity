"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import RatingStars from "@/components/RatingStars";
import QRCode from "react-qr-code";
import { Download } from "lucide-react";

const INVITATION_METHODS_PATH = "/business/dashboard/get-reviews/invitation-methods";
const SENT_PAGE_SIZE = 25;

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
  const { selectedBusiness } = useBusinessContext();
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
      const res = await fetch("/api/review-invites/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
        }),
      });

      if (!res.ok) {
        setMonthlyUsage(0);
        return;
      }

      const data = await res.json();

      setMonthlyUsage(data.monthlyCount);
      setMonthlyLimit(data.limit);
    } catch (err) {
      console.error("Usage fetch failed:", err);
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
  const remainingInvites = Math.max(monthlyLimit - monthlyUsage, 0);
  const isLimitReached = monthlyUsage >= monthlyLimit;
  const canSetUpInvites = !!businessId && !isLimitReached;

  const handleSetUpInvitations = () => {
    if (!canSetUpInvites) return;
    router.push(INVITATION_METHODS_PATH);
  };

  const fetchMetrics = async () => {
    if (!businessId) return;

    await ensureSessionFresh();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const supabase = supabaseBrowser();

    const { count: sentThisMonth } = await supabase
      .from("review_invites")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .not("sent_at", "is", null)
      .gte("sent_at", startOfMonth.toISOString());

    const { count: deliveredThisMonth } = await supabase
      .from("review_invites")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .not("opened_at", "is", null)
      .gte("opened_at", startOfMonth.toISOString());

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

    setMetrics({
      sentThisMonth: sentThisMonth ?? 0,
      deliveredThisMonth: deliveredThisMonth ?? 0,
      totalPublishedReviews,
      reviewsThisMonth,
      averageRatingLifetime,
      averageRatingThisMonth,
    });
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

        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("review_invites")
          .select(
            `
              id,
              recipient_email,
              channel,
              created_at,
              sent_at,
              opened_at,
              review_submitted_at
            `
          )
          .eq("business_id", businessId)
          .not("sent_at", "is", null)
          .order("created_at", { ascending: false })
          .range(offset, offset + SENT_PAGE_SIZE - 1);

        if (error) {
          console.error("Error fetching invites:", error);
          setSentItems([]);
          setHasMoreSent(false);
          setSentOffset(0);
          return;
        }

        const rows = Array.isArray(data) ? data : [];
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
        console.error("Unexpected invite fetch error:", err);
        setSentItems([]);
        setHasMoreSent(false);
        setSentOffset(0);
      } finally {
        setLoading(false);
      }
    },
    [businessId]
  );

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
          fetchMetrics();
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
  }, [businessId]);

  const reviewUrl = selectedBusiness?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : "https://tellacity.com"}/b/${selectedBusiness.slug}/write-review`
    : "";

  function downloadQR() {
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
      <h1 className="text-2xl font-semibold">Get reviews – Overview</h1>
      <p className="mt-2 text-sm text-gray-500">
        Collect verified customer feedback through automated invites.
      </p>

      <PlanStatusBanner plan={normalizedPlan} />

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
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Invitations sent this month
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">
              {monthlyUsage} / {monthlyLimit}
            </div>
            <div className="mt-1 text-xs text-gray-400">
              {remainingInvites} remaining this month
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Delivered
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
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Reviews generated
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
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Average rating
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
      </div>

      {/* Section B - Invites sent */}
      <div
        id="invites-sent"
        className="scroll-mt-24 mt-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-base font-semibold text-gray-900">
          Invites sent
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
          <h2 className="text-base font-semibold text-gray-900">
            Collect reviews offline
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Use a direct link or printable QR code to collect reviews in-store or at events.
          </p>
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
            {/* QR code */}
            <div className="flex-shrink-0 rounded-xl border border-gray-200 bg-white p-5 shadow-sm inline-flex flex-col items-center gap-3">
              <QRCode id="review-qr-overview" value={reviewUrl} size={220} />
              <span className="text-xs text-gray-400">Scan to leave a review</span>
            </div>
            {/* URL + download */}
            <div className="flex flex-col gap-4 flex-1">
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">Review link</p>
                <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <span className="flex-1 truncate text-sm text-gray-700">{reviewUrl}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={downloadQR}
                className="inline-flex items-center gap-2 self-start rounded-lg bg-[#124541] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0f3a35] transition"
              >
                <Download size={15} />
                Download QR as PNG
              </button>
              <p className="text-sm text-gray-400">
                Ideal for storefronts, packaging, receipts, or printed marketing material.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section D - Smart action block */}
      <div className="mt-10 rounded-xl border border-gray-200 bg-gray-50 p-8">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Start collecting verified reviews
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-600">
            Automate invitations and turn completed transactions into trusted
            public feedback.
          </p>
          <button
            type="button"
            disabled={!canSetUpInvites}
            onClick={handleSetUpInvitations}
            className={`mt-6 rounded-lg px-8 py-3 font-medium text-white transition ${
              !canSetUpInvites
                ? "cursor-not-allowed bg-gray-400"
                : "bg-[#124541] hover:bg-[#0f3a35]"
            }`}
          >
            Set up automated invitations
          </button>
        </div>
      </div>
    </div>
  );
}
