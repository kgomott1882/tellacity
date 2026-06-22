const INTERNAL_ERROR_PATTERNS = [
  "insert into",
  "update ",
  "delete from",
  "select ",
  "on conflict",
  "violates row-level security",
  "permission denied",
  "pgrst",
  "jwt",
  "row-level security",
  "syntax error",
  "duplicate key",
  "foreign key",
  "null value in column",
];

/**
 * Map errors to safe copy for dashboard UI — never surface raw SQL / Postgres text.
 */
export function userFacingErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const raw =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as { message?: string })?.message === "string"
          ? String((error as { message: string }).message)
          : "";

  const msg = raw.trim();
  if (!msg) return fallback;

  const lowered = msg.toLowerCase();
  if (
    INTERNAL_ERROR_PATTERNS.some((p) => lowered.includes(p)) ||
    msg.length > 140
  ) {
    return fallback;
  }

  return msg;
}
