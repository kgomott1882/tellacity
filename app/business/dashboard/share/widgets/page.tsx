"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBusinessContext } from "../../_context/BusinessContext";
import { Check, Copy } from "lucide-react";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";
import {
  incrementUpgradeClickCount,
  upgradeModalTitleForClickCount,
} from "@/lib/upgradeClickStorage";
import {
  canAccessWebsiteWidget,
  normalizePlanCodeToKey,
  type PlanKey,
} from "@/lib/plans";
import WebsiteWidgetUpgradePreview from "@/components/widgets/WebsiteWidgetUpgradePreview";

const WIDGETS = [
  {
    id: "badge",
    name: "Trust Badge",
    description: "Compact rating badge for headers and footers.",
    previewHeight: 120,
    planWidget: "trust_badge" as const,
  },
  {
    id: "carousel",
    name: "Review Carousel",
    description: "Showcase rotating customer reviews.",
    previewHeight: 300,
    planWidget: "review_carousel" as const,
  },
  {
    id: "list",
    name: "Review List",
    description: "Display latest reviews in a vertical list.",
    previewHeight: 420,
    planWidget: "review_list" as const,
  },
  {
    id: "collector",
    name: "Review Collector",
    description: "Button to collect new reviews.",
    previewHeight: 80,
    planWidget: "review_collector" as const,
  },
  {
    id: "review_us",
    name: "Review Strip",
    description: "Elegant review collector strip",
    previewHeight: 88,
    planWidget: "review_strip" as const,
  },
  {
    id: "showcase",
    name: "Review showcase",
    description: "Trust-style card with your latest public review and aggregate stats.",
    previewHeight: 400,
    planWidget: "review_showcase" as const,
  },
  {
    id: "tellacity_trust",
    name: "Tellacity reviews",
    description: "Compact badge: logo, stars, and live rating & review count.",
    previewHeight: 200,
    planWidget: "tellacity_trust" as const,
  },
  {
    id: "score_strip",
    name: "Tellacity Score",
    description: "Trust-style score strip with block stars and review count.",
    previewHeight: 150,
    planWidget: "tellacity_score" as const,
  },
] as const;

type WidgetId = (typeof WIDGETS)[number]["id"];
type WebsiteWidgetKey = (typeof WIDGETS)[number]["planWidget"];

