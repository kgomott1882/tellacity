import { redirect } from "next/navigation";

/** Settings → billing profile now lives at `/business/dashboard/settings/billing-profile`. */
export default function BillingSettingsRedirectPage() {
  redirect("/business/dashboard/settings/billing-profile");
}
