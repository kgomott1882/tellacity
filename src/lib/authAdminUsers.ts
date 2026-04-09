/**
 * Resolve auth user id by email via GoTrue admin API (paginated).
 */
export async function getAuthUserIdByEmail(
  supabaseUrl: string,
  serviceRoleKey: string,
  emailNorm: string
): Promise<string | null> {
  const base = supabaseUrl.replace(/\/+$/, "");
  let page = 1;
  const perPage = 200;

  for (let safety = 0; safety < 100; safety++) {
    const res = await fetch(
      `${base}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const json = (await res.json()) as {
      users?: { id?: string; email?: string | null }[];
    };
    const users = json.users ?? [];

    for (const u of users) {
      if ((u.email ?? "").trim().toLowerCase() === emailNorm && u.id) {
        return u.id;
      }
    }

    if (users.length < perPage) return null;
    page += 1;
  }

  return null;
}
