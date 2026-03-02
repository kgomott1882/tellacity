import { redirect } from "next/navigation";

export default function NotificationsRedirect() {
  redirect("/business/dashboard/settings/notifications");
}
