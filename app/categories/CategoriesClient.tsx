"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeCountryCode, setStoredCountry } from "@/lib/country";
import {
  CATEGORIES_NEED_HELP_INTRO,
  CATEGORIES_WHY_COPY,
  getCategoriesCountryMeta,
  getCategoriesHowCountryLine,
  getCategoriesIntro,
  getCategoriesPopularSectorsIntro,
  getGroupDescription,
  NEED_HELP_LINKS,
} from "@/lib/categoriesPageContent";
import { loadCategoryCatalogFromBrowser } from "@/lib/categoryCatalogBrowser";
import { buildCategoryGroupsFromCatalog } from "@/lib/categoryCatalogServer";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import { FadeUp, StaggerFadeUp } from "@/components/ui/MotionWrapper";
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

const MAX_SUBCATEGORIES_SHOWN = 8;
const IO_THRESHOLD = 0.12;
const DEFAULT_GROUP_ACCENT = "#00B4A6";

/** Exact accent palette — most specific slug matches first. */
const GROUP_ACCENT_COLORS: { match: string; color: string }[] = [
  { match: "animal", color: "#F59E0B" },
  { match: "pet", color: "#F59E0B" },
  { match: "beauty", color: "#F43F5E" },
  { match: "well-being", color: "#F43F5E" },
  { match: "wellbeing", color: "#F43F5E" },
  { match: "business-service", color: "#3B82F6" },
  { match: "construction", color: "#EA580C" },
  { match: "manufacturing", color: "#EA580C" },
  { match: "education", color: "#8B5CF6" },
  { match: "training", color: "#8B5CF6" },
  { match: "electronics", color: "#06B6D4" },
  { match: "technology", color: "#06B6D4" },
  { match: "events", color: "#EC4899" },
  { match: "entertainment", color: "#EC4899" },
  { match: "food", color: "#22C55E" },
  { match: "beverage", color: "#22C55E" },
  { match: "tobacco", color: "#22C55E" },
  { match: "medical", color: "#10B981" },
  { match: "health", color: "#10B981" },
  { match: "hobbies", color: "#EAB308" },
  { match: "crafts", color: "#EAB308" },
  { match: "home-services", color: "#0EA5E9" },
  { match: "home-garden", color: "#84CC16" },
  { match: "home", color: "#84CC16" },
  { match: "legal", color: "#6366F1" },
  { match: "government", color: "#6366F1" },
  { match: "media", color: "#EF4444" },
  { match: "publishing", color: "#EF4444" },
  { match: "money", color: "#16A34A" },
  { match: "insurance", color: "#16A34A" },
  { match: "financial", color: "#16A34A" },
  { match: "public", color: "#14B8A6" },
  { match: "local-service", color: "#14B8A6" },
  { match: "local", color: "#14B8A6" },
  { match: "restaurant", color: "#F97316" },
  { match: "bars", color: "#F97316" },
  { match: "shopping", color: "#D946EF" },
  { match: "fashion", color: "#D946EF" },
  { match: "retail", color: "#D946EF" },
  { match: "sport", color: "#DC2626" },
  { match: "travel", color: "#0284C7" },
  { match: "vacation", color: "#0284C7" },
  { match: "utilities", color: "#64748B" },
  { match: "power", color: "#64748B" },
  { match: "energy", color: "#64748B" },
  { match: "vehicle", color: "#15803D" },
  { match: "transport", color: "#15803D" },
  { match: "automotive", color: "#15803D" },
  { match: "logistics", color: "#15803D" },
  { match: "business", color: "#3B82F6" },
];

const HERO_CONFETTI = [
  { x: "8%", y: "18%", size: 6, color: "#F59E0B" },
  { x: "22%", y: "8%", size: 5, color: "#F43F5E" },
  { x: "38%", y: "22%", size: 7, color: "#3B82F6" },
  { x: "55%", y: "12%", size: 5, color: "#22C55E" },
  { x: "72%", y: "20%", size: 6, color: "#8B5CF6" },
  { x: "88%", y: "10%", size: 5, color: "#06B6D4" },
  { x: "15%", y: "55%", size: 5, color: "#EC4899" },
  { x: "48%", y: "48%", size: 6, color: "#EAB308" },
  { x: "65%", y: "42%", size: 5, color: "#D946EF" },
  { x: "82%", y: "52%", size: 7, color: "#0284C7" },
  { x: "30%", y: "72%", size: 5, color: "#10B981" },
  { x: "58%", y: "68%", size: 6, color: "#F97316" },
  { x: "92%", y: "75%", size: 5, color: "#14B8A6" },
] as const;

