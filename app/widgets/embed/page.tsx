import { createClient } from "@supabase/supabase-js";
import type { WidgetPayload, WidgetType } from "@/components/widgets/types";
import TrustBadge from "@/components/widgets/TrustBadge";
import ReviewCarousel from "@/components/widgets/ReviewCarousel";
import ReviewList from "@/components/widgets/ReviewList";
import TellacityReviewUsBadge from "@/components/widgets/TellacityReviewUsBadge";
import TellacityScoreStrip from "@/components/widgets/TellacityScoreStrip";
import TellacityTrustStrip from "@/components/widgets/TellacityTrustStrip";
import TellacityTrustStacked from "@/components/widgets/TellacityTrustStacked";
import TellacityTrustStripIcon from "@/components/widgets/TellacityTrustStripIcon";
import TellacityTrustMini from "@/components/widgets/TellacityTrustMini";
import SpotlightCarouselWidget from "@/components/widgets/SpotlightCarouselWidget";
import ReviewSliderWidget from "@/components/widgets/ReviewSliderWidget";
import ReviewDropdownWidget from "@/components/widgets/ReviewDropdownWidget";
import MicroTrustScoreWidget from "@/components/widgets/MicroTrustScoreWidget";
import ReviewShowcaseEmbed from "@/components/widgets/ReviewShowcaseEmbed";
import TellacityTrustBadgeEmbed from "@/components/widgets/TellacityTrustBadgeEmbed";
import { getPublicAppOrigin, getPublicWriteReviewUrl } from "@/lib/emailBranding";
import { getActivePlanKeyForBusiness } from "@/lib/plans";
import { resolveWidgetShowBusinessName } from "@/lib/widgetEmbedShowBusinessName";
import {
  applyDashboardPreviewReviewLimit,
  applyWidgetDashboardDemoOverlay,
  widgetEmbedDataLimitCap,
} from "@/lib/widgetDashboardDemoPayload";
import {
  applyReviewStarFilterToPayload,
  isWidgetTypeWithReviewStarFilter,
  resolveWidgetReviewStarRatings,
} from "@/lib/widgetReviewStarFilter";
import { WIDGET_GALLERY_CANVAS_HEIGHT } from "@/lib/widgetGalleryThumb";

export const dynamic = "force-dynamic";

const VALID_TYPES: WidgetType[] = [
  "badge",
  "carousel",
  "list",
  "collector",
  "review_us",
  "score_strip",
  "showcase",
  "tellacity_trust",
  "trust_strip",
  "trust_stacked",
  "trust_strip_icon",
  "trust_mini",
  "spotlight_carousel",
  "review_slider",
  "review_dropdown",
  "micro_trustscore",
];

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

