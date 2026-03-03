"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useBusinessContext } from "../../_context/BusinessContext";
import { useBusinessInsights } from "@/hooks/useBusinessInsights";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { RecentReviewInvitesCard } from "../_components/RecentReviewInvitesCard";

// ─── Types ────────────────────────────────────────────────────────────────────

// Raw row from the reviews table used to build the daily activity series
type DailyReview   = { review_date: string; review_count: number };
type RecentReview  = { id: string; rating: number; title: string | null; body: string | null; created_at: string; guest_name: string | null };
type MonthlyInvite = { date: string; value: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derives reputation label and color from the backend trust_score (data.trust_score).
 *
 *  < 30  → Needs Attention   (red)
 * 30–54  → Early Stage       (blue)
 * 55–74  → Building Momentum (amber)
 * 75–89  → Strong Reputation (green)
 * ≥ 90   → Elite Reputation  (teal)
 */
function trustReputation(score: number): {
  label: string;
  border: string;
  dot: string;
  text: string;
} {
  if (score >= 90) return { label: "Elite Reputation",   border: "border-l-[#2fb2a8]",  dot: "bg-[#2fb2a8]",  text: "text-[#2fb2a8]"  };
  if (score >= 75) return { label: "Strong Reputation",  border: "border-l-emerald-400", dot: "bg-emerald-400", text: "text-emerald-400" };
  if (score >= 55) return { label: "Building Momentum",  border: "border-l-amber-400",   dot: "bg-amber-400",   text: "text-amber-400"   };
  if (score >= 30) return { label: "Early Stage",        border: "border-l-blue-400",    dot: "bg-blue-400",    text: "text-blue-400"    };
  return                   { label: "Needs Attention",   border: "border-l-red-400",     dot: "bg-red-400",     text: "text-red-400"     };
}

/**
 * Contextual helper message for the Reputation Status banner.
 * Exactly one message renders based on priority order.
 */
function reputationHelper(totalReviews: number, avgRating: number, vel: number): string {
  if (totalReviews < 5) {
    return "Limited review data. Send more invitations to build reputation accuracy and improve momentum.";
  }
  if (avgRating < 3.5) {
    return "Customer sentiment needs improvement. Focus on delivering consistent service and encouraging satisfied customers to leave feedback.";
  }
  if (vel === 0) {
    return "No recent review growth. Increase outreach to maintain visibility and strengthen your reputation.";
  }
  return "Reputation is building steadily. Continue consistent review outreach to maintain momentum.";
}

/**
 * Executive summary insight line beneath KPI cards, keyed to backend trust score.
 */
function executiveSummaryLine(score: number): string {
  if (score >= 90) return "Elite reputation achieved. Keep engaging customers to sustain this level.";
  if (score >= 75) return "Strong reputation momentum. Maintain consistent engagement.";
  if (score >= 55) return "Reputation building steadily. Continue outreach to strengthen score.";
  if (score >= 30) return "Early stage reputation. Grow review volume and invite more customers.";
  return "Reputation is in early stage. Focus on increasing review volume and consistency.";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  badge,
  sub,
  subMuted,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
  sub: string;
  subMuted?: boolean;
}) {
  return (
    <div className="relative flex flex-col rounded-xl border border-neutral-700 bg-neutral-800 p-5">
      <p className="text-xs uppercase tracking-wider text-neutral-400">{label}</p>
      {badge && <div className="absolute right-4 top-4">{badge}</div>}
      <p className="mt-3 text-4xl font-semibold leading-none text-neutral-100">{value}</p>
      <p className={`mt-2 text-xs ${subMuted ? "text-neutral-600 italic" : "text-neutral-500"}`}>{sub}</p>
    </div>
  );
}

function SentimentBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{label}</span>
        <span className="text-xs font-semibold text-neutral-100">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-neutral-700">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Sk({ h = "h-32" }: { h?: string }) {
  return <div className={`${h} animate-pulse rounded-xl bg-neutral-800`} />;
}

function SectionHeading({ title, sub, note }: { title: string; sub: string; note?: string }) {
  return (
    <div className="pt-2">
      <h2 className="text-base font-semibold text-neutral-200">{title}</h2>
      <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>
      {note && (
        <p className="mt-1 text-xs text-neutral-600 italic">{note}</p>
      )}
    </div>
  );
}

