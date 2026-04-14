import { redirect } from "next/navigation";
import { createSupabaseServerCookies } from "@/lib/supabase/serverCookies";
import { getUserBusinesses } from "@/lib/getUserBusinesses";

export const dynamic = "force-dynamic";

/**
 * Root business dashboard: require at least one linked/owned business; otherwise send
 * non-owners to the consumer dashboard. Owners continue to the default workspace route.
 */
export default async function BusinessDashboardIndexPage() {
  const supabase = await createSupabaseServerCookies();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/business/login");
  }

  const businesses = await getUserBusinesses(user.id, supabase);
  if (businesses.length === 0) {
    redirect("/dashboard");
  }

  redirect("/business/dashboard/analytics/performance");
}
