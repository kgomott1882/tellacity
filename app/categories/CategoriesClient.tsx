"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeCountryCode, setStoredCountry } from "@/lib/country";
import {
  getCategoriesCountryMeta,
  getGroupDescription,
  NEED_HELP_LINKS,
  RELATED_LINKS,
  resolveTopSectorHref,
  TOP_SECTOR_CHIPS,
} from "@/lib/categoriesPageContent";
import {
  ChevronRight,
  Folder,
  Dog,
  Wallet,
  Film,
  ShoppingBag,
  Home,
  Wrench,
  Car,
  CalendarDays,
  UtensilsCrossed,
  Truck,
  Zap,
  Heart,
  Sparkles,
  Briefcase,
  Factory,
  GraduationCap,
  Laptop,
  Scale,
  Landmark,
  BookOpen,
  Shield,
  Flower2,
  Palette,
  HeartPulse,
  Building2,
  Trophy,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  group_slug?: string | null;
  is_active?: boolean | null;
};

type CategoryGroup = {
  id: string;
  name: string;
  slug: string;
  categories: Category[];
};

const FALLBACK_GROUPS: CategoryGroup[] = [
  {
    id: "fallback-home-services",
    name: "Home Services",
    slug: "home-services",
    categories: [
      { id: "fb-cleaning", name: "Cleaning Services", slug: "cleaning-services" },
      { id: "fb-plumbing", name: "Plumbing Services", slug: "plumbing-services" },
      { id: "fb-electricians", name: "Electricians", slug: "electricians" },
    ],
  },
  {
    id: "fallback-food-beverage",
    name: "Food & Beverage",
    slug: "food-beverage",
    categories: [
      { id: "fb-restaurants", name: "Restaurants", slug: "restaurants" },
      { id: "fb-takeaways", name: "Takeaways", slug: "takeaways" },
      { id: "fb-coffee-shops", name: "Coffee Shops", slug: "coffee-shops" },
    ],
  },
  {
    id: "fallback-health",
    name: "Health & Medical",
    slug: "health-medical",
    categories: [
      { id: "fb-clinics", name: "Clinics", slug: "clinics" },
      { id: "fb-pharmacies", name: "Pharmacies", slug: "pharmacies" },
      { id: "fb-dental", name: "Dental Services", slug: "dental-services" },
    ],
  },
];

const ICON_MATCHES: { match: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { match: "animal", icon: Dog },
  { match: "pet", icon: Dog },
  { match: "beauty", icon: Sparkles },
  { match: "well-being", icon: Sparkles },
  { match: "wellbeing", icon: Sparkles },
  { match: "food", icon: UtensilsCrossed },
  { match: "beverage", icon: UtensilsCrossed },
  { match: "tobacco", icon: UtensilsCrossed },
  { match: "medical", icon: HeartPulse },
  { match: "health", icon: Heart },
  { match: "hobbies", icon: Palette },
  { match: "crafts", icon: Palette },
  { match: "garden", icon: Flower2 },
  { match: "legal", icon: Scale },
  { match: "government", icon: Landmark },
  { match: "publishing", icon: BookOpen },
  { match: "money", icon: Wallet },
  { match: "insurance", icon: Shield },
  { match: "financial", icon: Wallet },
  { match: "business", icon: Briefcase },
  { match: "construction", icon: Factory },
  { match: "manufacturing", icon: Factory },
  { match: "education", icon: GraduationCap },
  { match: "training", icon: GraduationCap },
  { match: "electronics", icon: Laptop },
  { match: "technology", icon: Laptop },
  { match: "media", icon: Film },
  { match: "entertainment", icon: Film },
  { match: "events", icon: CalendarDays },
  { match: "public", icon: Building2 },
  { match: "restaurant", icon: UtensilsCrossed },
  { match: "bars", icon: UtensilsCrossed },
  { match: "sports", icon: Trophy },
  { match: "utilities", icon: Zap },
  { match: "hospitality", icon: UtensilsCrossed },
  { match: "travel", icon: Car },
  { match: "hotel", icon: CalendarDays },
  { match: "transport", icon: Truck },
  { match: "logistics", icon: Truck },
  { match: "retail", icon: ShoppingBag },
  { match: "shopping", icon: ShoppingBag },
  { match: "trade", icon: ShoppingBag },
  { match: "home", icon: Home },
  { match: "service", icon: Wrench },
  { match: "local", icon: Wrench },
  { match: "automotive", icon: Car },
  { match: "power", icon: Zap },
  { match: "energy", icon: Zap },
];

