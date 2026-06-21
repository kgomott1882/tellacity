import { generateJSON, generateHTML } from "@tiptap/html";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { emptyArticleDoc, sanitizeArticleContent } from "@/lib/articles/sanitize";
import { getArticleEditorExtensionsServer } from "@/lib/articles/articleEditorExtensionsServer";
import { isTellacityInternalLink } from "@/lib/articles/linkValidation/urlUtils";

const extensions = getArticleEditorExtensionsServer();

const ANCHOR_TAG_RE = /<a\b[^>]*>/gi;
const HREF_ATTR_RE = /\bhref\s*=\s*(["'])(.*?)\1/i;
const REL_ATTR_RE = /\brel\s*=\s*(["'])(.*?)\1/i;

/** External links get nofollow; internal Tellacity links stay follow. */
export function applyTellacityArticleAnchorRelPolicy(html: string): string {
  if (!html.trim()) return html;
  return html.replace(ANCHOR_TAG_RE, (anchorTag) => {
    const hrefMatch = anchorTag.match(HREF_ATTR_RE);
    if (!hrefMatch) return anchorTag;
    const hrefValue = hrefMatch[2]?.trim() ?? "";
    const relValue = isTellacityInternalLink(hrefValue)
      ? "noopener noreferrer"
      : "noopener noreferrer nofollow";

    if (REL_ATTR_RE.test(anchorTag)) {
      return anchorTag.replace(REL_ATTR_RE, `rel="${relValue}"`);
    }
    return anchorTag.replace(/>$/, ` rel="${relValue}">`);
  });
}

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
    const html = generateHTML(safe, extensions);
    return applyTellacityArticleAnchorRelPolicy(html);
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
