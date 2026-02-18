"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { normalizeLogoUrl } from "@/lib/logo";

type CategoryBusiness = {
  id: string;
  name: string;
  slug: string;
  website: string;
  trust_score: number | null;
  average_rating?: number | null;
  avg_rating?: number | null;
  review_count: number | null;
  category_slug: string;
  country_code: string;
  resolved_logo_url: string;
};

export default function CategoryDetailPage() {
  const params = useParams();

  // 🔒 CRITICAL: normalize slug to a string (App Router fix)
  const slug =
    typeof params.slug === "string"
      ? params.slug
      : Array.isArray(params.slug)
      ? params.slug[0]
      : null;

  const [businesses, setBusinesses] = useState<CategoryBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchBusinesses = async () => {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc(
        "get_top_businesses_for_category_global",
        {
          category_slug: slug,
          country_code: null,
          min_rating: null,
          limit: 20,
          offset: 0,
        }
      );

      if (error) {
        console.error("RPC error:", error);
        setError("Failed to load businesses.");
        setBusinesses([]);
      } else {
        setBusinesses(data ?? []);
      }

      setLoading(false);
    };

    fetchBusinesses();
  }, [slug]);

  // 🚨 Hard stop if slug is missing
  if (!slug) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm text-red-600">
          Invalid category slug.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm text-gray-500">Loading businesses…</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold capitalize">
          {slug.replace(/-/g, " ")}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Businesses listed under this category
        </p>
      </header>

      {error && (
        <p className="mb-6 text-sm text-red-600">{error}</p>
      )}

      {businesses.length === 0 && !error && (
        <p className="text-sm text-gray-500">
          No businesses found for this category.
        </p>
      )}

      <div className="space-y-4">
        {businesses.map((b) => {
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
          const reviewCount = Number(b.review_count ?? 0);

          return (
          <Link
            key={b.id}
            href={`/b/${b.slug}`}
            className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50"
          >
            <img
              src={normalizeLogoUrl(b.resolved_logo_url) ?? undefined}
              alt={b.name}
              className="h-10 w-10 rounded object-contain"
            />

            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {b.name}
              </div>
              <div className="text-sm text-gray-500">
                {reviewCount.toLocaleString()} reviews · {ratingValue.toFixed(1)} ★
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {b.country_code}
            </div>
          </Link>
          );
        })}
      </div>
    </main>
  );
}
