export const normalizeLogoUrl = (rawUrl?: string | null): string | null => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  return trimmed || null;
};

export function similarBusinessLogoUrl(row: {
  logo_url?: string | null;
}): string | null {
  return normalizeLogoUrl(String(row.logo_url ?? "").trim());
}
