import { redirect } from "next/navigation";

export default function DetailsRedirect() {
  redirect("/business/dashboard/settings/account");
}
