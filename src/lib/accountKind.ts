/**
 * Where this account should land after sign-in (consumer vs business product).
 * Stored in auth user_metadata as `account_kind`: "consumer" | "business".
 */
export type AccountKind = "consumer" | "business";

export function parseAccountKind(
  metadata: Record<string, unknown> | null | undefined
): AccountKind | null {
  const v = String(metadata?.account_kind ?? "").toLowerCase().trim();
  if (v === "consumer" || v === "business") return v;
  return null;
}
