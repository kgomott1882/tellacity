/** Normalize UUID strings from Postgres/JSON so object lookups stay consistent. */
export function normalizeBusinessIdKey(id: string | null | undefined): string {
  return String(id ?? "")
    .trim()
    .toLowerCase();
}
