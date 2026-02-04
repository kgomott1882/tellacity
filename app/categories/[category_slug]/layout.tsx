import React from "react";

type CategoryLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    category_slug: string;
  }>;
};

export default function CategoryLayout({
  children,
}: CategoryLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}

