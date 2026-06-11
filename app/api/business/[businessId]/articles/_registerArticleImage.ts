import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { requireArticleWriteAccess } from "@/lib/articles/access";
import { ARTICLE_MEDIA_PUBLIC_MARKER, UUID_RE } from "./_shared";

export function parseArticleImageKind(raw: unknown): "featured" | "inline" {
  return String(raw ?? "").trim().toLowerCase() === "featured" ? "featured" : "inline";
}

function createServiceRoleClient(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function resolveArticleOwnerBusinessId(
  articleId: string,
): Promise<{ ownerBusinessId: string | null; error: string | null }> {
  if (!UUID_RE.test(articleId)) {
    return { ownerBusinessId: null, error: "Invalid id" };
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("articles")
    .select("id, business_id")
    .eq("id", articleId)
    .maybeSingle();

  if (error) {
    return { ownerBusinessId: null, error: error.message };
  }
  if (!data?.business_id) {
    return { ownerBusinessId: null, error: "Article not found" };
  }

  return { ownerBusinessId: String(data.business_id), error: null };
}

export async function registerArticleImage(
  db: SupabaseClient,
  userId: string,
  input: {
    articleId: string;
    url: string;
    storagePath: string;
    kind: "featured" | "inline";
  },
): Promise<{ data: Record<string, unknown> | null; error: string | null }> {
  const { articleId, url, storagePath, kind } = input;

  if (!UUID_RE.test(articleId)) {
    return { data: null, error: "Invalid id" };
  }
  if (!url || !url.includes(ARTICLE_MEDIA_PUBLIC_MARKER)) {
    return { data: null, error: "Invalid image URL" };
  }
  if (!storagePath) {
    return { data: null, error: "storagePath is required" };
  }

  const { ownerBusinessId, error: resolveErr } = await resolveArticleOwnerBusinessId(articleId);
  if (resolveErr || !ownerBusinessId) {
    return { data: null, error: resolveErr ?? "Article not found" };
  }

  const write = await requireArticleWriteAccess(db, userId, ownerBusinessId);
  if (!write.ok) {
    return { data: null, error: write.message };
  }

  const { data, error } = await db
    .from("article_images")
    .insert({
      business_id: ownerBusinessId,
      article_id: articleId,
      storage_path: storagePath,
      public_url: url,
      kind,
    })
    .select("id, public_url, kind, article_id")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Record<string, unknown>, error: null };
}
