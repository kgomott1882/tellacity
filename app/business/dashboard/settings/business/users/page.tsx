import { redirect } from "next/navigation";

export default function UsersRedirect() {
  redirect("/business/dashboard/settings/team-access");
}
