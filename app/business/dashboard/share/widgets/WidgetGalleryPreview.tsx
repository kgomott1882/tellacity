"use client";

import {
  WIDGET_GALLERY_CANVAS_HEIGHT,
  WIDGET_GALLERY_CANVAS_WIDTH,
  WIDGET_GALLERY_DISPLAY_SCALE,
} from "@/lib/widgetGalleryThumb";

type Props = {
  src: string;
  title: string;
};

/** Live iframe thumb — content is centered inside the embed via `gallery=1`. */
export default function WidgetGalleryPreview({ src, title }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div
        className="shrink-0"
        style={{
          width: WIDGET_GALLERY_CANVAS_WIDTH,
          height: WIDGET_GALLERY_CANVAS_HEIGHT,
          transform: `scale(${WIDGET_GALLERY_DISPLAY_SCALE})`,
          transformOrigin: "center center",
        }}
      >
        <iframe
          src={src}
          title={title}
          className="block"
          style={{
            border: 0,
            backgroundColor: "transparent",
            width: WIDGET_GALLERY_CANVAS_WIDTH,
            height: WIDGET_GALLERY_CANVAS_HEIGHT,
            display: "block",
          }}
          scrolling="no"
          loading="lazy"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
