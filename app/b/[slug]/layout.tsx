import React from "react";

type BusinessLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    slug: string;
  }>;
};

export default function BusinessLayout({
  children,
}: BusinessLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}

