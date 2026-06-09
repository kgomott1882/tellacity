import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ArticleResizableImageView from "./ArticleResizableImageView";
import {
  articleImageExtraAttributes,
  buildImageInlineStyle,
  sanitizeImageAttrs,
} from "@/lib/articles/articleImageAttrs";

export const ArticleImageExtension = Image.extend({
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

  draggable: true,

  addNodeView() {
    return ReactNodeViewRenderer(ArticleResizableImageView);
  },
});

export { sanitizeImageAttrs };

export default ArticleImageExtension;