function sanitizeHexColor(input: unknown, fallback: string): string {
  if (typeof input !== "string") return fallback;
  const value = input.trim();
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

function sanitizeFont(input: unknown): FontKey {
  const v = String(input ?? "").toLowerCase();
  return v === "inter" || v === "serif" || v === "mono" || v === "system"
    ? (v as FontKey)
    : "system";
}

function fontCssStack(font: FontKey): string {
  switch (font) {
    case "inter":
      return "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    case "serif":
      return "Georgia, Cambria, Times New Roman, Times, serif";
    case "mono":
      return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";
    default:
      return "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
  }
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export default async function WidgetEmbedPage({
  searchParams,
}: {
  searchParams: Promise<{
    business?: string;
    type?: string;
    limit?: string;
    theme?: string;
    dashboard_demo?: string;
    wl_star?: string;
    wl_text?: string;
    wl_accent?: string;
    wl_font?: string;
    wl_logo?: string;
    show_business_name?: string;
    review_stars?: string;
    gallery?: string;
  }>;
}) {
  const params = await searchParams;
  const slug = params.business?.trim();
  const rawType = params.type ?? "badge";
  const type: WidgetType = VALID_TYPES.includes(rawType as WidgetType)
    ? (rawType as WidgetType)
    : "badge";
  const cap = widgetEmbedDataLimitCap(type);
  const defaultLimitStr =
    type === "review_dropdown" || type === "carousel" || type === "list" || type === "showcase"
      ? String(cap)
      : type === "spotlight_carousel" || type === "review_slider"
        ? "8"
        : "5";
  const fallbackLimit = parseInt(defaultLimitStr, 10);
  const parsedLimit = parseInt(params.limit ?? defaultLimitStr, 10);
  const n =
    Number.isFinite(parsedLimit) && parsedLimit >= 1 ? parsedLimit : fallbackLimit;
  const limit = Math.min(cap, Math.max(1, n));
  const dashboardDemo =
    params.dashboard_demo === "1" || params.dashboard_demo === "true";
  const galleryThumb = params.gallery === "1" || params.gallery === "true";
  const emptyStarBorder = "#9CA3AF";

  if (!slug) {
    return <Fallback message="Missing business slug." />;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_widget_payload_v1", {
    p_business_slug: slug,
    p_limit: limit,
  });

  if (
    error ||
    !data ||
    (typeof data === "object" &&
      data !== null &&
      "error" in data &&
      (data as { error?: unknown }).error)
  ) {
    return <Fallback message="Business not found." />;
  }

  const payload = data as WidgetPayload;
  let embedPayload = dashboardDemo ? applyWidgetDashboardDemoOverlay(payload) : payload;
  if (dashboardDemo) {
    embedPayload = applyDashboardPreviewReviewLimit(embedPayload, limit, type);
  }

  const { data: themeRow } = await supabase
    .from("businesses")
    .select("id, widget_white_label, widget_embed_settings")
    .eq("slug", slug)
    .maybeSingle();

  const rawTheme = (params.theme ?? "inherit").trim().toLowerCase();
  const embedSettingsRaw = (themeRow as { widget_embed_settings?: unknown } | null)?.widget_embed_settings;

  const reviewRatings = resolveWidgetReviewStarRatings(
    params.review_stars,
    embedSettingsRaw,
    type,
  );
  if (isWidgetTypeWithReviewStarFilter(type)) {
    embedPayload = applyReviewStarFilterToPayload(embedPayload, reviewRatings);
  }

  const writeReviewHref = getPublicWriteReviewUrl(getPublicAppOrigin(), embedPayload.slug);
  let whiteLabel = WHITE_LABEL_DEFAULTS;

  const showBusinessName = resolveWidgetShowBusinessName(
    params.show_business_name,
    embedSettingsRaw,
  );
  const embedThemes =
    embedSettingsRaw &&
    typeof embedSettingsRaw === "object" &&
    embedSettingsRaw !== null &&
    "themes" in embedSettingsRaw &&
    typeof (embedSettingsRaw as { themes?: unknown }).themes === "object"
      ? ((embedSettingsRaw as { themes: Record<string, unknown> }).themes ?? {})
      : {};

  const savedThemeForType = embedThemes[type];
  const savedIsLight =
    savedThemeForType === "light" ||
    (typeof savedThemeForType === "string" && savedThemeForType.toLowerCase() === "light");

  let minimal = true;
  if (rawTheme === "minimal") {
    minimal = true;
  } else if (rawTheme === "light") {
    minimal = false;
  } else {
    minimal = !savedIsLight;
  }

  const businessId = (themeRow as { id?: string | null } | null)?.id ?? null;
  let allowWhiteLabel = false;
  if (businessId) {
    try {
      const adminDb = getServiceSupabase();
      const plan = await getActivePlanKeyForBusiness(businessId, adminDb);
      allowWhiteLabel = plan === "elite";
    } catch {
      allowWhiteLabel = false;
    }
  }

  if (allowWhiteLabel) {
    const raw = (themeRow as { widget_white_label?: unknown } | null)?.widget_white_label;
    const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    whiteLabel = {
      starColor: sanitizeHexColor(src.starColor, WHITE_LABEL_DEFAULTS.starColor),
      textColor: sanitizeHexColor(src.textColor, WHITE_LABEL_DEFAULTS.textColor),
      accentColor: sanitizeHexColor(src.accentColor, WHITE_LABEL_DEFAULTS.accentColor),
      font: sanitizeFont(src.font),
      showTellacityLogo:
        typeof src.showTellacityLogo === "boolean"
          ? src.showTellacityLogo
          : WHITE_LABEL_DEFAULTS.showTellacityLogo,
    };
  }

  // Dashboard preview: draft query params only for Elite (same as live embed white-label).
  if (dashboardDemo && allowWhiteLabel) {
    whiteLabel = {
      starColor: sanitizeHexColor(params.wl_star, whiteLabel.starColor),
      textColor: sanitizeHexColor(params.wl_text, whiteLabel.textColor),
      accentColor: sanitizeHexColor(params.wl_accent, whiteLabel.accentColor),
      font: sanitizeFont(params.wl_font ?? whiteLabel.font),
      showTellacityLogo:
        params.wl_logo === "1" || params.wl_logo === "true"
          ? true
          : params.wl_logo === "0" || params.wl_logo === "false"
            ? false
            : whiteLabel.showTellacityLogo,
    };
  }

  return (
    <>
      <style>{`
        :root {
          --tc-widget-empty-star-border: ${emptyStarBorder};
          --tc-widget-active-star-color: ${whiteLabel.starColor};
          --tc-widget-text-color: ${whiteLabel.textColor};
          --tc-widget-accent-color: ${whiteLabel.accentColor};
          --tc-widget-font-family: ${fontCssStack(whiteLabel.font)};
        }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html {
          background: transparent;
        }
        body {
          padding: ${
            galleryThumb
              ? "0"
              : minimal
                ? "0"
                : type === "review_slider"
                  ? "12px 18px 8px"
                  : "20px 24px"
          };
          background: transparent;
          color: var(--tc-widget-text-color);
          font-family: var(--tc-widget-font-family);
        }
        ${
          galleryThumb
            ? `
        html {
          background: transparent;
          height: ${WIDGET_GALLERY_CANVAS_HEIGHT}px;
          overflow: hidden;
          width: 100%;
        }
        body {
          height: ${WIDGET_GALLERY_CANVAS_HEIGHT}px;
          min-height: ${WIDGET_GALLERY_CANVAS_HEIGHT}px;
          width: 100%;
          max-width: 100%;
          margin: 0;
          padding: 0 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: transparent;
        }
        `
            : type === "carousel" ||
                type === "spotlight_carousel" ||
                type === "review_slider" ||
                type === "micro_trustscore"
              ? `html, body { width: 100%; min-width: 100%; }`
              : ""
        }
        ${
          !galleryThumb && type === "tellacity_trust"
            ? `
        html { height: 100%; }
        body {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        `
            : ""
        }
      `}</style>

      {type === "carousel" && (
        <ReviewCarousel
          payload={embedPayload}
          dashboardDemo={dashboardDemo}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
          showBusinessName={showBusinessName}
        />
      )}
      {type === "list" && (
        <ReviewList
          payload={embedPayload}
          dashboardDemo={dashboardDemo}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
          showBusinessName={showBusinessName}
        />
      )}
      {(type === "collector" || type === "review_us") && (
        <div
          style={{
            display: "flex",
            justifyContent: galleryThumb || !minimal ? "center" : "flex-start",
            alignItems: "center",
            minHeight: minimal ? undefined : 44,
          }}
        >
          <TellacityReviewUsBadge
            href={getPublicWriteReviewUrl(getPublicAppOrigin(), embedPayload.slug)}
            size="md"
            showTellacityLogo={whiteLabel.showTellacityLogo}
            minimal={minimal}
          />
        </div>
      )}
      {type === "badge" && (
        <TrustBadge
          payload={embedPayload}
          dashboardDemo={dashboardDemo}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
          showBusinessName={showBusinessName}
        />
      )}
      {type === "score_strip" && (
        <TellacityScoreStrip
          payload={embedPayload}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "trust_strip" && (
        <TellacityTrustStrip
          payload={embedPayload}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "trust_stacked" && (
        <TellacityTrustStacked
          payload={embedPayload}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "trust_strip_icon" && (
        <TellacityTrustStripIcon
          payload={embedPayload}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "trust_mini" && (
        <TellacityTrustMini
          payload={embedPayload}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "showcase" && (
        <ReviewShowcaseEmbed
          payload={embedPayload}
          dashboardDemo={dashboardDemo}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
          showBusinessName={showBusinessName}
        />
      )}
      {type === "tellacity_trust" && (
        <TellacityTrustBadgeEmbed
          payload={embedPayload}
          reviewHref={writeReviewHref}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "spotlight_carousel" && (
        <SpotlightCarouselWidget
          payload={embedPayload}
          dashboardDemo={dashboardDemo}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
          showBusinessName={showBusinessName}
        />
      )}
      {type === "review_slider" && (
        <ReviewSliderWidget
          payload={embedPayload}
          dashboardDemo={dashboardDemo}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "review_dropdown" && (
        <ReviewDropdownWidget
          payload={embedPayload}
          dashboardDemo={dashboardDemo}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}
      {type === "micro_trustscore" && (
        <MicroTrustScoreWidget
          payload={embedPayload}
          showTellacityLogo={whiteLabel.showTellacityLogo}
          minimal={minimal}
        />
      )}

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){function s(){var b=document.body,d=document.documentElement;var h=Math.ceil(Math.max(b.scrollHeight,b.offsetHeight,d.scrollHeight));window.parent.postMessage({type:'tellacity-widget-resize',src:window.location.href,height:h},'*');}if(document.readyState==='complete'){s();}else{window.addEventListener('load',s);}setTimeout(s,0);setTimeout(s,300);setTimeout(s,900);setTimeout(s,1800);})();`,
        }}
      />
    </>
  );
}

function Fallback({ message }: { message: string }) {
  return (
    <div style={{ padding: 16, fontSize: 13, color: "#9ca3af", fontFamily: "system-ui, sans-serif" }}>
      {message}
    </div>
  );
}
