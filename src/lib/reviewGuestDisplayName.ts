/**
 * Privacy-safe display name for reviews (never derive from email).
 */
export function getSafeReviewGuestDisplayName(
  input: string | null | undefined,
): string {
  if (input && input.trim().length > 0) return input.trim();
  return "Anonymous";
}

/**
 * Optional public masking: "Jane D." instead of full name.
 */
export function formatPublicReviewDisplayName(name: string | null | undefined): string {
  const safe = getSafeReviewGuestDisplayName(name);
  if (safe === "Anonymous") return safe;
  const parts = safe.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    const first = parts[0] ?? "";
    const second = parts[1] ?? "";
    if (second.length > 0) {
      return `${first} ${second[0]}.`;
    }
  }
  return safe;
}
