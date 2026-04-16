/**
 * Resolves whether website widgets should show the business name.
 * Query param wins (dashboard live preview); otherwise saved `widget_embed_settings`; default true.
 */
export function resolveWidgetShowBusinessName(
  queryValue: string | undefined,
  embedSettings: unknown,
): boolean {
  const q = (queryValue ?? "").trim().toLowerCase();
  if (q === "0" || q === "false") return false;
  if (q === "1" || q === "true") return true;
  if (
    embedSettings &&
    typeof embedSettings === "object" &&
    embedSettings !== null &&
    "showBusinessName" in embedSettings &&
    typeof (embedSettings as { showBusinessName?: unknown }).showBusinessName === "boolean"
  ) {
    return (embedSettings as { showBusinessName: boolean }).showBusinessName;
  }
  return true;
}
