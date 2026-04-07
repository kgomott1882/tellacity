import type { Metadata } from "next";
import { createWidgetClient } from "@/lib/supabaseServerWidget";
import type { WidgetPayload, WidgetType } from "@/components/widgets/types";
import TrustBadge from "@/components/widgets/TrustBadge";
import ReviewCarousel from "@/components/widgets/ReviewCarousel";
import ReviewList from "@/components/widgets/ReviewList";
import ReviewCollector from "@/components/widgets/ReviewCollector";
import TellacityReviewUsBadge from "@/components/widgets/TellacityReviewUsBadge";
import { getPublicAppOrigin, getPublicWriteReviewUrl } from "@/lib/emailBranding";

export const metadata: Metadata = { robots: "noindex" };
export const dynamic = "force-dynamic";

const VALID_TYPES: WidgetType[] = [
  "badge",
  "carousel",
  "list",
  "collector",
  "review_us",
];

function clampLimit(raw: string | undefined): number {
  const n = parseInt(raw ?? "5", 10);
  if (isNaN(n)) return 5;
  return Math.min(20, Math.max(1, n));
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
  const limit = clampLimit(Array.isArray(params.limit) ? params.limit[0] : params.limit);

  const payload = business ? await fetchPayload(business, limit) : null;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: transparent; }
        body { padding: 20px 24px; font-family: system-ui, -apple-system, sans-serif; }
      `}</style>

      {!payload ? (
        <div style={{ fontSize: 13, color: "#9ca3af", padding: 8 }}>
          {business ? "Business not found." : "No business specified."}
        </div>
      ) : (
        <>
          {type === "carousel" && <ReviewCarousel payload={payload} />}
          {type === "list" && <ReviewList payload={payload} />}
          {type === "collector" && <ReviewCollector payload={payload} />}
          {type === "review_us" && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 44,
              }}
            >
              <TellacityReviewUsBadge
                href={getPublicWriteReviewUrl(getPublicAppOrigin(), payload.slug)}
                size="md"
              />
            </div>
          )}
          {type === "badge" && <TrustBadge payload={payload} />}
        </>
      )}

      {/* Notify parent iframe of rendered height for auto-resize */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){function s(){var h=document.body.scrollHeight;window.parent.postMessage({type:'tellacity-widget-resize',src:window.location.href,height:h},'*');}if(document.readyState==='complete'){s();}else{window.addEventListener('load',s);}setTimeout(s,300);})();`,
        }}
      />
    </>
  );
}
