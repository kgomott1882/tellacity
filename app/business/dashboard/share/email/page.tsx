"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import UpgradeButton from "@/components/billing/UpgradeButton";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import TellacityStarStrip from "@/components/widgets/TellacityStarStrip";
import WidgetStars from "@/components/widgets/WidgetStars";
import { EMAIL_WIDGET_CTA_BORDER, EMAIL_WIDGET_CTA_TEXT } from "@/lib/emailBranding";

const DEFAULT_WIDGET_SUBJECT = "Share your experience with us";
const DEFAULT_WIDGET_INTRO =
  "We'd love to hear about your experience. It only takes a minute.";

function isPremiumOrElite(plan: string | null | undefined): boolean {
  if (!plan) return false;
  const p = plan.toLowerCase();
  return p === "premium" || p === "elite";
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((e) => e.trim())
    .filter((e) => /\S+@\S+\.\S+/.test(e));
}

type WidgetTemplate = {
  subject: string | null;
  intro_message: string | null;
  layout_style: string | null;
  signature_enabled: boolean | null;
  signature_name: string | null;
};

function TellacityBranding() {
  return (
    <p className="mt-2 text-center text-[10px] leading-snug text-gray-400">
      Verified reviews powered by <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
    </p>
  );
}

export default function EmailWidgetsPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();
  if (!selectedBusiness?.id) return null;
  const businessId = selectedBusiness.id;

  const [template, setTemplate] = useState<WidgetTemplate | null>(null);
  const [businessLogoUrl, setBusinessLogoUrl] = useState<string | null>(null);

  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendFeedback, setSendFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const sendSectionRef = useRef<HTMLDivElement>(null);

  const fetchTemplate = useCallback(async () => {
    if (!businessId) {
      return;
    }
    try {
      await ensureSessionFresh();
      const res = await fetch(
        `/api/review-invite-email-templates/widget?businessId=${encodeURIComponent(businessId)}`,
        { method: "GET", credentials: "include" },
      );
      const payload = (await res.json().catch(() => ({}))) as {
        template?: WidgetTemplate | null;
        logo_url?: string | null;
        error?: string;
      };
      if (!res.ok) {
        setTemplate(null);
        setBusinessLogoUrl(null);
        return;
      }
      setTemplate((payload.template as WidgetTemplate | null) ?? null);
      setBusinessLogoUrl(
        typeof payload.logo_url === "string" ? payload.logo_url : null,
      );
    } catch {
      setTemplate(null);
    }
  }, [businessId]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const business = selectedBusiness;

  const normalizedPlan: PlanKey = normalizePlanCodeToKey(selectedBusiness.plan);
  const canSend = isPremiumOrElite(normalizedPlan);

  const displaySubject = template?.subject?.trim() || DEFAULT_WIDGET_SUBJECT;
  const displayIntro = template?.intro_message?.trim() || DEFAULT_WIDGET_INTRO;
  const hasSignature = Boolean(template?.signature_enabled && template?.signature_name);
  const widgetLayoutStyle = template?.layout_style ?? "standard";
  const isReviewShowcase = widgetLayoutStyle === "review_card";
  const isRatingLadder = widgetLayoutStyle === "rating_ladder";
  const isEliteBranded =
    normalizedPlan === "elite" && widgetLayoutStyle === "elite_branded";

  const persistWidgetLayout = useCallback(
    async (
      layout: "standard" | "elite_branded" | "review_card" | "rating_ladder",
    ) => {
      if (!businessId || !canSend) return;
      if (layout === "elite_branded" && normalizedPlan !== "elite") return;
      setLayoutSaving(true);
      setToast(null);
      try {
        await ensureSessionFresh();
        const res = await fetch("/api/review-invite-email-templates/widget", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            layoutStyle: layout,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !data.success) {
          throw new Error(data.error || "save_failed");
        }
        await fetchTemplate();
        setToast({
          type: "success",
          text:
            layout === "elite_branded"
              ? "Elite branded layout selected."
              : layout === "review_card"
                ? "Review showcase layout selected."
                : layout === "rating_ladder"
                  ? "Rating ladder layout selected."
                  : "Standard layout selected.",
        });
      } catch (e) {
        const fromApi =
          e instanceof Error && e.message && e.message !== "save_failed"
            ? e.message
            : null;
        setToast({
          type: "error",
          text: fromApi ?? "Could not save layout preference.",
        });
      } finally {
        setLayoutSaving(false);
      }
    },
    [businessId, canSend, normalizedPlan, fetchTemplate],
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !canSend) return;

    const emailList = parseEmails(recipients);
    if (emailList.length === 0) {
      setSendFeedback({
        kind: "error",
        message: "Please enter at least one valid email address.",
      });
      return;
    }

    setSending(true);
    setSendFeedback(null);

    try {
      const res = await fetch("/api/email-widget/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, recipients: emailList }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSendFeedback({
          kind: "error",
          message: (data.error as string) || "Failed to send. Try again.",
        });
        return;
      }
      const sent = (data.sent as number) ?? emailList.length;
      const failed = (data.failed as number) ?? 0;
      let message =
        sent === 1
          ? "Sent — 1 email delivered successfully."
          : `Sent — ${sent} emails delivered successfully.`;
      if (failed > 0) {
        message += ` ${failed} could not be sent; check those addresses.`;
      }
      setSendFeedback({ kind: "success", message });
      setRecipients("");
      requestAnimationFrame(() => {
        sendSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    } catch {
      setSendFeedback({
        kind: "error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <SimplePage
        title="Email Widgets"
        subtitle="Promote your Tellacity profile via email."
      />

      <PlanStatusBanner plan={normalizedPlan} />

      {/* Toast */}
      {toast && (
        <div
          className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="alert"
        >
          <span className="mt-0.5 shrink-0 text-base">
            {toast.type === "success" ? "✓" : "✕"}
          </span>
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto shrink-0 text-xs opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {!canSend && (
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm font-semibold text-amber-900">
            Available on Premium and Elite plans.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Send direct review links to customers without consuming invite credits.
          </p>
          <div className="mt-4">
            <UpgradeButton
              businessId={business.id}
              planCode="premium"
              amount={5000}
              email={user?.email ?? ""}
            />
          </div>
        </div>
      )}
      {/* ── Layout Options comparison ── */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900">Layout Options</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Click a layout to use it for widget emails. To edit subject, intro, or signature, open{" "}
          <button
            type="button"
            disabled={!canSend}
            onClick={() => canSend && router.push("/business/dashboard/get-reviews/email-templates")}
            className="text-[#124541] underline underline-offset-2 hover:text-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Email templates
          </button>
          {" "}or use &quot;Customize message&quot; below.
        </p>
        {layoutSaving && (
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            Saving layout…
          </p>
        )}

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* Premium Widget Layout — standard email (selectable layout) */}
              <button
                type="button"
                disabled={!canSend || layoutSaving}
                onClick={() => void persistWidgetLayout("standard")}
                aria-pressed={widgetLayoutStyle === "standard"}
                className={`rounded-xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  widgetLayoutStyle === "standard"
                    ? "border-[#124541] ring-1 ring-[#124541] shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Premium Widget Layout</p>
                  {widgetLayoutStyle === "standard" && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-gray-500">Default Tellacity email layout.</p>
                <div className="pointer-events-none rounded-lg border border-gray-100 bg-gray-50 px-4 py-5 text-center">
                  <p className="mb-2 text-xs font-semibold text-gray-800">Tell us about your experience</p>
                  <div className="flex justify-center">
                    <TellacityStarStrip size={12} />
                  </div>
                  <div
                    className="mt-2 inline-block rounded border px-3 py-1 text-[11px] font-semibold leading-tight bg-transparent"
                    style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                  >
                    Leave a Review
                  </div>
                  <TellacityBranding />
                </div>
              </button>

              {/* Review showcase — Premium & Elite */}
              <button
                type="button"
                disabled={!canSend || layoutSaving}
                onClick={() => void persistWidgetLayout("review_card")}
                aria-pressed={isReviewShowcase}
                className={`rounded-xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isReviewShowcase
                    ? "border-[#124541] ring-1 ring-[#124541] shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Review showcase</p>
                  {isReviewShowcase && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  Trust-style card with your latest public review and aggregate rating (Tellacity stars).
                </p>
                <div className="pointer-events-none overflow-hidden rounded-lg border border-gray-100 bg-white text-left shadow-sm">
                  <div className="h-1.5 bg-gray-100" />
                  <div className="px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <WidgetStars rating={4} size={10} />
                      <span className="shrink-0 text-[9px] text-gray-400">20 Jun 2019</span>
                    </div>
                    <p className="mt-1.5 text-[9px] text-gray-400">by Sample Customer</p>
                    <p className="mt-1 text-[11px] font-bold text-gray-900">Recent review title</p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-600">
                      A short excerpt from the review appears here with your intro above the card…
                    </p>
                  </div>
                  <div className="border-t border-gray-100 px-2 py-2 text-center text-[9px] text-gray-600">
                    Rated <strong>4.8</strong> out of <strong>5</strong> | <strong>24</strong> reviews on{" "}
                    <strong className="text-[#0E0E0E]">Tellacity</strong>
                  </div>
                  <div className="h-1.5 bg-gray-100" />
                  <div className="pb-2 text-center">
                    <span
                      className="inline-block rounded border px-2 py-0.5 text-[9px] font-semibold"
                      style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                    >
                      Leave a review
                    </span>
                  </div>
                </div>
              </button>

              {/* Rating ladder — Premium & Elite */}
              <button
                type="button"
                disabled={!canSend || layoutSaving}
                onClick={() => void persistWidgetLayout("rating_ladder")}
                aria-pressed={isRatingLadder}
                className={`rounded-xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isRatingLadder
                    ? "border-[#124541] ring-1 ring-[#124541] shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">Rating ladder</p>
                  {isRatingLadder && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-gray-500">
                  &quot;How did we do?&quot; rows with Tellacity stars; each row opens the invite-style review form with that rating (Premium+).
                </p>
                <div className="pointer-events-none space-y-1.5 rounded-lg border border-gray-200 bg-white px-3 py-3 text-left">
                  <p className="mb-2 text-center text-[10px] font-bold text-gray-800 underline">How did we do?</p>
                  {[5, 4, 3].map((r) => (
                    <div key={r} className="flex items-center gap-2 border-b border-gray-100 pb-1.5 last:border-0">
                      <span className="h-3 w-3 shrink-0 rounded-full border-2 border-gray-300" />
                      <WidgetStars rating={r} size={9} />
                    </div>
                  ))}
                  <p className="pt-1 text-center text-[9px] text-gray-500">Tellacity</p>
                </div>
              </button>

              {/* Elite Branded Layout — clickable (Elite) or opens billing */}
              <button
                type="button"
                disabled={layoutSaving}
                onClick={() => {
                  if (normalizedPlan === "elite" && canSend) {
                    void persistWidgetLayout("elite_branded");
                  } else {
                    router.push("/business/dashboard/billing");
                  }
                }}
                aria-pressed={normalizedPlan === "elite" && isEliteBranded}
                className={`relative rounded-xl border bg-white p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  normalizedPlan === "elite" && isEliteBranded
                    ? "border-solid border-[#124541] ring-1 ring-[#124541] shadow-sm"
                    : normalizedPlan === "elite"
                    ? "border-solid border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    : "border-dashed border-gray-300 hover:border-gray-400"
                }`}
              >
                {/* Lock badge - non-elite only */}
                {normalizedPlan !== "elite" && (
                  <div className="absolute right-4 top-4 flex items-center gap-1 rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white shadow-md">
                    🔒 Locked
                  </div>
                )}

                {/* Selected checkmark - elite + active */}
                {normalizedPlan === "elite" && isEliteBranded && (
                  <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}

                <p className="mb-1 text-sm font-medium text-gray-900">Elite Branded Layout</p>
                <p className="mb-3 text-xs text-gray-500">Includes your business logo &amp; branded header</p>

                {/* Elite mini-preview */}
                <div className="pointer-events-none overflow-hidden rounded-lg border border-gray-200 bg-white text-center shadow-sm">
                  {/* Business header */}
                  <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">
                    {businessLogoUrl ? (
                      <img
                        src={businessLogoUrl}
                        alt={selectedBusiness?.name ?? ""}
                        className="mx-auto mb-3 h-14 object-contain"
                      />
                    ) : (
                      <div className="mx-auto mb-3 flex h-14 w-20 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400">
                        logo
                      </div>
                    )}
                    <p className="text-lg font-semibold tracking-wide text-gray-800">
                      {selectedBusiness?.name ?? "Your Business"}
                    </p>
                  </div>
                  {/* Body */}
                  <div className="px-4 py-4">
                    <p className="mb-2 text-xs font-semibold text-gray-800">Tell us about your experience</p>
                    <div className="flex justify-center">
                    <TellacityStarStrip size={12} />
                  </div>
                    <div
                      className="mt-2 inline-block rounded border px-3 py-1 text-[11px] font-semibold leading-tight bg-transparent"
                      style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                    >
                      Leave a Review
                    </div>
                    <TellacityBranding />
                  </div>
                </div>

                {/* Upgrade nudge - non-elite only */}
                {normalizedPlan !== "elite" && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-600">Tap to upgrade to Elite for branded email layout</p>
                    <span className="mt-2 inline-block rounded-lg bg-black px-4 py-1.5 text-xs font-medium text-white">
                      View plans
                    </span>
                  </div>
                )}
              </button>

        </div>
      </div>

      {/* Preview + send: single flow */}
      <div
        className="mt-8 overflow-hidden rounded-2xl border-4 border-[#124541] bg-white"
        style={{ boxShadow: "0 14px 44px -10px rgba(33, 69, 65, 0.45), 0 6px 18px -6px rgba(33, 69, 65, 0.28)" }}
      >
        <div className="border-b border-gray-100 bg-gradient-to-r from-[#124541]/[0.07] via-white to-white px-5 py-4 sm:px-8 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900">Preview & send</h2>
              <p className="mt-1 max-w-xl text-sm text-gray-600">
                See what customers receive, then send the same email. No invite credits are used.
              </p>
            </div>
            <button
              type="button"
              disabled={!canSend}
              onClick={() => canSend && router.push("/business/dashboard/get-reviews/email-templates")}
              className="shrink-0 rounded-lg border border-[#124541]/25 bg-white px-3.5 py-2 text-sm font-medium text-[#124541] shadow-sm transition hover:border-[#124541]/50 hover:bg-[#f0faf8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Edit subject & message
            </button>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,380px)] lg:items-stretch">
          {/* Inbox preview */}
          <div className="border-b border-gray-100 p-5 sm:p-8 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Inbox preview
              </span>
              {isEliteBranded ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#124541] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  <span aria-hidden>★</span> Elite branded
                </span>
              ) : isReviewShowcase ? (
                <span className="inline-flex items-center rounded-full border border-[#124541]/40 bg-[#f0faf8] px-2 py-0.5 text-[10px] font-semibold text-[#124541]">
                  Review showcase
                </span>
              ) : isRatingLadder ? (
                <span className="inline-flex items-center rounded-full border border-[#124541]/40 bg-[#f0faf8] px-2 py-0.5 text-[10px] font-semibold text-[#124541]">
                  Rating ladder
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                  Standard
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Uses your saved subject and intro from email templates.
            </p>

            <div className="mt-5 mx-auto max-w-md rounded-xl border border-gray-200/90 bg-white shadow-md shadow-gray-200/40 ring-1 ring-black/[0.03]">
              <div className="border-b border-gray-100 bg-gray-50/90 px-4 py-2 text-xs text-gray-600">
                <span className="font-medium text-gray-800">Subject</span>
                <span className="mt-0.5 block truncate text-gray-600">{displaySubject}</span>
              </div>

              {isEliteBranded && (
                <div className="border-b border-gray-100 px-4 py-4 text-center">
                  <div className="mb-2 flex min-h-[36px] items-center justify-center">
                    {businessLogoUrl ? (
                      <img
                        src={businessLogoUrl}
                        alt=""
                        className="max-h-9 max-w-[180px] object-contain"
                      />
                    ) : (
                      <div className="rounded-md bg-gray-100 px-2.5 py-1 text-[11px] text-gray-400">
                        Business logo
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {selectedBusiness?.name ?? "Your Business"}
                  </p>
                </div>
              )}

              <div className="p-4 sm:p-5">
                <p className="text-sm leading-relaxed text-gray-700">{displayIntro}</p>

                {isRatingLadder ? (
                  <>
                    <p className="mt-3 text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-2">
                      How did we do?
                    </p>
                    <div className="my-3 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      {[5, 4, 3, 2, 1].map((r) => (
                        <div
                          key={r}
                          className="flex items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0"
                        >
                          <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-gray-300" />
                          <WidgetStars rating={r} size={11} />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] leading-relaxed text-gray-500">
                      Tapping a row opens your review form with that rating pre-selected.
                    </p>
                    <p className="mt-2 text-center text-[10px] text-gray-400">
                      Verified reviews powered by{" "}
                      <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
                    </p>
                  </>
                ) : isReviewShowcase ? (
                  <>
                    <div className="my-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                      <div className="h-1.5 bg-gray-100" />
                      <div className="px-3 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <WidgetStars rating={4} size={11} />
                          <span className="shrink-0 text-[10px] text-gray-400">20 Jun 2019</span>
                        </div>
                        <p className="mt-1.5 text-[10px] text-gray-400">by Sample Customer</p>
                        <p className="mt-1.5 text-sm font-bold text-gray-900">Your latest public review title</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-600">
                          Sample excerpt from your most recent published review on Tellacity.
                        </p>
                      </div>
                      <div className="border-t border-gray-200 px-3 py-2 text-center text-[10px] text-gray-600">
                        Rated <strong>4.8</strong> / <strong>5</strong> · <strong>1,672</strong> reviews on{" "}
                        <strong className="text-[#0E0E0E]">Tellacity</strong>
                      </div>
                      <div className="h-1.5 bg-gray-100" />
                    </div>
                    <div className="text-center">
                      <span
                        className="inline-block rounded-md border px-3 py-1.5 text-[11px] font-semibold leading-tight"
                        style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                      >
                        Leave a review
                      </span>
                    </div>
                    <p className="mt-2 text-center text-[10px] text-gray-400">
                      Verified reviews powered by{" "}
                      <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
                    </p>
                  </>
                ) : (
                  <div className="my-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center">
                    <p className="text-sm font-semibold text-gray-900">Tell us about your experience</p>
                    <div className="mt-2 flex justify-center">
                      <TellacityStarStrip size={13} />
                    </div>
                    <div
                      className="mt-2.5 inline-block rounded-md border bg-white px-3 py-1.5 text-[11px] font-semibold leading-tight"
                      style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
                    >
                      Leave a Review
                    </div>
                    <TellacityBranding />
                  </div>
                )}

                {hasSignature && (
                  <div className="mt-3 border-t border-gray-100 pt-3 text-[11px] text-gray-500">
                    <span className="font-medium text-gray-700">{template?.signature_name}</span>
                    {" — signature included"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Send */}
          <div
            ref={sendSectionRef}
            className="flex flex-col bg-slate-50/50 p-5 sm:p-8"
          >
            <h3 className="text-base font-semibold text-gray-900">Send to recipients</h3>
            <p className="mt-1 text-sm text-gray-600">
              One address per line, or separate with commas. Confirmation appears below when done.
            </p>
            {!canSend && (
              <p className="mt-2 text-xs font-medium text-amber-800">
                Upgrade to Premium or Elite to send from here.
              </p>
            )}

            {sendFeedback && (
              <div
                role={sendFeedback.kind === "success" ? "status" : "alert"}
                aria-live="polite"
                className={`mt-4 flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm ${
                  sendFeedback.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <span className="mt-0.5 shrink-0 font-semibold" aria-hidden>
                  {sendFeedback.kind === "success" ? "✓" : "!"}
                </span>
                <p className="min-w-0 flex-1 leading-snug">{sendFeedback.message}</p>
                <button
                  type="button"
                  onClick={() => setSendFeedback(null)}
                  className="shrink-0 text-xs font-medium text-current/70 underline decoration-current/40 underline-offset-2 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            <form onSubmit={handleSend} className="mt-4 flex flex-1 flex-col gap-4">
              <div className="min-h-0 flex-1">
                <label
                  htmlFor="widget-recipients"
                  className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                >
                  Recipients
                </label>
                <textarea
                  id="widget-recipients"
                  rows={6}
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder={"customer@example.com\nanother@example.com"}
                  disabled={!canSend || sending}
                  className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-[#124541]/40 focus:ring-2 focus:ring-[#124541]/15 disabled:bg-gray-100/80 disabled:text-gray-500"
                />
                {recipients.trim() && (
                  <p className="mt-1.5 text-xs text-gray-500">
                    {parseEmails(recipients).length} valid address
                    {parseEmails(recipients).length !== 1 ? "es" : ""} detected
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!canSend || sending || !businessId}
                className="w-full rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none sm:w-auto"
              >
                {!canSend ? "Upgrade to send" : sending ? "Sending…" : "Send email"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
