import { adminApiPost } from "@/lib/admin/platformArticleApi";

/** Reused across Strict Mode remounts and double-clicks so only one draft is created. */
let createDraftPromise: Promise<string> | null = null;

export function createPlatformArticleDraft(): Promise<string> {
  if (createDraftPromise) return createDraftPromise;

  createDraftPromise = adminApiPost<{ article?: { id: string } }>(
    "/api/admin/platform-articles",
    { title: "", contentType: "article" },
  ).then((res) => {
    const id = res?.article?.id;
    if (!id) throw new Error("Create failed");
    return id;
  });

  createDraftPromise = createDraftPromise.catch((err) => {
    createDraftPromise = null;
    throw err;
  });

  return createDraftPromise;
}