function getGroupAccentColor(slug: string): string {
  const lower = (slug ?? "").toLowerCase();
  const found = GROUP_ACCENT_COLORS.find(({ match }) => lower.includes(match));
  return found?.color ?? DEFAULT_GROUP_ACCENT;
}

function getGroupIcon(slug: string) {
  const lower = (slug ?? "").toLowerCase();
  const found = ICON_MATCHES.find(({ match }) => lower.includes(match));
  return found?.icon ?? Folder;
}

export default function CategoriesPage({
  countryParam,
  initialGroups,
}: {
  countryParam?: string;
  initialGroups?: CategoryGroup[];
}) {
  const searchParams = useSearchParams();
  const urlCountry = searchParams.get("country");
  const countryCode = normalizeCountryCode(urlCountry ?? countryParam ?? undefined);
  const countryMeta = getCategoriesCountryMeta(countryCode);
  const countryQuerySuffix = `?country=${encodeURIComponent(countryCode)}`;

  const [groups, setGroups] = useState<CategoryGroup[]>(initialGroups ?? []);
  const [dataCount, setDataCount] = useState(initialGroups?.length ?? 0);
  const [isLoading, setIsLoading] = useState(!initialGroups?.length);

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
    if (initialGroups?.length) {
      return;
    }

    let isMounted = true;

    const fetchGroups = async () => {
      const setFallback = () => {
        setGroups(FALLBACK_GROUPS);
        setDataCount(FALLBACK_GROUPS.length);
        setIsLoading(false);
      };

      const applyCatalog = (payload: {
        groups?: Array<{ name: string; group_slug: string }>;
        categories?: Array<{ name: string; slug: string; group_slug: string }>;
      }) => {
        const cleanedGroups = (
          buildCategoryGroupsFromCatalog({
            groups: payload.groups ?? [],
            categories: payload.categories ?? [],
          }) as CategoryGroup[]
        ).filter((group) => group.categories.length > 0);

        if (cleanedGroups.length === 0) {
          setFallback();
          return;
        }

        setGroups(cleanedGroups);
        setDataCount(cleanedGroups.length);
        setIsLoading(false);
      };

      const response = await fetch("/api/business/category-catalog", {
        method: "GET",
        cache: "no-store",
      }).catch(() => null);

      if (!isMounted) {
        return;
      }

      if (response?.ok) {
        const payload = (await response.json().catch(() => null)) as
          | {
              groups?: Array<{ name: string; group_slug: string }>;
              categories?: Array<{ name: string; slug: string; group_slug: string }>;
            }
          | null;
        if (payload) {
          applyCatalog(payload);
          return;
        }
      }

      const browserCatalog = await loadCategoryCatalogFromBrowser();
      if (!isMounted) {
        return;
      }

      if (browserCatalog) {
        applyCatalog(browserCatalog);
        return;
      }

      if (!response?.ok) {
        console.warn(
          "Categories load fell back to static list:",
          response?.status ?? "network_error",
        );
      }
      setFallback();
    };

    void fetchGroups();

    return () => {
      isMounted = false;
    };
  }, [initialGroups]);

  const { headingName, code: countryMetaCode } = countryMeta;
  const introParagraph = getCategoriesIntro(headingName);
  const popularSectorsIntro = getCategoriesPopularSectorsIntro(headingName);
  const howCountryLine = getCategoriesHowCountryLine(headingName, countryMetaCode);

  const howToSteps = [
    "Start broad when browsing; pick a specific subcategory when comparing businesses.",
    howCountryLine,
    "Use the same subcategory when weighing two providers side by side.",
  ];

  const categoryGrid = (
    <div
      id="category-directory"
      className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {isLoading &&
        Array.from({ length: 6 }).map((_, index) => (
          <div key={`category-group-skeleton-${index}`} className="cat-skeleton">
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
            className="cat-sector-pill cat-sector-pill--accent mt-3 inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{ "--cat-accent": "#00B4A6" } as React.CSSProperties}
          >
            Search businesses
          </Link>
        </div>
      )}

      {!isLoading &&
        groups.map((group, groupIndex) => {
          const Icon = getGroupIcon(group.slug);
          const accentColor = getGroupAccentColor(group.slug);
          const groupDescription = getGroupDescription(group.slug);
          const visibleCategories = group.categories.slice(0, MAX_SUBCATEGORIES_SHOWN);
          const groupSlug = (group.slug ?? "").trim();
          return (
            <StaggerFadeUp
              key={String(group.id ?? group.slug ?? group.name)}
              index={groupIndex}
              staggerMs={60}
              threshold={IO_THRESHOLD}
            >
              <div
                id={`category-${group.slug}`}
                className="cat-card cat-card--blocked scroll-mt-24"
                style={{ "--cat-accent": accentColor } as React.CSSProperties}
              >
                <div className="cat-card-color-header">
                  <div className="cat-card-color-header-inner">
                    <Icon
                      className="cat-card-color-icon"
                      strokeWidth={1.5}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="cat-card-color-name">{group.name}</h3>
                      {groupDescription ? (
                        <p className="cat-card-color-desc line-clamp-2">
                          {groupDescription}
                        </p>
                      ) : null}
                      <span className="cat-card-color-badge">
                        {group.categories.length} categories
                      </span>
                    </div>
                  </div>
                </div>
                <div className="cat-card-body">
                  <ul className="cat-card-list">
                    {visibleCategories.map((category) => {
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
                            className="cat-card-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                          >
                            <span>{category.name}</span>
                            <ChevronRight
                              className="cat-card-link-chevron h-3.5 w-3.5"
                              aria-hidden
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="cat-card-footer">
                    <Link
                      href={
                        groupSlug
                          ? `/categories/${encodeURIComponent(groupSlug)}${countryQuerySuffix}`
                          : "#"
                      }
                      className="cat-card-view-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                    >
                      View Businesses
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </StaggerFadeUp>
          );
        })}
    </div>
  );

  const popularGroupsList =
    !isLoading && popularGroups.length > 0 ? (
      <ul className="mt-4 flex flex-wrap gap-2.5">
        {popularGroups.map((group) => {
          const accent = getGroupAccentColor(group.slug);
          return (
            <li key={group.slug}>
              <Link
                href={`/categories/${encodeURIComponent(group.slug.trim())}${countryQuerySuffix}`}
                className="cat-sector-pill cat-sector-pill--accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                style={{ "--cat-accent": accent } as React.CSSProperties}
              >
                {group.name}
              </Link>
            </li>
          );
        })}
      </ul>
    ) : null;

  return (
    <main className="categories-cinematic">
      <HomeScrollProgress />
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeUp threshold={IO_THRESHOLD} className="cat-hero">
          <div className="cat-hero-confetti" aria-hidden>
            {HERO_CONFETTI.map((dot, index) => (
              <span
                key={`confetti-${index}`}
                className="cat-hero-confetti-dot"
                style={{
                  left: dot.x,
                  top: dot.y,
                  width: dot.size,
                  height: dot.size,
                  backgroundColor: dot.color,
                }}
              />
            ))}
          </div>
          <div className="cat-hero-inner max-w-2xl">
            <h1 className="cat-hero-title">
              Explore{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Categories</span>
                <span className="cat-hero-draw-underline" aria-hidden />
              </span>{" "}
              in{" "}
              <span className="cat-hero-country">{headingName}</span>
            </h1>
            <p className="cat-hero-sub">{introParagraph}</p>
          </div>
        </FadeUp>

        <div className="cat-browse-section">
          <FadeUp threshold={IO_THRESHOLD}>
            <h2 className="cat-section-title">
              <span className="cat-section-accent">Browse</span> by category
            </h2>
            <p className="cat-section-sub">
              Select a group to view subcategories.
            </p>
          </FadeUp>
          {categoryGrid}
        </div>

        <FadeUp threshold={IO_THRESHOLD} className="cat-popular-section">
          <h2 className="cat-section-title">
            <span className="cat-section-accent">Popular</span> sectors
          </h2>
          <p className="cat-section-sub">{popularSectorsIntro}</p>
          {popularGroupsList}
        </FadeUp>

        <FadeUp threshold={IO_THRESHOLD} className="cat-info-section">
          <div className="cat-why-block">
            <h2 className="cat-section-title">
              <span className="cat-section-accent">Why</span> categories matter
            </h2>
            <p className="cat-why-body">{CATEGORIES_WHY_COPY}</p>
          </div>

          <div className="cat-how-block">
            <h2 className="cat-section-title">
              <span className="cat-section-accent">How to</span> choose a category
            </h2>
            <div className="cat-step-grid">
              {howToSteps.map((step, index) => (
                <div key={`how-step-${index}`} className="cat-step-card">
                  <span className="cat-step-num">{index + 1}</span>
                  <p className="cat-step-text">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp threshold={IO_THRESHOLD} className="cat-help-section">
          <div className="cat-help-card">
            <h2 className="cat-section-title">
              Need help<span className="cat-help-q">?</span>
            </h2>
            <p className="cat-section-sub">{CATEGORIES_NEED_HELP_INTRO}</p>
            <ul className="cat-help-grid">
              {NEED_HELP_LINKS.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className="cat-help-link">
                    <span>{page.label}</span>
                    <ChevronRight className="cat-help-link-icon h-4 w-4" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>
      </section>
    </main>
  );
}
