import type { ArticleContentDoc } from "./types";
import { countWordsFromDoc } from "./editorStats";

import type { ArticleContentType } from "./types";

export const EDITOR_GUIDE_DISMISSED_KEY = "tellacity_article_editor_guide_dismissed";
export const EDITOR_GUIDE_COLLAPSED_KEY = "tellacity_article_editor_guide_collapsed";

type DismissedStore = Record<string, true>;
type CollapsedStore = Record<string, boolean>;

function readDismissedStore(): DismissedStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EDITOR_GUIDE_DISMISSED_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as DismissedStore;
  } catch {
    return {};
  }
}

function writeDismissedStore(store: DismissedStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EDITOR_GUIDE_DISMISSED_KEY, JSON.stringify(store));
  } catch {
    /* ignore quota / private mode */
  }
}

export function isEditorGuideDismissed(articleId: string): boolean {
  if (!articleId) return false;
  return Boolean(readDismissedStore()[articleId]);
}

export function dismissEditorGuide(articleId: string): void {
  if (!articleId) return;
  const store = readDismissedStore();
  store[articleId] = true;
  writeDismissedStore(store);
}

function readCollapsedStore(): CollapsedStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(EDITOR_GUIDE_COLLAPSED_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CollapsedStore;
  } catch {
    return {};
  }
}

function writeCollapsedStore(store: CollapsedStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(EDITOR_GUIDE_COLLAPSED_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function isEditorGuideCollapsed(articleId: string): boolean {
  if (!articleId) return true;
  const stored = readCollapsedStore()[articleId];
  return stored !== false;
}

export function setEditorGuideCollapsed(articleId: string, collapsed: boolean): void {
  if (!articleId) return;
  const store = readCollapsedStore();
  store[articleId] = collapsed;
  writeCollapsedStore(store);
}

export function isUntouchedNewDraft(input: {
  status: string;
  title: string;
  featuredImageUrl: string | null;
  content: ArticleContentDoc;
  authorName?: string;
  clientIndustry?: string;
  challenge?: string;
  solution?: string;
  results?: string;
}): boolean {
  if (input.status !== "draft") return false;

  const doc = input.content;
  const wordCount = doc ? countWordsFromDoc(doc) : 0;
  const hasInlineImage = Boolean(
    doc?.content?.some((n) => n.type === "image" && n.attrs?.src),
  );

  const hasCaseStudyFields = Boolean(
    input.clientIndustry?.trim() ||
      input.challenge?.trim() ||
      input.solution?.trim() ||
      input.results?.trim(),
  );

  return (
    !input.title.trim() &&
    !input.featuredImageUrl &&
    wordCount === 0 &&
    !hasInlineImage &&
    !input.authorName?.trim() &&
    !hasCaseStudyFields
  );
}

export function shouldShowEditorGuide(input: {
  articleId: string;
  status: string;
  contentType: ArticleContentType;
  fromCreate: boolean;
  title: string;
  featuredImageUrl: string | null;
  content: ArticleContentDoc;
  authorName?: string;
  clientIndustry?: string;
  challenge?: string;
  solution?: string;
  results?: string;
}): boolean {
  if (!input.articleId || input.status !== "draft") return false;
  if (isEditorGuideDismissed(input.articleId)) return false;
  if (input.fromCreate) return true;
  return isUntouchedNewDraft(input);
}
