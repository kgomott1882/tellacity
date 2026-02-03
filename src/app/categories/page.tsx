"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Folder } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Category = {
  id: string;
  name: string;
  slug: string;
  group: string | null;
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
            group
          )
        `)
        .order("name");

      const sanitized =
        data?.map((group) => ({
          ...group,
          categories:
            group.categories?.filter((c: any) => c.group === group.slug) ?? [],
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
