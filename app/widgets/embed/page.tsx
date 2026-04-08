import { createClient } from "@supabase/supabase-js";
import type { WidgetPayload, WidgetType } from "@/components/widgets/types";
import TrustBadge from "@/components/widgets/TrustBadge";
import ReviewCarousel from "@/components/widgets/ReviewCarousel";
import ReviewList from "@/components/widgets/ReviewList";
import ReviewCollector from "@/components/widgets/ReviewCollector";
import TellacityReviewUsBadge from "@/components/widgets/TellacityReviewUsBadge";
import TellacityScoreStrip from "@/components/widgets/TellacityScoreStrip";
import { getPublicAppOrigin, getPublicWriteReviewUrl } from "@/lib/emailBranding";

export const dynamic = "force-dynamic";

const VALID_TYPES: WidgetType[] = [
  "badge",
  "carousel",
  "list",
  "collector",
  "review_us",
  "score_strip",
];

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export default async function WidgetEmbedPage({
  searchParams,
}: {
  searchParams: Promise<{ business?: string; type?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const slug = params.business?.trim();
  const rawType = params.type ?? "badge";
  const type: WidgetType = VALID_TYPES.includes(rawType as WidgetType)
    ? (rawType as WidgetType)
    : "badge";
  const limit = Math.min(Math.max((parseInt(params.limit ?? "5", 10)) || 5, 1), 20);

  if (!slug) {
    return <Fallback message="Missing business slug." />;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("get_widget_payload_v1", {
    p_business_slug: slug,
    p_limit: limit,
  });

  if (error || !data || (typeof data === "object" && (data as any).error)) {
    return <Fallback message="Business not found." />;
  }

  const payload = data as WidgetPayload;

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { padding: 20px 24px; background: transparent; }
      `}</style>

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
      {type === "score_strip" && <TellacityScoreStrip payload={payload} />}

      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){function s(){var h=document.body.scrollHeight;window.parent.postMessage({type:'tellacity-widget-resize',src:window.location.href,height:h},'*');}if(document.readyState==='complete'){s();}else{window.addEventListener('load',s);}setTimeout(s,300);})();`,
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
