import { redirect } from "next/navigation";

export default function InvitePrivacyRedirect() {
  redirect("/business/dashboard/settings/invite-settings");
}
