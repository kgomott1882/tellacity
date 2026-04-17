"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useBusinessContext } from "../../_context/BusinessContext";
import {
  Check,
  ChevronDown,
  Copy,
  Minus,
  Plus,
  Lock,
  Monitor,
  RotateCcw,
  Smartphone,
  Undo2,
  Redo2,
  X,
} from "lucide-react";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";
import {
  canAccessWebsiteWidget,
  normalizePlanCodeToKey,
  type PlanKey,
} from "@/lib/plans";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";
import {
  DASHBOARD_PREVIEW_REVIEW_LIMIT_MIN,
  dashboardPreviewReviewLimitCap,
} from "@/lib/widgetDashboardDemoPayload";
import {
  DEFAULT_REVIEW_STAR_RATINGS,
  formatReviewStarsForQuery,
  isFullStarSelection,
  normalizeReviewStarRatings,
} from "@/lib/widgetReviewStarFilter";
import type { WidgetType } from "@/components/widgets/types";
import {
  WIDGET_CATEGORIES,
  WIDGET_CATEGORY_KEYS,
  WEBSITE_WIDGETS as WIDGETS,
  WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS,
  type WebsiteWidgetId as WidgetId,
} from "@/lib/widgetsConfig";

/** Iframe `location.href` vs parent `previewUrl` can differ in hash/trailing slash; compare path+query. */
function embedResizeMessageMatchesPreview(previewUrl: string, messageSrc: unknown): boolean {
  if (typeof messageSrc !== "string" || !messageSrc.trim()) return false;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "https://tellacity.com";
    const a = new URL(previewUrl, base);
    const b = new URL(messageSrc);
    return a.pathname === b.pathname && a.search === b.search;
  } catch {
    return previewUrl === messageSrc;
  }
}

/** Embed ids that support preview count + star filters (testimonial widgets). */
const WIDGET_IDS_WITH_PREVIEW_LIMIT = WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS;
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

