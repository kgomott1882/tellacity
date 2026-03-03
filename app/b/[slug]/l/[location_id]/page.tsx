import { createClient } from "@supabase/supabase-js";
import LocationProfilePage from "./LocationProfilePage";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase env missing for location page");
  }
  return createClient(url, key);
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string; location_id: string };
}) {
  const { slug, location_id } = params;

  const supabase = getSupabase();
  const { data: bizData } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!bizData) {
    return {
      title: "Location Not Found | Tellacity",
    };
  }

  const { data: locData } = await supabase
    .from("business_locations")
    .select("id, name, city, country_code")
    .eq("id", location_id)
    .eq("business_id", bizData.id)
    .maybeSingle();

  if (!locData) {
    return {
      title: `${bizData.name} Location Not Found | Tellacity`,
    };
  }

  const locationName = locData.name || bizData.name;
  const canonical = `https://tellacity.com/b/${bizData.slug}/l/${location_id}`;

  return {
    title: `${locationName} Reviews | ${bizData.name} | Tellacity`,
    description: `Read customer reviews for ${locationName}. Verified reviews, ratings, and feedback on Tellacity.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${locationName} Reviews | ${bizData.name}`,
      description: `Customer reviews and ratings for ${locationName}.`,
      url: canonical,
      type: "website",
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: { slug: string; location_id: string };
}) {
  const { slug, location_id } = params;

  const supabase = getSupabase();
  const { data: bizData } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (!bizData) {
    return <LocationProfilePage />;
  }

  const { data: locData } = await supabase
    .from("business_locations")
    .select("*")
    .eq("id", location_id)
    .eq("business_id", bizData.id)
    .maybeSingle();

  if (!locData) {
    return <LocationProfilePage />;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: locData.name || bizData.name,
    url: `https://tellacity.com/b/${bizData.slug}/l/${location_id}`,
    address: locData.address
      ? {
          "@type": "PostalAddress",
          streetAddress: locData.address,
          addressLocality: locData.city || undefined,
          addressCountry: locData.country_code || undefined,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LocationProfilePage initialLocation={locData} initialBusiness={bizData} />
    </>
  );
}