// ─── Trend Summary block ──────────────────────────────────────────────────────

type TrendData = {
  last_30: number;
  prev_30: number;
  percent_change: number;
  direction: "up" | "down" | "flat";
} | null;

function TrendSummary({ trend }: { trend: TrendData }) {
  if (!trend) return null;
  const { last_30, percent_change, direction } = trend;
  const color = direction === "up"   ? "text-emerald-400"
              : direction === "down" ? "text-red-400"
              :                        "text-neutral-400";
  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "→";
  const sign  = direction === "up" ? "+" : "";
  return (
    <div className="mb-4 flex flex-col gap-0.5">
      <p className="text-sm font-semibold text-neutral-200">
        {last_30 > 0 ? "+" : ""}{last_30} review{last_30 !== 1 ? "s" : ""} in the last 30 days
      </p>
      <p className={`text-xs font-medium ${color}`}>
        {arrow} {sign}{Math.abs(percent_change)}% vs previous 30 days
      </p>
    </div>
  );
}

// ─── UTC date helpers (no timezone drift) ────────────────────────────────────

function toUTCDateKey(input: string | Date): string {
  if (typeof input === "string") return input.slice(0, 10);
  return input.toISOString().slice(0, 10);
}

function utcDateFromKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDaysUTC(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

// ─── Adaptive Y-axis tick generator ──────────────────────────────────────────

function generateYAxisTicks(max: number): number[] {
  if (max <= 8) return Array.from({ length: max + 1 }, (_, i) => i);
  if (max <= 20) {
    const step = 2;
    return Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step);
  }
  const approxStep = Math.ceil(max / 5);
  return Array.from({ length: 6 }, (_, i) => i * approxStep);
}

// ─── Review Activity Line Chart (last 90 days) ────────────────────────────────

