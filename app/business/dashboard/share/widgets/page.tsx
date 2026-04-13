"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBusinessContext } from "../../_context/BusinessContext";
import { Check, Copy, RotateCcw, Undo2, Redo2 } from "lucide-react";
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
    previewHeight: 128,
    planWidget: "trust_badge" as const,
  },
  {
    id: "carousel",
    name: "Review Carousel",
    description: "Showcase rotating customer reviews.",
    previewHeight: 320,
    planWidget: "review_carousel" as const,
  },
  {
    id: "list",
    name: "Review List",
    description: "Display latest reviews in a vertical list.",
    previewHeight: 440,
    planWidget: "review_list" as const,
  },
  {
    id: "collector",
    name: "Review Collector",
    description: "Button to collect new reviews.",
    previewHeight: 96,
    planWidget: "review_collector" as const,
  },
  {
    id: "review_us",
    name: "Review Strip",
    description: "Elegant review collector strip",
    previewHeight: 112,
    planWidget: "review_strip" as const,
  },
  {
    id: "showcase",
    name: "Review showcase",
    description: "Trust-style card with your latest public review and aggregate stats.",
    previewHeight: 420,
    planWidget: "review_showcase" as const,
  },
  {
    id: "tellacity_trust",
    name: "Tellacity reviews",
    description: "Compact badge: logo, stars, and live rating & review count.",
    previewHeight: 220,
    planWidget: "tellacity_trust" as const,
  },
  {
    id: "score_strip",
    name: "Tellacity Score",
    description: "Trust-style score strip with block stars and review count.",
    previewHeight: 168,
    planWidget: "tellacity_score" as const,
  },
  {
    id: "trust_strip",
    name: "Tellacity Trust Strip",
    description: "Trustpilot-style strip with stars, score, and review count.",
    previewHeight: 148,
    planWidget: "trust_strip" as const,
  },
  {
    id: "trust_stacked",
    name: "Tellacity Trust Stacked",
    description: "Vertical trust block with headline, stars, count, and logo.",
    previewHeight: 240,
    planWidget: "trust_stacked" as const,
  },
  {
    id: "trust_strip_icon",
    name: "Tellacity Trust Strip (Icon)",
    description: "Compact trust strip with Tellacity icon only.",
    previewHeight: 128,
    planWidget: "trust_strip_icon" as const,
  },
  {
    id: "trust_mini",
    name: "Tellacity Trust Mini",
    description: "Minimal stars + score + review count.",
    previewHeight: 120,
    planWidget: "trust_mini" as const,
  },
] as const;

type WidgetId = (typeof WIDGETS)[number]["id"];
type WebsiteWidgetKey = (typeof WIDGETS)[number]["planWidget"];
type FontKey = "system" | "inter" | "serif" | "mono";
type WidgetWhiteLabelSettings = {
  starColor: string;
  textColor: string;
  accentColor: string;
  font: FontKey;
  showTellacityLogo: boolean;
};

const WHITE_LABEL_DEFAULTS: WidgetWhiteLabelSettings = {
  starColor: "#12B76A",
  textColor: "#0E0E0E",
  accentColor: "#2FB2A8",
  font: "system",
  showTellacityLogo: true,
};

