import { redirect } from "next/navigation";

export default function InviteTimeRedirect() {
  redirect("/business/dashboard/settings/invite-settings");
}
