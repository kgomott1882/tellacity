import type { Metadata } from "next";
import { createWidgetClient } from "@/lib/supabaseServerWidget";
import type { WidgetPayload, WidgetType } from "@/components/widgets/types";
import TrustBadge from "@/components/widgets/TrustBadge";
import ReviewCarousel from "@/components/widgets/ReviewCarousel";
import ReviewList from "@/components/widgets/ReviewList";
import TellacityReviewUsBadge from "@/components/widgets/TellacityReviewUsBadge";
import TellacityScoreStrip from "@/components/widgets/TellacityScoreStrip";
import ReviewShowcaseEmbed from "@/components/widgets/ReviewShowcaseEmbed";
import TellacityTrustBadgeEmbed from "@/components/widgets/TellacityTrustBadgeEmbed";
import SpotlightCarouselWidget from "@/components/widgets/SpotlightCarouselWidget";
import ReviewSliderWidget from "@/components/widgets/ReviewSliderWidget";
import ReviewDropdownWidget from "@/components/widgets/ReviewDropdownWidget";
import MicroTrustScoreWidget from "@/components/widgets/MicroTrustScoreWidget";
import { getPublicAppOrigin, getPublicWriteReviewUrl } from "@/lib/emailBranding";
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

export const metadata: Metadata = {
  robots: {
    index: true,
    follow: true,
  },
};
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
  "spotlight_carousel",
  "review_slider",
  "review_dropdown",
  "micro_trustscore",
];

function clampLimit(raw: string | undefined, type: WidgetType): number {
  const cap = widgetEmbedDataLimitCap(type);
  const defaultStr =
    type === "review_dropdown" || type === "carousel" || type === "list" || type === "showcase"
      ? String(cap)
      : type === "spotlight_carousel" || type === "review_slider"
        ? "8"
        : "5";
  const fallback = parseInt(defaultStr, 10);
  const parsed = parseInt(raw ?? defaultStr, 10);
  const n = Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
  return Math.min(cap, Math.max(1, n));
}

async function fetchPayload(business: string, limit: number): Promise<WidgetPayload | null> {
  const supabase = createWidgetClient();
  const { data, error } = await supabase.rpc("get_widget_payload_v1", {
    p_business_slug: business,
    p_limit: limit,
  });
  if (error || !data) return null;
  if (typeof data === "object" && (data as any).error) return null;
  return data as WidgetPayload;
}

