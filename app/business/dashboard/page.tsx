import { redirect } from "next/navigation";

/**
 * Keep dashboard root deterministic on the server so nested child routes continue
 * to resolve correctly in dev/build route trees.
 */
export default function BusinessDashboardPage() {
  redirect("/business/dashboard/analytics/performance");
}
