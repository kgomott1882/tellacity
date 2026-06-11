"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clampCropState,
  coverScaleForImage,
  containScaleForImage,
  exportWriterAvatarCrop,
  initialCropState,
  WRITER_AVATAR_VIEWPORT_PX,
  type WriterAvatarCropState,
  type WriterAvatarFitMode,
} from "@/lib/articles/writerAvatarCrop";

type Props = {
  sourceUrl: string;
  onSave: (file: File) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
};

export default function WriterAvatarPhotoSettings({
  sourceUrl,
  onSave,
  onCancel,
  saving = false,
}: Props) {
  const viewport = WRITER_AVATAR_VIEWPORT_PX;
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<WriterAvatarCropState | null>(null);
  const [error, setError] = useState("");
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    baseOffsetX: number;
    baseOffsetY: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError("");
    setImgSize(null);
    setCrop(null);

    const img = new Image();
    const needsCors =
      sourceUrl.startsWith("http://") || sourceUrl.startsWith("https://");
    if (needsCors) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w < 1 || h < 1) {
        setError("Could not read image dimensions.");
        return;
      }
      setImgSize({ w, h });
      setCrop(initialCropState(w, h, viewport, "cover"));
    };
    img.onerror = () => {
      if (!cancelled) {
        setError("Could not load this image for editing. Try uploading the photo again.");
      }
    };
    img.src = sourceUrl;

    return () => {
      cancelled = true;
    };
  }, [sourceUrl, viewport]);

  const updateCrop = useCallback(
    (next: WriterAvatarCropState) => {
      if (!imgSize) return;
      setCrop(clampCropState(next, imgSize.w, imgSize.h, viewport));
    },
    [imgSize, viewport],
  );

  const setFitMode = (fitMode: WriterAvatarFitMode) => {
    if (!imgSize) return;
    updateCrop(initialCropState(imgSize.w, imgSize.h, viewport, fitMode));
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!crop || crop.fitMode !== "cover" || saving) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      baseOffsetX: crop.offsetX,
      baseOffsetY: crop.offsetY,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag?.active || !crop) return;
    updateCrop({
      ...crop,
      offsetX: drag.baseOffsetX + (e.clientX - drag.startX),
      offsetY: drag.baseOffsetY + (e.clientY - drag.startY),
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.active) {
      dragRef.current.active = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const handleSave = async () => {
    if (!crop) return;
    setError("");
    try {
      const file = await exportWriterAvatarCrop(sourceUrl, viewport, crop);
      await onSave(file);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save photo.");
    }
  };

  const minScale = imgSize
    ? crop?.fitMode === "contain"
      ? containScaleForImage(imgSize.w, imgSize.h, viewport) * 0.5
      : coverScaleForImage(imgSize.w, imgSize.h, viewport)
    : 1;
  const maxScale = imgSize
    ? crop?.fitMode === "contain"
      ? containScaleForImage(imgSize.w, imgSize.h, viewport) * 3
      : coverScaleForImage(imgSize.w, imgSize.h, viewport) * 4
    : 4;

  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-[#FAFAF8] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Photo settings</h4>
          <p className="mt-0.5 text-xs text-gray-500">
            Crop, zoom, and fit your writer photo. It saves as a square for the published byline.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center gap-4 lg:flex-row lg:items-start">
        <div
          className={`relative shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-inner ${
            crop?.fitMode === "cover" && !saving ? "cursor-grab active:cursor-grabbing" : ""
          }`}
          style={{ width: viewport, height: viewport }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {crop && imgSize ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sourceUrl}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                width: imgSize.w * crop.scale,
                height: imgSize.h * crop.scale,
                left: crop.offsetX,
                top: crop.offsetY,
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
              Loading…
            </div>
          )}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-inset ring-[#1FAF9E]/35"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]"
            aria-hidden
          />
        </div>

        <div className="w-full min-w-0 flex-1 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Fit</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ["cover", "Fill frame"],
                  ["contain", "Fit entire image"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  disabled={!crop || saving}
                  onClick={() => setFitMode(mode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    crop?.fitMode === mode
                      ? "bg-[#124541] text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  } disabled:opacity-50`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="writer-avatar-zoom"
              className="text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Zoom
            </label>
            <input
              id="writer-avatar-zoom"
              type="range"
              min={minScale}
              max={maxScale}
              step={0.01}
              disabled={!crop || saving}
              value={crop?.scale ?? minScale}
              onChange={(e) => {
                if (!crop) return;
                updateCrop({ ...crop, scale: Number(e.target.value) });
              }}
              className="mt-2 w-full accent-[#1FAF9E]"
            />
          </div>

          {crop?.fitMode === "cover" ? (
            <p className="text-xs text-gray-500">Drag the image to reposition the crop.</p>
          ) : (
            <p className="text-xs text-gray-500">
              Fit mode keeps the full image inside the frame with padding.
            </p>
          )}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!crop || saving}
              className="rounded-lg bg-[#1FAF9E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save photo"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
