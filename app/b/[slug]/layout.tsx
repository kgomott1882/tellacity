import type { Metadata } from "next";
import React from "react";

export type BusinessLayoutProps = {
  children: React.ReactNode;
  params: { slug: string };
};

export async function generateMetadata({
  params,
}: BusinessLayoutProps): Promise<Metadata> {
  const { slug } = params;

  return {
    alternates: {
      canonical: `https://tellacity.com/b/${slug}`,
    },
  };
}

export default function BusinessLayout({ children }: BusinessLayoutProps) {
  return children;
}

