"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useBusinessContext } from "../../_context/BusinessContext";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import PageLoadingOverlay from "../../_components/PageLoadingOverlay";
import WidgetStars from "@/components/widgets/WidgetStars";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";
import { getPublicWriteReviewUrl } from "@/lib/emailBranding";
import {
  canUseCustomEmail,
  normalizePlanCodeToKey,
  nextTierUpgradeCtaLabel,
} from "@/lib/plans";

const BASE_URL =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://tellacity.com";

type ProfileStats = {
  business_name: string;
  avg_rating: number;
  review_count: number;
  logo_url: string | null;
};

function CopyButton({
  text,
  onCopied,
}: {
  text: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 shrink-0 ml-4 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        copied
          ? "bg-green-50 text-green-700 border border-green-200"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
      }`}
    >
      {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} strokeWidth={2} />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

const SOCIAL_PLATFORMS = [
  {
    key: "linkedin",
    label: "LinkedIn",
    logo: "/brand/LinkedIn.jpg",
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    logo: "/brand/X.jpg",
    href: (url: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out our reviews on Tellacity")}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    logo: "/brand/FACEBOOK.jpg",
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    logo: "/brand/instagram.jpg",
    href: () => `https://www.instagram.com/`,
  },
  {
    key: "tiktok",
    label: "TikTok",
    logo: "/brand/tiktok.jpg",
    href: () => `https://www.tiktok.com/`,
  },
  {
    key: "telegram",
    label: "Telegram",
    logo: "/brand/telegram.jpg",
    href: (url: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent("Check out our reviews on Tellacity")}`,
  },
];

export default function SocialSharePage() {
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const slug = selectedBusiness?.slug ?? "";
  const planKey = normalizePlanCodeToKey(selectedBusiness?.plan);
  const canUseQrClearly = canUseCustomEmail(planKey);

  const profileUrl = slug ? `${BASE_URL}/b/${slug}` : "";
  const reviewUrl = slug ? getPublicWriteReviewUrl(BASE_URL, slug) : "";

  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!businessId || !slug) {
      setStats(null);
      setStatsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setStatsLoading(true);
      try {
        const json = await dashboardApiGet<{ stats: ProfileStats | null }>(
          `/api/business/${encodeURIComponent(businessId)}/social-widget-stats`
        );
        if (!cancelled) setStats(json.stats);
      } catch {
        if (!cancelled) setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, slug]);

  if (!businessId) return null;

  return (
    <div className="max-w-3xl space-y-10">
      {statsLoading ? <PageLoadingOverlay /> : null}

      <div>
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Social</h1>
        <p className="mt-1 text-sm text-gray-500">
          Share your Tellacity profile and collect more reviews across social channels.
        </p>
      </div>

      {!slug && (
        <p className="text-sm text-gray-400">Select a business to see your share links.</p>
      )}

      {slug && (
        <>
          {/* Profile preview card */}
          {stats && (
            <div className="flex items-center gap-4 rounded-xl border-2 border-[#2fb2a8] bg-white px-5 py-4 shadow-sm">
              {stats.logo_url && (
                <img
                  src={stats.logo_url}
                  alt="logo"
                  width={44}
                  height={44}
                  className="rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0E0E0E] truncate">{stats.business_name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <WidgetStars rating={stats.avg_rating} size={12} />
                  <span className="text-xs font-semibold text-gray-700">
                    {stats.avg_rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    · {stats.review_count} verified review{stats.review_count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-medium text-[#2fb2a8] hover:underline"
              >
                View profile →
              </a>
            </div>
          )}

          {/* Share public profile */}
          <div>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Your public profile
            </h2>
            <p className="mb-3 text-xs text-gray-400">
              Share this link so customers can read your reviews and learn about your business.
            </p>
            <div className="flex items-center rounded-xl border-2 border-[#2fb2a8] bg-white px-4 py-3 shadow-sm">
              <span className="flex-1 truncate text-sm text-gray-700">{profileUrl}</span>
              <CopyButton
                text={profileUrl}
                onCopied={() => {
                  if (businessId) {
                    logDashboardActivityClient({
                      businessId,
                      action: "profile_link_copied",
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Collect reviews + QR */}
          <div>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Collect more reviews
            </h2>
            <p className="mb-3 text-xs text-gray-400">
              Send this link directly to customers to make leaving a review quick and easy.
            </p>
            <div className="flex items-center rounded-xl border-2 border-[#2fb2a8] bg-white px-4 py-3 shadow-sm">
              <span className="flex-1 truncate text-sm text-gray-700">{reviewUrl}</span>
              <CopyButton text={reviewUrl} />
            </div>

            {/* QR code: same gate as Get reviews overview (Grow+ for clear / printable use) */}
            <div className="relative mt-4 inline-flex min-w-[152px] flex-col items-stretch rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div
                className={`mx-auto flex flex-col items-center gap-2 ${
                  !canUseQrClearly
                    ? "pointer-events-none select-none blur-md opacity-50"
                    : ""
                }`}
              >
                <QRCode value={reviewUrl} size={120} />
                <span className="text-xs text-gray-400">Scan to leave a review</span>
              </div>
              {!canUseQrClearly ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/65 px-3 text-center backdrop-blur-[2px]">
                  <div className="max-w-[9.5rem]">
                    <p className="text-xs font-semibold text-gray-900">QR preview</p>
                    <p className="mt-1 text-[11px] leading-snug text-gray-600">
                      Grow unlocks a sharp code for print, tables, and receipts.
                    </p>
                    <Link
                      href="/business/dashboard/billing"
                      className="mt-2 inline-block text-xs font-semibold text-[#124541] underline decoration-[#124541]/40 underline-offset-2 hover:text-[#0f3a35]"
                    >
                      {nextTierUpgradeCtaLabel(planKey)}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick share */}
          <div>
            <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Quick share
            </h2>
            <p className="mb-4 text-xs text-gray-400">
              Share your profile directly to your social channels.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SOCIAL_PLATFORMS.map((platform) => (
                <a
                  key={platform.key}
                  href={platform.href(profileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#2fb2a8] hover:shadow-md"
                >
                  <Image
                    src={platform.logo}
                    alt={platform.label}
                    width={22}
                    height={22}
                    className="rounded shrink-0"
                  />
                  {platform.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
