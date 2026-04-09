/**
 * Session-persistent (localStorage) click counts for progressive upgrade messaging.
 * Key: tc_upgrade_click_<feature>
 */
const PREFIX = "tc_upgrade_click_";

export function incrementUpgradeClickCount(feature: string): number {
  if (typeof window === "undefined") return 1;
  const key = `${PREFIX}${feature}`;
  const prev = Number.parseInt(window.localStorage.getItem(key) ?? "0", 10);
  const safePrev = Number.isFinite(prev) && prev >= 0 ? prev : 0;
  const next = safePrev + 1;
  window.localStorage.setItem(key, String(next));
  return next;
}

export function upgradeModalTitleForClickCount(clickCount: number): string {
  if (clickCount <= 1) return "Unlock this feature";
  if (clickCount === 2) return "You're missing out on valuable insights";
  return "Ready to unlock the next tier for your business?";
}
