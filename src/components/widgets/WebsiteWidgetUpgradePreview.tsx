"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Matches `planWidget` on the website widgets dashboard grid. */
export type WebsiteWidgetPlanKey =
  | "trust_badge"
  | "review_carousel"
  | "review_list"
  | "review_collector"
  | "review_strip"
  | "review_showcase"
  | "tellacity_trust"
  | "tellacity_score"
  | "trust_strip"
  | "trust_stacked"
  | "trust_strip_icon"
  | "trust_mini"
  | "spotlight_carousel"
  | "review_slider"
  | "review_dropdown"
  | "micro_trustscore";

const EMBED_TYPE_BY_WIDGET: Record<WebsiteWidgetPlanKey, string> = {
  trust_badge: "badge",
  review_carousel: "carousel",
  review_list: "list",
  review_collector: "collector",
  review_strip: "review_us",
  review_showcase: "showcase",
  tellacity_trust: "tellacity_trust",
  tellacity_score: "score_strip",
  trust_strip: "trust_strip",
  trust_stacked: "trust_stacked",
  trust_strip_icon: "trust_strip_icon",
  trust_mini: "trust_mini",
  spotlight_carousel: "spotlight_carousel",
  review_slider: "review_slider",
  review_dropdown: "review_dropdown",
  micro_trustscore: "micro_trustscore",
};

function embedUrlsMatchForResize(expectedParentHref: string, messageSrc: string): boolean {
  try {
    const a = new URL(expectedParentHref);
    const b = new URL(messageSrc);
    return a.pathname === b.pathname && a.search === b.search;
  } catch {
    return expectedParentHref === messageSrc;
  }
}

/** Minimum iframe height before / until embed postMessage resize (px). Keep ≥ real widget chrome so nothing clips. */
const PREVIEW_HEIGHT_BY_WIDGET: Record<WebsiteWidgetPlanKey, number> = {
  trust_badge: 128,
  review_carousel: 320,
  review_list: 440,
  review_collector: 96,
  review_strip: 112,
  review_showcase: 420,
  tellacity_trust: 220,
  tellacity_score: 168,
  trust_strip: 148,
  trust_stacked: 240,
  trust_strip_icon: 128,
  trust_mini: 120,
  spotlight_carousel: 560,
  review_slider: 420,
  review_dropdown: 400,
  micro_trustscore: 120,
};

const RESIZE_HEIGHT_BUFFER = 24;

export default function WebsiteWidgetUpgradePreview({
  widget,
  businessSlug,
}: {
  widget: WebsiteWidgetPlanKey | null;
  businessSlug?: string | null;
}) {
  const toneClass =
    "rounded-lg border border-[#E9E1D2] bg-[#F9F6EF] px-3 py-3 text-[12px] text-[#1F2937]";
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [measuredIframeHeight, setMeasuredIframeHeight] = useState<number | null>(null);

  const innerShell =
    "pointer-events-none w-full max-h-[min(72vh,560px)] overflow-y-auto rounded-md bg-white";

  const previewBundle = useMemo(() => {
    if (!widget) return null;
    const slug = (businessSlug ?? "").trim().toLowerCase();
    if (!slug) return null;
    const embedType = EMBED_TYPE_BY_WIDGET[widget];
    const limitQs = widget === "review_dropdown" ? "&limit=20" : "";
    const previewSrc = `/widgets/embed?business=${encodeURIComponent(
      slug
    )}&type=${encodeURIComponent(embedType)}&dashboard_demo=1${limitQs}`;
    const minIframeHeight = PREVIEW_HEIGHT_BY_WIDGET[widget];
    return { previewSrc, minIframeHeight, widget };
  }, [widget, businessSlug]);

  const fullPreviewUrl = useMemo(() => {
    const src = previewBundle?.previewSrc ?? "";
    if (!src) return "";
    if (typeof window === "undefined") return src;
    return new URL(src, window.location.origin).href;
  }, [previewBundle?.previewSrc]);

  useEffect(() => {
    setMeasuredIframeHeight(null);
  }, [previewBundle?.previewSrc]);

  useEffect(() => {
    if (!fullPreviewUrl) return;
    function onMessage(e: MessageEvent) {
      if (e.data?.type !== "tellacity-widget-resize" || !iframeRef.current) return;
      const msgSrc = typeof e.data.src === "string" ? e.data.src : "";
      if (!embedUrlsMatchForResize(fullPreviewUrl, msgSrc)) return;
      const raw = Number(e.data.height);
      if (!Number.isFinite(raw) || raw < 40) return;
      const next = Math.min(Math.ceil(raw + RESIZE_HEIGHT_BUFFER), 2400);
      setMeasuredIframeHeight(next);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [fullPreviewUrl]);

  if (!widget) {
    return (
      <div className={toneClass}>
        <p className="font-semibold text-[#111827]">Widget preview</p>
        <p className="mt-1 text-[#374151]">
          Unlock additional widget styles and richer social proof blocks.
        </p>
      </div>
    );
  }

  if (!previewBundle) {
    return (
      <div className={toneClass}>
        <p className="mt-1 text-[#374151]">
          Select a business to load real widget preview data.
        </p>
      </div>
    );
  }

  const { previewSrc, minIframeHeight } = previewBundle;
  const iframeHeight = measuredIframeHeight ?? minIframeHeight;

  return (
    <div className={toneClass}>
      <div className="mt-2 select-none">
        <div className={innerShell}>
          <iframe
            ref={iframeRef}
            title={`${widget} upgrade preview`}
            src={previewSrc}
            className="w-full"
            style={{
              height: iframeHeight,
              minHeight: minIframeHeight,
              border: 0,
              display: "block",
              overflow: "hidden",
            }}
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
}
