"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getActiveCountry } from "@/lib/getActiveCountry";

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

export default function CategoriesPage() {
  const [groups, setGroups] = useState<CategoryGroup[]>([]);
  const [dataCount, setDataCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [countryQuerySuffix, setCountryQuerySuffix] = useState(() => {
    if (typeof window === "undefined") return "";
    const c = getActiveCountry();
    return c ? `?country=${encodeURIComponent(c)}` : "";
  });

  useEffect(() => {
    const syncCountryQuery = () => {
      const c = getActiveCountry();
      setCountryQuerySuffix(c ? `?country=${encodeURIComponent(c)}` : "");
    };
    syncCountryQuery();
    window.addEventListener("tellacity-country-change", syncCountryQuery);
    window.addEventListener("storage", syncCountryQuery);
    return () => {
      window.removeEventListener("tellacity-country-change", syncCountryQuery);
      window.removeEventListener("storage", syncCountryQuery);
    };
  }, []);

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

      console.log("CATEGORY GROUPS:", cleanedGroups);

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

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">Explore Categories</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Find the perfect company for your needs. Browse our comprehensive list
            of verified businesses across all industries.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                href="/search"
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
              return (
              <div
                key={String(group.id ?? group.slug ?? group.name)}
                className="rounded-xl border-2 bg-white p-6 shadow-sm"
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
                      <Icon className="h-6 w-6" strokeWidth={1.5} style={{ color: accentColor }} />
                    </span>
                    <div>
                      <h2 className="text-base font-semibold text-[#0E0E0E]">
                        {group.name}
                      </h2>
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
                      <li key={String(category.id ?? category.slug ?? category.name)}>
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
                    style={{
                      color: accentColor,
                    }}
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
      </section>
    </main>
  );
}
