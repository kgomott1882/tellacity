const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function isValidArticleSlug(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length >= 2 && slug.length <= 100;
}

/** Append -2, -3, … until unique against existing slugs. */
export function resolveUniqueSlug(base: string, taken: Set<string>): string {
  const root = slugifyTitle(base) || "article";
  if (!taken.has(root)) return root;
  for (let i = 2; i < 500; i++) {
    const candidate = `${root}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${root}-${Date.now()}`;
}
