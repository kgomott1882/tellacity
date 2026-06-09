"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CategoryMarqueeItem = {
  id: string;
  slug: string;
  name: string;
};

type CategoryIconMarqueeProps = {
  items: CategoryMarqueeItem[];
  hrefForSlug: (slug: string) => string;
  isSafeSlug: (slug: string) => boolean;
  renderIcon: (name: string) => ReactNode;
};

function CategoryTile({
  category,
  href,
  renderIcon,
}: {
  category: CategoryMarqueeItem;
  href: string;
  renderIcon: (name: string) => ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "home-category-marquee-tile group relative flex w-[5.75rem] shrink-0 flex-col items-center gap-2 rounded-xl px-3 py-3 text-center sm:w-[6.25rem]",
        "touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6] focus-visible:ring-offset-2",
      )}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#0A0A0A] transition-all duration-300 group-hover:scale-110 group-hover:text-[#00B4A6] group-focus-visible:text-[#00B4A6] group-hover:drop-shadow-[0_0_10px_rgba(0,180,166,0.75)] sm:h-11 sm:w-11">
        {renderIcon(category.name)}
      </span>
      <span className="relative max-w-[6.5rem] whitespace-normal text-[11px] font-medium leading-snug text-[#0A0A0A]/90 sm:text-xs">
        {category.name}
      </span>
    </Link>
  );
}

export default function CategoryIconMarquee({
  items,
  hrefForSlug,
  isSafeSlug,
  renderIcon,
}: CategoryIconMarqueeProps) {
  const safeItems = items.filter((item) =>
    isSafeSlug((item.slug ?? "").trim()),
  );

  if (safeItems.length === 0) return null;

  const renderRow = (keyPrefix: string) =>
    safeItems.map((category) => (
      <CategoryTile
        key={`${keyPrefix}-${category.id}`}
        category={category}
        href={hrefForSlug(category.slug)}
        renderIcon={renderIcon}
      />
    ));

  return (
    <div className="home-category-marquee relative mt-6 overflow-hidden py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[var(--home-beige,#f5f0e8)] to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[var(--home-beige,#f5f0e8)] to-transparent sm:w-16" />
      <div className="home-category-marquee-track flex w-max gap-4 sm:gap-5">
        <div className="flex shrink-0 gap-4 sm:gap-5">{renderRow("a")}</div>
        <div className="flex shrink-0 gap-4 sm:gap-5" aria-hidden>
          {renderRow("b")}
        </div>
      </div>
    </div>
  );
}
