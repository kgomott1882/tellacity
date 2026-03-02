import { redirect } from "next/navigation";

export default function InviteLegalRedirect() {
  redirect("/business/dashboard/settings/invite-settings");
}