function isSameWhiteLabel(
  a: WidgetWhiteLabelSettings,
  b: WidgetWhiteLabelSettings
): boolean {
  return (
    a.starColor === b.starColor &&
    a.textColor === b.textColor &&
    a.accentColor === b.accentColor &&
    a.font === b.font &&
    a.showTellacityLogo === b.showTellacityLogo
  );
}

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
    case "trust_strip_icon":
      return "elite";
    case "trust_strip":
    case "trust_stacked":
      return "premium";
    case "trust_mini":
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
  const [whiteLabel, setWhiteLabel] = useState<WidgetWhiteLabelSettings>(WHITE_LABEL_DEFAULTS);
  const [whiteLabelLoading, setWhiteLabelLoading] = useState(false);
  const [whiteLabelSaving, setWhiteLabelSaving] = useState(false);
  const [whiteLabelMessage, setWhiteLabelMessage] = useState<string | null>(null);
  const [whiteLabelRevision, setWhiteLabelRevision] = useState(0);
  const [whiteLabelPast, setWhiteLabelPast] = useState<WidgetWhiteLabelSettings[]>([]);
  const [whiteLabelFuture, setWhiteLabelFuture] = useState<WidgetWhiteLabelSettings[]>([]);
  const whiteLabelRef = useRef<WidgetWhiteLabelSettings>(WHITE_LABEL_DEFAULTS);

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
    whiteLabelRef.current = whiteLabel;
  }, [whiteLabel]);

  useEffect(() => {
    setSelected((current) => {
      const def = WIDGETS.find((w) => w.id === current);
      if (def && canAccessWebsiteWidget(planKey, def.planWidget)) return current;
      const fb = WIDGETS.find((w) => canAccessWebsiteWidget(planKey, w.planWidget));
      return (fb?.id ?? "collector") as WidgetId;
    });
  }, [planKey]);

  const previewUrl = useMemo(
    () => {
      if (!slug) return "";
      const qs = new URLSearchParams({
        business: slug,
        type: selected,
        dashboard_demo: "1",
        wlv: String(whiteLabelRevision),
      });
      // Pass unsaved draft values so iframe preview updates live as user edits.
      qs.set("wl_star", whiteLabel.starColor);
      qs.set("wl_text", whiteLabel.textColor);
      qs.set("wl_accent", whiteLabel.accentColor);
      qs.set("wl_font", whiteLabel.font);
      qs.set("wl_logo", whiteLabel.showTellacityLogo ? "1" : "0");
      const glue = previewExtraParams ? `${previewExtraParams}` : "";
      return `${previewBaseUrl}/widgets/embed?${qs.toString()}${glue}`;
    },
    [
      previewBaseUrl,
      previewExtraParams,
      slug,
      selected,
      whiteLabelRevision,
      whiteLabel.starColor,
      whiteLabel.textColor,
      whiteLabel.accentColor,
      whiteLabel.font,
      whiteLabel.showTellacityLogo,
    ]
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
  const canWhiteLabelCurrentWidget = planKey === "elite";
  const upgradeWidgetDisplayName =
    upgradePreviewWidget != null
      ? (WIDGETS.find((w) => w.planWidget === upgradePreviewWidget)?.name ?? null)
      : null;

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.style.height = `${currentWidget.previewHeight}px`;
    }
  }, [selected, currentWidget.previewHeight]);

  useEffect(() => {
    let cancelled = false;
    async function loadWhiteLabel() {
      if (!selectedBusiness?.id || planKey !== "elite") {
        setWhiteLabel(WHITE_LABEL_DEFAULTS);
        setWhiteLabelPast([]);
        setWhiteLabelFuture([]);
        setWhiteLabelLoading(false);
        return;
      }
      setWhiteLabelLoading(true);
      setWhiteLabelMessage(null);
      try {
        const res = await fetch(`/api/business/${selectedBusiness.id}/widget-white-label`, {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => ({}))) as {
          settings?: Partial<WidgetWhiteLabelSettings>;
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Failed to load white-label settings.");
        if (cancelled) return;
        setWhiteLabel({
          starColor: json.settings?.starColor ?? WHITE_LABEL_DEFAULTS.starColor,
          textColor: json.settings?.textColor ?? WHITE_LABEL_DEFAULTS.textColor,
          accentColor: json.settings?.accentColor ?? WHITE_LABEL_DEFAULTS.accentColor,
          font: (json.settings?.font as FontKey | undefined) ?? WHITE_LABEL_DEFAULTS.font,
          showTellacityLogo:
            typeof json.settings?.showTellacityLogo === "boolean"
              ? json.settings.showTellacityLogo
              : WHITE_LABEL_DEFAULTS.showTellacityLogo,
        });
        setWhiteLabelPast([]);
        setWhiteLabelFuture([]);
        setWhiteLabelRevision((v) => v + 1);
      } catch (e) {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Failed to load white-label settings.";
          setWhiteLabelMessage(message);
          setWhiteLabel(WHITE_LABEL_DEFAULTS);
          setWhiteLabelPast([]);
          setWhiteLabelFuture([]);
        }
      } finally {
        if (!cancelled) setWhiteLabelLoading(false);
      }
    }
    void loadWhiteLabel();
    return () => {
      cancelled = true;
    };
  }, [planKey, selectedBusiness?.id]);

  async function saveWhiteLabelSettings() {
    if (!selectedBusiness?.id || planKey !== "elite") return;
    setWhiteLabelSaving(true);
    setWhiteLabelMessage(null);
    try {
      const res = await fetch(`/api/business/${selectedBusiness.id}/widget-white-label`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: whiteLabel }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save white-label settings.");
      setWhiteLabelMessage("Saved. Live preview updated.");
      setWhiteLabelRevision((v) => v + 1);
    } catch (e) {
      setWhiteLabelMessage(e instanceof Error ? e.message : "Failed to save white-label settings.");
    } finally {
      setWhiteLabelSaving(false);
    }
  }

  function applyWhiteLabelUpdate(
    updater: (current: WidgetWhiteLabelSettings) => WidgetWhiteLabelSettings
  ) {
    setWhiteLabel((current) => {
      const next = updater(current);
      if (isSameWhiteLabel(current, next)) return current;
      setWhiteLabelPast((prev) => [...prev, current].slice(-40));
      setWhiteLabelFuture([]);
      setWhiteLabelMessage(null);
      setWhiteLabelRevision((v) => v + 1);
      return next;
    });
  }

  function undoWhiteLabelChange() {
    setWhiteLabelPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const current = whiteLabelRef.current;
      setWhiteLabel(previous);
      setWhiteLabelFuture((prevFuture) => [current, ...prevFuture].slice(0, 40));
      setWhiteLabelMessage(null);
      setWhiteLabelRevision((v) => v + 1);
      return prevPast.slice(0, -1);
    });
  }

  function redoWhiteLabelChange() {
    setWhiteLabelFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const [next, ...rest] = prevFuture;
      const current = whiteLabelRef.current;
      setWhiteLabel(next);
      setWhiteLabelPast((prevPast) => [...prevPast, current].slice(-40));
      setWhiteLabelMessage(null);
      setWhiteLabelRevision((v) => v + 1);
      return rest;
    });
  }

  function resetWhiteLabelSettings() {
    const current = whiteLabelRef.current;
    if (isSameWhiteLabel(current, WHITE_LABEL_DEFAULTS)) return;
    setWhiteLabelPast((prev) => [...prev, current].slice(-40));
    setWhiteLabelFuture([]);
    setWhiteLabel(WHITE_LABEL_DEFAULTS);
    setWhiteLabelMessage("Reset to defaults. Save to apply.");
    setWhiteLabelRevision((v) => v + 1);
  }

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

      {canWhiteLabelCurrentWidget ? (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Elite white-label
          </h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-xs text-gray-500">
              Customize stars, font, and widget colors for all website widgets on Elite. The Tellacity logo asset
              stays fixed, but you can hide/show it.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                Star color
                <input
                  type="color"
                  value={whiteLabel.starColor}
                  disabled={whiteLabelLoading || whiteLabelSaving}
                  onChange={(e) =>
                    applyWhiteLabelUpdate((prev) => ({ ...prev, starColor: e.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-gray-200 bg-white p-1"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                Text color
                <input
                  type="color"
                  value={whiteLabel.textColor}
                  disabled={whiteLabelLoading || whiteLabelSaving}
                  onChange={(e) =>
                    applyWhiteLabelUpdate((prev) => ({ ...prev, textColor: e.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-gray-200 bg-white p-1"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                Accent color
                <input
                  type="color"
                  value={whiteLabel.accentColor}
                  disabled={whiteLabelLoading || whiteLabelSaving}
                  onChange={(e) =>
                    applyWhiteLabelUpdate((prev) => ({ ...prev, accentColor: e.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-gray-200 bg-white p-1"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-gray-600">
                Font family
                <select
                  value={whiteLabel.font}
                  disabled={whiteLabelLoading || whiteLabelSaving}
                  onChange={(e) =>
                    applyWhiteLabelUpdate((prev) => ({
                      ...prev,
                      font: (e.target.value as FontKey) ?? "system",
                    }))
                  }
                  className="h-10 rounded-md border border-gray-200 bg-white px-2 text-sm text-gray-700"
                >
                  <option value="system">System</option>
                  <option value="inter">Inter</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={whiteLabel.showTellacityLogo}
                  disabled={whiteLabelLoading || whiteLabelSaving}
                  onChange={(e) =>
                    applyWhiteLabelUpdate((prev) => ({ ...prev, showTellacityLogo: e.target.checked }))
                  }
                />
                Show Tellacity logo
              </label>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={undoWhiteLabelChange}
                disabled={whiteLabelLoading || whiteLabelSaving || whiteLabelPast.length === 0}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Undo2 size={12} />
                Back
              </button>
              <button
                type="button"
                onClick={redoWhiteLabelChange}
                disabled={whiteLabelLoading || whiteLabelSaving || whiteLabelFuture.length === 0}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Redo2 size={12} />
                Forward
              </button>
              <button
                type="button"
                onClick={resetWhiteLabelSettings}
                disabled={whiteLabelLoading || whiteLabelSaving}
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button
                type="button"
                onClick={() => void saveWhiteLabelSettings()}
                disabled={whiteLabelLoading || whiteLabelSaving}
                className="rounded-lg bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {whiteLabelSaving ? "Saving..." : "Save white-label settings"}
              </button>
              {whiteLabelMessage ? (
                <span className="text-xs text-gray-600">{whiteLabelMessage}</span>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

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
            className="relative w-full max-w-md rounded-xl bg-[#3A3A3A] p-6 text-[#E8DDC7] shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="widgets-upgrade-feature-title"
          >
            <h2
              id="widgets-upgrade-feature-title"
              className="text-lg font-semibold text-[#F3E8D0]"
            >
              {upgradeFeatureModalTitle}
            </h2>
            <p className="mt-2 text-sm text-[#D9CEB6]">
              This widget requires the {upgradeRequiredPlan} plan.
              Move up a tier to unlock more widgets and get more value from your reviews.
              Showcasing reviews builds trust and increases conversions.
            </p>
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#C9BEA6]">
                What you'll unlock
              </p>
              {upgradeWidgetDisplayName ? (
                <p className="mb-2 text-sm font-semibold text-[#F3E8D0]">
                  {upgradeWidgetDisplayName}
                </p>
              ) : null}
              <WebsiteWidgetUpgradePreview
                widget={upgradePreviewWidget}
                businessSlug={selectedBusiness?.slug ?? null}
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setUpgradeFeatureModalOpen(false)}
                className="rounded-lg border border-[#C9BEA6]/60 px-4 py-2 text-sm font-medium text-[#E8DDC7] hover:bg-[#4A4A4A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpgradeFeatureModalOpen(false);
                  router.push("/business/dashboard/billing?reason=widget");
                }}
                className="rounded-lg bg-[#124541] px-4 py-2 text-sm font-semibold text-[#F3E8D0] hover:bg-[#0f3a35]"
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
