/**
 * Embeds run in an iframe; the static resize script in `/widgets/embed` fires before
 * client components paint. Client widgets must notify the parent again after layout.
 */
export function postTellacityWidgetHeightToParent(): void {
  if (typeof window === "undefined") return;
  try {
    const root = document.documentElement;
    const body = document.body;
    const h = Math.ceil(
      Math.max(
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0,
        root?.scrollHeight ?? 0,
        root?.offsetHeight ?? 0,
      ),
    );
    if (h < 32) return;
    window.parent.postMessage(
      { type: "tellacity-widget-resize", src: window.location.href, height: h },
      "*",
    );
  } catch {
    /* cross-origin or embed not in iframe */
  }
}
