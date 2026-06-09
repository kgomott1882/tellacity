import type { ArticleContentType } from "@/lib/articles/types";
import { parseArticleContentType } from "@/lib/articles/types";
import {
  ARTICLE_MEDIA_PUBLIC_MARKER,
  UUID_RE,
  jsonError,
} from "@/lib/articles/businessArticlesRouteShared";

export { ARTICLE_MEDIA_PUBLIC_MARKER, UUID_RE, jsonError };

export function parseContentType(raw: unknown): ArticleContentType | null {
  return parseArticleContentType(raw);
}
