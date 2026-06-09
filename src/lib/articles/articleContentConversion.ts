import { generateJSON, generateHTML } from "@tiptap/html";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { emptyArticleDoc, sanitizeArticleContent } from "@/lib/articles/sanitize";
import { getArticleEditorExtensionsServer } from "@/lib/articles/articleEditorExtensionsServer";

const extensions = getArticleEditorExtensionsServer();

export function htmlToArticleDoc(html: string): ArticleContentDoc {
  const trimmed = html.trim();
  if (!trimmed) return emptyArticleDoc();
  try {
    const doc = generateJSON(trimmed, extensions) as ArticleContentDoc;
    return sanitizeArticleContent(doc);
  } catch {
    return emptyArticleDoc();
  }
}

export function articleDocToHtml(doc: ArticleContentDoc): string {
  try {
    const safe = sanitizeArticleContent(doc);
    return generateHTML(safe, extensions);
  } catch {
    return "";
  }
}

export function resolvePlatformArticleContent(
  content: ArticleContentDoc | null | undefined,
  bodyHtml: string | null | undefined,
): ArticleContentDoc {
  const sanitized = content ? sanitizeArticleContent(content) : emptyArticleDoc();
  const hasNodes = (sanitized.content?.length ?? 0) > 0;
  if (hasNodes) return sanitized;
  if (bodyHtml?.trim()) return htmlToArticleDoc(bodyHtml);
  return emptyArticleDoc();
}