function ReviewActivityLineChart({ daily, totalReviews }: { daily: DailyReview[]; totalReviews: number }) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; count: number } | null>(null);
  const [lineLen, setLineLen] = useState(0);
  const [drawn,   setDrawn]   = useState(false);

  // ── Build UTC-safe lookup from backend rows ──────────────────────────────
  // DailyReview rows have review_date: "YYYY-MM-DD" — slice to 10 chars, no Date parsing.
  const dense = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of daily) {
      const key = toUTCDateKey(r.review_date);
      map.set(key, (map.get(key) ?? 0) + r.review_count);
    }

    // Build 90-day series entirely in UTC — no local timezone involvement
    const endKey      = toUTCDateKey(new Date());
    const endDateUTC  = utcDateFromKey(endKey);
    const startDateUTC = addDaysUTC(endDateUTC, -89);

    const series: { key: string; dateUTC: Date; count: number }[] = [];
    for (let i = 0; i < 90; i++) {
      const d   = addDaysUTC(startDateUTC, i);
      const key = toUTCDateKey(d);
      series.push({ key, dateUTC: d, count: map.get(key) ?? 0 });
    }
    return series;
  }, [daily]);

  // ── Spike mode: driven by 90-day window count, not all-time total ────────
  const totalReviews90d = dense.reduce((sum, p) => sum + p.count, 0);
  const isSpikeMode     = totalReviews90d < 10 || totalReviews < 10;

  const allZero  = dense.every((p) => p.count === 0);
  const maxValue = Math.max(...dense.map((p) => p.count), 0);
  const maxY     = Math.max(maxValue + 1, 3);
  const maxVal   = maxY;

  const W = 800; const H = 320;
  const PAD = { top: 24, right: 24, bottom: 40, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  // Index-based x scale (dense array is always 90 entries)
  const toX = (i: number) => PAD.left + (i / (dense.length - 1)) * chartW;
  const toY = (v: number) => PAD.top  + chartH - (v / maxVal) * chartH;

  // ── Catmull-Rom smooth path (line mode only) ──────────────────────────────
  const linePath = useMemo(() => {
    if (dense.length < 2) return "";
    const pts = dense.map((p, i) => ({ x: toX(i), y: toY(p.count) }));
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dense, maxVal]);

  // ── Closed area path for gradient fill ───────────────────────────────────
  const areaPath = useMemo(() => {
    if (!linePath) return "";
    const baseY  = PAD.top + chartH;
    const firstX = toX(0);
    const lastX  = toX(dense.length - 1);
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linePath, dense.length]);

  // ── Stroke-dashoffset draw animation ─────────────────────────────────────
  useEffect(() => {
    if (!lineRef.current) return;
    const len = lineRef.current.getTotalLength();
    setLineLen(len);
    setDrawn(false);
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, [linePath]);

  // ── X-axis: 7 evenly-spaced labels, formatted from UTC date ──────────────
  const xTicks = useMemo(() => {
    const indices = [0, 15, 30, 45, 60, 75, 89];
    return indices.map((i) => ({
      x:     toX(i),
      label: dense[i]?.dateUTC.toLocaleDateString(undefined, {
        month: "short", day: "numeric", timeZone: "UTC",
      }) ?? "",
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dense]);

  // ── Y-axis ticks ──────────────────────────────────────────────────────────
  const yTicks = generateYAxisTicks(maxY);

  // ── Dot markers for line mode (non-zero days only) ────────────────────────
  const dotPoints = useMemo(
    () => dense
      .map((p, i) => ({ ...p, xi: i }))
      .filter((p) => p.count > 0)
      .map((p) => ({ x: toX(p.xi), y: toY(p.count) })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [dense, maxVal]);

  // ── Mouse hover: snap to nearest dense point ─────────────────────────────
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect   = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx     = (e.clientX - rect.left) * scaleX;
    const idx    = Math.max(0, Math.min(dense.length - 1,
      Math.round(((mx - PAD.left) / chartW) * (dense.length - 1))
    ));
    const pt = dense[idx];
    if (!pt) return;
    setTooltip({
      x:     toX(idx),
      y:     toY(pt.count),
      // Format date from UTC Date object — no timezone drift
      label: pt.dateUTC.toLocaleDateString(undefined, {
        day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
      }),
      count: pt.count,
    });
  };

  return (
    <div className="relative w-full" style={{ minHeight: 320 }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 320 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="ralcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1FAF9E" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#1FAF9E" stopOpacity="0"    />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Y-axis grid lines + labels */}
        {yTicks.map((t) => {
          const y = toY(t);
          return (
            <g key={t}>
              <line
                x1={PAD.left} x2={W - PAD.right}
                y1={y}        y2={y}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 10} y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="#9ca3af"
                fontFamily="inherit"
              >
                {t}
              </text>
            </g>
          );
        })}

        {/* X-axis tick labels */}
        {xTicks.map(({ x, label }) => (
          <text
            key={label}
            x={x} y={H - 10}
            textAnchor="middle"
            fontSize={11}
            fill="#9ca3af"
            fontFamily="inherit"
          >
            {label}
          </text>
        ))}

        {isSpikeMode ? (
          /* ── Spike mode: vertical spikes + glowing circles on non-zero days ── */
          <g>
            {dense.map((pt, i) => {
              if (pt.count === 0) return null;
              const x     = toX(i);
              const y     = toY(pt.count);
              const baseY = toY(0);
              return (
                <g key={pt.key} filter="url(#glow)">
                  <line
                    x1={x} x2={x}
                    y1={baseY} y2={y}
                    stroke="#1FAF9E"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />
                  <circle cx={x} cy={y} r={6} fill="#1FAF9E" />
                </g>
              );
            })}
          </g>
        ) : (
          /* ── Line mode: gradient fill + animated smooth curve + dot markers ── */
          <>
            {!allZero && <path d={areaPath} fill="url(#ralcGrad)" />}

            <path
              ref={lineRef}
              d={linePath}
              fill="none"
              stroke={allZero ? "rgba(255,255,255,0.12)" : "#1FAF9E"}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={
                lineLen > 0
                  ? {
                      strokeDasharray:  lineLen,
                      strokeDashoffset: drawn ? 0 : lineLen,
                      transition:       "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
                    }
                  : undefined
              }
            />

            {!allZero && dotPoints.map((dp, i) => (
              <circle
                key={i}
                cx={dp.x} cy={dp.y}
                r={3}
                fill="#1FAF9E"
                stroke="#1a2626"
                strokeWidth={1.5}
                opacity={0.7}
              />
            ))}
          </>
        )}

        {/* Tooltip vertical crosshair + active dot at hovered count (not baseline) */}
        {tooltip && (
          <g>
            <line
              x1={tooltip.x} x2={tooltip.x}
              y1={PAD.top}    y2={PAD.top + chartH}
              stroke="#1FAF9E"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.45}
            />
            <circle
              cx={tooltip.x} cy={tooltip.y}
              r={5.5}
              fill="#1FAF9E"
              stroke="#0E0E0E"
              strokeWidth={2.5}
            />
          </g>
        )}
      </svg>

      {/* Floating tooltip card */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-xl shadow-2xl"
          style={{
            left:       `${(tooltip.x / W) * 100}%`,
            top:        `${(tooltip.y / H) * 100}%`,
            transform:  "translate(-50%, -130%)",
            background: "#0E0E0E",
            border:     "1px solid rgba(255,255,255,0.15)",
            padding:    "10px 14px",
            minWidth:   120,
            whiteSpace: "nowrap",
          }}
        >
          <p className="text-sm font-bold text-white leading-tight">
            {tooltip.count} review{tooltip.count !== 1 ? "s" : ""}
          </p>
          <p className="mt-1 text-xs text-neutral-400">{tooltip.label}</p>
        </div>
      )}
    </div>
  );
}

// ─── Invite Activity chart ────────────────────────────────────────────────────

function InviteBarChart({ data }: { data: { date: string; value: number }[] }) {
  const maxV = Math.max(...data.map((d) => d.value), 1);
  const W = 560; const H = 160;
  const PAD = { top: 10, right: 10, bottom: 28, left: 28 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW   = Math.floor((chartW / data.length) * 0.55);
  const gap    = chartW / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      {[0, Math.round(maxV / 2), maxV].map((t) => {
        const y = PAD.top + chartH - (t / maxV) * chartH;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#404040" strokeWidth={1} opacity={0.4} />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#737373">{t}</text>
          </g>
        );
      })}
      {data.map(({ date, value }, i) => {
        const cx   = PAD.left + i * gap + gap / 2;
        const barH = Math.max((value / maxV) * chartH, value > 0 ? 4 : 2);
        const bx   = cx - barW / 2;
        const by   = PAD.top + chartH - barH;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={barW} height={barH} fill="#2fb2a8" opacity={value > 0 ? 0.85 : 0.2} rx={3} />
            <text x={cx} y={H - 6} textAnchor="middle" fontSize={9} fill="#737373">{date}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Invite Activity empty state ──────────────────────────────────────────────

function InviteEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a3a3a3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </div>
      <p className="text-sm font-medium text-neutral-300">No invite activity yet</p>
      <p className="mt-1 max-w-xs text-xs text-neutral-500">
        Start sending review invitations to generate customer feedback and increase momentum.
      </p>
      <Link
        href="/business/dashboard/get-reviews/invitation-methods"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-4 py-2 text-xs font-semibold text-neutral-100 transition-colors hover:bg-neutral-600"
      >
        Send Invites
      </Link>
    </div>
  );
}

// ─── Recent Review Card ───────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={i < Math.round(rating) ? "#12B76A" : "#404040"}>
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: RecentReview }) {
  const initials = (review.guest_name ?? "?").split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
  const fmtDate  = (iso: string) => { try { return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }); } catch { return iso; } };
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xs font-semibold text-neutral-200">{initials}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-white">{review.guest_name ?? "Anonymous"}</p>
            <p className="shrink-0 text-xs text-neutral-500">{fmtDate(review.created_at)}</p>
          </div>
          <StarRow rating={review.rating} />
          {review.title && <p className="mt-1.5 text-sm font-medium text-neutral-200">{review.title}</p>}
          {review.body  && <p className="mt-1 line-clamp-3 text-xs text-neutral-400">{review.body}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const { selectedBusiness, isLoading: bizLoading } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const { data, loading, error } = useBusinessInsights(businessId);

  const [daily,           setDaily]           = useState<DailyReview[]>([]);
  const [reviews,         setReviews]         = useState<RecentReview[]>([]);
  const [inviteChart,     setInviteChart]     = useState<MonthlyInvite[]>([]);
  const [realTotalInvites, setRealTotalInvites] = useState(0);
  const [realInvites30,    setRealInvites30]    = useState(0);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    if (!businessId) { setInsightsLoading(false); return; }
    setInsightsLoading(true);
    try {
      // 90-day window in UTC — matches the chart's dense series exactly
      const since90dUTC = new Date(Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate() - 89,
      )).toISOString();
      const startOf30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const supabase = supabaseBrowser();

      const [rawReviewsRes, revRes, totalInvRes, inv30Res] = await Promise.all([
        // Fetch created_at for published/approved reviews in last 90 days — aggregated into DailyReview[] below
        supabase
          .from("reviews")
          .select("created_at")
          .eq("business_id", businessId)
          .in("status", ["published", "approved"])
          .gte("created_at", since90dUTC)
          .order("created_at", { ascending: true }),
        // Recent reviews list — published/approved only
        supabase
          .from("reviews")
          .select("id,rating,title,body,created_at,guest_name")
          .eq("business_id", businessId)
          .in("status", ["published", "approved"])
          .order("created_at", { ascending: false })
          .limit(2),
        // Total invites all time
        supabase
          .from("review_invites")
          .select("*", { count: "exact", head: true })
          .eq("business_id", businessId),
        // Invites in last 30 days
        supabase
          .from("review_invites")
          .select("*", { count: "exact", head: true })
          .eq("business_id", businessId)
          .gte("created_at", startOf30d),
      ]);

      // Aggregate raw review rows into DailyReview[] keyed by UTC date "YYYY-MM-DD"
      const dailyMap = new Map<string, number>();
      for (const row of (rawReviewsRes.data ?? []) as { created_at: string }[]) {
        // Slice the ISO string to get the UTC date — no Date() parsing, no timezone shift
        const key = row.created_at.slice(0, 10);
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
      }
      const dailyAgg: DailyReview[] = Array.from(dailyMap.entries()).map(
        ([review_date, review_count]) => ({ review_date, review_count }),
      );

      setDaily(dailyAgg);
      setReviews((revRes.data as RecentReview[]) ?? []);
      setRealTotalInvites(totalInvRes.count ?? 0);
      setRealInvites30(inv30Res.count ?? 0);

      // Build real per-month invite chart for the last 3 months
      const now = new Date();
      const monthBuckets = [2, 1, 0].map((offset) => {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        return {
          year:  d.getFullYear(),
          month: d.getMonth() + 1,
          label: d.toLocaleString("default", { month: "short" }),
          value: 0,
        };
      });
      const since3m = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
      const { data: invRows } = await supabase
        .from("review_invites")
        .select("created_at")
        .eq("business_id", businessId)
        .gte("created_at", since3m);

      if (invRows) {
        invRows.forEach((row: { created_at: string }) => {
          const d = new Date(row.created_at);
          const bucket = monthBuckets.find(
            (b) => b.year === d.getFullYear() && b.month === d.getMonth() + 1
          );
          if (bucket) bucket.value += 1;
        });
      }
      setInviteChart(monthBuckets.map(({ label, value }) => ({ date: label, value })));
    } catch (e) {
      console.error("[PerformancePage] fetchInsights error:", e);
    } finally {
      setInsightsLoading(false);
    }
  }, [businessId]);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  if (bizLoading) return null;

  const d = data;

  const avg          = d?.avg_rating ?? 0;
  const totalReviews = d?.total_reviews ?? 0;
  const vel          = d?.review_velocity_percent ?? 0;
  const dist         = d?.rating_distribution ?? {};
  const snt          = d?.sentiment ?? { positive: 0, neutral: 0, negative: 0 };
  const sntTotal     = snt.positive + snt.neutral + snt.negative;

  // Use real invite counts fetched directly from review_invites table
  const totalInvites = realTotalInvites;
  const invites30    = realInvites30;
  // Derive conversion from real counts
  const conv = totalInvites > 0 ? (totalReviews / totalInvites) * 100 : 0;

  // Trust score is canonical from the backend RPC (get_business_review_insights)
  const trustScore = d?.trust_score ?? 0;

  // Reputation label + color from frontend trust score
  const rep = trustReputation(trustScore);

  // Contextual helper message (exactly one, priority-ordered)
  const repHelper = reputationHelper(totalReviews, avg, vel);

  // Executive summary insight line
  const execLine = executiveSummaryLine(trustScore);

  const isPageLoading = loading || insightsLoading;

  // Trust Score display — always shows a number, never "--"
  const trustValue = `${trustScore} / 100`;
  const trustSub   = trustScore > 0 ? "Reputation strength index" : "Insufficient data to calculate strength.";

  // Review Velocity subtext
  const velSub = vel === 0 ? "No recent review growth" : "% growth in last 90 days";

  // Invite Conversion display
  const convValue   = totalInvites > 0 ? `${conv.toFixed(1)}%` : "0%";
  const convSub     = totalInvites > 0 ? `${totalReviews} review${totalReviews !== 1 ? "s" : ""} from ${totalInvites} invite${totalInvites !== 1 ? "s" : ""}` : "No invites sent yet";
  const convSubMuted = totalInvites === 0;

  // Low-data note for Reputation Performance section
  const repPerfNote = totalReviews < 3 ? "More reviews improve accuracy of insights." : undefined;

  // Rating Distribution low-sample note
  const ratingDistNote = totalReviews < 5;

  // Monthly Momentum guidance
  const momentumNote = totalReviews < 3;

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-neutral-900 p-6 space-y-6 rounded-xl">

      {/* Page title */}
      <div>
        <h1 className="text-xl font-bold text-neutral-100">Performance</h1>
        <p className="mt-0.5 text-xs text-neutral-500">Overview of ratings, review trends, and trust growth.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {isPageLoading ? (
        <div className="space-y-5">
          <Sk h="h-16" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map((i) => <Sk key={i} h="h-28" />)}</div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2"><Sk h="h-64" /><Sk h="h-64" /></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><Sk h="h-28" /><Sk h="h-28" /><Sk h="h-28" /></div>
          <Sk h="h-48" />
          <Sk h="h-48" />
          <Sk h="h-64" />
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════
              1) EXECUTIVE SUMMARY
          ════════════════════════════════════════════ */}

          {/* Reputation Status Banner — only section that may use red */}
          <div className={`flex items-start gap-4 rounded-lg border border-neutral-700 border-l-4 ${rep.border} bg-neutral-800 px-6 py-5`}>
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${rep.dot}`} />
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-neutral-400">Reputation Status</p>
              <p className={`text-2xl font-semibold leading-tight ${rep.text}`}>{rep.label}</p>
              <p className="mt-1 text-xs text-neutral-500">{repHelper}</p>
            </div>
          </div>

          {/* 4 KPI Cards: Avg Rating · Total Reviews · Review Velocity · Trust Score */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Average Rating"
              value={avg > 0 ? avg.toFixed(1) : "0.0"}
              badge={
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i < Math.round(avg) ? "#12B76A" : "#404040"}>
                      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                    </svg>
                  ))}
                </div>
              }
              sub="out of 5.0"
            />
            <MetricCard
              label="Total Reviews"
              value={String(totalReviews)}
              sub={`${d?.reviews_90d ?? 0} in last 90 days`}
            />
            <MetricCard
              label="Review Velocity"
              value={`${vel.toFixed(0)}%`}
              sub={velSub}
              subMuted={vel === 0}
            />
            <MetricCard
              label="Trust Score"
              value={trustValue}
              sub={trustSub}
              subMuted={trustScore < 30}
            />
          </div>

          {/* Executive summary insight line */}
          <p className="text-xs text-neutral-500 font-medium">{execLine}</p>

          {/* ════════════════════════════════════════════
              2) REPUTATION PERFORMANCE
          ════════════════════════════════════════════ */}
          <SectionHeading
            title="Reputation Performance"
            sub="Rating breakdown and review sentiment from your customers."
            note={repPerfNote}
          />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Rating Distribution */}
            <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Rating Distribution</h3>
                  {ratingDistNote && (
                    <p className="mt-1 text-xs text-neutral-600 italic">Sample size is low.</p>
                  )}
                </div>
                {avg > 0 && (
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-bold text-neutral-100">{avg.toFixed(1)}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{totalReviews} review{totalReviews !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const raw = dist[String(star)];
                  const bucket =
                    typeof raw === "object" && raw !== null
                      ? (raw as { count: number; percent: number })
                      : { count: 0, percent: 0 };
                  const count  = Number(bucket.count   ?? 0);
                  const pct    = Number(bucket.percent  ?? 0);
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="w-8 shrink-0 text-sm text-neutral-400">{star} ★</div>
                      <div className="flex-1 h-2 overflow-hidden rounded-full bg-neutral-700">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-20 shrink-0 text-right text-xs text-neutral-400">
                        {count} ({pct}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Sentiment */}
            <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">Review Sentiment</h3>
              {sntTotal === 0 ? (
                <p className="py-6 text-center text-xs text-neutral-500">Awaiting review data.</p>
              ) : (
                <div className="space-y-4">
                  <SentimentBar label="Positive (4–5 stars)" count={snt.positive} total={sntTotal} color="bg-emerald-500" />
                  <SentimentBar label="Neutral (3 stars)"    count={snt.neutral}  total={sntTotal} color="bg-amber-400"  />
                  <SentimentBar label="Negative (1–2 stars)" count={snt.negative} total={sntTotal} color="bg-red-500"    />
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════
              3) GROWTH & INVITATIONS
          ════════════════════════════════════════════ */}
          <SectionHeading
            title="Growth & Invitations"
            sub="Invite activity, conversion rates, and outreach momentum."
          />

          {/* 3 invite KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricCard
              label="Total Invites"
              value={String(totalInvites)}
              sub="All time"
            />
            <MetricCard
              label="Invites Last 30 Days"
              value={String(invites30)}
              sub="Recent outreach"
            />
            <MetricCard
              label="Invite Conversion"
              value={convValue}
              sub={convSub}
              subMuted={convSubMuted}
            />
          </div>

          {/* Invite Activity chart or empty state CTA */}
          <div className="rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Invite Activity <span className="font-normal normal-case text-neutral-600">(Last 3 Months)</span>
            </h3>
            {totalInvites === 0 ? (
              <InviteEmptyState />
            ) : (
              <InviteBarChart data={inviteChart} />
            )}
          </div>

          {/* Recent invite rows */}
          <RecentReviewInvitesCard businessId={businessId} />

          {/* ════════════════════════════════════════════
              4) REVIEW MOMENTUM
          ════════════════════════════════════════════ */}
          <SectionHeading
            title="Review Momentum"
            sub="Monthly review volume over the last 6 months."
          />

          <div className="rounded-xl border border-neutral-700 bg-neutral-800 px-5 py-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Review Activity <span className="font-normal normal-case text-neutral-600">(Last 90 Days)</span>
            </h3>
            <TrendSummary trend={d?.trend ?? null} />
            <ReviewActivityLineChart daily={daily} totalReviews={totalReviews} />
            {momentumNote && (
              <p className="mt-4 text-xs text-neutral-600 italic">
                Consistent monthly review flow improves visibility and trust score.
              </p>
            )}
          </div>

          {/* ════════════════════════════════════════════
              5) RECENT REVIEWS
          ════════════════════════════════════════════ */}
          <SectionHeading
            title="Recent Reviews"
            sub="The latest feedback from your customers."
          />

          <div className="rounded-xl border border-neutral-700 bg-neutral-800 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Reviews</h3>
              <span className="text-xs text-neutral-500">Showing latest 2</span>
            </div>
            {reviews.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-500">No reviews yet. Start collecting feedback to see insights here.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
              </div>
            )}

            {/* View all CTA */}
            <div className="mt-5 flex justify-center">
              <Link
                href="/business/dashboard/manage-reviews"
                className="group inline-flex items-center gap-2 rounded-lg border border-neutral-600 bg-neutral-700/50 px-5 py-2.5 text-sm font-medium text-neutral-200 transition-all duration-200 hover:border-[#1FAF9E]/60 hover:bg-[#1FAF9E]/10 hover:text-[#1FAF9E]"
              >
                View all reviews in Inbox
                <svg
                  width="14" height="14" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
