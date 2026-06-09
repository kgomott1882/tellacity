import { Extension } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import {
  articleImageExtraAttributes,
  buildImageInlineStyle,
} from "@/lib/articles/articleImageAttrs";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] as string[] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const FontFamily = Extension.create({
  name: "fontFamily",
  addOptions() {
    return { types: ["textStyle"] as string[] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (element) => element.style.fontFamily?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.fontFamily) return {};
              return { style: `font-family: ${attributes.fontFamily}` };
            },
          },
        },
      },
    ];
  },
});

/** Server-safe image extension (no React node views). */
const ServerArticleImage = Image.extend({
  name: "image",
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width") || element.style.width || null,
        renderHTML: (attributes) => {
          const style = buildImageInlineStyle({ width: attributes.width as string | null });
          return style ? { style } : {};
        },
      },
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => ({
          "data-align": attributes.align || "center",
        }),
      },
      ...articleImageExtraAttributes,
    };
  },
  parseHTML() {
    return [{ tag: "figure.article-image-node img" }, { tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    const style = buildImageInlineStyle({
      width: HTMLAttributes.width as string | null,
      flipH: HTMLAttributes.flipH as boolean | undefined,
      flipV: HTMLAttributes.flipV as boolean | undefined,
      offsetX: HTMLAttributes.offsetX as number | undefined,
      offsetY: HTMLAttributes.offsetY as number | undefined,
    });
    const { width: _w, flipH: _fh, flipV: _fv, offsetX: _ox, offsetY: _oy, ...rest } =
      HTMLAttributes;
    return ["img", style ? { ...rest, style } : rest];
  },
});

/** TipTap extensions for server-side HTML import/export (API routes). */
export function getArticleEditorExtensionsServer() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      horizontalRule: false,
    }),
    HorizontalRule,
    Underline,
    Subscript,
    Superscript,
    TextStyle,
    FontSize,
    FontFamily,
    Color,
    Highlight.configure({ multicolor: false }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    ServerArticleImage,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: "noopener noreferrer",
        target: "_blank",
      },
    }),
  ];
}
