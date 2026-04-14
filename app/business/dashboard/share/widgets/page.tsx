"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBusinessContext } from "../../_context/BusinessContext";
import { Check, Copy, Monitor, RotateCcw, Smartphone, Undo2, Redo2 } from "lucide-react";
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
    sizesHelp: "Typical width about 260–340px; height scales with your logo and text.",
    previewHeight: 128,
    planWidget: "trust_badge" as const,
  },
  {
    id: "carousel",
    name: "Review Carousel",
    description: "Showcase rotating customer reviews.",
    sizesHelp: "Horizontal strip; allow at least ~320px width for comfortable reading.",
    previewHeight: 320,
    planWidget: "review_carousel" as const,
  },
  {
    id: "list",
    name: "Review List",
    description: "Display latest reviews in a vertical list.",
    sizesHelp: "Up to about 420px wide recommended; height grows with review count.",
    previewHeight: 440,
    planWidget: "review_list" as const,
  },
  {
    id: "collector",
    name: "Review Collector",
    description: "Button to collect new reviews.",
    sizesHelp: "Inline-friendly; fits in narrow columns from ~280px width upward.",
    previewHeight: 96,
    planWidget: "review_collector" as const,
  },
  {
    id: "review_us",
    name: "Review Strip",
    description: "Elegant review collector strip",
    sizesHelp: "Single horizontal strip; roughly 240–520px wide depending on copy.",
    previewHeight: 112,
    planWidget: "review_strip" as const,
  },
  {
    id: "showcase",
    name: "Review showcase",
    description: "Trust-style card with your latest public review and aggregate stats.",
    sizesHelp: "Card-style block; about 360–420px wide works well on desktop.",
    previewHeight: 420,
    planWidget: "review_showcase" as const,
  },
  {
    id: "tellacity_trust",
    name: "Tellacity reviews",
    description: "Compact badge: logo, stars, and live rating & review count.",
    sizesHelp: "Compact; reserve roughly 200–280px width by 120–220px height.",
    previewHeight: 220,
    planWidget: "tellacity_trust" as const,
  },
  {
    id: "score_strip",
    name: "Tellacity Score",
    description: "Trust-style score strip with block stars and review count.",
    sizesHelp: "Score row; about 280–320px wide, height driven by stacked lines.",
    previewHeight: 168,
    planWidget: "tellacity_score" as const,
  },
  {
    id: "trust_strip",
    name: "Tellacity Trust Strip",
    description: "Trustpilot-style strip with stars, score, and review count.",
    sizesHelp: "Full-width strip on mobile; desktop from ~300px wide.",
    previewHeight: 148,
    planWidget: "trust_strip" as const,
  },
  {
    id: "trust_stacked",
    name: "Tellacity Trust Stacked",
    description: "Vertical trust block with headline, stars, count, and logo.",
    sizesHelp: "Vertical block; about 240–320px wide, height ~200–260px.",
    previewHeight: 240,
    planWidget: "trust_stacked" as const,
  },
  {
    id: "trust_strip_icon",
    name: "Tellacity Trust Strip (Icon)",
    description: "Compact trust strip with Tellacity icon only.",
    sizesHelp: "Compact row; from ~260px wide on desktop layouts.",
    previewHeight: 128,
    planWidget: "trust_strip_icon" as const,
  },
  {
    id: "trust_mini",
    name: "Tellacity Trust Mini",
    description: "Minimal stars + score + review count.",
    sizesHelp: "Minimal inline row; from ~180px wide.",
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
  textColor: "#000000",
  accentColor: "#000000",
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

function planDisplayName(plan: PlanKey): string {
  switch (plan) {
    case "grow":
      return "Grow";
    case "premium":
      return "Premium";
    case "elite":
      return "Elite";
    default:
      return "Free";
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

/** Live preview: classic transparency grid when not simulating a site background. */
const TRANSPARENCY_CHECKERBOARD_STYLE: CSSProperties = {
  backgroundColor: "#ffffff",
  backgroundImage: `
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
  `,
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
};

function parsePreviewSiteHex(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const h = t.startsWith("#") ? t : `#${t}`;
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h : null;
}

export default function WebsiteWidgetsPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const planKey: PlanKey = selectedBusiness?.id
    ? normalizePlanCodeToKey(selectedBusiness.plan)
    : "free";
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
  const [embedMinimal, setEmbedMinimal] = useState(true);
  /** When false, embed uses default floating (transparent) theme; when true, user can pick classic + preview backdrop. */
  const [widgetSettingsAdvanced, setWidgetSettingsAdvanced] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewSiteBackgroundHex, setPreviewSiteBackgroundHex] = useState("");
  const [embedSettingsSynced, setEmbedSettingsSynced] = useState(false);
  const [embedSettingsSaveError, setEmbedSettingsSaveError] = useState<string | null>(null);
  const skipNextEmbedSettingsSave = useRef(true);
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

  const currentWidget = WIDGETS.find((w) => w.id === selected)!;
  const previewLocked = !canAccessWebsiteWidget(planKey, currentWidget.planWidget);
  const canWhiteLabelCurrentWidget = planKey === "elite";

  const effectiveEmbedMinimal = !widgetSettingsAdvanced || embedMinimal;

  const previewPanelSurface = useMemo((): CSSProperties => {
    if (!widgetSettingsAdvanced) {
      return TRANSPARENCY_CHECKERBOARD_STYLE;
    }
    const hex = parsePreviewSiteHex(previewSiteBackgroundHex);
    if (hex) {
      return { backgroundColor: hex, backgroundImage: "none" };
    }
    return TRANSPARENCY_CHECKERBOARD_STYLE;
  }, [widgetSettingsAdvanced, previewSiteBackgroundHex]);

  useEffect(() => {
    whiteLabelRef.current = whiteLabel;
  }, [whiteLabel]);

  type ServerEmbedTheme = "minimal" | "light";

  type ServerEmbedSettings = {
    themes: Partial<Record<WidgetId, ServerEmbedTheme>>;
    advancedEnabled: boolean;
    previewSiteBackgroundHex: string;
  };

  const [serverEmbedSettings, setServerEmbedSettings] = useState<ServerEmbedSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadEmbedSettings() {
      if (!selectedBusiness?.id) {
        setServerEmbedSettings(null);
        setEmbedSettingsSynced(false);
        return;
      }
      skipNextEmbedSettingsSave.current = true;
      setEmbedSettingsSynced(false);
      try {
        const res = await fetch(`/api/business/${selectedBusiness.id}/widget-embed-settings`, {
          cache: "no-store",
        });
        const json = (await res.json().catch(() => ({}))) as {
          settings?: {
            themes?: Partial<Record<string, string>>;
            advancedEnabled?: boolean;
            previewSiteBackgroundHex?: string;
          };
          error?: string;
        };
        if (!res.ok) throw new Error(json.error ?? "Failed to load widget embed settings.");
        if (cancelled) return;
        const themes: Partial<Record<WidgetId, ServerEmbedTheme>> = {};
        for (const w of WIDGETS) {
          const t = json.settings?.themes?.[w.id];
          if (t === "light" || t === "minimal") themes[w.id] = t;
        }
        setServerEmbedSettings({
          themes,
          advancedEnabled: !!json.settings?.advancedEnabled,
          previewSiteBackgroundHex: json.settings?.previewSiteBackgroundHex ?? "",
        });
        setWidgetSettingsAdvanced(!!json.settings?.advancedEnabled);
        setPreviewSiteBackgroundHex(json.settings?.previewSiteBackgroundHex ?? "");
        setEmbedSettingsSaveError(null);
      } catch {
        if (!cancelled) {
          setServerEmbedSettings({ themes: {}, advancedEnabled: false, previewSiteBackgroundHex: "" });
          setEmbedSettingsSaveError(null);
        }
      } finally {
        if (!cancelled) setEmbedSettingsSynced(true);
      }
    }
    void loadEmbedSettings();
    return () => {
      cancelled = true;
    };
  }, [selectedBusiness?.id]);

  useEffect(() => {
    if (!serverEmbedSettings || !embedSettingsSynced) return;
    const t = serverEmbedSettings.themes[selected] ?? "minimal";
    setEmbedMinimal(t !== "light");
  }, [selected, serverEmbedSettings, embedSettingsSynced]);

  useEffect(() => {
    if (!selectedBusiness?.id || !embedSettingsSynced || previewLocked) return;
    if (skipNextEmbedSettingsSave.current) {
      skipNextEmbedSettingsSave.current = false;
      return;
    }

    const hexClean = previewSiteBackgroundHex.trim();
    const previewHexResolved = parsePreviewSiteHex(hexClean) ?? "";
    const patch: {
      advancedEnabled: boolean;
      previewSiteBackgroundHex: string;
      themes?: Partial<Record<WidgetId, ServerEmbedTheme>>;
    } = {
      advancedEnabled: widgetSettingsAdvanced,
      previewSiteBackgroundHex: previewHexResolved,
    };
    if (widgetSettingsAdvanced) {
      patch.themes = { [selected]: embedMinimal ? "minimal" : "light" };
    }

    const t = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/business/${selectedBusiness.id}/widget-embed-settings`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ patch }),
          });
          const json = (await res.json().catch(() => ({}))) as {
            settings?: ServerEmbedSettings & { themes?: Partial<Record<string, string>> };
            error?: string;
          };
          if (!res.ok) throw new Error(json.error ?? "Failed to save widget settings.");
          setEmbedSettingsSaveError(null);
          if (json.settings?.themes) {
            const themes: Partial<Record<WidgetId, ServerEmbedTheme>> = {};
            for (const w of WIDGETS) {
              const th = json.settings.themes[w.id];
              if (th === "light" || th === "minimal") themes[w.id] = th;
            }
            setServerEmbedSettings({
              themes,
              advancedEnabled: !!json.settings.advancedEnabled,
              previewSiteBackgroundHex: json.settings.previewSiteBackgroundHex ?? "",
            });
          }
        } catch (e) {
          setEmbedSettingsSaveError(e instanceof Error ? e.message : "Save failed.");
        }
      })();
    }, 500);

    return () => clearTimeout(t);
  }, [
    selectedBusiness?.id,
    embedSettingsSynced,
    previewLocked,
    widgetSettingsAdvanced,
    embedMinimal,
    selected,
    previewSiteBackgroundHex,
  ]);

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
      qs.set("theme", effectiveEmbedMinimal ? "minimal" : "light");
      const glue = previewExtraParams ? `${previewExtraParams}` : "";
      return `${previewBaseUrl}/widgets/embed?${qs.toString()}${glue}`;
    },
    [
      previewBaseUrl,
      previewExtraParams,
      slug,
      selected,
      effectiveEmbedMinimal,
      whiteLabelRevision,
      whiteLabel.starColor,
      whiteLabel.textColor,
      whiteLabel.accentColor,
      whiteLabel.font,
      whiteLabel.showTellacityLogo,
    ]
  );

  const embedCode = useMemo(() => {
    const theme = effectiveEmbedMinimal ? "minimal" : "light";
    return `<script src="${baseUrl}/widgets/v1.js" data-business="${slug}" data-type="${selected}" data-theme="${theme}"></script>`;
  }, [baseUrl, slug, selected, effectiveEmbedMinimal]);

  // Auto-resize iframe from postMessage
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e.data?.type === "tellacity-widget-resize" &&
        iframeRef.current &&
        e.data.src === previewUrl
      ) {
        const pad = effectiveEmbedMinimal ? 4 : 20;
        iframeRef.current.style.height = `${e.data.height + pad}px`;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [previewUrl, effectiveEmbedMinimal]);

  // Reset iframe height when widget type changes
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

  if (!selectedBusiness?.id) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-0">
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

      <div className="rounded-xl border-2 border-[#124541] bg-white p-6 shadow-sm space-y-8">
        {/* Widget settings + preview (Trustpilot-style) */}
        <div className="grid gap-8 border-b border-gray-100 pb-8 lg:grid-cols-[minmax(280px,340px)_1fr] lg:gap-10">
          <aside
            className={`space-y-6 lg:border-r lg:border-gray-100 lg:pr-8 ${previewLocked ? "opacity-60" : ""}`}
          >
            <div>
              <h2 className="text-lg font-semibold text-[#0E0E0E]">{currentWidget.name}</h2>
              <p className="mt-1 text-xs text-gray-500">Website widget · availability follows your plan</p>
            </div>

            {previewLocked ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-3 text-sm text-amber-950">
                <p className="font-medium">
                  Get the {planDisplayName(requiredPlanForWebsiteWidget(currentWidget.planWidget))} plan to use this
                  widget on your website.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    openUpgradeFeatureModal(
                      requiredPlanForWebsiteWidget(currentWidget.planWidget),
                      currentWidget.planWidget,
                    )
                  }
                  className="mt-3 rounded-md bg-[#124541] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3a35]"
                >
                  {upgradeLabelForPlan(requiredPlanForWebsiteWidget(currentWidget.planWidget))}
                </button>
              </div>
            ) : null}

            <section className="space-y-2 border-t border-gray-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">About</h3>
              <p className="text-sm leading-relaxed text-gray-700">{currentWidget.description}</p>
            </section>

            <section className="space-y-2 border-t border-gray-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Supported sizes</h3>
              <p className="text-sm leading-relaxed text-gray-700">{currentWidget.sizesHelp}</p>
              <p className="text-xs text-gray-500">Responsive · mobile, tablet, and desktop ready.</p>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customize</h3>
                <a
                  href="#website-widgets-howto-heading"
                  className="shrink-0 text-xs font-medium text-[#1e6b9e] underline-offset-2 hover:underline"
                >
                  Need help?
                </a>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">Custom embed options</p>
                  <p className="text-xs text-gray-500">
                    Off = default floating (transparent). On = change surface and preview backdrop.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={widgetSettingsAdvanced}
                  disabled={previewLocked}
                  onClick={() =>
                    setWidgetSettingsAdvanced((v) => {
                      const next = !v;
                      if (!next) {
                        setEmbedMinimal(true);
                        setPreviewSiteBackgroundHex("");
                      }
                      return next;
                    })
                  }
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2fb2a8] focus-visible:ring-offset-2 ${
                    widgetSettingsAdvanced ? "bg-[#2fb2a8]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow transition ${
                      widgetSettingsAdvanced ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {widgetSettingsAdvanced ? (
                <div className="space-y-4">
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-medium text-gray-700">Embed surface</legend>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                      <input
                        type="radio"
                        name="embed-surface"
                        className="border-gray-300 text-[#2fb2a8] focus:ring-[#2fb2a8]"
                        checked={embedMinimal}
                        disabled={previewLocked}
                        onChange={() => setEmbedMinimal(true)}
                      />
                      Floating (transparent, like a PNG)
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                      <input
                        type="radio"
                        name="embed-surface"
                        className="border-gray-300 text-[#2fb2a8] focus:ring-[#2fb2a8]"
                        checked={!embedMinimal}
                        disabled={previewLocked}
                        onChange={() => setEmbedMinimal(false)}
                      />
                      Classic (padded card-style in the embed)
                    </label>
                  </fieldset>

                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-700">Preview backdrop (dashboard only)</p>
                    <p className="text-xs text-gray-500">
                      Simulates your site background behind the widget in this preview only. It is not sent to your
                      live site — the real page color shows through a floating widget. Use{" "}
                      <span className="font-medium text-gray-700">Classic</span> above if you want a card inside the
                      embed.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label="Preview background swatch"
                        value={parsePreviewSiteHex(previewSiteBackgroundHex) ?? "#ffffff"}
                        disabled={previewLocked}
                        onChange={(e) => setPreviewSiteBackgroundHex(e.target.value)}
                        className="h-9 w-12 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="#f5f5f5"
                        value={previewSiteBackgroundHex}
                        disabled={previewLocked}
                        onChange={(e) => setPreviewSiteBackgroundHex(e.target.value)}
                        className="min-w-0 flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-800"
                        spellCheck={false}
                      />
                    </div>
                    {previewSiteBackgroundHex.trim() && !parsePreviewSiteHex(previewSiteBackgroundHex) ? (
                      <p className="text-xs text-amber-700">Use a full hex color, for example #1a1a1a.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>
          </aside>

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Preview</h2>
              <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 ${
                    previewDevice === "desktop"
                      ? "bg-[#124541] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Monitor size={14} aria-hidden />
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 ${
                    previewDevice === "mobile"
                      ? "bg-[#124541] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Smartphone size={14} aria-hidden />
                  Mobile
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-gray-500">
              Checkerboard indicates a transparent widget — it inherits the host page behind it. Embed surface
              (floating vs classic) is saved for your business and also appears in the code snippet as{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-theme</code>.
            </p>
            {embedSettingsSaveError ? (
              <p className="mb-2 text-xs text-red-600">{embedSettingsSaveError}</p>
            ) : null}

            <div
              className={`relative rounded-lg border border-gray-200 p-4 sm:p-6 ${
                previewDevice === "mobile" ? "mx-auto max-w-[400px]" : ""
              }`}
              style={previewPanelSurface}
            >
              {!slug ? (
                <p className="text-sm text-gray-600">
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
                      className={
                        effectiveEmbedMinimal
                          ? "max-w-full align-middle transition-all duration-300"
                          : "w-full transition-all duration-300"
                      }
                      style={{
                        height: currentWidget.previewHeight,
                        border: 0,
                        display: effectiveEmbedMinimal ? "inline-block" : "block",
                        verticalAlign: effectiveEmbedMinimal ? "middle" : undefined,
                        width: effectiveEmbedMinimal ? "auto" : "100%",
                        maxWidth: effectiveEmbedMinimal ? "100%" : undefined,
                        backgroundColor: "transparent",
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
                      className="absolute inset-4 z-10 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-0 bg-white/80 px-4 text-center backdrop-blur-md sm:inset-6"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        Unlock this widget for your plan to preview and embed it live.
                      </span>
                      <span className="rounded-lg bg-[#124541] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f3a35]">
                        {upgradeLabelForPlan(requiredPlanForWebsiteWidget(currentWidget.planWidget))}
                      </span>
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        {canWhiteLabelCurrentWidget ? (
          <div className="border-t border-gray-100 pt-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Elite white-label
            </h2>
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
        ) : null}

        {/* Embed code */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Embed code
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            The snippet includes{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">data-theme</code> matching Customize (floating ={" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">minimal</code>, classic ={" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">light</code>). If your site builder strips custom
            attributes, remove <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">data-theme</code> entirely —
            your saved surface choice still applies on the live widget.
          </p>
          <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-neutral-50/30 shadow-sm">
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

        <div
          className="border-t border-gray-100 pt-6 text-sm text-[#374151]"
          aria-labelledby="website-widgets-howto-heading"
        >
          <h2
            id="website-widgets-howto-heading"
            className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500"
          >
            How to add this to your website
          </h2>
          <ol className="list-decimal space-y-3 pl-4 marker:font-semibold marker:text-[#2fb2a8]">
            <li>
              Choose a widget above and check the live preview matches what you want visitors to see.
            </li>
            <li>
              Copy the embed code from the HTML box. It loads our script (
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/widgets/v1.js</code>) and automatically
              displays your business reviews.
            </li>
            <li>
              Paste it into your website (usually in a Custom HTML or Embed block) — common places include your
              homepage, footer, or a dedicated &ldquo;Reviews&rdquo; page.
            </li>
            <li>Publish and refresh your site for instant backlink for SEO.</li>
          </ol>
          <p className="mt-4 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-600">
            Your widget updates automatically when new reviews come in — no maintenance needed.
          </p>
        </div>
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
                What you&apos;ll unlock
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
