"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import UpgradeButton from "@/components/billing/UpgradeButton";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";
import {
  incrementUpgradeClickCount,
  upgradeModalTitleForClickCount,
} from "@/lib/upgradeClickStorage";
import {
  canAccessEmailWidget,
  canUseCustomEmail,
  normalizePlanCodeToKey,
  type PlanKey,
} from "@/lib/plans";

/** Same rules as POST /api/email-widget/send for the saved widget layout. */
function planAllowsEmailWidgetLayout(plan: PlanKey, layoutStyle: string): boolean {
  const ls = (layoutStyle || "standard").trim().toLowerCase();
  if (ls === "elite_branded") {
    return canAccessEmailWidget(plan, "elite_layout") && plan === "elite";
  }
  if (ls === "review_hunter") {
    return canAccessEmailWidget(plan, "premium_layout") && (plan === "premium" || plan === "elite");
  }
  if (ls === "rating_ladder") {
    return canUseCustomEmail(plan);
  }
  return canAccessEmailWidget(plan, "premium_layout");
}
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import {
  EmailWidgetEliteBrandedCard,
  EmailWidgetInviteBlock,
  EmailWidgetRatingLadderPreview,
} from "@/components/email/EmailWidgetLayoutPreviewBlocks";

const DEFAULT_WIDGET_SUBJECT = "Share your experience with us";
const DEFAULT_WIDGET_INTRO =
  "We'd love to hear about your experience. It only takes a minute.";

