import type { ArticleContentDoc, TipTapNode } from "../types";
import { extractUrlsFromPlainText } from "./urlUtils";

function walkNodes(nodes: TipTapNode[] | undefined, out: string[]) {
  if (!nodes) return;
  for (const node of nodes) {
    if (node.type === "text" && node.marks?.length) {
      let hasLinkMark = false;
      for (const mark of node.marks) {
        if (mark.type === "link" && typeof mark.attrs?.href === "string") {
          out.push(mark.attrs.href);
          hasLinkMark = true;
        }
      }
      // Avoid double-counting when link text is the URL itself.
      if (node.text && !hasLinkMark) {
        out.push(...extractUrlsFromPlainText(node.text));
      }
    } else if (node.type === "text" && node.text) {
      out.push(...extractUrlsFromPlainText(node.text));
    }
    if (node.content) walkNodes(node.content, out);
  }
}

export function extractLinksFromArticle(input: {
  content: ArticleContentDoc;
  caseStudyFields?: {
    clientIndustry?: string | null;
    challenge?: string | null;
    solution?: string | null;
    results?: string | null;
  };
}): string[] {
  const links: string[] = [];
  walkNodes(input.content?.content, links);

  const fields = input.caseStudyFields;
  if (fields) {
    for (const value of [
      fields.clientIndustry,
      fields.challenge,
      fields.solution,
      fields.results,
    ]) {
      links.push(...extractUrlsFromPlainText(value));
    }
  }

  return links.filter(Boolean);
}
