import { compressImage } from "@/lib/imageCompression";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { dashboardApiPost } from "@/lib/dashboardApiFetch";

const UPLOAD_BUCKET = "article_media";

/** Upload a file to article_media and register it in article_images. Returns public URL. */
export async function uploadArticleFeaturedImageFile(
  businessId: string,
  articleId: string,
  file: File,
): Promise<string> {
  const sb = supabaseBrowser();
  const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.85 });
  const ext = compressed.type.includes("webp") ? "webp" : "jpg";
  const path = `${businessId}/featured/${articleId}-${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from(UPLOAD_BUCKET).upload(path, compressed, {
    upsert: false,
    contentType: compressed.type,
  });
  if (upErr) throw new Error(upErr.message);

  const { data } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;

  try {
    await dashboardApiPost(
      `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}/images`,
      {
        url,
        storagePath: path,
        kind: "featured",
      },
    );
  } catch {
    // Storage upload succeeded; article_images registration is bookkeeping only.
  }

  return url;
}

/** Upload a square writer avatar to article_media. Returns public URL. */
export async function uploadArticleWriterAvatarFile(
  businessId: string,
  articleId: string,
  file: File,
): Promise<string> {
  const sb = supabaseBrowser();
  const compressed = await compressImage(file, { maxDimension: 512, quality: 0.88 });
  const ext = compressed.type.includes("webp") ? "webp" : "jpg";
  const path = `${businessId}/author-avatar/${articleId}-${Date.now()}.${ext}`;
  const { error: upErr } = await sb.storage.from(UPLOAD_BUCKET).upload(path, compressed, {
    upsert: false,
    contentType: compressed.type,
  });
  if (upErr) throw new Error(upErr.message);

  const { data } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
