import CategoriesClient from "./CategoriesClient";

export const metadata = {
title: "Browse Business Categories | Tellacity",
description:
"Explore thousands of business categories and discover trusted companies across industries on Tellacity.",
alternates: {
canonical: "https://tellacity.com/categories",
},
openGraph: {
title: "Browse Business Categories | Tellacity",
description:
"Discover businesses across all industries with real customer reviews on Tellacity.",
url: "https://tellacity.com/categories",
siteName: "Tellacity",
type: "website",
},
twitter: {
card: "summary_large_image",
title: "Tellacity Categories",
description:
"Browse business categories and discover trusted companies.",
},
};

export default function CategoriesPage() {
return <CategoriesClient />;
}

