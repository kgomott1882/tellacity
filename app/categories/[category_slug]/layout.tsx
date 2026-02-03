import type { Metadata } from "next";
import React from "react";

export type CategoryLayoutProps = {
  children: React.ReactNode;
  params: { category_slug: string };
};

export async function generateMetadata({
  params,
}: CategoryLayoutProps): Promise<Metadata> {
  const { category_slug } = params;

  return {
    alternates: {
      canonical: `https://tellacity.com/categories/${category_slug}`,
    },
  };
}

export default function CategoryLayout({ children }: CategoryLayoutProps) {
  return children;
}

