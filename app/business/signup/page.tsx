import { Suspense } from "react";
import BusinessSignupClient from "./BusinessSignupClient";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <BusinessSignupClient />
    </Suspense>
  );
}
