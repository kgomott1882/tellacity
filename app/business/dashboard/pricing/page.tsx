import { redirect } from "next/navigation";

/** Compare-all-plans URL consolidated under Billing & Plans. */
export default function DashboardPricingRedirectPage() {
  redirect("/business/dashboard/billing");
}
