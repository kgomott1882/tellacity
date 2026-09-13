import { Suspense } from "react";
import ConsumerDashboard from "./DashboardClient";

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <ConsumerDashboard />
    </Suspense>
  );
}
