import { redirect } from "next/navigation";

export default function InviteEmailRedirect() {
  redirect("/business/dashboard/settings/invite-settings");
}
