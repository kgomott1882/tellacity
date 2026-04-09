"use client";

import { useEffect, useState } from "react";

export type CategoryGroupOption = { name: string; group_slug: string };
export type CategoryOption = { name: string; slug: string; group_slug: string };

/** Match categories to the selected primary group (same logic as /suggest-business). */
export function filterCategoriesByPrimaryGroup(
  categories: CategoryOption[],
  primaryGroupSlug: string
): CategoryOption[] {
  const g = primaryGroupSlug.trim().toLowerCase();
  if (!g) return [];
  return categories.filter(
    (c) => (c.group_slug ?? "").trim().toLowerCase() === g
  );
}

/**
 * Loads category_groups + categories via GET /api/business/category-catalog
 * (server reads with service role , same dataset as suggest-business, reliable for logged-in users).
 */
export function useCategoryGroupCatalog(enabled: boolean) {
  const [groups, setGroups] = useState<CategoryGroupOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setGroups([]);
      setCategories([]);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch("/api/business/category-catalog", {
          method: "GET",
          credentials: "same-origin",
        });
        const json = (await res.json().catch(() => ({}))) as {
          groups?: CategoryGroupOption[];
          categories?: CategoryOption[];
          error?: string;
        };

        if (!mounted) return;

        if (!res.ok) {
          setGroups([]);
          setCategories([]);
          setLoadError(json.error || "Could not load categories.");
          setLoading(false);
          return;
        }

        setGroups(Array.isArray(json.groups) ? json.groups : []);
        setCategories(Array.isArray(json.categories) ? json.categories : []);
      } catch {
        if (!mounted) return;
        setGroups([]);
        setCategories([]);
        setLoadError("Could not load categories.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  return { groups, categories, loading, loadError };
}
