import { Suspense } from "react";
import type { Metadata } from "next";
import WriteReviewPageInner from "./WriteReviewPageInner";
import { WRITE_REVIEW_ROBOTS } from "@/lib/businessIndexability";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * SEO contract: review forms canonicalise to `/b/[slug]` and must not be indexed.
 * `robots.txt` also discourages crawling `/write-review` variants.
 */
export async function generateMetadata(
  props: { searchParams: Promise<{ businessSlug?: string }> }
): Promise<Metadata> {
  const { businessSlug } = await props.searchParams;
  const baseRobots = WRITE_REVIEW_ROBOTS;
  const fallback: Metadata = {
    title: "Write a review | Tellacity",
    robots: baseRobots,
    alternates: {
      canonical: "https://tellacity.com/write-review",
    },
  };

  if (!businessSlug) return fallback;

  const slug = businessSlug.trim().toLowerCase();
  if (!slug) return fallback;

  const supabase = createClient();

  const { data: row } = await supabase
    .from("businesses")
    .select("name, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!row) return fallback;

  const name = String((row as { name?: string | null }).name ?? "").trim();
  const publicSlug = String((row as { slug?: string | null }).slug ?? slug)
    .trim()
    .toLowerCase();

  return {
    title: name
      ? `Write a review for ${name} | Tellacity`
      : "Write a review | Tellacity",
    description: name
      ? `Share your experience with ${name} on Tellacity. Submit a verified review and help other customers.`
      : "Submit a verified customer review on Tellacity.",
    robots: baseRobots,
    alternates: {
      canonical: `https://tellacity.com/b/${publicSlug}`,
    },
  };
}

export default function WriteReviewPage() {
  return (
    <Suspense fallback={null}>
      <WriteReviewPageInner />
    </Suspense>
  );
}
