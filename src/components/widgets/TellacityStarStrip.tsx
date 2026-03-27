/**
 * Decorative 5-star row for email widget previews: black stars on light squares.
 */
const STAR_BOX_BG = "#ffffff";
const STAR_BOX_BORDER = "#E5E7EB";
const STAR_FILL = "#000000";

export default function TellacityStarStrip({
  size = 14,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const boxSize = size + 6;

  return (
    <span
      className={`inline-flex items-center justify-center gap-1 ${className}`}
      aria-hidden
    >
      {[0, 1, 2, 3, 4].map((idx) => (
        <span
          key={idx}
          className="inline-flex items-center justify-center rounded-[3px]"
          style={{
            width: boxSize,
            height: boxSize,
            backgroundColor: STAR_BOX_BG,
            border: `1px solid ${STAR_BOX_BORDER}`,
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={STAR_FILL}
            stroke={STAR_FILL}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        </span>
      ))}
    </span>
  );
}
