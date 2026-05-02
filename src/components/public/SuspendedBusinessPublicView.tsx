import Link from "next/link";

type Props = {
  /** Display name when available */
  businessName?: string;
};

/**
 * Shown when a business row exists but is not publicly active (e.g. admin suspended).
 */
export default function SuspendedBusinessPublicView({ businessName }: Props) {
  const label = businessName?.trim() || "This business";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 px-6 py-8 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Business suspended
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">
          {label} is no longer available on Tellacity. Its public profile, search listing,
          and reviews are not shown, and new reviews cannot be submitted.
        </p>
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          If you believe this is a mistake, please{" "}
          <Link
            href="/contact"
            className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
          >
            contact support
          </Link>
          .
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
