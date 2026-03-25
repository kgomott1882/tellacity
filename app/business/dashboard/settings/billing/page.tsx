import { redirect } from "next/navigation";

/** Settings → Plans & billing now lives at `/business/dashboard/billing`. */
export default function BillingSettingsRedirectPage() {
  redirect("/business/dashboard/billing");
}
