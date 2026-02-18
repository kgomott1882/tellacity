"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { normalizeLogoUrl } from "@/lib/logo";

type CategoryBusiness = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  trust_score?: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  country_code?: string | null;
  display_location?: string | null;
  location?: string | null;
  address?: string | null;
  review_count?: number | null;
  resolved_logo_url?: string | null;
};

export default function CategoryDetailPage() {
  const params = useParams();
  const slug =
    typeof params.slug === "string"
      ? params.slug
      : Array.isArray(params.slug)
      ? params.slug[0]
      : null;

  const searchParams = useSearchParams();
  const country = searchParams.get("country") ?? "ZA";

  const [businesses, setBusinesses] = useState<CategoryBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const run = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc(
        "get_top_businesses_for_category_global",
        {
          p_category_slug: slug,
          p_country_code: country,
          p_limit: 20,
          p_offset: 0,
          p_min_rating: null,
        }
      );

      if (error) {
        setError(error.message);
        setBusinesses([]);
      } else {
        setBusinesses(data ?? []);
      }

      setIsLoading(false);
    };

    run();
  }, [slug, country]);

  useEffect(() => {
    if (!slug) return;

    const fetchCategoryAndGroup = async () => {
      const { data: category } = await supabase
        .from("categories")
        .select("name, group_slug")
        .eq("slug", slug)
        .single();

      if (!category) return;

      setCategoryName((category as { name?: string }).name ?? null);

      const groupSlug = (category as { group_slug?: string | null }).group_slug;
      if (!groupSlug) {
        setGroupName(null);
        return;
      }

      const { data: group } = await supabase
        .from("category_groups")
        .select("name")
        .eq("group_slug", groupSlug)
        .single();

      setGroupName((group as { name?: string } | null)?.name ?? null);
    };

    fetchCategoryAndGroup();
  }, [slug]);

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-6">
        <nav className="mb-2 text-xs text-gray-500">
          <span>Categories</span>
          {groupName && (
            <>
              <span className="mx-1">›</span>
              <span>{groupName}</span>
            </>
          )}
          {categoryName && (
            <>
              <span className="mx-1">›</span>
              <span>{categoryName}</span>
            </>
          )}
        </nav>
        <h1 className="text-3xl font-semibold">
          {categoryName ? `Best in ${categoryName}` : slug?.replace(/-/g, " ")}
        </h1>
      </header>

      {isLoading && <p className="text-gray-500">Loading businesses...</p>}

      {!isLoading && error && (
        <p className="text-red-600">Failed to load businesses.</p>
      )}

      {!isLoading && !error && businesses.length === 0 && (
        <p className="text-gray-500">No businesses found.</p>
      )}

      {!isLoading && !error && businesses.length > 0 && (
        <div className="space-y-4">
          {businesses.map((b) => {
            const website =
              typeof b.website === "string"
                ? b.website.replace(/^https?:\/\//, "").replace(/^www\./, "")
                : "";
            const trustScore =
              typeof b.trust_score === "number" ? b.trust_score : null;
            const averageRating =
              typeof b.average_rating === "number"
                ? b.average_rating
                : typeof b.avg_rating === "number"
                ? b.avg_rating
                : null;
            const ratingValue =
              trustScore != null && trustScore > 0
                ? trustScore
                : averageRating != null && averageRating > 0
                ? averageRating
                : 0;
            const countryName =
              b.country_code === "US"
                ? "United States"
                : b.country_code === "GB"
                ? "United Kingdom"
                : b.country_code === "ZA"
                ? "South Africa"
                : b.country_code || "";
            const location =
              b.display_location || b.location || b.address || countryName;

            return (
              <Link
                key={b.id}
                href={`/b/${b.slug}`}
                className="flex items-center justify-between gap-6 border p-4 rounded-lg"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={normalizeLogoUrl(b.resolved_logo_url) ?? undefined}
                    alt={b.name}
                    className="h-10 w-10 object-contain"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{b.name}</div>
                    {website && (
                      <div className="text-sm text-gray-500 truncate">
                        {website}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 shrink-0">
                  <div className="flex items-center gap-1 text-[#1FAF9E]">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const filled = index < Math.round(ratingValue);
                      return (
                        <span
                          key={`${b.id}-star-${index}`}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-sm text-xs ${
                            filled
                              ? "bg-[#1FAF9E] text-white"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          ★
                        </span>
                      );
                    })}
                  </div>
                  <span className="font-medium text-[#0E0E0E]">
                    {ratingValue.toFixed(1)}
                  </span>
                  <span className="text-gray-500">
                    ({(b.review_count ?? 0).toLocaleString()})
                  </span>
                </div>

                <div className="text-sm text-gray-500 text-right min-w-[120px]">
                  {location}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