function suggestedWidgetSubject(businessName: string) {
  const n = businessName?.trim() || "us";
  return `Share your experience with ${n}`;
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

function requiredPlanForEmailLayout(
  layout: "standard" | "review_hunter" | "elite_branded" | "rating_ladder",
): PlanKey {
  switch (layout) {
    case "standard":
      return "free";
    case "rating_ladder":
      return "grow";
    case "review_hunter":
      return "premium";
    case "elite_branded":
      return "elite";
    default:
      return "grow";
  }
}

function upgradeLabelForPlan(plan: PlanKey): string {
  switch (plan) {
    case "grow":
      return "Upgrade to Grow";
    case "premium":
      return "Upgrade to Premium";
    case "elite":
      return "Upgrade to Elite";
    default:
      return "Upgrade";
  }
}

function EmailLayoutUpgradePreview({
  layout,
  businessName,
  businessLogoUrl,
}: {
  layout: "standard" | "review_hunter" | "elite_branded" | "rating_ladder" | null;
  businessName: string;
  businessLogoUrl?: string | null;
}) {
  const shell = "rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-[12px] text-gray-700";
  if (!layout) {
    return (
      <div className={shell}>
        <p className="font-semibold text-gray-900">Email layout preview</p>
        <p className="mt-1 text-gray-600">Unlock higher-converting invite layouts with richer trust signals.</p>
      </div>
    );
  }

  const labels: Record<
    "standard" | "review_hunter" | "rating_ladder" | "elite_branded",
    string
  > = {
    standard: "Premium Widget Layout",
    review_hunter: "Review Hunter",
    rating_ladder: "Rating ladder",
    elite_branded: "Elite Branded Layout",
  };
  const label = labels[layout];

  return (
    <div className={shell}>
      <p className="font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-xs text-gray-500">
        Same preview as Layout Options and “Preview &amp; send” for this layout.
      </p>
      <div className="mt-3 max-h-[min(50vh,360px)] overflow-y-auto rounded-md border border-gray-100 bg-white p-2">
        {layout === "standard" && (
          <EmailWidgetInviteBlock
            variant="standard"
            businessName={businessName}
            density="comfortable"
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center"
          />
        )}
        {layout === "review_hunter" && (
          <EmailWidgetInviteBlock
            variant="review_hunter"
            businessName={businessName}
            density="comfortable"
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center"
          />
        )}
        {layout === "rating_ladder" && <EmailWidgetRatingLadderPreview density="comfortable" />}
        {layout === "elite_branded" && (
          <EmailWidgetEliteBrandedCard
            businessName={businessName}
            logoUrl={businessLogoUrl}
            density="comfortable"
          />
        )}
      </div>
    </div>
  );
}

function EmailLayoutLockOverlay({
  onUnlockClick,
  ctaLabel,
}: {
  onUnlockClick: () => void;
  ctaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onUnlockClick}
      className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-0 bg-white/75 px-4 text-center shadow-inner backdrop-blur-sm"
    >
      <span className="text-sm font-medium text-gray-900">
        Unlock this layout to increase response rates and showcase more customer feedback.
      </span>
      <span className="rounded-lg bg-[#124541] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3a35]">
        {ctaLabel}
      </span>
    </button>
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
  const [copySaving, setCopySaving] = useState(false);
  const [widgetSubject, setWidgetSubject] = useState(DEFAULT_WIDGET_SUBJECT);
  const [widgetIntro, setWidgetIntro] = useState(DEFAULT_WIDGET_INTRO);
  const copyDirtyRef = useRef(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sendFeedback, setSendFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [upgradeFeatureModalOpen, setUpgradeFeatureModalOpen] = useState(false);
  const [upgradeFeatureModalTitle, setUpgradeFeatureModalTitle] = useState(
    "Unlock this feature",
  );
  const [upgradeRequiredPlan, setUpgradeRequiredPlan] = useState<PlanKey>("grow");
  const [upgradePreviewLayout, setUpgradePreviewLayout] = useState<
    "standard" | "review_hunter" | "elite_branded" | "rating_ladder" | null
  >(null);
  const sendSectionRef = useRef<HTMLDivElement>(null);
  const emailLayoutMigratedRef = useRef(false);

  const FEATURE_LOCKED = "email_widget" as const;

  const openUpgradeFeatureModal = (
    requiredPlan: PlanKey,
    previewLayout?: "standard" | "review_hunter" | "elite_branded" | "rating_ladder",
  ) => {
    setUpgradeRequiredPlan(requiredPlan);
    setUpgradePreviewLayout(previewLayout ?? null);
    const n = incrementUpgradeClickCount(FEATURE_LOCKED);
    setUpgradeFeatureModalTitle(upgradeModalTitleForClickCount(n));
    logDashboardActivityClient({
      businessId,
      action: "feature_locked_clicked",
      metadata: { feature: FEATURE_LOCKED },
    });
    setUpgradeFeatureModalOpen(true);
  };

  const fetchTemplate = useCallback(
    async (opts?: { signal?: AbortSignal }) => {
      const signal = opts?.signal;
      if (!businessId) {
        return;
      }
      try {
        await ensureSessionFresh();
        if (signal?.aborted) return;
        const res = await fetch(
          `/api/review-invite-email-templates/widget?businessId=${encodeURIComponent(businessId)}`,
          { method: "GET", credentials: "include", signal },
        );
        const payload = (await res.json().catch(() => ({}))) as {
          template?: WidgetTemplate | null;
          logo_url?: string | null;
          review_count?: number;
          average_rating?: number;
          error?: string;
        };
        if (signal?.aborted) return;
        if (!res.ok) {
          setTemplate(null);
          setBusinessLogoUrl(null);
          return;
        }
        setTemplate((payload.template as WidgetTemplate | null) ?? null);
        setBusinessLogoUrl(
          typeof payload.logo_url === "string" ? payload.logo_url : null,
        );
      } catch (e) {
        if (signal?.aborted || (e instanceof DOMException && e.name === "AbortError")) {
          return;
        }
        setTemplate(null);
      }
    },
    [businessId],
  );

  useEffect(() => {
    const ac = new AbortController();
    void fetchTemplate({ signal: ac.signal });
    return () => ac.abort();
  }, [fetchTemplate]);

  useEffect(() => {
    copyDirtyRef.current = false;
    emailLayoutMigratedRef.current = false;
    setTemplate(null);
    setWidgetSubject(DEFAULT_WIDGET_SUBJECT);
    setWidgetIntro(DEFAULT_WIDGET_INTRO);
  }, [businessId]);

  const rawEmailLayoutStyle = template?.layout_style ?? "";

  useEffect(() => {
    if (!businessId) return;
    if (rawEmailLayoutStyle !== "review_card" && rawEmailLayoutStyle !== "tellacity_branded") {
      return;
    }
    if (emailLayoutMigratedRef.current) return;
    emailLayoutMigratedRef.current = true;
    void (async () => {
      try {
        await ensureSessionFresh();
        const res = await fetch("/api/review-invite-email-templates/widget", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, layoutStyle: "standard" }),
        });
        const data = (await res.json().catch(() => ({}))) as { success?: boolean };
        if (res.ok && data.success) {
          await fetchTemplate();
          setToast({
            type: "success",
            text: "Review showcase and Tellacity reviews are website embeds only. Email widget set to Standard.",
          });
        } else {
          emailLayoutMigratedRef.current = false;
        }
      } catch {
        emailLayoutMigratedRef.current = false;
      }
    })();
  }, [businessId, rawEmailLayoutStyle, fetchTemplate]);

  useEffect(() => {
    if (!businessId) return;
    if (copyDirtyRef.current) return;
    if (template === null) {
      setWidgetSubject(suggestedWidgetSubject(selectedBusiness?.name ?? ""));
      setWidgetIntro(DEFAULT_WIDGET_INTRO);
      return;
    }
    if (!template) return;
    const sub = template.subject?.trim();
    const useSuggested = !sub || sub === DEFAULT_WIDGET_SUBJECT;
    setWidgetSubject(
      useSuggested ? suggestedWidgetSubject(selectedBusiness?.name ?? "") : sub,
    );
    setWidgetIntro(template.intro_message?.trim() || DEFAULT_WIDGET_INTRO);
  }, [businessId, template, selectedBusiness?.name]);

  // Auto-dismiss toast after 4 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const business = selectedBusiness;

  const normalizedPlan: PlanKey = normalizePlanCodeToKey(selectedBusiness.plan);
  const canStandardLayout = canAccessEmailWidget(normalizedPlan, "premium_layout");
  const canReviewHunterLayout =
    canAccessEmailWidget(normalizedPlan, "premium_layout") &&
    (normalizedPlan === "premium" || normalizedPlan === "elite");
  const canRatingLadderLayout = canUseCustomEmail(normalizedPlan);
  const canEliteBrandedLayout =
    normalizedPlan === "elite" &&
    canAccessEmailWidget(normalizedPlan, "elite_layout");

  const displaySubject = widgetSubject.trim() || DEFAULT_WIDGET_SUBJECT;
  const displayIntro = widgetIntro.trim() || DEFAULT_WIDGET_INTRO;
  const hasSignature = Boolean(template?.signature_enabled && template?.signature_name);
  const widgetLayoutStyle = useMemo(() => {
    const raw = (template?.layout_style ?? "standard").trim();
    if (raw === "review_card" || raw === "tellacity_branded") return "standard";
    return raw || "standard";
  }, [template?.layout_style]);
  const isRatingLadder = widgetLayoutStyle === "rating_ladder";
  const isReviewHunter = widgetLayoutStyle === "review_hunter";
  const isEliteBranded =
    normalizedPlan === "elite" && widgetLayoutStyle === "elite_branded";
  const canSend = planAllowsEmailWidgetLayout(
    normalizedPlan,
    widgetLayoutStyle,
  );

  const persistWidgetLayout = useCallback(
    async (
      layout: "standard" | "review_hunter" | "elite_branded" | "rating_ladder",
    ) => {
      if (!businessId || layoutSaving) return;
      if (layout === "standard" && !canStandardLayout) return;
      if (layout === "review_hunter" && !canReviewHunterLayout) return;
      if (layout === "rating_ladder" && !canRatingLadderLayout) return;
      if (
        layout === "elite_branded" &&
        (!canEliteBrandedLayout || normalizedPlan !== "elite")
      )
        return;
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
              : layout === "review_hunter"
                ? "Review Hunter layout selected."
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
    [
      businessId,
      layoutSaving,
      normalizedPlan,
      fetchTemplate,
      canStandardLayout,
      canReviewHunterLayout,
      canRatingLadderLayout,
      canEliteBrandedLayout,
    ],
  );

  const persistWidgetCopy = useCallback(async () => {
    if (!businessId || copySaving) return;
    const sub = widgetSubject.trim();
    const intro = widgetIntro.trim();
    if (!sub) {
      setToast({ type: "error", text: "Add a subject line before saving." });
      return;
    }
    if (!intro) {
      setToast({ type: "error", text: "Add an intro message before saving." });
      return;
    }
    setCopySaving(true);
    setToast(null);
    try {
      await ensureSessionFresh();
      const res = await fetch("/api/review-invite-email-templates/widget", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          subject: sub,
          introMessage: intro,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.error || "save_failed");
      }
      copyDirtyRef.current = false;
      await fetchTemplate();
      setToast({ type: "success", text: "Subject and intro saved." });
    } catch (e) {
      const fromApi =
        e instanceof Error && e.message && e.message !== "save_failed"
          ? e.message
          : null;
      setToast({
        type: "error",
        text: fromApi ?? "Could not save subject or intro.",
      });
    } finally {
      setCopySaving(false);
    }
  }, [businessId, copySaving, widgetSubject, widgetIntro, fetchTemplate]);

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
            This saved layout is not included on your current plan.
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Upgrade to use this layout, or pick a layout your plan supports below. Sending uses the same access as saving.
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
          Click a layout for outgoing invite emails. Review showcase and Tellacity reviews badges live under{" "}
          <button
            type="button"
            onClick={() => router.push("/business/dashboard/share/widgets")}
            className="text-[#124541] underline underline-offset-2 hover:text-[#0f3a35]"
          >
            Website widgets
          </button>
          . Edit subject and intro in Preview &amp; send; open{" "}
          <button
            type="button"
            disabled={!canSend}
            onClick={() => canSend && router.push("/business/dashboard/get-reviews/email-templates")}
            className="text-[#124541] underline underline-offset-2 hover:text-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Email templates
          </button>
          {" "}
          for signature and other templates.
        </p>
        {layoutSaving && (
          <p className="mt-2 text-xs text-gray-500" aria-live="polite">
            Saving layout…
          </p>
        )}

        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">

              {/* Premium Widget Layout — standard email (selectable layout) */}
              <div className="relative w-[280px] shrink-0">
                <div className={!canStandardLayout ? "opacity-50" : ""}>
                  <button
                    type="button"
                    disabled={layoutSaving || !canStandardLayout}
                    onClick={() => void persistWidgetLayout("standard")}
                    aria-pressed={widgetLayoutStyle === "standard"}
                    className={`h-[270px] w-full rounded-xl border bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
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
                    <p className="mb-2 min-h-[30px] text-xs text-gray-500">Default Tellacity email layout.</p>
                    <div className="pointer-events-none">
                      <EmailWidgetInviteBlock
                        variant="standard"
                        businessName={selectedBusiness?.name ?? ""}
                        density="compact"
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-4 text-center"
                      />
                    </div>
                  </button>
                </div>
                {!canStandardLayout ? (
                  <EmailLayoutLockOverlay
                    onUnlockClick={() =>
                      openUpgradeFeatureModal(
                        requiredPlanForEmailLayout("standard"),
                        "standard",
                      )
                    }
                    ctaLabel={upgradeLabelForPlan(
                      requiredPlanForEmailLayout("standard"),
                    )}
                  />
                ) : null}
              </div>

              {/* Review Hunter — same as Premium, logo footer instead of text branding */}
              <div className="relative w-[280px] shrink-0">
                <div className={!canReviewHunterLayout ? "opacity-50" : ""}>
                  <button
                    type="button"
                    disabled={layoutSaving || !canReviewHunterLayout}
                    onClick={() => void persistWidgetLayout("review_hunter")}
                    aria-pressed={isReviewHunter}
                    className={`h-[270px] w-full rounded-xl border bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isReviewHunter
                        ? "border-[#124541] ring-1 ring-[#124541] shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">Review Hunter</p>
                      {isReviewHunter && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="mb-2 min-h-[30px] text-xs text-gray-500">
                      Same as Premium Widget Layout, but with Tellacity logo footer.
                    </p>
                    <div className="pointer-events-none">
                      <EmailWidgetInviteBlock
                        variant="review_hunter"
                        businessName={selectedBusiness?.name ?? "Your Business"}
                        density="compact"
                        className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-4 text-center"
                      />
                    </div>
                  </button>
                </div>
                {!canReviewHunterLayout ? (
                  <EmailLayoutLockOverlay
                    onUnlockClick={() =>
                      openUpgradeFeatureModal(
                        requiredPlanForEmailLayout("review_hunter"),
                        "review_hunter",
                      )
                    }
                    ctaLabel={upgradeLabelForPlan(
                      requiredPlanForEmailLayout("review_hunter"),
                    )}
                  />
                ) : null}
              </div>

              {/* Rating ladder — Premium & Elite */}
              <div className="relative w-[280px] shrink-0">
                <div className={!canRatingLadderLayout ? "opacity-50" : ""}>
                  <button
                    type="button"
                    disabled={layoutSaving || !canRatingLadderLayout}
                    onClick={() => void persistWidgetLayout("rating_ladder")}
                    aria-pressed={isRatingLadder}
                    className={`h-[270px] w-full rounded-xl border bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
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
                <p className="mb-2 min-h-[30px] text-xs text-gray-500">
                  &quot;How did we do?&quot; rows with Tellacity stars; each row opens the invite-style review form with that rating (Premium+).
                </p>
                <div className="pointer-events-none">
                  <EmailWidgetRatingLadderPreview density="compact" />
                </div>
                  </button>
                </div>
                {!canRatingLadderLayout ? (
                  <EmailLayoutLockOverlay
                    onUnlockClick={() =>
                      openUpgradeFeatureModal(
                        requiredPlanForEmailLayout("rating_ladder"),
                        "rating_ladder",
                      )
                    }
                    ctaLabel={upgradeLabelForPlan(
                      requiredPlanForEmailLayout("rating_ladder"),
                    )}
                  />
                ) : null}
              </div>

              {/* Elite Branded Layout */}
              <div className="relative w-[280px] shrink-0">
                <div className={!canEliteBrandedLayout ? "opacity-50" : ""}>
                  <button
                    type="button"
                    disabled={layoutSaving || !canEliteBrandedLayout}
                    onClick={() => void persistWidgetLayout("elite_branded")}
                    aria-pressed={normalizedPlan === "elite" && isEliteBranded}
                    className={`relative h-[270px] w-full rounded-xl border bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                      normalizedPlan === "elite" && isEliteBranded
                        ? "border-solid border-[#124541] ring-1 ring-[#124541] shadow-sm"
                        : normalizedPlan === "elite"
                          ? "border-solid border-gray-200 hover:border-gray-300 hover:shadow-sm"
                          : "border-dashed border-gray-300 hover:border-gray-400"
                    }`}
                  >
                {normalizedPlan === "elite" && isEliteBranded && (
                  <span className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#124541]">
                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                      <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}

                <p className="mb-1 text-sm font-medium text-gray-900">Elite Branded Layout</p>
                <p className="mb-2 min-h-[30px] text-xs text-gray-500">Includes your business logo &amp; branded header</p>

                <div className="pointer-events-none">
                  <EmailWidgetEliteBrandedCard
                    businessName={selectedBusiness?.name ?? "Your Business"}
                    logoUrl={businessLogoUrl}
                    density="compact"
                  />
                </div>
                  </button>
                </div>
                {!canEliteBrandedLayout ? (
                  <EmailLayoutLockOverlay
                    onUnlockClick={() =>
                      openUpgradeFeatureModal(
                        requiredPlanForEmailLayout("elite_branded"),
                        "elite_branded",
                      )
                    }
                    ctaLabel={upgradeLabelForPlan(
                      requiredPlanForEmailLayout("elite_branded"),
                    )}
                  />
                ) : null}
              </div>

        </div>
      </div>

      {/* Preview + send: Gmail-style compose */}
      <div
        className="mt-8 overflow-hidden rounded-t-xl rounded-b-lg border border-gray-300 bg-white shadow-lg shadow-gray-400/25"
        style={{ boxShadow: "0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)" }}
      >
        {/* Compose chrome (familiar mail-client header) */}
        <div className="flex items-start justify-between gap-3 bg-[#404040] px-3 py-2.5 text-white sm:px-4">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium sm:text-[15px]">New message</h2>
            <p className="truncate text-[11px] font-normal text-white/70">
              Review invite · no credits used ·{" "}
              {isEliteBranded ? (
                <span className="text-white/85">Elite branded</span>
              ) : isRatingLadder ? (
                <span className="text-white/85">Rating ladder</span>
              ) : isReviewHunter ? (
                <span className="text-white/85">Review Hunter</span>
              ) : (
                <span className="text-white/85">Standard layout</span>
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={copySaving || !businessId}
            onClick={() => void persistWidgetCopy()}
            className="shrink-0 pt-0.5 text-sm font-medium text-white/90 underline decoration-white/40 underline-offset-2 transition hover:text-white hover:decoration-white disabled:cursor-not-allowed disabled:text-white/40 disabled:no-underline"
          >
            {copySaving ? "Saving…" : "Save message"}
          </button>
        </div>

        <form
          ref={sendSectionRef}
          onSubmit={handleSend}
          className="flex flex-col"
        >
          {/* To */}
          <div className="flex gap-2 border-b border-gray-200 px-3 py-1 sm:gap-3 sm:px-4">
            <label
              htmlFor="widget-recipients"
              className="w-12 shrink-0 pt-2.5 text-right text-sm text-gray-500 sm:w-14"
            >
              To
            </label>
            <textarea
              id="widget-recipients"
              rows={2}
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="Recipients"
              disabled={!canSend || sending}
              className="min-h-[44px] flex-1 resize-y border-0 bg-transparent py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:ring-0 disabled:text-gray-500"
            />
          </div>
          {recipients.trim() ? (
            <p className="border-b border-gray-100 px-3 py-1.5 pl-[3.25rem] text-xs text-gray-500 sm:pl-[4.5rem]">
              {parseEmails(recipients).length} valid address
              {parseEmails(recipients).length !== 1 ? "es" : ""}
            </p>
          ) : null}

          {/* Subject */}
          <div className="flex gap-2 border-b border-gray-200 px-3 py-1 sm:gap-3 sm:px-4">
            <label
              htmlFor="widget-subject"
              className="w-12 shrink-0 pt-2.5 text-right text-sm text-gray-500 sm:w-14"
            >
              Subject
            </label>
            <input
              id="widget-subject"
              type="text"
              value={widgetSubject}
              onChange={(e) => {
                copyDirtyRef.current = true;
                setWidgetSubject(e.target.value);
              }}
              disabled={copySaving}
              placeholder={suggestedWidgetSubject(selectedBusiness?.name ?? "")}
              className="min-h-[44px] flex-1 border-0 bg-transparent py-2 text-sm text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:ring-0 disabled:bg-transparent disabled:text-gray-500"
            />
          </div>

          {/* Message body + live preview */}
          <div className="min-h-0 flex-1 px-3 py-3 sm:px-4">
            <label htmlFor="widget-intro" className="sr-only">
              Message
            </label>
            <textarea
              id="widget-intro"
              rows={5}
              value={widgetIntro}
              onChange={(e) => {
                copyDirtyRef.current = true;
                setWidgetIntro(e.target.value);
              }}
              disabled={copySaving}
              placeholder={DEFAULT_WIDGET_INTRO}
              className="w-full resize-y border-0 bg-transparent text-sm leading-relaxed text-gray-900 outline-none ring-0 placeholder:text-gray-400 focus:ring-0 disabled:text-gray-500"
            />
            <p className="mt-4 text-xs text-gray-400">
              Below your text, customers see this review block (matches your layout above):
            </p>
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50/80 p-3 sm:p-4">
              <div className="mx-auto max-w-md rounded-lg border border-gray-200/90 bg-white shadow-sm ring-1 ring-black/[0.03]">
                {isEliteBranded && (
                  <div className="border-b border-gray-100 px-4 py-3 text-center">
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
                    <EmailWidgetRatingLadderPreview density="comfortable" />
                  ) : (
                    <EmailWidgetInviteBlock
                      variant={
                        isEliteBranded
                          ? "elite_body"
                          : isReviewHunter
                            ? "review_hunter"
                            : "standard"
                      }
                      businessName={selectedBusiness?.name ?? "Your Business"}
                      density="comfortable"
                    />
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
          </div>

          {!canSend && (
            <p className="border-t border-amber-100 bg-amber-50/80 px-3 py-2.5 text-xs font-medium text-amber-900 sm:px-4">
              Upgrade to send with this layout, or pick a layout your plan supports above.
            </p>
          )}

          {sendFeedback && (
            <div
              role={sendFeedback.kind === "success" ? "status" : "alert"}
              aria-live="polite"
              className={`flex items-start gap-3 border-t px-3 py-3 text-sm sm:px-4 ${
                sendFeedback.kind === "success"
                  ? "border-emerald-100 bg-emerald-50/90 text-emerald-950"
                  : "border-red-100 bg-red-50/90 text-red-900"
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

          {/* Toolbar — Send primary; Save message lives in the dark header above */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/60 px-3 py-3 sm:px-4">
            <button
              type="submit"
              disabled={!canSend || sending || !businessId}
              className="rounded-full bg-[#124541] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
            >
              {!canSend ? "Upgrade to send" : sending ? "Sending…" : "Send"}
            </button>
            <p className="max-w-full text-right text-[11px] text-gray-500 sm:max-w-[min(100%,20rem)]">
              Save message stores subject &amp; intro for sends. Separate addresses with commas or new lines.
            </p>
          </div>
        </form>
      </div>

      {upgradeFeatureModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setUpgradeFeatureModalOpen(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-upgrade-feature-title"
          >
            <h2
              id="email-upgrade-feature-title"
              className="text-lg font-semibold text-[#0E0E0E]"
            >
              {upgradeFeatureModalTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This layout requires the {upgradeRequiredPlan} plan.
              Move up a tier to unlock this layout and get more value from your reviews.
            </p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                What you'll unlock
              </p>
              <EmailLayoutUpgradePreview
                layout={upgradePreviewLayout}
                businessName={selectedBusiness?.name ?? "Your Business"}
                businessLogoUrl={businessLogoUrl}
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setUpgradeFeatureModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpgradeFeatureModalOpen(false);
                  router.push("/business/dashboard/billing?reason=widget");
                }}
                className="rounded-lg bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3a35]"
              >
                {upgradeLabelForPlan(upgradeRequiredPlan)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
