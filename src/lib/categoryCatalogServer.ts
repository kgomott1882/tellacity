import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

export type CategoryCatalogGroup = { name: string; group_slug: string };
export type CategoryCatalogCategory = {
  name: string;
  slug: string;
  group_slug: string;
};

export type CategoryCatalogPayload = {
  groups: CategoryCatalogGroup[];
  categories: CategoryCatalogCategory[];
};

export type CategoryGroupWithCategories = {
  id: string;
  name: string;
  slug: string;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    group_slug: string;
    is_active: boolean;
  }>;
};

async function loadFromDb(
  admin: SupabaseClient,
): Promise<CategoryCatalogPayload | { error: string }> {
  const [{ data: groupsData, error: gErr }, { data: categoriesData, error: cErr }] =
    await Promise.all([
      admin.from("category_groups").select("name, slug").order("name"),
      admin.from("categories").select("name, slug, group_slug").order("name"),
    ]);

  if (gErr || cErr) {
    return { error: gErr?.message ?? cErr?.message ?? "catalog_load_failed" };
  }

  const categories: CategoryCatalogCategory[] = (categoriesData ?? []).map(
    (r: { name: string; slug: string; group_slug: string | null }) => ({
      name: r.name,
      slug: r.slug,
      group_slug: String(r.group_slug ?? "").trim(),
    }),
  );

  const groupSlugsWithCategories = new Set(
    categories.map((c) => c.group_slug.trim().toLowerCase()).filter(Boolean),
  );

  const groups: CategoryCatalogGroup[] = (groupsData ?? [])
    .filter((r: { slug: string | null }) => {
      const s = String(r.slug ?? "").trim().toLowerCase();
      return groupSlugsWithCategories.has(s);
    })
    .map((r: { name: string; slug: string | null }) => ({
      name: r.name,
      group_slug: String(r.slug ?? "").trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { groups, categories };
}

/** Service-role taxonomy load (API routes + server components). */
export async function loadCategoryCatalog(): Promise<
  CategoryCatalogPayload | { error: string }
> {
  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return loadFromDb(admin);
}

export function buildCategoryGroupsFromCatalog(
  payload: CategoryCatalogPayload,
): CategoryGroupWithCategories[] {
  const { groups, categories } = payload;

  return groups.map((group) => ({
    id: group.group_slug,
    name: group.name,
    slug: group.group_slug,
    categories: categories
      .filter((cat) => cat.group_slug === group.group_slug)
      .map((cat) => ({
        id: cat.slug,
        name: cat.name,
        slug: cat.slug,
        group_slug: cat.group_slug,
        is_active: true,
      })),
  }));
}
