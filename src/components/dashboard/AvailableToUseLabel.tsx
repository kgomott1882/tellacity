/**
 * Marks a plan-included feature on dashboard screens (light teal, small type).
 */
export default function AvailableToUseLabel({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block text-[11px] font-normal leading-tight tracking-wide text-[#7dd3ce] ${className}`}
    >
      Available to use
    </span>
  );
}
