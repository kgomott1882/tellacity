/** Admin Activity Feed: human labels + importance for sorting (business-impact first). */

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  review_received: "New review received",
  invite_converted: "Invite converted to review",
  invite_sent: "Invite sent",
  invite_opened: "Invite opened",
  review_replied: "Owner replied to a review",
  dashboard_login: "Dashboard login",
  integration_connected: "Integration connected",
  profile_link_copied: "Profile link copied",
  widget_generated: "Widget generated",
  upgrade_clicked: "Upgrade clicked",
  test_event: "Test event",
};

export type ActivityImportance = "high" | "medium" | "low";

const HIGH = new Set([
  "review_received",
  "invite_converted",
  "review_replied",
]);

const MEDIUM = new Set([
  "invite_sent",
  "invite_opened",
]);

const LOW = new Set(["dashboard_login"]);

export function activityActionLabel(actionType: string | null | undefined): string {
  const key = String(actionType ?? "").trim();
  if (!key) return "—";
  return ACTIVITY_ACTION_LABELS[key] ?? key.replace(/_/g, " ");
}

export function activityImportance(actionType: string | null | undefined): ActivityImportance {
  const key = String(actionType ?? "").trim().toLowerCase();
  if (HIGH.has(key)) return "high";
  if (MEDIUM.has(key)) return "medium";
  if (LOW.has(key)) return "low";
  return "medium";
}

/** Lower = sort earlier (more important). */
export function activitySortRank(actionType: string | null | undefined): number {
  const imp = activityImportance(actionType);
  if (imp === "high") return 0;
  if (imp === "medium") return 1;
  return 2;
}

export function isNoiseActionType(actionType: string | null | undefined): boolean {
  return String(actionType ?? "").trim() === "test_event";
}
