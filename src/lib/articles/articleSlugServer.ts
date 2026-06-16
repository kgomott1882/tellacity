import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import { getServerEnv } from "@/lib/serverEnv";
import { isValidArticleSlug, resolveUniqueSlug, slugifyTitle } from "@/lib/articles/slug";

/** Globally unique placeholder slug for new drafts (empty title). */
export function createDraftArticleSlug(): string {
  return `draft-${Date.now()}-${randomBytes(4).toString("hex")}`;
}

/** All article slugs (global unique constraint) via service role — RLS cannot see other businesses' drafts. */
export async function loadTakenArticleSlugs(excludeArticleId?: string): Promise<Set<string>> {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = admin.from("articles").select("slug");
  if (excludeArticleId) {
    query = query.neq("id", excludeArticleId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((row) => String((row as { slug: string }).slug)));
}

export async function allocateArticleSlug(options: {
  title: string;
  excludeArticleId?: string;
}): Promise<string> {
  const title = options.title.trim();
  if (!title) {
    return createDraftArticleSlug();
  }

  const taken = await loadTakenArticleSlugs(options.excludeArticleId);
  const base = slugifyTitle(title);
  if (isValidArticleSlug(base)) {
    return resolveUniqueSlug(title, taken);
  }
  return resolveUniqueSlug("article", taken);
}
