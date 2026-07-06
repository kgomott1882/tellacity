export type AdminBusinessSearchRow = {
  id: string;
  name: string | null;
  slug: string | null;
  website: string | null;
  website_display: string | null;
  country_code: string | null;
  primary_group_slug: string | null;
  category_slug: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  owner_id: string | null;
  is_claimed: boolean | null;
};

export function sanitizeAdminBusinessSearchToken(q: string): string {
  return q
    .trim()
    .replace(/[%_,]/g, " ")
    .replace(/\s+/g, " ");
}
