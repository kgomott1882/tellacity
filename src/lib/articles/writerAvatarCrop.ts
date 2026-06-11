export type WriterAvatarFitMode = "cover" | "contain";

export type WriterAvatarCropState = {
  scale: number;
  offsetX: number;
  offsetY: number;
  fitMode: WriterAvatarFitMode;
};

export const WRITER_AVATAR_VIEWPORT_PX = 280;
export const WRITER_AVATAR_OUTPUT_PX = 512;

function loadImageElement(src: string, useCors: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (useCors) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

/** Load remote or local sources into a blob URL safe for canvas export. */
export async function resolveImageSourceForEditing(
  source: string | File,
): Promise<{ url: string; revokeWhenDone: boolean }> {
  if (source instanceof File) {
    return { url: URL.createObjectURL(source), revokeWhenDone: true };
  }

  const trimmed = source.trim();
  if (!trimmed) {
    throw new Error("No image source");
  }

  if (trimmed.startsWith("blob:") || trimmed.startsWith("data:")) {
    return { url: trimmed, revokeWhenDone: false };
  }

  try {
    const res = await fetch(trimmed, { cache: "no-store" });
    if (res.ok) {
      const blob = await res.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("Not an image");
      }
      return { url: URL.createObjectURL(blob), revokeWhenDone: true };
    }
  } catch {
    /* try direct image load below */
  }

  await loadImageElement(trimmed, true);
  return { url: trimmed, revokeWhenDone: false };
}

export function coverScaleForImage(
  imgW: number,
  imgH: number,
  viewport: number,
): number {
  if (imgW <= 0 || imgH <= 0) return 1;
  return Math.max(viewport / imgW, viewport / imgH);
}

export function containScaleForImage(
  imgW: number,
  imgH: number,
  viewport: number,
): number {
  if (imgW <= 0 || imgH <= 0) return 1;
  return Math.min(viewport / imgW, viewport / imgH);
}

export function initialCropState(
  imgW: number,
  imgH: number,
  viewport: number,
  fitMode: WriterAvatarFitMode = "cover",
): WriterAvatarCropState {
  const scale =
    fitMode === "contain"
      ? containScaleForImage(imgW, imgH, viewport)
      : coverScaleForImage(imgW, imgH, viewport);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  return {
    scale,
    offsetX: (viewport - drawW) / 2,
    offsetY: (viewport - drawH) / 2,
    fitMode,
  };
}

export function clampCropState(
  state: WriterAvatarCropState,
  imgW: number,
  imgH: number,
  viewport: number,
): WriterAvatarCropState {
  const minScale =
    state.fitMode === "contain"
      ? containScaleForImage(imgW, imgH, viewport) * 0.5
      : coverScaleForImage(imgW, imgH, viewport);
  const maxScale =
    state.fitMode === "contain"
      ? containScaleForImage(imgW, imgH, viewport) * 3
      : coverScaleForImage(imgW, imgH, viewport) * 4;

  const scale = Math.min(maxScale, Math.max(minScale, state.scale));
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  let offsetX = state.offsetX;
  let offsetY = state.offsetY;

  if (state.fitMode === "cover") {
    const maxX = 0;
    const minX = viewport - drawW;
    const maxY = 0;
    const minY = viewport - drawH;
    offsetX = Math.min(maxX, Math.max(minX, offsetX));
    offsetY = Math.min(maxY, Math.max(minY, offsetY));
  } else {
    offsetX = (viewport - drawW) / 2;
    offsetY = (viewport - drawH) / 2;
  }

  return { ...state, scale, offsetX, offsetY };
}

export async function exportWriterAvatarCrop(
  imageSrc: string,
  viewport: number,
  state: WriterAvatarCropState,
  outputSize = WRITER_AVATAR_OUTPUT_PX,
): Promise<File> {
  const useCors = !imageSrc.startsWith("blob:") && !imageSrc.startsWith("data:");
  const img = await loadImageElement(imageSrc, useCors);
  const drawW = img.naturalWidth * state.scale;
  const drawH = img.naturalHeight * state.scale;

  const viewportCanvas = document.createElement("canvas");
  viewportCanvas.width = viewport;
  viewportCanvas.height = viewport;
  const vctx = viewportCanvas.getContext("2d");
  if (!vctx) throw new Error("Canvas not supported");

  if (state.fitMode === "contain") {
    vctx.fillStyle = "#ffffff";
    vctx.fillRect(0, 0, viewport, viewport);
  }

  vctx.drawImage(img, state.offsetX, state.offsetY, drawW, drawH);

  const out = document.createElement("canvas");
  out.width = outputSize;
  out.height = outputSize;
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas not supported");
  octx.drawImage(viewportCanvas, 0, 0, viewport, viewport, 0, 0, outputSize, outputSize);

  const blob = await new Promise<Blob | null>((resolve) => {
    out.toBlob((b) => resolve(b), "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("Could not export image");

  return new File([blob], "writer-avatar.jpg", { type: "image/jpeg" });
}