function requiredPlanForWebsiteWidget(
  widget: Parameters<typeof canAccessWebsiteWidget>[1],
): PlanKey {
  switch (widget) {
    case "review_collector":
    case "review_strip":
      return "free";
    case "review_carousel":
    case "trust_badge":
      return "grow";
    case "review_list":
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
    case "spotlight_carousel":
    case "review_slider":
    case "review_dropdown":
    case "micro_trustscore":
      return "premium";
    default:
      return "grow";
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

/** Multi-review widgets: dashboard can tune how many reviews load in preview & embed (`data-limit`). Available on every plan. */
function isWidgetWithPreviewLimit(id: WidgetId): boolean {
  return (WIDGET_IDS_WITH_PREVIEW_LIMIT as readonly string[]).includes(id);
}

function previewReviewLimitMax(id: WidgetId): number {
  return dashboardPreviewReviewLimitCap(id as WidgetType);
}

function defaultPreviewReviewLimit(id: WidgetId): number {
  switch (id) {
    case "spotlight_carousel":
    case "review_slider":
      return 8;
    case "review_dropdown":
      return 4;
    default:
      return 3;
  }
}

function clampPreviewReviewLimit(id: WidgetId, n: number): number {
  const max = previewReviewLimitMax(id);
  let v = Math.floor(Number(n));
  if (!Number.isFinite(v)) v = defaultPreviewReviewLimit(id);
  return Math.min(max, Math.max(DASHBOARD_PREVIEW_REVIEW_LIMIT_MIN, v));
}

function normalizePreviewReviewLimitsFromStorage(parsed: unknown): Partial<Record<WidgetId, number>> {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const src = parsed as Record<string, unknown>;
  const out: Partial<Record<WidgetId, number>> = {};
  for (const wid of WIDGET_IDS_WITH_PREVIEW_LIMIT) {
    const v = src[wid];
    const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
    if (!Number.isFinite(n)) continue;
    out[wid] = clampPreviewReviewLimit(wid, n);
  }
  return out;
}

function previewLimitStorageKey(businessId: string): string {
  return `tellacity-widget-preview-limits-${businessId}`;
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
  /** Trustpilot-style: pick a widget from the grid, then configure in a full-screen modal. */
  const [widgetConfigureOpen, setWidgetConfigureOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState<WidgetWhiteLabelSettings>(WHITE_LABEL_DEFAULTS);
  const [whiteLabelLoading, setWhiteLabelLoading] = useState(false);
  const [whiteLabelSaving, setWhiteLabelSaving] = useState(false);
  const [whiteLabelMessage, setWhiteLabelMessage] = useState<string | null>(null);
  const [whiteLabelRevision, setWhiteLabelRevision] = useState(0);
  const [whiteLabelPast, setWhiteLabelPast] = useState<WidgetWhiteLabelSettings[]>([]);
  const [whiteLabelFuture, setWhiteLabelFuture] = useState<WidgetWhiteLabelSettings[]>([]);

  type EmbedCustomizeSnapshot = {
    widgetSettingsAdvanced: boolean;
    embedMinimal: boolean;
    previewSiteBackgroundHex: string;
    showBusinessName: boolean;
  };
  const EMBED_CUSTOMIZE_INITIAL: EmbedCustomizeSnapshot = {
    widgetSettingsAdvanced: false,
    embedMinimal: true,
    previewSiteBackgroundHex: "",
    showBusinessName: true,
  };
  function isSameEmbedCustomize(a: EmbedCustomizeSnapshot, b: EmbedCustomizeSnapshot) {
    return (
      a.widgetSettingsAdvanced === b.widgetSettingsAdvanced &&
      a.embedMinimal === b.embedMinimal &&
      a.previewSiteBackgroundHex === b.previewSiteBackgroundHex &&
      a.showBusinessName === b.showBusinessName
    );
  }
  const [embedCustomizePast, setEmbedCustomizePast] = useState<EmbedCustomizeSnapshot[]>([]);
  const [embedCustomizeFuture, setEmbedCustomizeFuture] = useState<EmbedCustomizeSnapshot[]>([]);
  const embedCustomizeRef = useRef<EmbedCustomizeSnapshot>(EMBED_CUSTOMIZE_INITIAL);
  const lastEmbedThemeForWidgetRef = useRef<WidgetId | null>(null);

  const [embedMinimal, setEmbedMinimal] = useState(true);
  /** When false, embed uses default floating (transparent) theme; when true, user can pick classic + preview backdrop. */
  const [widgetSettingsAdvanced, setWidgetSettingsAdvanced] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [previewSiteBackgroundHex, setPreviewSiteBackgroundHex] = useState("");
  const [showBusinessName, setShowBusinessName] = useState(true);
  const [embedSettingsSynced, setEmbedSettingsSynced] = useState(false);
  const [embedSettingsSaveError, setEmbedSettingsSaveError] = useState<string | null>(null);
  const [embedAppearanceSaving, setEmbedAppearanceSaving] = useState(false);
  const [embedAppearanceMessage, setEmbedAppearanceMessage] = useState<string | null>(null);
  /** Collapsed by default so Elite / upgrade is not mistaken for a required step. */
  const [eliteWhiteLabelOpen, setEliteWhiteLabelOpen] = useState(false);
  /** Per-widget review counts for embed preview + `data-limit` (session-persisted per business). */
  const [previewReviewLimits, setPreviewReviewLimits] = useState<Partial<Record<WidgetId, number>>>({});
  /** Per-widget which whole-star ratings (1–5) may appear in review lists; saved with widget embed settings. */
  const [reviewStarRatingsByWidget, setReviewStarRatingsByWidget] = useState<
    Partial<Record<WidgetId, number[]>>
  >({});
  const whiteLabelRef = useRef<WidgetWhiteLabelSettings>(WHITE_LABEL_DEFAULTS);

  useEffect(() => {
    embedCustomizeRef.current = {
      widgetSettingsAdvanced,
      embedMinimal,
      previewSiteBackgroundHex,
      showBusinessName,
    };
  }, [widgetSettingsAdvanced, embedMinimal, previewSiteBackgroundHex, showBusinessName]);

  function applyEmbedCustomizeSnapshot(next: EmbedCustomizeSnapshot) {
    const cur = embedCustomizeRef.current;
    if (isSameEmbedCustomize(cur, next)) return;
    setEmbedCustomizePast((p) => [...p, cur].slice(-40));
    setEmbedCustomizeFuture([]);
    setWidgetSettingsAdvanced(next.widgetSettingsAdvanced);
    setEmbedMinimal(next.embedMinimal);
    setPreviewSiteBackgroundHex(next.previewSiteBackgroundHex);
    setShowBusinessName(next.showBusinessName);
  }

  function undoEmbedCustomize() {
    setEmbedCustomizePast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const previous = prevPast[prevPast.length - 1];
      const cur = embedCustomizeRef.current;
      setWidgetSettingsAdvanced(previous.widgetSettingsAdvanced);
      setEmbedMinimal(previous.embedMinimal);
      setPreviewSiteBackgroundHex(previous.previewSiteBackgroundHex);
      setShowBusinessName(previous.showBusinessName);
      setEmbedCustomizeFuture((f) => [cur, ...f].slice(0, 40));
      return prevPast.slice(0, -1);
    });
  }

  function redoEmbedCustomize() {
    setEmbedCustomizeFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const [next, ...rest] = prevFuture;
      const cur = embedCustomizeRef.current;
      setWidgetSettingsAdvanced(next.widgetSettingsAdvanced);
      setEmbedMinimal(next.embedMinimal);
      setPreviewSiteBackgroundHex(next.previewSiteBackgroundHex);
      setShowBusinessName(next.showBusinessName);
      setEmbedCustomizePast((p) => [...p, cur].slice(-40));
      return rest;
    });
  }

  function resetEmbedCustomize() {
    const cur = embedCustomizeRef.current;
    if (isSameEmbedCustomize(cur, EMBED_CUSTOMIZE_INITIAL)) return;
    setEmbedCustomizePast((p) => [...p, cur].slice(-40));
    setEmbedCustomizeFuture([]);
    setWidgetSettingsAdvanced(EMBED_CUSTOMIZE_INITIAL.widgetSettingsAdvanced);
    setEmbedMinimal(EMBED_CUSTOMIZE_INITIAL.embedMinimal);
    setPreviewSiteBackgroundHex(EMBED_CUSTOMIZE_INITIAL.previewSiteBackgroundHex);
    setShowBusinessName(EMBED_CUSTOMIZE_INITIAL.showBusinessName);
  }

  const FEATURE_LOCKED = "website_widget" as const;

  const goToPricingPlans = (requiredPlan: PlanKey) => {
    if (!selectedBusiness?.id) return;
    logDashboardActivityClient({
      businessId: selectedBusiness.id,
      action: "feature_locked_clicked",
      metadata: { feature: FEATURE_LOCKED, required_plan: requiredPlan },
    });
    router.push("/business/dashboard/settings/usage");
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

  useEffect(() => {
    if (!selectedBusiness?.id) return;
    try {
      const raw = sessionStorage.getItem(previewLimitStorageKey(selectedBusiness.id));
      if (raw) {
        setPreviewReviewLimits(normalizePreviewReviewLimitsFromStorage(JSON.parse(raw)));
      } else {
        setPreviewReviewLimits({});
      }
    } catch {
      setPreviewReviewLimits({});
    }
  }, [selectedBusiness?.id]);

  useEffect(() => {
    if (!widgetConfigureOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWidgetConfigureOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [widgetConfigureOpen]);

  const effectiveEmbedMinimal = !widgetSettingsAdvanced || embedMinimal;
  /** Wide / horizontal widgets: full-width iframe and preview panel so rows are not clipped. */
  const rowWidgetPreviewFullBleed =
    selected === "carousel" ||
    selected === "spotlight_carousel" ||
    selected === "review_slider" ||
    selected === "micro_trustscore";

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
    showBusinessName: boolean;
    reviewStarRatingsByType?: Partial<Record<WidgetId, number[]>>;
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
            showBusinessName?: boolean;
            reviewStarRatingsByType?: Partial<Record<string, unknown>>;
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
        const loadedShowName = json.settings?.showBusinessName !== false;
        const rawRs = json.settings?.reviewStarRatingsByType;
        const mergedStars: Partial<Record<WidgetId, number[]>> = {};
        for (const wid of WIDGET_IDS_WITH_PREVIEW_LIMIT) {
          mergedStars[wid] = normalizeReviewStarRatings(
            rawRs && typeof rawRs === "object" && wid in rawRs
              ? (rawRs as Record<string, unknown>)[wid]
              : undefined,
          );
        }
        setReviewStarRatingsByWidget(mergedStars);
        setServerEmbedSettings({
          themes,
          advancedEnabled: !!json.settings?.advancedEnabled,
          previewSiteBackgroundHex: json.settings?.previewSiteBackgroundHex ?? "",
          showBusinessName: loadedShowName,
          reviewStarRatingsByType: mergedStars,
        });
        setWidgetSettingsAdvanced(!!json.settings?.advancedEnabled);
        setPreviewSiteBackgroundHex(json.settings?.previewSiteBackgroundHex ?? "");
        setShowBusinessName(loadedShowName);
        setEmbedSettingsSaveError(null);
        lastEmbedThemeForWidgetRef.current = null;
        setEmbedCustomizePast([]);
        setEmbedCustomizeFuture([]);
      } catch {
        if (!cancelled) {
          const fallbackStars: Partial<Record<WidgetId, number[]>> = {};
          for (const wid of WIDGET_IDS_WITH_PREVIEW_LIMIT) {
            fallbackStars[wid] = [...DEFAULT_REVIEW_STAR_RATINGS];
          }
          setReviewStarRatingsByWidget(fallbackStars);
          setServerEmbedSettings({
            themes: {},
            advancedEnabled: false,
            previewSiteBackgroundHex: "",
            showBusinessName: true,
            reviewStarRatingsByType: fallbackStars,
          });
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
    lastEmbedThemeForWidgetRef.current = null;
    setEmbedCustomizePast([]);
    setEmbedCustomizeFuture([]);
  }, [selectedBusiness?.id]);

  useEffect(() => {
    setEmbedCustomizePast([]);
    setEmbedCustomizeFuture([]);
  }, [selected]);

  useEffect(() => {
    if (!serverEmbedSettings || !embedSettingsSynced) return;
    if (lastEmbedThemeForWidgetRef.current === selected) return;
    lastEmbedThemeForWidgetRef.current = selected;
    const t = serverEmbedSettings.themes[selected] ?? "minimal";
    setEmbedMinimal(t !== "light");
  }, [selected, serverEmbedSettings, embedSettingsSynced]);

  useEffect(() => {
    if (widgetConfigureOpen) {
      setEliteWhiteLabelOpen(false);
      setEmbedAppearanceMessage(null);
    }
  }, [widgetConfigureOpen]);

  const saveEmbedAppearanceNow = useCallback(async () => {
    if (!selectedBusiness?.id || !embedSettingsSynced) return;
    setEmbedAppearanceSaving(true);
    setEmbedAppearanceMessage(null);
    setEmbedSettingsSaveError(null);
    const hexClean = previewSiteBackgroundHex.trim();
    const previewHexResolved = parsePreviewSiteHex(hexClean) ?? "";
    const patch: {
      advancedEnabled: boolean;
      previewSiteBackgroundHex: string;
      showBusinessName: boolean;
      themes?: Partial<Record<WidgetId, ServerEmbedTheme>>;
      reviewStarRatingsByType?: Partial<Record<WidgetId, number[]>>;
    } = {
      advancedEnabled: widgetSettingsAdvanced,
      previewSiteBackgroundHex: previewHexResolved,
      showBusinessName,
      reviewStarRatingsByType: {
        [selected]: normalizeReviewStarRatings(reviewStarRatingsByWidget[selected]),
      },
    };
    if (widgetSettingsAdvanced) {
      patch.themes = { [selected]: embedMinimal ? "minimal" : "light" };
    }
    try {
      const res = await fetch(`/api/business/${selectedBusiness.id}/widget-embed-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        settings?: ServerEmbedSettings & {
          themes?: Partial<Record<string, string>>;
          reviewStarRatingsByType?: Partial<Record<string, unknown>>;
        };
        error?: string;
      };
      if (!res.ok) throw new Error(json.error ?? "Failed to save widget settings.");
      if (json.settings) {
        const themes: Partial<Record<WidgetId, ServerEmbedTheme>> = {};
        for (const w of WIDGETS) {
          const th = json.settings.themes?.[w.id];
          if (th === "light" || th === "minimal") themes[w.id] = th;
        }
        const rawRs = json.settings.reviewStarRatingsByType;
        const mergedStars: Partial<Record<WidgetId, number[]>> = {};
        for (const wid of WIDGET_IDS_WITH_PREVIEW_LIMIT) {
          mergedStars[wid] = normalizeReviewStarRatings(
            rawRs && typeof rawRs === "object" && wid in rawRs
              ? (rawRs as Record<string, unknown>)[wid]
              : reviewStarRatingsByWidget[wid],
          );
        }
        setReviewStarRatingsByWidget(mergedStars);
        setServerEmbedSettings({
          themes,
          advancedEnabled: !!json.settings.advancedEnabled,
          previewSiteBackgroundHex: json.settings.previewSiteBackgroundHex ?? "",
          showBusinessName: json.settings.showBusinessName !== false,
          reviewStarRatingsByType: mergedStars,
        });
      }
      setEmbedAppearanceMessage("Saved.");
      window.setTimeout(() => {
        setEmbedAppearanceMessage(null);
      }, 3500);
    } catch (e) {
      setEmbedSettingsSaveError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setEmbedAppearanceSaving(false);
    }
  }, [
    selectedBusiness?.id,
    embedSettingsSynced,
    widgetSettingsAdvanced,
    embedMinimal,
    selected,
    previewSiteBackgroundHex,
    showBusinessName,
    reviewStarRatingsByWidget,
  ]);

  useEffect(() => {
    setSelected((current) => {
      const def = WIDGETS.find((w) => w.id === current);
      if (def && canAccessWebsiteWidget(planKey, def.planWidget)) return current;
      const fb = WIDGETS.find((w) => canAccessWebsiteWidget(planKey, w.planWidget));
      return (fb?.id ?? "collector") as WidgetId;
    });
  }, [planKey]);

  const effectivePreviewReviewLimit = useMemo(
    () =>
      clampPreviewReviewLimit(selected, previewReviewLimits[selected] ?? defaultPreviewReviewLimit(selected)),
    [selected, previewReviewLimits],
  );

  const effectiveReviewStars = useMemo(() => {
    if (!isWidgetWithPreviewLimit(selected)) return [...DEFAULT_REVIEW_STAR_RATINGS];
    return normalizeReviewStarRatings(reviewStarRatingsByWidget[selected]);
  }, [selected, reviewStarRatingsByWidget]);

  function toggleReviewStarBand(star: number) {
    if (!isWidgetWithPreviewLimit(selected)) return;
    setReviewStarRatingsByWidget((prev) => {
      const cur = normalizeReviewStarRatings(prev[selected]);
      const set = new Set(cur);
      if (set.has(star)) {
        if (set.size <= 1) return prev;
        set.delete(star);
      } else {
        set.add(star);
      }
      return { ...prev, [selected]: [...set].sort((a, b) => a - b) };
    });
  }

  function bumpPreviewReviewLimit(delta: number) {
    if (!selectedBusiness?.id || !isWidgetWithPreviewLimit(selected)) return;
    setPreviewReviewLimits((prev) => {
      const cur = prev[selected] ?? defaultPreviewReviewLimit(selected);
      const next = clampPreviewReviewLimit(selected, cur + delta);
      if (next === cur) return prev;
      const merged = { ...prev, [selected]: next };
      try {
        sessionStorage.setItem(previewLimitStorageKey(selectedBusiness.id), JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    });
  }

  const previewUrl = useMemo(
    () => {
      if (!slug) return "";
      const qs = new URLSearchParams({
        business: slug,
        type: selected,
        dashboard_demo: "1",
      });
      // Draft white-label in iframe preview — Elite only (matches live embed).
      if (canWhiteLabelCurrentWidget) {
        qs.set("wlv", String(whiteLabelRevision));
        qs.set("wl_star", whiteLabel.starColor);
        qs.set("wl_text", whiteLabel.textColor);
        qs.set("wl_accent", whiteLabel.accentColor);
        qs.set("wl_font", whiteLabel.font);
        qs.set("wl_logo", whiteLabel.showTellacityLogo ? "1" : "0");
      }
      qs.set("theme", effectiveEmbedMinimal ? "minimal" : "light");
      qs.set("show_business_name", showBusinessName ? "1" : "0");
      if (isWidgetWithPreviewLimit(selected)) {
        qs.set("limit", String(effectivePreviewReviewLimit));
        if (!isFullStarSelection(effectiveReviewStars)) {
          qs.set("review_stars", formatReviewStarsForQuery(effectiveReviewStars));
        }
      }
      const glue = previewExtraParams ? `${previewExtraParams}` : "";
      return `${previewBaseUrl}/widgets/embed?${qs.toString()}${glue}`;
    },
    [
      previewBaseUrl,
      previewExtraParams,
      slug,
      selected,
      effectiveEmbedMinimal,
      canWhiteLabelCurrentWidget,
      whiteLabelRevision,
      whiteLabel.starColor,
      whiteLabel.textColor,
      whiteLabel.accentColor,
      whiteLabel.font,
      whiteLabel.showTellacityLogo,
      showBusinessName,
      effectivePreviewReviewLimit,
      effectiveReviewStars,
    ]
  );

  const embedCode = useMemo(() => {
    const theme = effectiveEmbedMinimal ? "minimal" : "light";
    const limitAttr = isWidgetWithPreviewLimit(selected)
      ? ` data-limit="${effectivePreviewReviewLimit}"`
      : "";
    const starsAttr =
      isWidgetWithPreviewLimit(selected) && !isFullStarSelection(effectiveReviewStars)
        ? ` data-review-stars="${formatReviewStarsForQuery(effectiveReviewStars)}"`
        : "";
    const nameAttr = showBusinessName ? "" : ` data-show-business-name="false"`;
    return `<script src="${baseUrl}/widgets/v1.js" data-business="${slug}" data-type="${selected}" data-theme="${theme}"${limitAttr}${starsAttr}${nameAttr}></script>`;
  }, [
    baseUrl,
    slug,
    selected,
    effectiveEmbedMinimal,
    showBusinessName,
    effectivePreviewReviewLimit,
    effectiveReviewStars,
  ]);

  // Auto-resize iframe from postMessage
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e.data?.type === "tellacity-widget-resize" &&
        iframeRef.current &&
        embedResizeMessageMatchesPreview(previewUrl, e.data.src)
      ) {
        const pad = effectiveEmbedMinimal ? 4 : 20;
        const raw = Number(e.data.height);
        if (!Number.isFinite(raw) || raw < 40) return;
        const next = Math.min(Math.ceil(raw + pad), 2400);
        iframeRef.current.style.height = `${next}px`;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [previewUrl, effectiveEmbedMinimal]);

  // Reset iframe height when widget type changes
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
        setWhiteLabelMessage(null);
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

      {/* Widget gallery (Trustpilot Essentials–style): click any card for full preview & settings */}
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Choose a widget
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Select a style to preview it full size. Locked widgets still show a live preview — upgrade your plan to
          copy embed code.
        </p>
        <div className="space-y-10">
          {WIDGET_CATEGORY_KEYS.map((categoryKey) => {
            const cat = WIDGET_CATEGORIES[categoryKey];
            return (
              <div key={categoryKey}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{cat.label}</h3>
                <p className="mt-1 max-w-3xl text-xs text-gray-500">{cat.description}</p>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cat.widgets.map((widget) => {
                    const isActive = selected === widget.id;
                    const cardLocked = !canAccessWebsiteWidget(planKey, widget.planWidget);
                    return (
                      <button
                        key={widget.id}
                        type="button"
                        onClick={() => {
                          setSelected(widget.id);
                          setWidgetConfigureOpen(true);
                        }}
                        className={`text-left rounded-xl border-2 p-4 transition-all ${
                          isActive
                            ? "border-[#2fb2a8] bg-[#2fb2a8]/5 shadow-sm"
                            : "border-gray-200 hover:border-[#2fb2a8]/50 bg-white shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-semibold text-[#0E0E0E]">
                            <span>{widget.name}</span>
                            {!cardLocked ? <AvailableToUseLabel /> : null}
                          </h3>
                          <div className="flex shrink-0 items-center gap-1">
                            {cardLocked ? (
                              <span
                                className="inline-flex rounded-full bg-gray-100 p-1 text-gray-600"
                                title="Requires higher plan"
                              >
                                <Lock size={14} strokeWidth={2} aria-hidden />
                              </span>
                            ) : null}
                            {isActive && widgetConfigureOpen ? (
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2fb2a8]">
                                <Check size={10} strokeWidth={3} className="text-white" />
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-2 line-clamp-3 text-xs leading-snug text-gray-500">{widget.description}</p>
                        <p className="mt-3 text-[11px] font-medium text-[#124541]">Preview &amp; configure →</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="border-t border-gray-100 pt-8 text-sm text-[#374151]"
        aria-labelledby="website-widgets-howto-heading"
      >
        <h2
          id="website-widgets-howto-heading"
          className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500"
        >
          How to add a widget to your website
        </h2>
        <ol className="list-decimal space-y-3 pl-4 marker:font-semibold marker:text-[#2fb2a8]">
          <li>Pick a widget from the gallery above and open <strong>Preview &amp; configure</strong>.</li>
          <li>
            Copy the embed code from the HTML box. It loads{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">/widgets/v1.js</code> and shows your reviews.
          </li>
          <li>
            Paste into your site (Custom HTML / Embed block) — homepage, footer, or a Reviews page.
          </li>
          <li>Publish; widgets update automatically when new reviews arrive.</li>
        </ol>
      </div>

      {widgetConfigureOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto px-3 py-6 sm:px-6 sm:py-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby="widget-configure-title"
        >
          <div
            className="absolute inset-0 bg-black/45"
            aria-hidden
            onClick={() => setWidgetConfigureOpen(false)}
          />
          <div className="relative z-10 flex h-[96vh] w-[98vw] max-w-[1600px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl my-auto">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div>
                <h2
                  id="widget-configure-title"
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-semibold text-[#0E0E0E]"
                >
                  <span>{currentWidget.name}</span>
                  {!previewLocked ? <AvailableToUseLabel /> : null}
                </h2>
                <p className="text-xs text-gray-500">Website widget · live preview</p>
              </div>
              <button
                type="button"
                onClick={() => setWidgetConfigureOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>

            {previewLocked ? (
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#E9E1D2] bg-[#F9F6EF] px-5 py-3">
                <p className="flex items-center gap-2 text-sm font-medium text-[#1f2937]">
                  <Lock size={16} className="shrink-0 text-[#92400e]" aria-hidden />
                  Get the {planDisplayName(requiredPlanForWebsiteWidget(currentWidget.planWidget))} plan to use this
                  widget on your site.
                </p>
                <button
                  type="button"
                  onClick={() => goToPricingPlans(requiredPlanForWebsiteWidget(currentWidget.planWidget))}
                  className="shrink-0 rounded-lg bg-[#1e6b9e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#185a87]"
                >
                  Upgrade
                </button>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-6 p-4 sm:p-5 lg:p-6">
        {/* Widget settings + preview (Trustpilot-style) */}
        <div className="grid gap-6 border-b border-gray-100 pb-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] lg:gap-8">
          <aside className="space-y-5 lg:max-h-[calc(96vh-9rem)] lg:overflow-y-auto lg:border-r lg:border-gray-100 lg:pr-6">
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">About</h3>
              <p className="text-sm leading-relaxed text-gray-700">{currentWidget.description}</p>
            </section>

            <section className="space-y-2 border-t border-gray-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Supported sizes</h3>
              <p className="text-sm leading-relaxed text-gray-700">{currentWidget.sizesHelp}</p>
              <p className="text-xs text-gray-500">Responsive · mobile, tablet, and desktop ready.</p>
            </section>

            <section className="space-y-4 border-t border-gray-100 pt-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Customize</h3>
                  <div
                    className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm"
                    title="Embed preview options"
                  >
                    <button
                      type="button"
                      aria-label="Back — undo embed preview change"
                      disabled={embedCustomizePast.length === 0}
                      onClick={undoEmbedCustomize}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Undo2 className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Forward — redo embed preview change"
                      disabled={embedCustomizeFuture.length === 0}
                      onClick={redoEmbedCustomize}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Redo2 className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label="Reset embed preview options"
                      onClick={resetEmbedCustomize}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
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
                  
                  onClick={() => {
                    const cur = embedCustomizeRef.current;
                    const nextAdvanced = !cur.widgetSettingsAdvanced;
                    applyEmbedCustomizeSnapshot({
                      widgetSettingsAdvanced: nextAdvanced,
                      embedMinimal: nextAdvanced ? cur.embedMinimal : true,
                      previewSiteBackgroundHex: nextAdvanced ? cur.previewSiteBackgroundHex : "",
                      showBusinessName: cur.showBusinessName,
                    });
                  }}
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

              <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show business name</p>
                  <p className="text-xs text-gray-500">
                    Turn off to hide your business title in the widget. Your logo and links stay the same.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showBusinessName}
                  
                  onClick={() => {
                    const cur = embedCustomizeRef.current;
                    applyEmbedCustomizeSnapshot({
                      ...cur,
                      showBusinessName: !cur.showBusinessName,
                    });
                  }}
                  className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2fb2a8] focus-visible:ring-offset-2 ${
                    showBusinessName ? "bg-[#2fb2a8]" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow transition ${
                      showBusinessName ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {isWidgetWithPreviewLimit(selected) ? (
                <div className="rounded-lg border border-emerald-100/80 bg-emerald-50/40 px-3 py-2.5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">Reviews in preview</p>
                      <p className="text-xs text-gray-600">
                        Add or remove how many reviews load in this preview and in your embed&apos;s{" "}
                        <code className="rounded bg-white/80 px-1 py-0.5 text-[11px] text-gray-800">data-limit</code>{" "}
                        (from {DASHBOARD_PREVIEW_REVIEW_LIMIT_MIN} up to {previewReviewLimitMax(selected)} for this
                        widget).
                        Available on every plan.
                      </p>
                      {selected === "showcase" ? (
                        <p className="mt-1 text-xs text-gray-500">
                          Review showcase stacks your latest reviews here (newest first); changing the number updates
                          this preview and the embed.
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={() => bumpPreviewReviewLimit(-1)}
                        disabled={effectivePreviewReviewLimit <= DASHBOARD_PREVIEW_REVIEW_LIMIT_MIN}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Fewer reviews in preview"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-[2.5rem] text-center text-sm font-semibold tabular-nums text-gray-900">
                        {effectivePreviewReviewLimit}
                      </span>
                      <button
                        type="button"
                        onClick={() => bumpPreviewReviewLimit(1)}
                        disabled={effectivePreviewReviewLimit >= previewReviewLimitMax(selected)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="More reviews in preview"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-emerald-200/60 pt-3">
                    <p className="text-sm font-medium text-gray-900">Star ratings to show</p>
                    <p className="mt-0.5 text-xs text-gray-600">
                      Choose which whole-star reviews can appear (1–5). The list still loads up to your count above;
                      only rows that match stay visible. Leave all on for no filter. At least one rating must stay
                      selected.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const on = effectiveReviewStars.includes(star);
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => toggleReviewStarBand(star)}
                            className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                              on
                                ? "border-[#2fb2a8] bg-[#2fb2a8] text-white"
                                : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                            aria-pressed={on}
                            aria-label={`${on ? "Hide" : "Show"} ${star}-star reviews`}
                          >
                            {star}★
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}

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
                        
                        onChange={() => {
                          applyEmbedCustomizeSnapshot({
                            ...embedCustomizeRef.current,
                            embedMinimal: true,
                          });
                        }}
                      />
                      Floating (transparent, like a PNG)
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-800">
                      <input
                        type="radio"
                        name="embed-surface"
                        className="border-gray-300 text-[#2fb2a8] focus:ring-[#2fb2a8]"
                        checked={!embedMinimal}
                        
                        onChange={() => {
                          applyEmbedCustomizeSnapshot({
                            ...embedCustomizeRef.current,
                            embedMinimal: false,
                          });
                        }}
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
                        
                        onChange={(e) => {
                          applyEmbedCustomizeSnapshot({
                            ...embedCustomizeRef.current,
                            previewSiteBackgroundHex: e.target.value,
                          });
                        }}
                        className="h-9 w-12 cursor-pointer rounded border border-gray-200 bg-white p-0.5"
                      />
                      <input
                        type="text"
                        placeholder="#f5f5f5"
                        value={previewSiteBackgroundHex}
                        
                        onChange={(e) => {
                          applyEmbedCustomizeSnapshot({
                            ...embedCustomizeRef.current,
                            previewSiteBackgroundHex: e.target.value,
                          });
                        }}
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

            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Save widget settings</h3>
              <p className="mt-1 text-xs text-gray-600">
                Saves custom embed options, floating vs classic surface, preview backdrop (when advanced is on), and
                whether your business name appears in widgets. Use this for the settings above — no upgrade required.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void saveEmbedAppearanceNow()}
                  disabled={!embedSettingsSynced || embedAppearanceSaving || !selectedBusiness?.id}
                  className="rounded-lg bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {embedAppearanceSaving ? "Saving…" : "Save widget settings"}
                </button>
                {embedAppearanceMessage ? (
                  <span className="text-xs font-medium text-green-700">{embedAppearanceMessage}</span>
                ) : null}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <button
                type="button"
                id="elite-white-label-disclosure"
                aria-expanded={eliteWhiteLabelOpen}
                aria-controls="elite-white-label-panel"
                onClick={() => setEliteWhiteLabelOpen((o) => !o)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-left transition hover:bg-gray-50"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Elite white-label
                  {!canWhiteLabelCurrentWidget ? (
                    <span className="ml-1 font-normal normal-case text-gray-500">(Elite plan — optional)</span>
                  ) : null}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform ${eliteWhiteLabelOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {!eliteWhiteLabelOpen ? (
                <p className="mt-2 text-xs text-gray-500">
                  Brand colors and font for your widgets. Hidden until you open this — not needed for the standard
                  options above.
                </p>
              ) : (
                <div id="elite-white-label-panel" className="mt-4 space-y-4">
                  {canWhiteLabelCurrentWidget ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        <AvailableToUseLabel />
                      </div>
                      <p className="text-xs text-gray-500">
                        Customize stars, font, and widget colors for all website widgets. The Tellacity logo asset
                        stays fixed, but you can hide or show it.
                      </p>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                        <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 sm:col-span-2">
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
                      <div className="flex flex-wrap items-center gap-2">
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
                          className="rounded-lg bg-[#124541] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                        >
                          {whiteLabelSaving ? "Saving..." : "Save white-label settings"}
                        </button>
                        {whiteLabelMessage ? (
                          <span className="w-full text-xs text-gray-600">{whiteLabelMessage}</span>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-600">
                        Match stars, text, accent, and font to your brand across all website widgets. Included on the
                        Elite plan only — separate from the standard widget settings above.
                      </p>
                      <button
                        type="button"
                        onClick={() => goToPricingPlans("elite")}
                        className="rounded-lg bg-[#124541] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3a35] sm:text-sm"
                      >
                        Upgrade to Elite
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 lg:sticky lg:top-0 lg:self-start">
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
              Checkerboard indicates a transparent widget — it inherits the host page behind it. Use{" "}
              <span className="font-medium text-gray-700">Save widget settings</span> so your embed snippet and live
              widget match; the code uses{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">data-theme</code> for floating vs classic.
            </p>
            {embedSettingsSaveError ? (
              <p className="mb-2 text-xs text-red-600">{embedSettingsSaveError}</p>
            ) : null}

            <div
              className={`relative flex min-h-[min(44vh,520px)] max-h-[min(62vh,720px)] min-w-0 rounded-lg border border-gray-200 ${
                previewDevice === "mobile"
                  ? "mx-auto max-w-[400px] items-center justify-center overflow-auto p-5 sm:p-8"
                  : rowWidgetPreviewFullBleed
                    ? "w-full flex-col items-stretch justify-start overflow-x-auto overflow-y-auto px-1 py-2 sm:px-2 sm:py-3"
                    : "items-center justify-center overflow-auto p-5 sm:p-8"
              }`}
              style={previewPanelSurface}
            >
              {!slug ? (
                <p className="text-sm text-gray-600">
                  No business selected. Please select a business to preview the widget.
                </p>
              ) : (
                <iframe
                  ref={iframeRef}
                  key={previewUrl}
                  src={previewUrl}
                  title={`${currentWidget.name} preview`}
                  className={
                    effectiveEmbedMinimal && !rowWidgetPreviewFullBleed
                      ? "max-w-full align-middle transition-all duration-300"
                      : "w-full min-w-0 max-w-none flex-1 transition-all duration-300"
                  }
                  style={{
                    height: currentWidget.previewHeight,
                    border: 0,
                    display:
                      effectiveEmbedMinimal && !rowWidgetPreviewFullBleed
                        ? "inline-block"
                        : "block",
                    verticalAlign:
                      effectiveEmbedMinimal && !rowWidgetPreviewFullBleed
                        ? "middle"
                        : undefined,
                    width:
                      effectiveEmbedMinimal && !rowWidgetPreviewFullBleed
                        ? "auto"
                        : "100%",
                    maxWidth: rowWidgetPreviewFullBleed ? "none" : "100%",
                    minWidth: rowWidgetPreviewFullBleed ? "100%" : undefined,
                    backgroundColor: "transparent",
                    overflow: rowWidgetPreviewFullBleed ? "visible" : "hidden",
                  }}
                  scrolling="no"
                />
              )}
            </div>
          </div>
        </div>

        {/* Embed code */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Embed code
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            The snippet updates as you change Customize and includes{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">data-theme</code> (floating ={" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">minimal</code>, classic ={" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">light</code>). Use{" "}
            <span className="font-medium text-gray-800">Save widget settings</span> on the left so Tellacity stores
            these choices for your live embed. If your site builder strips custom attributes, remove{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">data-theme</code> entirely — your saved surface
            choice still applies on the live widget.
          </p>
          <div className="rounded-lg border border-gray-100 bg-neutral-50/30 shadow-sm">
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
          <p className="mt-3 text-xs text-gray-400">
            Paste this snippet anywhere in your website HTML where you want the widget to appear.
            {previewLocked ? " Upgrade your plan to copy embed code." : ""}
          </p>
        </div>
      </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-[#fafafa] px-5 py-4">
              <button
                type="button"
                onClick={() => setWidgetConfigureOpen(false)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={previewLocked}
                className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                  previewLocked
                    ? "bg-gray-200 text-gray-500"
                    : "bg-[#124541] text-white hover:bg-[#0f3a35]"
                }`}
              >
                <Copy size={16} strokeWidth={2} aria-hidden />
                Get code
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
}
