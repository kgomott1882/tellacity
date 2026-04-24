/**
 * Client-side image compression for profile photo uploads.
 *
 * Resizes long-edge to `maxDimension` (default 1600px) preserving aspect
 * ratio, then re-encodes as JPEG at `quality` (default 0.82). PNGs that
 * contain transparency stay as PNG (re-encoded at the target dimensions)
 * so logos with alpha channels are preserved.
 *
 * Returns a plain `File` so the existing `.upload()` / `FormData` path
 * is unchanged. Falls back to the original file on any decode / encode
 * failure so uploads never break due to compression.
 */

export type CompressImageOptions = {
  maxDimension?: number;
  quality?: number;
  /** If the compressed output is larger than the original, return the original. */
  preferSmaller?: boolean;
};

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), type, quality);
  });
}

async function hasAlpha(img: HTMLImageElement): Promise<boolean> {
  const sampleSize = Math.min(64, img.naturalWidth, img.naturalHeight);
  if (sampleSize <= 0) return false;
  const c = document.createElement("canvas");
  c.width = sampleSize;
  c.height = sampleSize;
  const ctx = c.getContext("2d");
  if (!ctx) return false;
  ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
  try {
    const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true;
    }
  } catch {
    // Tainted canvas — assume no alpha rather than throwing.
    return false;
  }
  return false;
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (typeof document === "undefined") return file;

  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_QUALITY,
    preferSmaller = true,
  } = options;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return file;

    const scale = Math.min(1, maxDimension / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    // Skip work entirely if the file is already tiny and we don't need to re-encode.
    if (scale === 1 && file.size <= 300 * 1024) return file;

    const keepPng = file.type === "image/png" && (await hasAlpha(img));
    const outType = keepPng ? "image/png" : "image/jpeg";

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    if (!keepPng) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const blob = await canvasToBlob(canvas, outType, quality);
    if (!blob) return file;
    if (preferSmaller && blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const ext = outType === "image/png" ? "png" : "jpg";
    return new File([blob], `${baseName}.${ext}`, {
      type: outType,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