function requiredPlanForWebsiteWidget(widget: WebsiteWidgetKey): PlanKey {
  switch (widget) {
    case "review_collector":
      return "free";
    case "review_carousel":
    case "trust_badge":
      return "grow";
    case "review_list":
    case "review_strip":
    case "review_showcase":
      return "premium";
    case "tellacity_trust":
    case "tellacity_score":
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

function resolveWidgetBaseUrl(): string {
  const envBase = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
  const raw =
    envBase ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    "https://tellacity.com";

  try {
    const parsed = new URL(raw);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";
    if (parsed.protocol === "http:" && !isLocal) {
      parsed.protocol = "https:";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "https://tellacity.com";
  }
}

export default function WebsiteWidgetsPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;
  const planKey = normalizePlanCodeToKey(selectedBusiness.plan);
  const [selected, setSelected] = useState<WidgetId>("collector");
  const [copied, setCopied] = useState(false);
  const [upgradeFeatureModalOpen, setUpgradeFeatureModalOpen] = useState(false);
  const [upgradeFeatureModalTitle, setUpgradeFeatureModalTitle] = useState(
    "Unlock this feature",
  );
  const [upgradeRequiredPlan, setUpgradeRequiredPlan] = useState<PlanKey>("grow");
  const [upgradePreviewWidget, setUpgradePreviewWidget] =
    useState<WebsiteWidgetKey | null>(null);

  const FEATURE_LOCKED = "website_widget" as const;

  const openUpgradeFeatureModal = (
    requiredPlan: PlanKey,
    previewWidget?: WebsiteWidgetKey,
  ) => {
    if (!selectedBusiness?.id) return;
    setUpgradeRequiredPlan(requiredPlan);
    setUpgradePreviewWidget(previewWidget ?? null);
    const n = incrementUpgradeClickCount(FEATURE_LOCKED);
    setUpgradeFeatureModalTitle(upgradeModalTitleForClickCount(n));
    logDashboardActivityClient({
      businessId: selectedBusiness.id,
      action: "feature_locked_clicked",
      metadata: { feature: FEATURE_LOCKED },
    });
    setUpgradeFeatureModalOpen(true);
  };
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const baseUrl = useMemo(() => resolveWidgetBaseUrl(), []);
  const previewBaseUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : baseUrl),
    [baseUrl]
  );
  const previewExtraParams = useMemo(() => {
    if (typeof window === "undefined") return "";
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    // Hide Next.js dev indicator inside iframe preview in local dev.
    return isLocal ? "&__nextjs_disable_dev_indicator=true" : "";
  }, []);

  const slug = selectedBusiness?.slug ?? "";

  useEffect(() => {
    setSelected((current) => {
      const def = WIDGETS.find((w) => w.id === current);
      if (def && canAccessWebsiteWidget(planKey, def.planWidget)) return current;
      const fb = WIDGETS.find((w) => canAccessWebsiteWidget(planKey, w.planWidget));
      return (fb?.id ?? "collector") as WidgetId;
    });
  }, [planKey]);

  const previewUrl = useMemo(
    () =>
      slug
        ? `${previewBaseUrl}/widgets/embed?business=${encodeURIComponent(slug)}&type=${selected}&dashboard_demo=1${previewExtraParams}`
        : "",
    [previewBaseUrl, previewExtraParams, slug, selected]
  );

  const embedCode = useMemo(
    () =>
      `<script src="${baseUrl}/widgets/v1.js" data-business="${slug}" data-type="${selected}"></script>`,
    [baseUrl, slug, selected]
  );

  // Auto-resize iframe from postMessage
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e.data?.type === "tellacity-widget-resize" &&
        iframeRef.current &&
        e.data.src === previewUrl
      ) {
        iframeRef.current.style.height = `${e.data.height + 20}px`;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [previewUrl]);

  // Reset iframe height when widget type changes
  const currentWidget = WIDGETS.find((w) => w.id === selected)!;
  const previewLocked = !canAccessWebsiteWidget(planKey, currentWidget.planWidget);

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.style.height = `${currentWidget.previewHeight}px`;
    }
  }, [selected, currentWidget.previewHeight]);

  function handleCopy() {
    if (previewLocked) return;
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (selectedBusiness?.id) {
        logDashboardActivityClient({
          businessId: selectedBusiness.id,
          action: "widget_generated",
          metadata: { widget_type: selected },
        });
      }
    });
  }

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Website widgets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Showcase verified feedback across your website and channels.
        </p>
      </div>

      {/* Widget selector */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Choose a widget
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {WIDGETS.map((widget) => {
            const isActive = selected === widget.id;
            const cardLocked = !canAccessWebsiteWidget(planKey, widget.planWidget);
            return (
              <button
                key={widget.id}
                type="button"
                onClick={() => {
                  setSelected(widget.id);
                  if (cardLocked) {
                    openUpgradeFeatureModal(
                      requiredPlanForWebsiteWidget(widget.planWidget),
                      widget.planWidget,
                    );
                  }
                }}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  isActive
                    ? "border-[#2fb2a8] bg-[#2fb2a8]/5 shadow-sm"
                    : "border-gray-200 hover:border-[#2fb2a8]/50 bg-white"
                } ${cardLocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">{widget.name}</h3>
                  {cardLocked && (
                    <span className="text-xs" aria-hidden>
                      🔒
                    </span>
                  )}
                  {isActive && (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2fb2a8]">
                      <Check size={10} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">{widget.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Live preview
        </h2>
        <div className="relative rounded-xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
          {!slug ? (
            <p className="text-sm text-gray-400">
              No business selected. Please select a business to preview the widget.
            </p>
          ) : (
            <>
              <div className={previewLocked ? "blur-sm select-none" : ""}>
                <iframe
                  ref={iframeRef}
                  key={previewUrl}
                  src={previewUrl}
                  title={`${currentWidget.name} preview`}
                  className="w-full transition-all duration-300"
                  style={{
                    height: currentWidget.previewHeight,
                    border: 0,
                    display: "block",
                    overflow: "hidden",
                  }}
                  scrolling="no"
                />
              </div>
              {previewLocked ? (
                <button
                  type="button"
                  onClick={() =>
                    openUpgradeFeatureModal(
                      requiredPlanForWebsiteWidget(currentWidget.planWidget),
                      currentWidget.planWidget,
                    )
                  }
                  className="absolute inset-8 z-10 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-0 bg-white/75 px-6 text-center backdrop-blur-md sm:inset-10"
                >
                  <span className="text-sm font-medium text-gray-900">
                    Unlock more widget styles to spotlight reviews and build trust on your site.
                  </span>
                  <span className="rounded-lg bg-[#124541] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3a35]">
                    {upgradeLabelForPlan(upgradeRequiredPlan)}
                  </span>
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Embed code */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Embed code
        </h2>
        <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className={previewLocked ? "blur-sm select-none" : ""}>
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-xs font-medium text-gray-500">HTML</span>
            <button
              type="button"
              onClick={handleCopy}
              disabled={previewLocked}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                copied
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={2.5} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2} />
                  Copy code
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-gray-700 font-mono whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
          </div>
          {previewLocked ? (
            <button
              type="button"
              onClick={() =>
                openUpgradeFeatureModal(
                  requiredPlanForWebsiteWidget(currentWidget.planWidget),
                  currentWidget.planWidget,
                )
              }
              className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-center gap-3 border-0 bg-white/75 px-6 text-center backdrop-blur-md"
            >
              <span className="text-sm font-medium text-gray-900">
                Unlock more widget styles to spotlight reviews and build trust on your site.
              </span>
              <span className="rounded-lg bg-[#124541] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3a35]">
                {upgradeLabelForPlan(upgradeRequiredPlan)}
              </span>
            </button>
          ) : null}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Paste this snippet anywhere in your website HTML where you want the widget to appear.
        </p>
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
            aria-labelledby="widgets-upgrade-feature-title"
          >
            <h2
              id="widgets-upgrade-feature-title"
              className="text-lg font-semibold text-[#0E0E0E]"
            >
              {upgradeFeatureModalTitle}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This widget requires the {upgradeRequiredPlan} plan.
              Move up a tier to unlock more widgets and get more value from your reviews.
              Showcasing reviews builds trust and increases conversions.
            </p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                What you'll unlock
              </p>
              <WebsiteWidgetUpgradePreview
                widget={upgradePreviewWidget}
                businessName={selectedBusiness?.name ?? "Your business"}
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