const CATEGORY_COLORS: { match: string; color: string }[] = [
  { match: "animal", color: "#1CA7A6" },
  { match: "pet", color: "#1CA7A6" },
  { match: "beauty", color: "#E84393" },
  { match: "well-being", color: "#E84393" },
  { match: "wellbeing", color: "#E84393" },
  { match: "food", color: "#FF6B35" },
  { match: "beverage", color: "#FF6B35" },
  { match: "tobacco", color: "#FF6B35" },
  { match: "medical", color: "#27AE60" },
  { match: "health", color: "#27AE60" },
  { match: "hobbies", color: "#5F27CD" },
  { match: "crafts", color: "#5F27CD" },
  { match: "garden", color: "#7D9D00" },
  { match: "legal", color: "#1B1464" },
  { match: "government", color: "#1B1464" },
  { match: "publishing", color: "#C2185B" },
  { match: "money", color: "#009432" },
  { match: "insurance", color: "#009432" },
  { match: "financial", color: "#009432" },
  { match: "business", color: "#2E86DE" },
  { match: "construction", color: "#E67E22" },
  { match: "manufacturing", color: "#E67E22" },
  { match: "education", color: "#6C5CE7" },
  { match: "training", color: "#6C5CE7" },
  { match: "electronics", color: "#00B8D9" },
  { match: "technology", color: "#00B8D9" },
  { match: "media", color: "#C2185B" },
  { match: "entertainment", color: "#E74C3C" },
  { match: "events", color: "#E74C3C" },
  { match: "public", color: "#3C6382" },
  { match: "restaurant", color: "#B71540" },
  { match: "bars", color: "#B71540" },
  { match: "sports", color: "#0984E3" },
  { match: "utilities", color: "#FBC531" },
  { match: "hospitality", color: "#E74C3C" },
  { match: "travel", color: "#00A8FF" },
  { match: "hotel", color: "#00A8FF" },
  { match: "transport", color: "#2F3640" },
  { match: "logistics", color: "#2F3640" },
  { match: "retail", color: "#FF3F6C" },
  { match: "shopping", color: "#FF3F6C" },
  { match: "trade", color: "#FF3F6C" },
  { match: "home", color: "#4A69BD" },
  { match: "service", color: "#4A69BD" },
  { match: "local", color: "#4A69BD" },
  { match: "automotive", color: "#2F3640" },
  { match: "power", color: "#FBC531" },
  { match: "energy", color: "#FBC531" },
];

const DEFAULT_CATEGORY_COLOR = "#1FAF9E";

function getGroupIcon(slug: string) {
  const lower = (slug ?? "").toLowerCase();
  const found = ICON_MATCHES.find(({ match }) => lower.includes(match));
  return found?.icon ?? Folder;
}

function getGroupColor(slug: string): string {
  const lower = (slug ?? "").toLowerCase();
  const found = CATEGORY_COLORS.find(({ match }) => lower.includes(match));
  return found?.color ?? DEFAULT_CATEGORY_COLOR;
}

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const sectionClass = "border-t border-gray-100 py-12 sm:py-14";
const sectionClassCompact = "border-t border-gray-100 py-8 sm:py-10";
const h2Class = "text-2xl font-semibold text-[#0E0E0E] sm:text-3xl";
const h2ClassCompact = "text-xl font-semibold text-[#0E0E0E] sm:text-2xl";
const bodyClass = "mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-gray-600";
const bodyClassCompact = "mt-2 max-w-3xl text-sm leading-relaxed text-gray-600";

