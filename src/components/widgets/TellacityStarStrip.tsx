import WidgetStars from "./WidgetStars";

/**
 * Decorative 5-star row for email widget previews — same Tellacity tier styling as WidgetStars (5 filled).
 */
export default function TellacityStarStrip({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      <WidgetStars rating={5} size={size} />
    </span>
  );
}
