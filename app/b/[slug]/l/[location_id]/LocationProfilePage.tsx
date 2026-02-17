"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import RatingStars from "@/components/RatingStars";
import { MapPin, Phone, Globe } from "lucide-react";

type Business = {
  id: string;
  name: string;
  slug: string;
};

type Location = {
  id: string;
  business_id: string;
  name: string | null;
  address: string | null;
  street_address_2: string | null;
  city: string | null;
  postcode: string | null;
  state_region: string | null;
  country_code: string | null;
  phone: string | null;
  website: string | null;
  headline: string | null;
  description: string | null;
};

type Review = {
  id: string;
  guest_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const buildWebsiteHref = (value: string | null | undefined) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function LocationProfilePage({
  initialBusiness = null,
  initialLocation = null,
}: {
  initialBusiness?: Business | null;
  initialLocation?: Location | null;
}) {
  const params = useParams<{ slug: string; location_id: string }>();
  const slug = params?.slug ?? "";
  const locationId = params?.location_id ?? "";
  const [business, setBusiness] = useState<Business | null>(initialBusiness ?? null);
  const [location, setLocation] = useState<Location | null>(initialLocation ?? null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(!initialBusiness || !initialLocation);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (initialBusiness && initialLocation) {
      if (locationId) {
        supabase
          .from("reviews")
          .select("id, guest_name, rating, title, body, created_at")
          .eq("location_id", locationId)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(50)
          .then(({ data }) => setReviews((data ?? []) as Review[]));
      }
      return;
    }
    let mounted = true;
    (async () => {
      if (!slug || !locationId) {
        setLoading(false);
        setNotFound(true);
        return;
      }
      setLoading(true);
      setNotFound(false);
      const { data: bizData, error: bizError } = await supabase
        .from("businesses")
        .select("id, name, slug")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (!mounted || bizError || !bizData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setBusiness(bizData as Business);
      const { data: locData, error: locError } = await supabase
        .from("business_locations")
        .select("id, business_id, name, address, street_address_2, city, postcode, state_region, country_code, phone, website, headline, description")
        .eq("id", locationId)
        .eq("business_id", (bizData as Business).id)
        .maybeSingle();
      if (!mounted || locError || !locData) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setLocation(locData as Location);
      const { data: revData } = await supabase
        .from("reviews")
        .select("id, guest_name, rating, title, body, created_at")
        .eq("location_id", locationId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(50);
      if (mounted) setReviews((revData ?? []) as Review[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [slug, locationId, initialBusiness, initialLocation]);

  const trustScore = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating ?? 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  }, [reviews]);

  const fullAddress = useMemo(() => {
    if (!location) return "";
    const parts = [
      location.address,
      location.street_address_2,
      location.city,
      location.state_region,
      location.postcode,
      location.country_code,
    ].filter(Boolean);
    return parts.join(", ");
  }, [location]);

  const locationName = location?.name || business?.name || "Location";
  const pageTitle = `${locationName} | ${business?.name ?? "Business"}`;

  useEffect(() => {
    if (!location || !business || typeof document === "undefined") return;
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: locationName,
      description: location.description || location.headline || undefined,
      address: fullAddress
        ? {
            "@type": "PostalAddress",
            streetAddress: [location.address, location.street_address_2].filter(Boolean).join(", "),
            addressLocality: location.city ?? undefined,
            addressRegion: location.state_region ?? undefined,
            postalCode: location.postcode ?? undefined,
            addressCountry: location.country_code ?? undefined,
          }
        : undefined,
      telephone: location.phone ?? undefined,
      url: location.website ? buildWebsiteHref(location.website) : undefined,
      aggregateRating:
        trustScore != null && reviews.length > 0
          ? {
              "@type": "AggregateRating",
              ratingValue: trustScore,
              reviewCount: reviews.length,
              bestRating: 5,
            }
          : undefined,
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, [location, business, locationName, fullAddress, trustScore, reviews.length]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F4F0]">
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="h-10 w-64 rounded bg-gray-200 animate-pulse" />
          <div className="mt-6 h-6 w-48 rounded bg-gray-200 animate-pulse" />
          <div className="mt-12 h-32 rounded bg-gray-200 animate-pulse" />
        </section>
      </main>
    );
  }

  if (notFound || !business || !location) {
    return (
      <main className="min-h-screen bg-[#F8F4F0]">
        <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Location not found</h1>
          <p className="mt-2 text-sm text-gray-600">This location is not available.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-[#124541] hover:underline">
            Go home
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4F0]">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-[#124541] hover:underline">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/b/${business.slug}`} className="hover:text-[#124541] hover:underline">
            {business.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[#0E0E0E]">{locationName}</span>
        </nav>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">{locationName}</h1>
          {location.headline && (
            <p className="mt-2 text-base text-gray-700">{location.headline}</p>
          )}
          {location.description && (
            <p className="mt-2 text-sm text-gray-600">{location.description}</p>
          )}

          {trustScore != null && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-1">
                <RatingStars rating={trustScore} size={20} editable={false} />
              </div>
              <span className="text-sm font-medium text-[#0E0E0E]">
                {trustScore} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="mt-6 space-y-3 border-t border-gray-100 pt-6">
            {fullAddress && (
              <div className="flex items-start gap-3 text-sm text-gray-700">
                <MapPin size={18} className="mt-0.5 shrink-0 text-gray-500" />
                <span>{fullAddress}</span>
              </div>
            )}
            {location.phone && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone size={18} className="shrink-0 text-gray-500" />
                <a href={`tel:${location.phone}`} className="text-[#124541] hover:underline">
                  {location.phone}
                </a>
              </div>
            )}
            {location.website && (
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Globe size={18} className="shrink-0 text-gray-500" />
                <a
                  href={buildWebsiteHref(location.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#124541] hover:underline"
                >
                  {location.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">No reviews yet for this location.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#0E0E0E]">
                      {review.guest_name ?? "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <RatingStars rating={review.rating} size={14} editable={false} />
                  </div>
                  {review.title && (
                    <p className="mt-2 text-sm font-medium text-[#0E0E0E]">{review.title}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                    {review.body ?? ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8">
          <Link
            href={`/b/${business.slug}`}
            className="text-sm font-medium text-[#124541] hover:underline"
          >
            ← Back to {business.name}
          </Link>
        </div>
      </section>
    </main>
  );
}
