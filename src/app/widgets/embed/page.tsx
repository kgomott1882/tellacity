import type { Metadata } from "next";
import { createWidgetClient } from "@/lib/supabaseServerWidget";
import type { WidgetPayload, WidgetType } from "@/components/widgets/types";
import TrustBadge from "@/components/widgets/TrustBadge";
import ReviewCarousel from "@/components/widgets/ReviewCarousel";
import ReviewList from "@/components/widgets/ReviewList";
import ReviewCollector from "@/components/widgets/ReviewCollector";
import TellacityReviewUsBadge from "@/components/widgets/TellacityReviewUsBadge";
import TellacityScoreStrip from "@/components/widgets/TellacityScoreStrip";
import ReviewShowcaseEmbed from "@/components/widgets/ReviewShowcaseEmbed";
import TellacityTrustBadgeEmbed from "@/components/widgets/TellacityTrustBadgeEmbed";
import SpotlightCarouselWidget from "@/components/widgets/SpotlightCarouselWidget";
import ReviewSliderWidget from "@/components/widgets/ReviewSliderWidget";
import ReviewDropdownWidget from "@/components/widgets/ReviewDropdownWidget";
import MicroTrustScoreWidget from "@/components/widgets/MicroTrustScoreWidget";
import { getPublicAppOrigin, getPublicWriteReviewUrl } from "@/lib/emailBranding";

export const metadata: Metadata = { robots: "noindex" };
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
  const defaultStr = type === "review_dropdown" ? "20" : "5";
  const fallback = parseInt(defaultStr, 10);
  const parsed = parseInt(raw ?? defaultStr, 10);
  const n = Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
  let limit = Math.min(20, Math.max(1, n));
  if (type === "spotlight_carousel" || type === "review_slider") {
    limit = Math.min(20, Math.max(limit, 6));
  }
  return limit;
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
  const themeRaw = Array.isArray(params.theme) ? params.theme[0] : params.theme;
  const rawTheme = (themeRaw ?? "minimal").toString().trim().toLowerCase();
  const minimal = rawTheme === "minimal";

  const payload = business ? await fetchPayload(business, limit) : null;
  const writeReviewHref = payload
    ? getPublicWriteReviewUrl(getPublicAppOrigin(), payload.slug)
    : "";

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: transparent; }
        body { padding: ${
          minimal ? "0" : type === "review_slider" ? "12px 18px 8px" : "20px 24px"
        }; font-family: system-ui, -apple-system, sans-serif; }
        ${type === "spotlight_carousel" || type === "review_slider" || type === "micro_trustscore" ? `html, body { width: 100%; min-width: 100%; }` : ""}
      `}</style>

      {!payload ? (
        <div style={{ fontSize: 13, color: "#9ca3af", padding: 8 }}>
          {business ? "Business not found." : "No business specified."}
        </div>
      ) : (
        <>
          {type === "carousel" && (
            <ReviewCarousel payload={payload} dashboardDemo={dashboardDemo} minimal={minimal} />
          )}
          {type === "list" && (
            <ReviewList payload={payload} dashboardDemo={dashboardDemo} minimal={minimal} />
          )}
          {type === "collector" && (
            <ReviewCollector payload={payload} dashboardDemo={dashboardDemo} minimal={minimal} />
          )}
          {type === "review_us" && (
            <div
              style={{
                display: "flex",
                justifyContent: minimal ? "flex-start" : "center",
                alignItems: "center",
                minHeight: minimal ? undefined : 44,
              }}
            >
              <TellacityReviewUsBadge
                href={getPublicWriteReviewUrl(getPublicAppOrigin(), payload.slug)}
                size="md"
                minimal={minimal}
              />
            </div>
          )}
          {type === "badge" && (
            <TrustBadge payload={payload} dashboardDemo={dashboardDemo} minimal={minimal} />
          )}
          {type === "score_strip" && <TellacityScoreStrip payload={payload} minimal={minimal} />}
          {type === "showcase" && (
            <ReviewShowcaseEmbed payload={payload} dashboardDemo={dashboardDemo} minimal={minimal} />
          )}
          {type === "tellacity_trust" && (
            <TellacityTrustBadgeEmbed payload={payload} reviewHref={writeReviewHref} minimal={minimal} />
          )}
          {type === "spotlight_carousel" && (
            <SpotlightCarouselWidget
              payload={payload}
              dashboardDemo={dashboardDemo}
              showTellacityLogo
              minimal={minimal}
            />
          )}
          {type === "review_slider" && (
            <ReviewSliderWidget
              payload={payload}
              dashboardDemo={dashboardDemo}
              showTellacityLogo
              minimal={minimal}
            />
          )}
          {type === "review_dropdown" && (
            <ReviewDropdownWidget
              payload={payload}
              dashboardDemo={dashboardDemo}
              showTellacityLogo
              minimal={minimal}
            />
          )}
          {type === "micro_trustscore" && (
            <MicroTrustScoreWidget payload={payload} showTellacityLogo minimal={minimal} />
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
