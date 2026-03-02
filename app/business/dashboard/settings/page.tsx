import { redirect } from "next/navigation";

export default function SettingsRoot() {
  redirect("/business/dashboard/settings/business-profile");
}
