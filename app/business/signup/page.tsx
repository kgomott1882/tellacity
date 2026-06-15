export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "https://tellacity.com/business/signup",
  },
};

import { Suspense } from "react";
import BusinessSignupClient from "./BusinessSignupClient";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <BusinessSignupClient />
    </Suspense>
  );
}
