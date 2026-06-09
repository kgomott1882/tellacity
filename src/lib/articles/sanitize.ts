import type { ArticleContentDoc, TipTapNode } from "./types";
import { sanitizeImageAttrs } from "./articleImageAttrs";

const ALLOWED_NODE_TYPES = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "image",
  "hardBreak",
  "text",
]);

const ALLOWED_MARK_TYPES = new Set([
  "bold",
  "italic",
  "link",
  "underline",
  "strike",
  "textStyle",
  "highlight",
  "subscript",
  "superscript",
]);

const ALLOWED_TEXT_ALIGNS = new Set(["left", "center", "right", "justify"]);

const ALLOWED_FONT_SIZES = new Set(["14px", "16px", "20px", "28px"]);

const ALLOWED_FONT_FAMILIES = new Set([
  "Inter, sans-serif",
  "Georgia, serif",
  "Arial, sans-serif",
  "Times New Roman, serif",
  "Courier New, monospace",
]);

const ALLOWED_TEXT_COLORS = new Set([
  "#0E0E0E",
  "#404040",
  "#1FAF9E",
  "#DC2626",
  "#2563EB",
  "#9333EA",
]);

const ARTICLE_MEDIA_MARKER = "/storage/v1/object/public/article_media/";

function sanitizeText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\u0000/g, "").slice(0, 50_000);
}

function sanitizeImageSrc(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const src = raw.trim();
  if (!src.startsWith("https://") && !src.startsWith("http://")) return null;
  if (!src.includes(ARTICLE_MEDIA_MARKER)) return null;
  return src.slice(0, 2048);
}

function sanitizeLinkHref(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const href = raw.trim();
  if (!/^https?:\/\//i.test(href)) return null;
  return href.slice(0, 2048);
}

function sanitizeNode(node: unknown): TipTapNode | null {
  if (!node || typeof node !== "object") return null;
  const n = node as TipTapNode;
  if (!ALLOWED_NODE_TYPES.has(n.type)) return null;

  if (n.type === "text") {
    const text = sanitizeText(n.text);
    if (!text) return null;
    const marks = Array.isArray(n.marks)
      ? n.marks
          .filter((m) => m && ALLOWED_MARK_TYPES.has(m.type))
          .map((m) => {
            if (m.type === "link") {
              const href = sanitizeLinkHref(m.attrs?.href);
              return href ? { type: "link", attrs: { href } } : null;
            }
            if (m.type === "textStyle") {
              const attrs: Record<string, string> = {};
              const fontSize = typeof m.attrs?.fontSize === "string" ? m.attrs.fontSize : null;
              if (fontSize && ALLOWED_FONT_SIZES.has(fontSize)) attrs.fontSize = fontSize;
              const fontFamily =
                typeof m.attrs?.fontFamily === "string" ? m.attrs.fontFamily : null;
              if (fontFamily && ALLOWED_FONT_FAMILIES.has(fontFamily)) {
                attrs.fontFamily = fontFamily;
              }
              const color = typeof m.attrs?.color === "string" ? m.attrs.color.toUpperCase() : null;
              const normalizedColor = color && ALLOWED_TEXT_COLORS.has(color) ? color : null;
              if (normalizedColor) attrs.color = normalizedColor;
              return Object.keys(attrs).length > 0 ? { type: "textStyle", attrs } : null;
            }
            if (m.type === "highlight") {
              return { type: "highlight" };
            }
            if (m.type === "subscript" || m.type === "superscript") {
              return { type: m.type };
            }
            if (m.type === "underline" || m.type === "strike") {
              return { type: m.type };
            }
            return { type: m.type };
          })
          .filter(Boolean)
      : undefined;
    return { type: "text", text, marks: marks as TipTapNode["marks"] };
  }

  if (n.type === "heading") {
    const levelRaw = Number(n.attrs?.level);
    const level = levelRaw >= 1 && levelRaw <= 3 ? levelRaw : 2;
    const content = sanitizeNodes(n.content);
    if (content.length === 0) return null;
    const alignRaw = String(n.attrs?.textAlign ?? "");
    const textAlign = ALLOWED_TEXT_ALIGNS.has(alignRaw) ? alignRaw : undefined;
    return {
      type: "heading",
      attrs: textAlign ? { level, textAlign } : { level },
      content,
    };
  }

  if (n.type === "codeBlock") {
    const textNode = (n.content ?? []).find(
      (c) => (c as TipTapNode).type === "text" && (c as TipTapNode).text,
    ) as TipTapNode | undefined;
    const code = sanitizeText(textNode?.text ?? "");
    if (!code) return null;
    return { type: "codeBlock", content: [{ type: "text", text: code }] };
  }

  if (n.type === "image") {
    const src = sanitizeImageSrc(n.attrs?.src);
    if (!src) return null;
    const sanitized = sanitizeImageAttrs(n.attrs as Record<string, unknown>);
    return {
      type: "image",
      attrs: {
        src: sanitized.src,
        alt: sanitized.alt,
        align: sanitized.align,
        width: sanitized.width,
        flipH: sanitized.flipH,
        flipV: sanitized.flipV,
        offsetX: sanitized.offsetX,
        offsetY: sanitized.offsetY,
      },
    };
  }

  if (n.type === "horizontalRule") {
    return { type: "horizontalRule" };
  }

  const content = sanitizeNodes(n.content);
  if (
    n.type !== "doc" &&
    n.type !== "bulletList" &&
    n.type !== "orderedList" &&
    content.length === 0
  ) {
    return null;
  }

  if (n.type === "paragraph") {
    const alignRaw = String(n.attrs?.textAlign ?? "");
    const textAlign = ALLOWED_TEXT_ALIGNS.has(alignRaw) ? alignRaw : undefined;
    return {
      type: "paragraph",
      attrs: textAlign ? { textAlign } : undefined,
      content: content.length > 0 ? content : undefined,
    };
  }

  return { type: n.type, content: content.length > 0 ? content : undefined };
}

function sanitizeNodes(nodes: unknown): TipTapNode[] {
  if (!Array.isArray(nodes)) return [];
  const out: TipTapNode[] = [];
  for (const node of nodes) {
    const clean = sanitizeNode(node);
    if (clean) out.push(clean);
  }
  return out;
}

export function emptyArticleDoc(): ArticleContentDoc {
  return { type: "doc", content: [] };
}

export function sanitizeArticleContent(raw: unknown): ArticleContentDoc {
  const clean = sanitizeNode(raw);
  if (!clean || clean.type !== "doc") {
    return emptyArticleDoc();
  }
  return { type: "doc", content: clean.content ?? [] };
}

export function plainTextFromDoc(doc: ArticleContentDoc, maxLen = 320): string {
  const parts: string[] = [];
  const walk = (nodes?: TipTapNode[]) => {
    if (!nodes) return;
    for (const n of nodes) {
      if (n.type === "text" && n.text) parts.push(n.text);
      if (n.content) walk(n.content);
    }
  };
  walk(doc.content);
  const joined = parts.join(" ").replace(/\s+/g, " ").trim();
  if (joined.length <= maxLen) return joined;
  return `${joined.slice(0, maxLen - 1).trim()}…`;
}
