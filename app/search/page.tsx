import SearchPageClient from "./SearchPageClient";

export const dynamic = "force-dynamic";
export const metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return <SearchPageClient />;
}

