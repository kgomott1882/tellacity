import type { ArticleContentDoc, TipTapNode } from "./types";
import { countWordsFromDoc } from "./editorStats";

export const PREVIEW_HINT_SEEN_KEY = "tellacity_article_preview_hint_seen";

type PreviewHintStore = Record<string, true>;

function paragraphText(node: TipTapNode): string {
  const parts: string[] = [];
  const walk = (nodes?: TipTapNode[]) => {
    if (!nodes) return;
    for (const child of nodes) {
      if (child.type === "text" && child.text) parts.push(child.text);
      if (child.content) walk(child.content);
    }
  };
  walk(node.content);
  return parts.join(" ").trim();
}

/** True when the draft has more than a single short paragraph of body content. */
export function hasMoreThanParagraphContent(doc: ArticleContentDoc): boolean {
  const paragraphs = (doc.content ?? []).filter((n) => n.type === "paragraph");
  const nonEmpty = paragraphs.filter((p) => paragraphText(p).length > 0);
  if (nonEmpty.length >= 2) return true;
  return countWordsFromDoc(doc) > 55;
}

function readStore(): PreviewHintStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PREVIEW_HINT_SEEN_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as PreviewHintStore;
  } catch {
    return {};
  }
}

function writeStore(store: PreviewHintStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREVIEW_HINT_SEEN_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function hasSeenArticlePreviewHint(articleId: string): boolean {
  if (!articleId) return false;
  return Boolean(readStore()[articleId]);
}

export function markArticlePreviewHintSeen(articleId: string): void {
  if (!articleId) return;
  const store = readStore();
  store[articleId] = true;
  writeStore(store);
}
