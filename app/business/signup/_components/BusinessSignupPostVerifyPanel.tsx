"use client";

export type SignupVerifyOutcome = "claimed" | "already_claimed" | "new_business";

type Props = {
  outcome: SignupVerifyOutcome;
  businessName?: string | null;
  onGoDashboard: () => void;
  onCreateBusiness: () => void;
};

export default function BusinessSignupPostVerifyPanel({
  outcome,
  businessName,
  onGoDashboard,
  onCreateBusiness,
}: Props) {
  if (outcome === "claimed") {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold text-[#0E0E0E]">Your account is ready</h2>
        <p className="text-sm text-gray-700">
          We&apos;ve connected you to{" "}
          <span className="font-medium text-[#0E0E0E]">
            {businessName?.trim() || "your business"}
          </span>
          .
        </p>
        <p className="text-xs text-gray-600">
          You are now the verified owner of this business.
        </p>
        <button
          type="button"
          onClick={onGoDashboard}
          className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  if (outcome === "already_claimed") {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold text-[#0E0E0E]">Your account is ready</h2>
        <p className="text-sm text-gray-700">This business is already claimed.</p>
        <p className="text-xs text-gray-600">
          Contact support if you need access to this business.
        </p>
        <button
          type="button"
          onClick={onGoDashboard}
          className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
        >
          Go to dashboard
        </button>
        <p className="text-center text-sm">
          <a
            href="mailto:support@tellacity.com"
            className="font-medium text-[#1FAF9E] hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <h2 className="text-2xl font-semibold text-[#0E0E0E]">Your account is ready</h2>
      <p className="text-sm text-gray-700">We couldn&apos;t find your business.</p>
      <button
        type="button"
        onClick={onCreateBusiness}
        className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
      >
        Create your business profile
      </button>
      <button
        type="button"
        onClick={onGoDashboard}
        className="w-full text-sm font-semibold text-[#1FAF9E] hover:underline"
      >
        I&apos;ll do this later
      </button>
    </div>
  );
}
