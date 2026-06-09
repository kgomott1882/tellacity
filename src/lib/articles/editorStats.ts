import type { ArticleContentDoc, TipTapNode } from "./types";

export function countWordsFromDoc(doc: ArticleContentDoc): number {
  const parts: string[] = [];
  const walk = (nodes?: TipTapNode[]) => {
    if (!nodes) return;
    for (const node of nodes) {
      if (node.type === "text" && node.text) parts.push(node.text);
      if (node.content) walk(node.content);
    }
  };
  walk(doc.content);
  const text = parts.join(" ").trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateReadingMinutes(words: number): number {
  if (words <= 0) return 0;
  return Math.max(1, Math.round(words / 200));
}

export function formatLastSaved(at: Date): string {
  return at.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}
