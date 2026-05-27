import type { Metadata } from "next";
import { Suspense } from "react";
import CategoriesClient from "./CategoriesClient";
import {
  buildCategoriesJsonLd,
  buildCategoriesMetadata,
} from "@/lib/categoriesPageContent";

type PageProps = {
  searchParams: Promise<{ country?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  return buildCategoriesMetadata(sp.country);
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const jsonLd = buildCategoriesJsonLd(sp.country);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={null}>
        <CategoriesClient countryParam={sp.country} />
      </Suspense>
    </>
  );
}
