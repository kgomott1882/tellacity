export const MAX_IMAGE_OFFSET = 320;
export const MIN_IMAGE_WIDTH_PX = 80;

const ALLOWED_ALIGN = new Set(["left", "center", "right"]);

export type SanitizedImageAttrs = {
  src: string;
  alt: string;
  align: "left" | "center" | "right";
  width: string;
  flipH: boolean;
  flipV: boolean;
  offsetX: number;
  offsetY: number;
};

export function sanitizeImageWidth(raw: unknown): string | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const clamped = Math.max(10, Math.min(100, Math.round(raw)));
    return `${clamped}%`;
  }
  if (typeof raw === "string") {
    const v = raw.trim();
    if (/^\d{1,4}px$/.test(v)) {
      const px = Number(v.replace("px", ""));
      if (px >= MIN_IMAGE_WIDTH_PX && px <= 2000) return v;
    }
    if (/^\d{1,3}%$/.test(v)) {
      const pct = Number(v.replace("%", ""));
      if (pct >= 10 && pct <= 100) return v;
    }
  }
  return null;
}

export function sanitizeImageOffset(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.max(-MAX_IMAGE_OFFSET, Math.min(MAX_IMAGE_OFFSET, Math.round(n)));
}

export function sanitizeImageAttrs(
  attrs: Record<string, unknown> | undefined,
): SanitizedImageAttrs {
  const src = typeof attrs?.src === "string" ? attrs.src : "";
  const alt = typeof attrs?.alt === "string" ? attrs.alt.slice(0, 500) : "";
  const alignRaw = String(attrs?.align ?? "center");
  const align = ALLOWED_ALIGN.has(alignRaw)
    ? (alignRaw as SanitizedImageAttrs["align"])
    : "center";
  const width = sanitizeImageWidth(attrs?.width) ?? "100%";
  return {
    src,
    alt,
    align,
    width,
    flipH: Boolean(attrs?.flipH),
    flipV: Boolean(attrs?.flipV),
    offsetX: sanitizeImageOffset(attrs?.offsetX),
    offsetY: sanitizeImageOffset(attrs?.offsetY),
  };
}

export function buildImageTransformStyle(attrs: {
  flipH?: boolean;
  flipV?: boolean;
  offsetX?: number;
  offsetY?: number;
}): string {
  const flipH = Boolean(attrs.flipH);
  const flipV = Boolean(attrs.flipV);
  const offsetX = sanitizeImageOffset(attrs.offsetX);
  const offsetY = sanitizeImageOffset(attrs.offsetY);
  const parts: string[] = [];
  if (offsetX !== 0 || offsetY !== 0) {
    parts.push(`translate(${offsetX}px, ${offsetY}px)`);
  }
  if (flipH) parts.push("scaleX(-1)");
  if (flipV) parts.push("scaleY(-1)");
  return parts.length ? parts.join(" ") : "";
}

export function buildImageInlineStyle(attrs: {
  width?: string | null;
  flipH?: boolean;
  flipV?: boolean;
  offsetX?: number;
  offsetY?: number;
}): string | undefined {
  const chunks: string[] = [];
  if (attrs.width) chunks.push(`width: ${attrs.width}`);
  const transform = buildImageTransformStyle(attrs);
  if (transform) chunks.push(`transform: ${transform}`);
  return chunks.length ? chunks.join("; ") : undefined;
}

export function imageAlignClass(align: string): string {
  if (align === "left") return "mr-auto ml-0";
  if (align === "right") return "ml-auto mr-0";
  return "mx-auto";
}

export const articleImageExtraAttributes = {
  flipH: {
    default: false,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-flip-h") === "true",
    renderHTML: (attributes: Record<string, unknown>) =>
      attributes.flipH ? { "data-flip-h": "true" } : {},
  },
  flipV: {
    default: false,
    parseHTML: (element: HTMLElement) => element.getAttribute("data-flip-v") === "true",
    renderHTML: (attributes: Record<string, unknown>) =>
      attributes.flipV ? { "data-flip-v": "true" } : {},
  },
  offsetX: {
    default: 0,
    parseHTML: (element: HTMLElement) =>
      sanitizeImageOffset(element.getAttribute("data-offset-x")),
    renderHTML: (attributes: Record<string, unknown>) => {
      const offsetX = sanitizeImageOffset(attributes.offsetX);
      return offsetX !== 0 ? { "data-offset-x": String(offsetX) } : {};
    },
  },
  offsetY: {
    default: 0,
    parseHTML: (element: HTMLElement) =>
      sanitizeImageOffset(element.getAttribute("data-offset-y")),
    renderHTML: (attributes: Record<string, unknown>) => {
      const offsetY = sanitizeImageOffset(attributes.offsetY);
      return offsetY !== 0 ? { "data-offset-y": String(offsetY) } : {};
    },
  },
} as const;
