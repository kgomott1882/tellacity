"use client";

import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  FlipHorizontal2,
  FlipVertical2,
  GripVertical,
  RotateCcw,
} from "lucide-react";
import { ARTICLE_CONTENT_INNER_WIDTH_PX } from "@/lib/articles/articleLayout";
import {
  buildImageTransformStyle,
  imageAlignClass,
  MAX_IMAGE_OFFSET,
  MIN_IMAGE_WIDTH_PX,
  sanitizeImageAttrs,
} from "@/lib/articles/articleImageAttrs";

type ResizeCorner = "nw" | "ne" | "sw" | "se";

export default function ArticleResizableImageView({
  node,
  updateAttributes,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const attrs = sanitizeImageAttrs(node.attrs as Record<string, unknown>);
  const { align, width: widthAttr, flipH, flipV, offsetX, offsetY } = attrs;
  const alignClass = imageAlignClass(align);

  const selectNode = useCallback(() => {
    const pos = getPos();
    if (typeof pos === "number") {
      editor.commands.setNodeSelection(pos);
    }
  }, [editor, getPos]);

  const startMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editor.isEditable || !selected) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const baseX = offsetX;
      const baseY = offsetY;

      const onMove = (ev: MouseEvent) => {
        updateAttributes({
          offsetX: Math.max(
            -MAX_IMAGE_OFFSET,
            Math.min(MAX_IMAGE_OFFSET, baseX + (ev.clientX - startX)),
          ),
          offsetY: Math.max(
            -MAX_IMAGE_OFFSET,
            Math.min(MAX_IMAGE_OFFSET, baseY + (ev.clientY - startY)),
          ),
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editor.isEditable, offsetX, offsetY, selected, updateAttributes],
  );

  const startResize = useCallback(
    (corner: ResizeCorner) => (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!editor.isEditable) return;

      const img = imgRef.current;
      const wrap = wrapRef.current;
      if (!img || !wrap) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = img.getBoundingClientRect().width;
      const startOffsetX = offsetX;
      const startOffsetY = offsetY;
      const maxWidth = wrap.parentElement?.clientWidth ?? ARTICLE_CONTENT_INNER_WIDTH_PX;

      const onMove = (ev: MouseEvent) => {
        const deltaX = ev.clientX - startX;
        const deltaY = ev.clientY - startY;

        let nextWidth = startWidth;
        let nextOffsetX = startOffsetX;
        let nextOffsetY = startOffsetY;

        if (corner === "se") {
          nextWidth = startWidth + deltaX;
        } else if (corner === "sw") {
          nextWidth = startWidth - deltaX;
          nextOffsetX = startOffsetX + deltaX;
        } else if (corner === "ne") {
          nextWidth = startWidth + deltaX;
          nextOffsetY = startOffsetY + deltaY;
        } else {
          nextWidth = startWidth - deltaX;
          nextOffsetX = startOffsetX + deltaX;
          nextOffsetY = startOffsetY + deltaY;
        }

        nextWidth = Math.max(MIN_IMAGE_WIDTH_PX, Math.min(maxWidth, nextWidth));
        const pct = Math.round((nextWidth / maxWidth) * 100);

        updateAttributes({
          width: `${pct}%`,
          offsetX: Math.max(-MAX_IMAGE_OFFSET, Math.min(MAX_IMAGE_OFFSET, nextOffsetX)),
          offsetY: Math.max(-MAX_IMAGE_OFFSET, Math.min(MAX_IMAGE_OFFSET, nextOffsetY)),
        });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [editor.isEditable, offsetX, offsetY, updateAttributes],
  );

  useEffect(() => {
    const img = imgRef.current;
    if (!img || widthAttr) return;

    const setDefaultWidth = () => {
      updateAttributes({ width: "100%" });
    };

    if (img.complete) setDefaultWidth();
    else img.addEventListener("load", setDefaultWidth, { once: true });
  }, [widthAttr, updateAttributes]);

  const imgStyle: CSSProperties = {
    width: widthAttr || "100%",
  };
  const transform = buildImageTransformStyle({ flipH, flipV, offsetX, offsetY });
  if (transform) imgStyle.transform = transform;

  const resetTransform = () => {
    updateAttributes({
      offsetX: 0,
      offsetY: 0,
      flipH: false,
      flipV: false,
    });
  };

  return (
    <NodeViewWrapper
      as="figure"
      className={`article-image-node my-6 block max-w-full ${alignClass} ${selected ? "is-selected" : ""}`}
      data-align={align}
      contentEditable={false}
      draggable={editor.isEditable}
      onMouseDown={(e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest("[data-image-control]")) return;
        selectNode();
      }}
    >
      <div ref={wrapRef} className={`group relative inline-block max-w-full ${alignClass}`}>
        {editor.isEditable ? (
          <div
            className="absolute left-2 top-2 z-20 flex h-7 w-7 cursor-grab items-center justify-center rounded-md border border-gray-200 bg-white/95 text-gray-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 active:cursor-grabbing [.is-selected_&]:opacity-100"
            contentEditable={false}
            data-drag-handle
            data-image-control
            title="Drag to move block in the article"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        ) : null}

        <div className="relative inline-block max-w-full leading-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={node.attrs.src as string}
            alt={String(node.attrs.alt ?? "")}
            style={imgStyle}
            className={`block max-w-full rounded-xl border border-gray-100 ${
              selected && editor.isEditable ? "cursor-move" : ""
            } ${selected ? "ring-2 ring-[#1FAF9E] ring-offset-2" : ""}`}
            draggable={false}
            onMouseDown={(e) => {
              if (!selected || !editor.isEditable) return;
              if ((e.target as HTMLElement).closest("[data-image-control]")) return;
              startMove(e);
            }}
          />

          {editor.isEditable && selected ? (
            <>
              <div
                className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 flex-wrap items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white/95 px-1.5 py-1 shadow-md"
                contentEditable={false}
                data-image-control
              >
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    type="button"
                    title={`Align ${a}`}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      align === a ? "bg-[#1FAF9E] text-white" : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateAttributes({ align: a })}
                  >
                    {a[0]}
                  </button>
                ))}
                <span className="mx-0.5 h-4 w-px bg-gray-200" aria-hidden />
                <button
                  type="button"
                  title="Flip horizontal"
                  className={`rounded p-1 ${flipH ? "bg-[#1FAF9E] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ flipH: !flipH })}
                >
                  <FlipHorizontal2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Flip vertical"
                  className={`rounded p-1 ${flipV ? "bg-[#1FAF9E] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateAttributes({ flipV: !flipV })}
                >
                  <FlipVertical2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Reset position and flip"
                  className="rounded p-1 text-gray-600 hover:bg-gray-100"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={resetTransform}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {(["nw", "ne", "sw", "se"] as const).map((corner) => (
                <div
                  key={corner}
                  role="separator"
                  aria-label={`Resize ${corner}`}
                  data-image-control
                  className={`absolute z-20 h-4 w-4 rounded-full border-2 border-white bg-[#1FAF9E] shadow ${
                    corner === "nw"
                      ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize"
                      : corner === "ne"
                        ? "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize"
                        : corner === "sw"
                          ? "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize"
                          : "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize"
                  }`}
                  contentEditable={false}
                  onMouseDown={startResize(corner)}
                />
              ))}
            </>
          ) : null}
        </div>
      </div>
    </NodeViewWrapper>
  );
}
