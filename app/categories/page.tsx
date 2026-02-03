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
  const [dataCount, setDataCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      const { data, error } = await supabase
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
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        setGroups([]);
        setDataCount(0);
      } else {
        const sanitized = (data ?? [])
          .map((group) => {
            const filteredCategories = (group.categories ?? [])
              .filter((category) => category.group === group.slug)
              .map((category) => ({
              id: category.id,
              name: category.name,
              slug: category.slug,
                group: category.group,
          }))
              .sort((a, b) => a.name.localeCompare(b.name));

            return {
              id: group.id,
              name: group.name,
              slug: group.slug,
              categories: filteredCategories,
            };
          })
          .filter((group) => group.categories.length > 0)
          .sort((a, b) => a.name.localeCompare(b.name));

        setGroups(sanitized);
        setDataCount(sanitized.length);
      }

      setIsLoading(false);
    };

    fetchGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">Explore Categories</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Find the perfect company for your needs. Browse our comprehensive list
            of verified businesses across all industries.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`category-group-skeleton-${index}`}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="h-4 w-32 rounded bg-gray-100" />
                <div className="mt-4 space-y-3">
                  <div className="h-3 w-40 rounded bg-gray-100" />
                  <div className="h-3 w-36 rounded bg-gray-100" />
                  <div className="h-3 w-28 rounded bg-gray-100" />
                </div>
              </div>
            ))}

          {!isLoading && dataCount === 0 && (
            <div className="text-sm text-gray-500">
              <p>No categories available yet.</p>
              <Link
                href="/search"
                className="mt-3 inline-flex rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
              >
                Search businesses
              </Link>
            </div>
          )}

          {!isLoading &&
            groups.map((group) => (
              <div
                key={group.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0E0E0E]">
                      <Folder className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-[#0E0E0E]">
                  {group.name}
                </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        {group.categories.length} categories
                      </p>
                    </div>
                  </div>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  {group.categories.slice(0, 8).map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/categories/${category.slug}`}
                        className="flex items-center justify-between gap-3 text-gray-600 hover:text-[#16A34A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 border-t border-gray-100 pt-4 text-right">
                  <Link
                    href={`/categories/${group.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#16A34A] hover:text-[#15803D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                  >
                    View Businesses
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}

