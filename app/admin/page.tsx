import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { getAdminOverviewStats } from "@/lib/admin";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdminSession();

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const [statsRes, reviewsRes, profilesRes, businessesRes] = await Promise.all([
    getAdminOverviewStats(supabase),
    adminSupabase
      .from("reviews")
      .select(
        `
        created_at,
        rating,
        guest_name,
        guest_email,
        author_email,
        email,
        consumer_id,
        business_id,
        businesses:business_id (
          name
        ),
        profiles:consumer_id (
          email
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(7),
    adminSupabase
      .from("profiles")
      .select("created_at, email")
      .order("created_at", { ascending: false })
      .limit(7),
    adminSupabase
      .from("businesses")
      .select("created_at, name, owner_id")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const reviewActivity = (reviewsRes.data ?? []).map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const business = Array.isArray(r.businesses) ? r.businesses[0] : r.businesses;
    const email =
      r.email ||
      r.author_email ||
      r.guest_email ||
      profile?.email ||
      "—";
    const businessName = business?.name || "—";
    return {
      when: r.created_at,
      type: "Review created",
      business: businessName,
      email,
    };
  });

  const userActivity = (profilesRes.data ?? []).map((u) => ({
    when: u.created_at,
    type: "New user",
    business: "—",
    email: u.email || "—",
  }));

  const businessActivity = (businessesRes.data ?? []).map((b) => ({
    when: b.created_at,
    type: "Business created",
    business: b.name || "—",
    email: "—",
  }));

  const activityRows: { when: string | null; type: string; business: string; email: string }[] = [
    ...reviewActivity,
    ...userActivity,
    ...businessActivity,
  ];

  const activity = activityRows
    .filter((row) => row.when)
    .sort((a, b) => {
      const ta = new Date(a.when as string).getTime();
      const tb = new Date(b.when as string).getTime();
      return tb - ta;
    });

  const recentActivityError =
    reviewsRes.error?.message ||
    profilesRes.error?.message ||
    businessesRes.error?.message ||
    null;

  const [{ data: businessOwners }, { data: businessMembers }] = await Promise.all([
    adminSupabase.from("businesses").select("owner_id").not("owner_id", "is", null),
    adminSupabase.from("business_members").select("user_id").not("user_id", "is", null),
  ]);

  const businessUserIds = new Set<string>();
  for (const row of businessOwners ?? []) {
    const id = String(row.owner_id ?? "").trim();
    if (id) businessUserIds.add(id);
  }
  for (const row of businessMembers ?? []) {
    const id = String(row.user_id ?? "").trim();
    if (id) businessUserIds.add(id);
  }
  const businessUsersCount = businessUserIds.size;

  const s = statsRes.data;

  return (
    <div className="space-y-8">
      {statsRes.error ? (
        <p className="text-sm text-red-600">Overview stats: {statsRes.error}</p>
      ) : null}
      {recentActivityError ? (
        <p className="text-sm text-red-600">Recent activity: {recentActivityError}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total users" value={num(s?.total_users)} />
        <AdminStatCard title="Total businesses" value={num(s?.total_businesses)} />
        <AdminStatCard title="Total reviews" value={num(s?.total_reviews)} />
        <AdminStatCard title="New users today" value={num(s?.new_users_today)} />
        <AdminStatCard title="Reviews today" value={num(s?.reviews_today)} />
        <AdminStatCard title="Pending businesses" value={num(s?.pending_businesses)} />
        <AdminStatCard title="Unverified reviews" value={num(s?.unverified_reviews)} />
        <AdminStatCard title="Business users" value={businessUsersCount} />
        <AdminStatCard title="Consumer users" value={num(s?.consumer_users)} />
      </div>

      <AdminTableShell title="Recent activity">
        {activity.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message="No recent activity returned." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Business</th>
                <th className="px-4 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {activity.map((item, i) => {
                const key = `activity-${i}`;
                return (
                  <tr key={key} className="bg-white">
                    <td className="whitespace-nowrap px-4 py-2 text-neutral-600">
                      {formatWhen(item.when)}
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{item.type}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{item.business}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{item.email}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminTableShell>
    </div>
  );
}