export default function CategoriesPage({
  countryParam,
}: {
  countryParam?: string;
}) {
  const searchParams = useSearchParams();
  const urlCountry = searchParams.get("country");
  const countryCode = normalizeCountryCode(urlCountry ?? countryParam ?? undefined);
  const countryMeta = getCategoriesCountryMeta(countryCode);
  const countryQuerySuffix = `?country=${encodeURIComponent(countryCode)}`;

  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [dataCount, setDataCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setStoredCountry(countryCode);
  }, [countryCode]);

  const popularGroupSlugs = useMemo(
    () =>
      [
        "shopping",
        "fashion",
        "home-services",
        "home",
        "travel",
        "vacation",
        "restaurant",
        "food",
        "health",
        "medical",
        "education",
        "training",
        "electronics",
        "technology",
        "money",
        "insurance",
        "financial",
      ],
    []
  );

  const popularGroups = useMemo(() => {
    if (groups.length === 0) return [];
    return groups
      .filter((g) =>
        popularGroupSlugs.some((m) => g.slug.toLowerCase().includes(m))
      )
      .slice(0, 8);
  }, [groups, popularGroupSlugs]);

  useEffect(() => {
    let isMounted = true;

    const fetchGroups = async () => {
      const setFallback = () => {
        setGroups(FALLBACK_GROUPS);
        setDataCount(FALLBACK_GROUPS.length);
        setIsLoading(false);
      };

      const response = await fetch("/api/business/category-catalog", {
        method: "GET",
        cache: "no-store",
      }).catch(() => null);

      if (!isMounted) {
        return;
      }

      if (!response || !response.ok) {
        console.error("Categories load error:", response?.status ?? "network_error");
        setFallback();
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | {
            groups?: Array<{ name: string; group_slug: string }>;
            categories?: Array<{ name: string; slug: string; group_slug: string }>;
          }
        | null;

      const groupsData = payload?.groups ?? [];
      const categoriesData = payload?.categories ?? [];

      const cleanedGroups = groupsData.map((group) => ({
        id: group.group_slug,
        name: group.name,
        slug: group.group_slug,
        categories: categoriesData
          .filter((cat) => cat.group_slug === group.group_slug)
          .map((cat) => ({
            id: cat.slug,
            name: cat.name,
            slug: cat.slug,
            group_slug: cat.group_slug,
            is_active: true,
          })),
      })) as CategoryGroup[];

      if (cleanedGroups.length === 0) {
        setFallback();
        return;
      }

      setGroups(cleanedGroups.filter((group) => group.categories.length > 0));
      setDataCount(cleanedGroups.length);
      setIsLoading(false);
    };

    fetchGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  const isUsLean = countryCode === "US";

  const h1Title =
    countryCode === "GB"
      ? "Explore Categories in Great Britain"
      : `Explore Categories in ${countryMeta.headingName}`;

  const introParagraph = isUsLean
    ? "Browse verified businesses across major industries in the United States and quickly narrow your choices by category."
    : countryCode === "GB"
      ? "Find the right company for your needs in Great Britain. Browse verified businesses across major industries, compare options, and discover where real customers are sharing trusted feedback."
      : `Find the right company for your needs in ${countryMeta.label}. Browse verified businesses across major industries, compare options, and discover where real customers are sharing trusted feedback.`;

  const topSectorChips = (
    <div className="mt-4 flex flex-wrap gap-2">
      {TOP_SECTOR_CHIPS.map((chip) => {
        const href = resolveTopSectorHref(chip, groups, countryQuerySuffix);
        if (!href) {
          return (
            <span
              key={chip.label}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 sm:text-sm"
            >
              {chip.label}
            </span>
          );
        }
        return (
          <Link
            key={chip.label}
            href={href}
            className="rounded-full border border-[#1FAF9E]/40 bg-[#E5F4F2] px-3 py-1.5 text-xs font-medium text-[#0F766E] transition-colors hover:border-[#1FAF9E] hover:bg-[#D4EDE8] sm:text-sm"
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );

  const categoryGrid = (
    <div
      id="category-directory"
      className={isUsLean ? "mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" : "mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"}
    >
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
            href={`/search${countryQuerySuffix}`}
            className="mt-3 inline-flex rounded-full border border-[#1FAF9E] px-4 py-2 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
          >
            Search businesses
          </Link>
        </div>
      )}

      {!isLoading &&
        groups.map((group) => {
          const Icon = getGroupIcon(group.slug);
          const accentColor = getGroupColor(group.slug);
          const groupDescription = getGroupDescription(group.slug);
          return (
            <div
              id={`category-${group.slug}`}
              key={String(group.id ?? group.slug ?? group.name)}
              className="scroll-mt-24 rounded-xl border-2 bg-white p-6 shadow-sm"
              style={{ borderColor: accentColor }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-[#0E0E0E]"
                    style={{
                      borderColor: accentColor,
                      backgroundColor: `${accentColor}14`,
                    }}
                  >
                    <Icon
                      className="h-6 w-6"
                      strokeWidth={1.5}
                      style={{ color: accentColor }}
                    />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-[#0E0E0E]">
                      {group.name}
                    </h3>
                    {!isUsLean && groupDescription ? (
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">
                        {groupDescription}
                      </p>
                    ) : isUsLean && groupDescription ? (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {groupDescription}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-gray-500">
                      {group.categories.length} categories
                    </p>
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-600">
                {group.categories.map((category) => {
                  const safeCategorySlug = (category.slug ?? "").trim();
                  return (
                    <li
                      key={String(
                        category.id ?? category.slug ?? category.name
                      )}
                    >
                      <Link
                        href={
                          safeCategorySlug
                            ? `/categories/${encodeURIComponent(safeCategorySlug)}${countryQuerySuffix}`
                            : "#"
                        }
                        className="flex items-center justify-between gap-3 text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = accentColor;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "";
                        }}
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-5 border-t border-gray-100 pt-4 text-right">
                <Link
                  href={
                    (group.slug ?? "").trim()
                      ? `/categories/${encodeURIComponent((group.slug ?? "").trim())}${countryQuerySuffix}`
                      : "#"
                  }
                  className="inline-flex items-center gap-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ color: accentColor }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "0.85";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  View Businesses
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
    </div>
  );

  const popularGroupsList =
    !isLoading && popularGroups.length > 0 ? (
      <ul className="mt-3 flex flex-wrap gap-2">
        {popularGroups.map((group) => (
          <li key={group.slug}>
            <Link
              href={`/categories/${encodeURIComponent(group.slug.trim())}${countryQuerySuffix}`}
              className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-[#0E0E0E] transition hover:border-[#1FAF9E]/40 hover:text-[#0F766E]"
            >
              {group.name}
            </Link>
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <main className="bg-white">
      <section
        className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${
          isUsLean ? "py-8 sm:py-10" : "py-12 sm:py-16"
        }`}
      >
        <div className={isUsLean ? "max-w-2xl" : "max-w-3xl"}>
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            <span className="relative inline-block">
              <span className="relative z-10">{h1Title}</span>
              <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
            {introParagraph}
          </p>
          {!isUsLean ? (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Browse by industry, compare verified businesses, and narrow your
              choices by category. Every listing links to real customer reviews
              and trust signals on Tellacity&apos;s customer reviews and
              feedback platform.
            </p>
          ) : null}
        </div>

        {isUsLean ? (
          <>
            <h2 className={`${h2ClassCompact} mt-8`}>Browse by category</h2>
            {categoryGrid}
            <div className={`mt-10 space-y-8 ${sectionClassCompact}`}>
              <section>
                <h2 className={h2ClassCompact}>Popular sectors</h2>
                <p className={bodyClassCompact}>
                  Shortcuts into common industries in the United States, retail,
                  home services, travel, food, health, education, technology, and
                  financial services.
                </p>
                {popularGroupsList}
              </section>

              <section>
                <h2 className={h2ClassCompact}>Why categories matter</h2>
                <p className={bodyClassCompact}>
                  Categories help you find relevant businesses and compare
                  verified reviews in the right industry. They also help
                  businesses appear in the right place for the right audience.
                </p>
              </section>

              <section>
                <h2 className={h2ClassCompact}>How to choose a category</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
                  <li>
                    Start broad when browsing; pick a specific subcategory when
                    comparing businesses.
                  </li>
                  <li>
                    Keep country set to US for local results on this directory.
                  </li>
                  <li>
                    Use the same subcategory when weighing two providers side by
                    side.
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-gray-200 bg-[#F8FAFC] p-5">
                <h2 className={h2ClassCompact}>Need help?</h2>
                <p className={bodyClassCompact}>
                  Use these links if you need to add a business, manage a listing,
                  or learn more about trust policies.
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {NEED_HELP_LINKS.map((page) => (
                    <li key={page.href}>
                      <Link href={page.href} className={linkClass}>
                        {page.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </>
        ) : (
          <>
            <section className="mt-10">
              <h2 className={h2Class}>Browse the top sectors</h2>
              <p className="mt-3 max-w-3xl text-sm text-gray-600">
                Quick entry points into major industries, each opens a category
                group with verified business listings for {countryMeta.label}.
              </p>
              {topSectorChips}
            </section>

            <section className="mt-12">
              <h2 className={h2Class}>Browse by category</h2>
              <div className={bodyClass}>
                <p>
                  Each category group helps you start from a broad industry and
                  drill down into more specific needs, from home repairs to
                  financial services.
                </p>
                <p>
                  Verified business profiles and reviews help you compare
                  options with more confidence before you choose a provider in{" "}
                  {countryMeta.label}.
                </p>
              </div>
            </section>

            {categoryGrid}
          </>
        )}
      </section>

      {!isUsLean ? (
        <>
          <section
            className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${sectionClass}`}
          >
            <h2 className={h2Class}>Why categories matter</h2>
            <div className={bodyClass}>
              <p>
                Categories organize Tellacity so you can find businesses that
                match what you need, without scrolling through unrelated listings.
              </p>
              <p>
                They also help businesses appear in the right place for the right
                audience, whether someone is comparing local plumbers or
                researching financial services in {countryMeta.label}.
              </p>
              <p>
                Category pages are useful for both discovery and trust: you see
                who operates in an industry, how they are rated, and what
                verified customers actually experienced.
              </p>
            </div>
          </section>

          <section
            className={`mx-auto w-full max-w-7xl bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 ${sectionClass}`}
          >
            <h2 className={h2Class}>
              {countryCode === "GB"
                ? "Popular sectors in GB"
                : `Popular sectors in ${countryMeta.code}`}
            </h2>
            <div className={bodyClass}>
              <p>
                These sector groups are among the broadest paths people use when
                browsing verified businesses on Tellacity. They cover everyday
                needs many users search for in {countryMeta.label}.
              </p>
              <p>
                {countryCode === "GB" ? (
                  <>
                    In Great Britain, people often browse retail and shopping,
                    home and local services, travel, food and hospitality,
                    health and well-being, education, technology, and financial
                    services, without any single industry dominating every
                    search.
                  </>
                ) : (
                  <>
                    People often browse retail and shopping, home and local
                    services, travel, food and hospitality, health, education,
                    technology, and financial services, use the sector links that
                    match what you need.
                  </>
                )}
              </p>
              <p>
                Use the links below to jump into a sector, then narrow down by
                subcategory for more specific comparisons.
              </p>
            </div>
            {!isLoading && popularGroups.length > 0 ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {popularGroups.map((group) => (
                  <li key={group.slug}>
                    <Link
                      href={`/categories/${encodeURIComponent(group.slug.trim())}${countryQuerySuffix}`}
                      className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-[#0E0E0E] shadow-sm transition hover:border-[#1FAF9E]/40 hover:text-[#0F766E]"
                    >
                      {group.name}
                      <span className="mt-1 block text-xs font-normal text-gray-500">
                        {group.categories.length} subcategories
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <section
            className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${sectionClass}`}
          >
            <h2 className={h2Class}>How to choose a category</h2>
            <div className={bodyClass}>
              <p>
                Choose the most specific category that matches your search intent
                or the business you want to list. Broad groups are good for
                browsing; specific subcategories are better for detailed
                comparisons.
              </p>
              <p>
                If you are looking for a local provider, keep the country set to{" "}
                {countryMeta.label} ({countryMeta.code}) so results stay
                relevant. You can change country from the homepage or search when
                exploring other markets.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Browsing several options? Start with a top-level group, then
                  open subcategories.
                </li>
                <li>
                  Comparing two businesses? Use the same subcategory so reviews
                  and trust signals are comparable.
                </li>
                <li>
                  Missing a business?{" "}
                  <Link href="/suggest-business" className={linkClass}>
                    Suggest a missing business
                  </Link>{" "}
                  or read{" "}
                  <Link href="/for-business" className={linkClass}>
                    Tellacity for Business
                  </Link>
                  .
                </li>
              </ul>
            </div>
          </section>

          <section
            className={`mx-auto w-full max-w-7xl bg-[#F8FAFC] px-4 sm:px-6 lg:px-8 ${sectionClass}`}
          >
            <h2 className={h2Class}>Related links</h2>
            <div className={bodyClass}>
              <p>
                Learn more about Tellacity, our trust policies, and tools for
                businesses and reviewers, all connected to the category directory
                you are browsing.
              </p>
            </div>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {RELATED_LINKS.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClass}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-sm text-gray-600">
              Tellacity&apos;s category directory works alongside our{" "}
              <Link href="/write-review" className={linkClass}>
                reviews
              </Link>
              ,{" "}
              <Link href="/safety-trust" className={linkClass}>
                trust policies
              </Link>
              , and{" "}
              <Link href="/reputation-platform" className={linkClass}>
                business tools
              </Link>
              .
            </p>
          </section>
        </>
      ) : null}
    </main>
  );
}
