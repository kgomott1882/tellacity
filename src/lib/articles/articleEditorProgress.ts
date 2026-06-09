import type { ArticleContentDoc } from "./types";
import { countWordsFromDoc } from "./editorStats";

export const EDITOR_PROGRESS_STORAGE_KEY = "tellacity_article_editor_progress";

export const EDITOR_STEP_COUNT = 5;

type ProgressEntry = {
  step: number;
  maxStepReached: number;
  savedAt: string;
};

type ProgressStore = Record<string, ProgressEntry>;

function clampStep(step: number): number {
  return Math.min(EDITOR_STEP_COUNT - 1, Math.max(0, Math.round(step)));
}

export function loadEditorProgress(
  articleId: string,
): { step: number; maxStepReached: number } | null {
  if (typeof window === "undefined" || !articleId) return null;
  try {
    const raw = localStorage.getItem(EDITOR_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProgressStore;
    const entry = parsed[articleId];
    if (!entry) return null;
    const step = clampStep(entry.step);
    const maxStepReached = clampStep(Math.max(entry.maxStepReached ?? step, step));
    return { step, maxStepReached };
  } catch {
    return null;
  }
}

export function saveEditorProgress(
  articleId: string,
  step: number,
  maxStepReached: number,
): void {
  if (typeof window === "undefined" || !articleId) return;
  try {
    const raw = localStorage.getItem(EDITOR_PROGRESS_STORAGE_KEY);
    const parsed = (raw ? JSON.parse(raw) : {}) as ProgressStore;
    parsed[articleId] = {
      step: clampStep(step),
      maxStepReached: clampStep(maxStepReached),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(EDITOR_PROGRESS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearEditorProgress(articleId: string): void {
  if (typeof window === "undefined" || !articleId) return;
  try {
    const raw = localStorage.getItem(EDITOR_PROGRESS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as ProgressStore;
    delete parsed[articleId];
    localStorage.setItem(EDITOR_PROGRESS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

export function editorStepLabel(step: number): string {
  const labels = ["Setup", "Title", "Featured image", "Content", "Submit"];
  return labels[clampStep(step)] ?? "Content";
}

/** Fallback when no browser progress exists — infer from saved article fields. */
export function inferEditorResumeStep(input: {
  title?: string;
  featuredImageUrl?: string | null;
  content?: ArticleContentDoc;
}): number {
  const doc = input.content;
  const wordCount = doc ? countWordsFromDoc(doc) : 0;
  const hasInlineImage = Boolean(
    doc?.content?.some((n) => n.type === "image" && n.attrs?.src),
  );
  const hasBody = wordCount > 0 || hasInlineImage;

  if (hasBody) return 3;
  if (input.featuredImageUrl) return 2;
  if ((input.title ?? "").trim()) return 1;
  return 0;
}

export function resolveEditorResumeStep(
  articleId: string,
  input: {
    title?: string;
    featuredImageUrl?: string | null;
    content?: ArticleContentDoc;
  },
): { step: number; maxStepReached: number } {
  const stored = loadEditorProgress(articleId);
  const inferred = inferEditorResumeStep(input);
  const step = stored?.step ?? inferred;
  const maxStepReached = Math.max(stored?.maxStepReached ?? step, inferred, step);
  return { step, maxStepReached };
}
