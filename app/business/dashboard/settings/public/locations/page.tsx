import { redirect } from "next/navigation";

export default function LocationsRedirect() {
  redirect("/business/dashboard/settings/business-profile");
}
