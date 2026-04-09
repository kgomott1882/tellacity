export function sanitizeText(input: string | null | undefined): string {
  if (!input) return "";

  return input
    .replace(/â€¢/g, "•")
    .replace(/â€“/g, "–")
    .replace(/â€”/g, "-")
    .replace(/â€‹/g, "")
    .replace(/â€œ/g, "“")
    .replace(/â€/g, "”")
    .replace(/â€˜/g, "‘")
    .replace(/â€™/g, "’")
    .replace(/Â/g, " ")
    .trim();
}
