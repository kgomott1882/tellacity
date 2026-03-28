"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Folder } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Category = {
  id: string;
  name: string;
  slug: string;
  group_slug: string | null;
};

type CategoryGroup = {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
};

export default function CategoriesPage() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("category_groups")
        .select(`
          id,
          name,
          slug,
          categories (
            id,
            name,
            slug,
            group_slug
          )
        `)
        .order("name");

      const sanitized =
        data?.map((group) => ({
          ...group,
          categories:
            group.categories?.filter(
              (c: Category & { group?: string | null }) =>
                String(c.group_slug ?? c.group ?? "")
                  .trim()
                  .toLowerCase() === String(group.slug ?? "").trim().toLowerCase()
            ) ?? [],
        })) ?? [];

      setGroups(sanitized.filter((g) => g.categories.length > 0));
      setIsLoading(false);
    };

    fetchGroups();
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-3xl font-semibold mb-8">Explore Categories</h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {!isLoading &&
          groups.map((group) => (
            <div key={group.id} className="border rounded-lg p-4">
              <h2 className="font-medium mb-3">{group.name}</h2>
              <ul className="space-y-2">
                {group.categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/categories/${cat.slug}`}
                      className="flex justify-between text-sm"
                    >
                      {cat.name}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </main>
  );
}