export default async function WidgetEmbedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const business = (Array.isArray(params.business) ? params.business[0] : params.business)?.trim() ?? "";
  const rawType = (Array.isArray(params.type) ? params.type[0] : params.type) ?? "badge";
  const type: WidgetType = VALID_TYPES.includes(rawType as WidgetType) ? (rawType as WidgetType) : "badge";
  const requestedLimit = clampLimit(
    Array.isArray(params.limit) ? params.limit[0] : params.limit,
    type,
  );
  const limit = requestedLimit;
  const dashboardRaw = Array.isArray(params.dashboard_demo) ? params.dashboard_demo[0] : params.dashboard_demo;
  const dashboardDemo = dashboardRaw === "1" || dashboardRaw === "true";
  const galleryRaw = Array.isArray(params.gallery) ? params.gallery[0] : params.gallery;
  const galleryThumb = galleryRaw === "1" || galleryRaw === "true";
  const themeRaw = Array.isArray(params.theme) ? params.theme[0] : params.theme;
  const rawTheme = (themeRaw ?? "minimal").toString().trim().toLowerCase();
  const minimal = rawTheme === "minimal";

  const payload = business ? await fetchPayload(business, limit) : null;

  const showNameParamRaw = Array.isArray(params.show_business_name)
    ? params.show_business_name[0]
    : params.show_business_name;
  const reviewStarsParamRaw = Array.isArray(params.review_stars)
    ? params.review_stars[0]
    : params.review_stars;

  let embedSettingsRaw: unknown;
  if (business) {
    const sb = createWidgetClient();
    const { data: bizRow } = await sb
      .from("businesses")
      .select("widget_embed_settings")
      .eq("slug", business)
      .maybeSingle();
    embedSettingsRaw = (bizRow as { widget_embed_settings?: unknown } | null)?.widget_embed_settings;
  }

  const embedPayload = payload
    ? (() => {
        let next = dashboardDemo ? applyWidgetDashboardDemoOverlay(payload) : payload;
        if (dashboardDemo) {
          next = applyDashboardPreviewReviewLimit(next, limit, type);
        }
        const reviewRatings = resolveWidgetReviewStarRatings(
          typeof reviewStarsParamRaw === "string" ? reviewStarsParamRaw : undefined,
          embedSettingsRaw,
          type,
        );
        if (isWidgetTypeWithReviewStarFilter(type)) {
          next = applyReviewStarFilterToPayload(next, reviewRatings);
        }
        return next;
      })()
    : null;
  const writeReviewHref = embedPayload
    ? getPublicWriteReviewUrl(getPublicAppOrigin(), embedPayload.slug)
    : "";

  const showBusinessName = resolveWidgetShowBusinessName(
    typeof showNameParamRaw === "string" ? showNameParamRaw : undefined,
    embedSettingsRaw,
  );

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: transparent; }
        body { padding: ${
          galleryThumb ? "0" : minimal ? "0" : type === "review_slider" ? "12px 18px 8px" : "20px 24px"
        }; font-family: system-ui, -apple-system, sans-serif; }
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

      {!embedPayload ? (
        <div style={{ fontSize: 13, color: "#9ca3af", padding: 8 }}>
          {business ? "Business not found." : "No business specified."}
        </div>
      ) : (
        <>
          {type === "carousel" && (
            <ReviewCarousel
              payload={embedPayload}
              dashboardDemo={dashboardDemo}
              minimal={minimal}
              showBusinessName={showBusinessName}
            />
          )}
          {type === "list" && (
            <ReviewList
              payload={embedPayload}
              dashboardDemo={dashboardDemo}
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
                minimal={minimal}
              />
            </div>
          )}
          {type === "badge" && (
            <TrustBadge
              payload={embedPayload}
              dashboardDemo={dashboardDemo}
              minimal={minimal}
              showBusinessName={showBusinessName}
            />
          )}
          {type === "score_strip" && <TellacityScoreStrip payload={embedPayload} minimal={minimal} />}
          {type === "showcase" && (
            <ReviewShowcaseEmbed
              payload={embedPayload}
              dashboardDemo={dashboardDemo}
              minimal={minimal}
              showBusinessName={showBusinessName}
            />
          )}
          {type === "tellacity_trust" && (
            <TellacityTrustBadgeEmbed payload={embedPayload} reviewHref={writeReviewHref} minimal={minimal} />
          )}
          {type === "spotlight_carousel" && (
            <SpotlightCarouselWidget
              payload={embedPayload}
              dashboardDemo={dashboardDemo}
              showTellacityLogo
              minimal={minimal}
              showBusinessName={showBusinessName}
            />
          )}
          {type === "review_slider" && (
            <ReviewSliderWidget
              payload={embedPayload}
              dashboardDemo={dashboardDemo}
              showTellacityLogo
              minimal={minimal}
            />
          )}
          {type === "review_dropdown" && (
            <ReviewDropdownWidget
              payload={embedPayload}
              dashboardDemo={dashboardDemo}
              showTellacityLogo
              minimal={minimal}
            />
          )}
          {type === "micro_trustscore" && (
            <MicroTrustScoreWidget payload={embedPayload} showTellacityLogo minimal={minimal} />
          )}
        </>
      )}

      {/* Notify parent iframe of rendered height for auto-resize */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){function s(){var b=document.body,d=document.documentElement;var h=Math.ceil(Math.max(b.scrollHeight,b.offsetHeight,d.scrollHeight));window.parent.postMessage({type:'tellacity-widget-resize',src:window.location.href,height:h},'*');}if(document.readyState==='complete'){s();}else{window.addEventListener('load',s);}setTimeout(s,0);setTimeout(s,300);setTimeout(s,900);setTimeout(s,1800);})();`,
        }}
      />
    </>
  );
}
