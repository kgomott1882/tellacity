import type { ReactNode, CSSProperties } from "react";
import type { ArticleContentDoc, TipTapNode } from "@/lib/articles/types";
import {
  buildImageTransformStyle,
  imageAlignClass,
  sanitizeImageAttrs,
} from "@/lib/articles/articleImageAttrs";
import "@/styles/article-body.css";

function renderMarks(text: string, marks?: TipTapNode["marks"]): ReactNode {
  if (!marks?.length) return text;
  let node: ReactNode = text;
  for (const mark of [...marks].reverse()) {
    if (mark.type === "bold") node = <strong>{node}</strong>;
    else if (mark.type === "italic") node = <em>{node}</em>;
    else if (mark.type === "underline") node = <span className="underline">{node}</span>;
    else if (mark.type === "strike") node = <span className="line-through">{node}</span>;
    else if (mark.type === "subscript") node = <sub>{node}</sub>;
    else if (mark.type === "superscript") node = <sup>{node}</sup>;
    else if (mark.type === "highlight") node = <mark>{node}</mark>;
    else if (mark.type === "textStyle") {
      const style: CSSProperties = {};
      if (typeof mark.attrs?.fontSize === "string") style.fontSize = mark.attrs.fontSize;
      if (typeof mark.attrs?.fontFamily === "string") style.fontFamily = mark.attrs.fontFamily;
      if (typeof mark.attrs?.color === "string") style.color = mark.attrs.color;
      if (Object.keys(style).length > 0) node = <span style={style}>{node}</span>;
    } else if (mark.type === "link" && typeof mark.attrs?.href === "string") {
      node = (
        <a
          href={mark.attrs.href}
          target="_blank"
          rel="noopener noreferrer ugc nofollow"
          className="font-medium text-[#1FAF9E] underline underline-offset-2"
        >
          {node}
        </a>
      );
    }
  }
  return node;
}

function renderInline(nodes?: TipTapNode[]): ReactNode {
  if (!nodes?.length) return null;
  return nodes.map((n, i) => {
    if (n.type === "text" && n.text) {
      return <span key={i}>{renderMarks(n.text, n.marks)}</span>;
    }
    if (n.type === "hardBreak") return <br key={i} />;
    return null;
  });
}

function blockClassName(node: TipTapNode, base: string): string {
  const align = node.attrs?.textAlign;
  if (align === "center") return `${base} text-center`;
  if (align === "right") return `${base} text-right`;
  if (align === "justify") return `${base} text-justify`;
  return base;
}

function renderBlock(node: TipTapNode, key: string | number): ReactNode {
  switch (node.type) {
    case "paragraph":
      return (
        <p key={key} className={blockClassName(node, "text-base leading-relaxed text-[#404040]")}>
          {renderInline(node.content)}
        </p>
      );
    case "heading": {
      const level = Number(node.attrs?.level) || 2;
      const className = blockClassName(
        node,
        level === 1
          ? "text-3xl font-semibold text-[#0E0E0E]"
          : level === 2
            ? "text-2xl font-semibold text-[#0E0E0E]"
            : "text-xl font-semibold text-[#0E0E0E]",
      );
      const children = renderInline(node.content);
      if (level === 1) return <h2 key={key} className={className}>{children}</h2>;
      if (level === 3) return <h4 key={key} className={className}>{children}</h4>;
      return <h3 key={key} className={className}>{children}</h3>;
    }
    case "bulletList":
      return (
        <ul key={key} className="list-disc space-y-2 pl-6 text-[#404040]">
          {(node.content ?? []).map((li, i) => renderBlock(li, `${key}-${i}`))}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="list-decimal space-y-2 pl-6 text-[#404040]">
          {(node.content ?? []).map((li, i) => renderBlock(li, `${key}-${i}`))}
        </ol>
      );
    case "listItem":
      return <li key={key}>{(node.content ?? []).map((c, i) => renderBlock(c, `${key}-${i}`))}</li>;
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="border-l-4 border-[#1FAF9E] pl-4 italic text-[#505050]"
        >
          {(node.content ?? []).map((c, i) => renderBlock(c, `${key}-${i}`))}
        </blockquote>
      );
    case "codeBlock": {
      const text = (node.content ?? [])
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("");
      return (
        <pre
          key={key}
          className="overflow-x-auto rounded-lg bg-gray-100 p-4 font-mono text-sm text-gray-800"
        >
          <code>{text}</code>
        </pre>
      );
    }
    case "horizontalRule":
      return <hr key={key} />;
    case "image": {
      if (typeof node.attrs?.src !== "string") return null;
      const sanitized = sanitizeImageAttrs(node.attrs as Record<string, unknown>);
      const figureClass = imageAlignClass(sanitized.align);
      const transform = buildImageTransformStyle(sanitized);
      const style: CSSProperties = { width: sanitized.width };
      if (transform) style.transform = transform;
      return (
        <figure key={key} className={`my-6 block max-w-full ${figureClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sanitized.src}
            alt={sanitized.alt}
            style={style}
            className="max-w-full rounded-xl border border-gray-100"
            loading="lazy"
          />
        </figure>
      );
    }
    default:
      return null;
  }
}

export default function ArticleContentRenderer({
  content,
  className = "",
}: {
  content: ArticleContentDoc;
  className?: string;
}) {
  return (
    <div className={`article-body-content space-y-4 ${className}`.trim()}>
      {(content.content ?? []).map((node, i) => renderBlock(node, i))}
    </div>
  );
}
